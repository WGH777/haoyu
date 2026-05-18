// apps/backend/src/order/order.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SubmitResultDto } from './dto/submit-result.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { NotificationService } from '../notification/notification.service';

type TxOptions = {
  isolationLevel?: Prisma.TransactionIsolationLevel;
  maxWait?: number;
  timeout?: number;
};

type RoleStr = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | string;

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  /**
   * 事务参数
   * 说明：
   * - 你的 Prisma.TransactionIsolationLevel 只包含 Serializable（TS 报错证明没有 ReadCommitted）
   * - SQLite 也常常不会按传统隔离级别那样工作，但这里保留为 Serializable，兼容你当前生成的类型
   */
  private readonly TX_OPTS: TxOptions = {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10000,
    timeout: 20000,
  };

  /**
   * 事务重试（关键：并发 complete 时写冲突/锁冲突会导致事务整体回滚并抛 500）
   * 目标：尽量让“一个成功(200)，其余 409/503”，而不是“全部 500 且无人结算”
   */
  private async withTxRetry<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;

    const backoff = async (n: number) => {
      const ms = Math.min(60 * n, 180);
      await new Promise((r) => setTimeout(r, ms));
    };

    while (true) {
      try {
        // 第二参数在不同 Prisma 版本类型上会不一致，这里用 any 避免 TS 报错
        return await this.prisma.$transaction(fn, this.TX_OPTS as any);
      } catch (e: any) {
        // 业务类 HttpException：直接抛（返回 4xx/409）
        if (e?.getStatus && typeof e.getStatus === 'function') throw e;

        // Prisma 并发写冲突/超时类：尝试重试
        if (this.isRetryablePrismaTxError(e) && attempt < maxRetries) {
          attempt += 1;
          await backoff(attempt);
          continue;
        }

        // 兜底：把常见 Prisma 错误转为更友好的 503，而不是 500
        this.rethrowAsFriendlyError(e);
        throw e;
      }
    }
  }

  private isRetryablePrismaTxError(e: any): boolean {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // P2034: write conflict/deadlock
      // P2028: transaction timeout
      // P1008: operations timed out
      return ['P2034', 'P2028', 'P1008'].includes(e.code);
    }

    if (e instanceof Prisma.PrismaClientUnknownRequestError) {
      const msg = String(e.message || '').toLowerCase();
      if (msg.includes('database is locked') || msg.includes('busy')) return true;
    }

    const raw = String(e?.message || '').toLowerCase();
    if (raw.includes('database is locked') || raw.includes('busy')) return true;

    return false;
  }

  private rethrowAsFriendlyError(e: any): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2028') {
        throw new ServiceUnavailableException(
          '数据库事务超时（P2028），请稍后重试',
        );
      }
      if (e.code === 'P1008') {
        throw new ServiceUnavailableException(
          '数据库操作超时（P1008），请稍后重试',
        );
      }
      if (e.code === 'P2034') {
        throw new ServiceUnavailableException(
          '数据库写冲突/死锁（P2034），请稍后重试',
        );
      }
    }

    const msg = String(e?.message || '').toLowerCase();
    if (msg.includes('database is locked') || msg.includes('busy')) {
      throw new ServiceUnavailableException('数据库繁忙，请稍后重试');
    }

    throw e;
  }

  private isAdmin(role?: RoleStr) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private async getServiceFeeRate(
    tx: Prisma.TransactionClient,
    workerId: number,
  ): Promise<number> {
    const completedCount = await tx.order.count({
      where: { workerId, status: 'COMPLETED' },
    });
    if (completedCount <= 30) return 0;
    if (completedCount <= 50) return 0.02;
    if (completedCount <= 100) return 0.05;
    return 0.1;
  }

  /**
   * 创建订单（抢单）
   * - 事务 + updateMany 条件更新，避免并发抢单导致重复抢占
   */
  async create(userId: number, taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, publisherId: true },
    });

    const order = await this.withTxRetry(async (tx: Prisma.TransactionClient) => {
      const task = await tx.task.findUnique({ where: { id: taskId } });
      if (!task) throw new NotFoundException('任务不存在');

      if (task.status !== 'PENDING') {
        throw new BadRequestException(`该任务不可领取，当前状态: ${task.status}`);
      }
      if (task.publisherId === userId) {
        throw new BadRequestException('不能领取自己发布的任务');
      }

      const existingOrder = await tx.order.findFirst({
        where: {
          taskId,
          workerId: userId,
          status: { in: ['ASSIGNED', 'SUBMITTED'] as any },
        },
      });
      if (existingOrder) {
        throw new BadRequestException('你已领取过该任务，无法重复领取');
      }

      const taskUpdated = await tx.task.updateMany({
        where: { id: taskId, status: 'PENDING' },
        data: { status: 'ASSIGNED' },
      });

      if (taskUpdated.count !== 1) {
        throw new BadRequestException('该任务已被抢占');
      }

      return tx.order.create({
        data: { taskId, workerId: userId, status: 'ASSIGNED' },
      });
    });

    // 通知发布者
    if (task) {
      this.notification.create({
        userId: task.publisherId,
        title: '需求被响应',
        content: `你的需求「${task.title}」已被接单，订单 #${order.id}`,
        type: 'REQUEST_RESPONDED',
      }).catch(() => {});
    }

    return order;
  }

  /** 服务者开始服务（ASSIGNED → IN_PROGRESS） */
  async startService(orderId: number, workerId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: { select: { publisherId: true, title: true } } },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.workerId !== workerId) throw new ForbiddenException('仅执行者可操作');
    if (order.status !== 'ASSIGNED') throw new BadRequestException(`当前状态 ${order.status} 不允许开始服务`);

    const result = await this.withTxRetry(async (tx: Prisma.TransactionClient) => {
      await tx.order.update({ where: { id: orderId }, data: { status: 'IN_PROGRESS' } });
      await tx.task.update({ where: { id: order.taskId }, data: { status: 'IN_PROGRESS' } });
      return tx.order.findUnique({ where: { id: orderId } });
    });

    if (order?.task?.publisherId) {
      this.notification.create({
        userId: order.task.publisherId,
        title: '服务已开始',
        content: `订单 #${orderId} 的服务者已开始工作`,
        type: 'SERVICE_STARTED',
      }).catch(() => {});
    }
    return result;
  }

  /**
   * 提交任务成果（仅执行者）
   */
  async submitResult(orderId: number, workerId: number, dto: SubmitResultDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: { select: { publisherId: true, title: true } } },
    });
    if (!order) throw new NotFoundException('订单不存在');

    if (order.workerId !== workerId) {
      throw new ForbiddenException('您无权操作此订单（仅执行者可提交）');
    }
    if (order.status !== 'ASSIGNED' && order.status !== 'IN_PROGRESS') {
      if (order.status === 'DISPUTED') {
        throw new BadRequestException('订单争议中，无法提交成果');
      }
      if (order.status === 'CANCELLED') {
        throw new BadRequestException('订单已取消，无法提交成果');
      }
      if (order.status === 'COMPLETED') {
        throw new BadRequestException('订单已完成，无法提交成果');
      }
      throw new BadRequestException(`当前订单状态 (${order.status}) 不允许提交成果`);
    }

    return this.withTxRetry(async (tx: Prisma.TransactionClient) => {
      // 1) 抢占提交权：ASSIGNED/IN_PROGRESS -> SUBMITTED
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
        data: {
          status: 'SUBMITTED',
          submissionContent: dto.content,
          submissionImage: dto.image || null,
          submittedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('订单状态已变化，提交失败（并发命中）');
      }

      // 2) Task 同步状态：ASSIGNED -> SUBMITTED（条件更新，防写穿）
      const taskUpdated = await tx.task.updateMany({
        where: { id: order.taskId, status: 'ASSIGNED' },
        data: { status: 'SUBMITTED' },
      });

      if (taskUpdated.count !== 1) {
        throw new ConflictException('任务状态已变化，提交失败（并发命中）');
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });

    // 通知发布者（order 已验证非空）
    const task = order!.task;
    if (task?.publisherId) {
      this.notification.create({
        userId: task.publisherId,
        title: '服务者已提交成果',
        content: `订单 #${orderId} 的服务者已提交成果，请验收`,
        type: 'SERVICE_SUBMITTED',
      }).catch(() => {});
    }
  }

  /**
   * 发布者验收任务（并发/幂等）
   */
  async completeOrder(orderId: number, publisherId: number, dto: CompleteOrderDto) {
    if (typeof dto?.isAccepted !== 'boolean') {
      throw new BadRequestException('isAccepted is required');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('订单不存在');

    if (order.task.publisherId !== publisherId) {
      throw new ForbiddenException('您无权验收此任务（仅发布者可验收）');
    }

    if (order.status !== 'SUBMITTED') {
      if (order.status === 'COMPLETED') {
        throw new ConflictException('订单已完成，无法验收');
      }
      if (order.status === 'DISPUTED') {
        throw new ConflictException('订单争议中，无法验收');
      }
      if (order.status === 'CANCELLED') {
        throw new ConflictException('订单已取消，无法验收');
      }
      throw new ConflictException(
        `订单状态不允许验收，当前状态: ${order.status}`,
      );
    }

    if (dto.isAccepted) {
      const result = await this.withTxRetry(async (tx: Prisma.TransactionClient) => {
        // 1) 抢占处理权：SUBMITTED -> COMPLETED
        const updated = await tx.order.updateMany({
          where: { id: orderId, status: 'SUBMITTED' },
          data: { status: 'COMPLETED' },
        });

        if (updated.count !== 1) {
          throw new ConflictException('订单已被处理（并发轮询命中）');
        }

        // 2) Task：SUBMITTED -> COMPLETED（条件更新）
        const taskUpdated = await tx.task.updateMany({
          where: { id: order.taskId, status: 'SUBMITTED' },
          data: { status: 'COMPLETED' },
        });

        if (taskUpdated.count !== 1) {
          throw new ConflictException('任务状态已变化，验收失败（并发命中）');
        }

        // 3) 阶梯费率 + 金额计算（单位：分）
        const feeRate = await this.getServiceFeeRate(tx, order.workerId);
        const taskPrice = order.task.price;
        const serviceFee = Math.max(0, Math.round(taskPrice * feeRate));
        const totalCost = taskPrice + serviceFee;
        const netReward = taskPrice - serviceFee;

        if (netReward < 0) {
          throw new BadRequestException('任务金额不足以覆盖服务费，无法结算');
        }

        const publisherWallet = await tx.wallet.findUnique({
          where: {
            userId_currency: { userId: order.task.publisherId, currency: 'CNY' },
          },
        });
        if (!publisherWallet) {
          throw new BadRequestException('发布者钱包不存在，请先创建钱包');
        }
        if (publisherWallet.frozen < totalCost) {
          throw new BadRequestException('发布者冻结余额不足，无法结算');
        }

        const workerWallet = await tx.wallet.findUnique({
          where: { userId_currency: { userId: order.workerId, currency: 'CNY' } },
        });
        if (!workerWallet) {
          throw new BadRequestException('执行者钱包不存在，请先创建钱包');
        }

        const platformWallet = await tx.wallet.findUnique({
          where: { code: 'SYSTEM_PLATFORM_FEE' },
        });
        if (!platformWallet) {
          throw new NotFoundException('系统平台费钱包不存在');
        }

        // 4) publisher frozen 中结算 totalCost（SETTLEMENT）
        await tx.wallet.update({
          where: { id: publisherWallet.id },
          data: { frozen: { decrement: totalCost } },
        });
        const publisherAfterSettle = await tx.wallet.findUnique({
          where: { id: publisherWallet.id },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: publisherWallet.id,
            userId: publisherWallet.userId,
            orderId: order.id,
            amount: totalCost,
            direction: 'OUT',
            type: 'SETTLEMENT',
            balanceAfter: publisherAfterSettle?.available,
            frozenAfter: publisherAfterSettle?.frozen,
            remark: `订单 #${order.id} 验收结算`,
          },
        });

        // 5) worker 入账 netReward（SETTLEMENT）
        await tx.wallet.update({
          where: { id: workerWallet.id },
          data: { available: { increment: netReward } },
        });
        const workerAfterDeposit = await tx.wallet.findUnique({
          where: { id: workerWallet.id },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: workerWallet.id,
            userId: workerWallet.userId,
            orderId: order.id,
            amount: netReward,
            direction: 'IN',
            type: 'SETTLEMENT',
            balanceAfter: workerAfterDeposit?.available,
            frozenAfter: workerAfterDeposit?.frozen,
            remark: `订单 #${order.id} 服务收入`,
          },
        });

        // 6) SYSTEM_PLATFORM_FEE 入账 serviceFee（PLATFORM_FEE）
        if (serviceFee > 0) {
          await tx.wallet.update({
            where: { id: platformWallet.id },
            data: { available: { increment: serviceFee } },
          });
          const platformAfterDeposit = await tx.wallet.findUnique({
            where: { id: platformWallet.id },
          });

          await tx.ledgerEntry.create({
            data: {
              walletId: platformWallet.id,
              userId: platformWallet.userId,
              orderId: order.id,
              amount: serviceFee,
              direction: 'IN',
              type: 'PLATFORM_FEE',
              balanceAfter: platformAfterDeposit?.available,
              frozenAfter: platformAfterDeposit?.frozen,
              remark: `订单 #${order.id} 平台服务费`,
            },
          });
        }

        return tx.order.findUnique({ where: { id: orderId } });
      });

      // 通知服务者：验收通过
      this.notification.create({
        userId: order.workerId,
        title: '验收通过',
        content: `订单 #${orderId} 已验收通过，收入已到账`,
        type: 'SERVICE_COMPLETED',
      }).catch(() => {});

      return result;
    }

    // 驳回：SUBMITTED -> ASSIGNED（允许再次 submit）
    const rejectedResult = await this.withTxRetry(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: 'SUBMITTED' },
        data: { status: 'ASSIGNED' },
      });

      if (updated.count !== 1) {
        throw new ConflictException('订单已被处理（并发轮询命中）');
      }

      const taskUpdated = await tx.task.updateMany({
        where: { id: order.taskId, status: 'SUBMITTED' },
        data: { status: 'ASSIGNED' },
      });

      if (taskUpdated.count !== 1) {
        throw new ConflictException('任务状态已变化，驳回失败（并发命中）');
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });

    // 通知服务者：验收驳回
    this.notification.create({
      userId: order.workerId,
      title: '验收驳回',
      content: `订单 #${orderId} 被驳回，请修改后重新提交`,
      type: 'SERVICE_SUBMITTED',
    }).catch(() => {});

    return rejectedResult;
  }

  async cancelOrder(orderId: number, userId: number, role?: RoleStr) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('订单不存在');

    const canCancel = ['ASSIGNED', 'SUBMITTED'].includes(order.status);
    if (!canCancel) {
      throw new BadRequestException(
        `当前订单状态 (${order.status}) 不允许取消`,
      );
    }

    if (order.task.publisherId !== userId && !this.isAdmin(role)) {
      throw new ForbiddenException('仅发布者或管理员可取消订单');
    }

    const result = await this.withTxRetry(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: { in: ['ASSIGNED', 'SUBMITTED'] as any } },
        data: { status: 'CANCELLED' },
      });

      if (updated.count !== 1) {
        throw new ConflictException('订单已被处理（并发命中）');
      }

      const expectedTaskStatus = order.status;
      const taskUpdated = await tx.task.updateMany({
        where: { id: order.taskId, status: expectedTaskStatus as any },
        data: { status: 'PENDING' },
      });
      if (taskUpdated.count !== 1) {
        throw new ConflictException('任务状态已变化，取消失败（并发命中）');
      }

      const taskPrice = order.task.price;
      const serviceFee = order.task.serviceFee ?? 0;
      const totalCost = taskPrice + serviceFee;

      const publisherWallet = await tx.wallet.findUnique({
        where: {
          userId_currency: { userId: order.task.publisherId, currency: 'CNY' },
        },
      });
      if (!publisherWallet) {
        throw new BadRequestException('发布者钱包不存在，请先创建钱包');
      }
      if (publisherWallet.frozen < totalCost) {
        throw new BadRequestException('冻结余额不足，无法退款');
      }

      await tx.wallet.update({
        where: { id: publisherWallet.id },
        data: {
          frozen: { decrement: totalCost },
          available: { increment: totalCost },
        },
      });
      const publisherAfterRefund = await tx.wallet.findUnique({
        where: { id: publisherWallet.id },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: publisherWallet.id,
          userId: publisherWallet.userId,
          orderId: order.id,
          amount: totalCost,
          direction: 'IN',
          type: 'REFUND',
          balanceAfter: publisherAfterRefund?.available,
          frozenAfter: publisherAfterRefund?.frozen,
          remark: `订单 #${order.id} 取消退款`,
        },
      });

      return tx.order.findUnique({ where: { id: orderId } });
    });

    // 通知双方
    const notifyTitle = '订单已取消';
    const notifyContent = `订单 #${orderId} 已被取消，资金已退回发布者`;
    this.notification.createBatch(
      [
        { userId: order.task.publisherId, title: notifyTitle, content: notifyContent },
        { userId: order.workerId, title: notifyTitle, content: notifyContent },
      ],
      'ORDER_CANCELLED',
    ).catch(() => {});

    return result;
  }

  /**
   * 系统自动确认（72h超时）
   * 复用结算逻辑，system 身份
   */
  async autoConfirm(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 'SUBMITTED') {
      throw new BadRequestException(`订单状态 ${order.status} 不允许自动确认`);
    }

    return this.withTxRetry(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: 'SUBMITTED' },
        data: { status: 'COMPLETED' },
      });
      if (updated.count !== 1) throw new ConflictException('订单已被处理');

      await tx.task.updateMany({
        where: { id: order.taskId, status: 'SUBMITTED' },
        data: { status: 'COMPLETED' },
      });

      // 结算（复用标准逻辑）
      const feeRate = await this.getServiceFeeRate(tx, order.workerId);
      const taskPrice = order.task.price;
      const serviceFee = Math.max(0, Math.round(taskPrice * feeRate));
      const totalCost = taskPrice + serviceFee;
      const netReward = taskPrice - serviceFee;

      const publisherWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: order.task.publisherId, currency: 'CNY' } },
      });
      if (!publisherWallet || publisherWallet.frozen < totalCost) {
        throw new BadRequestException('余额不足，自动确认失败');
      }

      await tx.wallet.update({
        where: { id: publisherWallet.id },
        data: { frozen: { decrement: totalCost } },
      });

      const workerWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: order.workerId, currency: 'CNY' } },
      });
      if (workerWallet) {
        await tx.wallet.update({
          where: { id: workerWallet.id },
          data: { available: { increment: netReward } },
        });
      }

      const platformWallet = await tx.wallet.findUnique({
        where: { code: 'SYSTEM_PLATFORM_FEE' },
      });
      if (platformWallet && serviceFee > 0) {
        await tx.wallet.update({
          where: { id: platformWallet.id },
          data: { available: { increment: serviceFee } },
        });
      }

      // 账本记录
      await tx.ledgerEntry.create({ data: { walletId: publisherWallet.id, userId: order.task.publisherId, orderId, amount: totalCost, direction: 'OUT', type: 'SETTLEMENT', remark: `订单#${orderId} 自动确认结算` } });
      await tx.ledgerEntry.create({ data: { walletId: workerWallet!.id, userId: order.workerId, orderId, amount: netReward, direction: 'IN', type: 'SETTLEMENT', remark: `订单#${orderId} 自动确认收入` } });
      if (serviceFee > 0 && platformWallet) {
        await tx.ledgerEntry.create({ data: { walletId: platformWallet.id, orderId, amount: serviceFee, direction: 'IN', type: 'PLATFORM_FEE', remark: `订单#${orderId} 服务费` } });
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });
  }

  /**
   * 系统自动取消（服务者48h超时）
   */
  async autoCancel(orderId: number, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 'ASSIGNED') {
      throw new BadRequestException(`订单状态 ${order.status} 不允许自动取消`);
    }

    return this.withTxRetry(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: 'ASSIGNED' },
        data: { status: 'CANCELLED' },
      });
      if (updated.count !== 1) throw new ConflictException('订单已被处理');

      await tx.task.updateMany({
        where: { id: order.taskId, status: 'ASSIGNED' },
        data: { status: 'PENDING' },
      });

      // 退款
      const totalCost = order.task.price + (order.task.serviceFee ?? 0);
      const publisherWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: order.task.publisherId, currency: 'CNY' } },
      });
      if (publisherWallet && publisherWallet.frozen >= totalCost) {
        await tx.wallet.update({
          where: { id: publisherWallet.id },
          data: {
            frozen: { decrement: totalCost },
            available: { increment: totalCost },
          },
        });
        await tx.ledgerEntry.create({
          data: {
            walletId: publisherWallet.id,
            userId: publisherWallet.userId,
            orderId,
            amount: totalCost,
            direction: 'IN',
            type: 'REFUND',
            remark: reason,
          },
        });
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });
  }

  /**
   * 发布者 / 执行者 查询任务订单
   */
  async findOrderByTaskId(taskId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { taskId },
      include: { task: { select: { publisherId: true } } },
    });

    if (!order) return null;
    if (order.workerId !== userId && order.task.publisherId !== userId) return null;

    return {
      id: order.id,
      status: order.status,
      taskId: order.taskId,
      submissionContent: order.submissionContent,
      submissionImage: order.submissionImage,
      workerId: order.workerId,
    };
  }

  /**
   * Worker 查询自己对某任务的订单
   */
  async findMyOrderForTask(taskId: number, workerId: number) {
    return this.prisma.order.findFirst({
      where: { taskId, workerId },
      select: {
        id: true,
        status: true,
        taskId: true,
        submissionContent: true,
        submissionImage: true,
      },
    });
  }

  /**
   * 我接取的所有订单（已脱敏）
   */
  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
            image: true,
            subTasks: true,
            publisher: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }
}
