import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'CANCELLED';
type DisputeResult = 'REFUND_BUYER' | 'PAY_SELLER' | 'PARTIAL_REFUND' | 'CANCEL_ORDER';

@Injectable()
export class DisputeService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  private isAdmin(role?: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  /** 用户发起争议 */
  async create(orderId: number, userId: number, reason: string, evidence?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('订单不存在');

    // 权限：发布者或执行者
    if (order.task.publisherId !== userId && order.workerId !== userId) {
      throw new ForbiddenException('无权对此订单发起争议');
    }

    // 状态校验
    if (!['IN_PROGRESS', 'SUBMITTED'].includes(order.status)) {
      if (order.status === 'COMPLETED') {
        throw new BadRequestException('订单已完成，如需申诉请联系管理员');
      }
      throw new BadRequestException(`当前订单状态 (${order.status}) 不允许发起争议`);
    }

    // 防重复：是否已有进行中的争议
    const existing = await this.prisma.dispute.findFirst({
      where: { orderId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    });
    if (existing) {
      throw new ConflictException('该订单已有进行中的争议');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 创建争议
      const dispute = await tx.dispute.create({
        data: {
          orderId,
          taskId: order.taskId,
          openerId: userId,
          reason,
          evidence: evidence || null,
          status: 'OPEN',
        },
      });

      // 订单 → DISPUTED（阻止验收/提交）
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'DISPUTED' },
      });

      // Task 同步
      await tx.task.update({
        where: { id: order.taskId },
        data: { status: 'DISPUTED' },
      });

      // 通知对方
      const notifyUserId =
        userId === order.task.publisherId ? order.workerId : order.task.publisherId;

      await this.notification.create({
        userId: notifyUserId,
        title: '订单争议',
        content: `订单 #${orderId} 已被发起争议。原因：${reason}`,
        type: 'ORDER_DISPUTED',
      });

      return dispute;
    });
  }

  /** 管理员处理争议 */
  async resolve(
    disputeId: number,
    adminId: number,
    result: DisputeResult,
    handledByRole: string,
  ) {
    if (!this.isAdmin(handledByRole)) {
      throw new ForbiddenException('仅管理员可处理争议');
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: { include: { task: true } } },
    });
    if (!dispute) throw new NotFoundException('争议不存在');

    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
      throw new BadRequestException(`争议已处理，当前状态: ${dispute.status}`);
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 更新争议
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          result,
          handledById: adminId,
          resolvedAt: new Date(),
        },
      });

      // 恢复订单状态（取消争议标记，但不自动完成）
      const newOrderStatus = result === 'REFUND_BUYER' || result === 'CANCEL_ORDER'
        ? 'CANCELLED'
        : 'SUBMITTED';

      await tx.order.update({
        where: { id: dispute.orderId },
        data: { status: newOrderStatus },
      });

      // Task 同步
      const newTaskStatus = result === 'REFUND_BUYER' || result === 'CANCEL_ORDER'
        ? 'CANCELLED'
        : 'SUBMITTED';

      await tx.task.update({
        where: { id: dispute.order.taskId },
        data: { status: newTaskStatus },
      });

      // === 资金处理 ===
      if (result === 'REFUND_BUYER' || result === 'CANCEL_ORDER') {
        // 退款给发布者
        const taskPrice = dispute.order.task.price;
        const serviceFee = dispute.order.task.serviceFee ?? 0;
        const totalCost = taskPrice + serviceFee;

        const publisherWallet = await tx.wallet.findUnique({
          where: {
            userId_currency: {
              userId: dispute.order.task.publisherId,
              currency: 'CNY',
            },
          },
        });
        if (publisherWallet && publisherWallet.frozen >= totalCost) {
          await tx.wallet.update({
            where: { id: publisherWallet.id },
            data: {
              frozen: { decrement: totalCost },
              available: { increment: totalCost },
            },
          });
          const after = await tx.wallet.findUnique({ where: { id: publisherWallet.id } });
          await tx.ledgerEntry.create({
            data: {
              walletId: publisherWallet.id,
              userId: publisherWallet.userId,
              orderId: dispute.orderId,
              amount: totalCost,
              direction: 'IN',
              type: 'REFUND',
              balanceAfter: after?.available,
              frozenAfter: after?.frozen,
              remark: `争议 #${disputeId} 裁决退款`,
            },
          });
        }
      } else if (result === 'PAY_SELLER') {
        // 结算给服务者（复用结算逻辑：需要发布者已冻结足够金额）
        const taskPrice = dispute.order.task.price;
        const totalCost = taskPrice + (dispute.order.task.serviceFee ?? 0);

        const publisherWallet = await tx.wallet.findUnique({
          where: {
            userId_currency: {
              userId: dispute.order.task.publisherId,
              currency: 'CNY',
            },
          },
        });

        if (publisherWallet && publisherWallet.frozen >= totalCost) {
          await tx.wallet.update({
            where: { id: publisherWallet.id },
            data: { frozen: { decrement: totalCost } },
          });
          const pAfter = await tx.wallet.findUnique({ where: { id: publisherWallet.id } });
          await tx.ledgerEntry.create({
            data: {
              walletId: publisherWallet.id,
              userId: publisherWallet.userId,
              orderId: dispute.orderId,
              amount: totalCost,
              direction: 'OUT',
              type: 'SETTLEMENT',
              balanceAfter: pAfter?.available,
              frozenAfter: pAfter?.frozen,
              remark: `争议 #${disputeId} 裁决付款`,
            },
          });

          const workerWallet = await tx.wallet.findUnique({
            where: {
              userId_currency: {
                userId: dispute.order.workerId,
                currency: 'CNY',
              },
            },
          });
          if (workerWallet) {
            const netReward = taskPrice - (dispute.order.task.serviceFee ?? 0);
            if (netReward > 0) {
              await tx.wallet.update({
                where: { id: workerWallet.id },
                data: { available: { increment: netReward } },
              });
              const wAfter = await tx.wallet.findUnique({ where: { id: workerWallet.id } });
              await tx.ledgerEntry.create({
                data: {
                  walletId: workerWallet.id,
                  userId: workerWallet.userId,
                  orderId: dispute.orderId,
                  amount: netReward,
                  direction: 'IN',
                  type: 'SETTLEMENT',
                  balanceAfter: wAfter?.available,
                  frozenAfter: wAfter?.frozen,
                  remark: `争议 #${disputeId} 裁决收入`,
                },
              });
            }
          }
        }
      }

      // 通知双方
      const resultText: Record<DisputeResult, string> = {
        REFUND_BUYER: '退款给发布者',
        PAY_SELLER: '付款给服务者',
        PARTIAL_REFUND: '部分退款',
        CANCEL_ORDER: '取消订单',
      };

      await this.notification.createBatch(
        [
          {
            userId: dispute.order.task.publisherId,
            title: '争议处理结果',
            content: `订单 #${dispute.orderId} 争议已处理：${resultText[result]}`,
          },
          {
            userId: dispute.order.workerId,
            title: '争议处理结果',
            content: `订单 #${dispute.orderId} 争议已处理：${resultText[result]}`,
          },
        ],
        'DISPUTE_RESOLVED',
      );

      return updated;
    });
  }

  /** 撤回争议（发起人） */
  async cancel(disputeId: number, userId: number) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: { include: { task: true } } },
    });
    if (!dispute) throw new NotFoundException('争议不存在');
    if (dispute.openerId !== userId) {
      throw new ForbiddenException('仅发起人可撤回争议');
    }
    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
      throw new BadRequestException('争议已处理，无法撤回');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: { status: 'CANCELLED' },
      });

      // 恢复订单为提交前状态
      const prevStatus = dispute.order.submittedAt ? 'SUBMITTED' : 'ASSIGNED';
      await tx.order.update({
        where: { id: dispute.orderId },
        data: { status: prevStatus },
      });
      await tx.task.update({
        where: { id: dispute.order.taskId },
        data: { status: prevStatus },
      });

      return updated;
    });
  }

  /** 查询争议列表 */
  async findByOrder(orderId: number) {
    return this.prisma.dispute.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 管理员查看所有争议 */
  async findAll(status?: string) {
    return this.prisma.dispute.findMany({
      where: status ? { status } : undefined,
      include: {
        order: {
          select: { id: true, task: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
