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

// Prisma 5.21.x 可能没有导出 Prisma.TransactionOptions，这里自定义一个兼容类型
type TxOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // 事务参数：缓解 P2028（交互式事务默认超时偏短时会出现）
  private readonly TX_OPTS: TxOptions = {
    timeout: 20000,
    maxWait: 20000,
  };

  private isKnownPrismaError(
    e: unknown,
  ): e is Prisma.PrismaClientKnownRequestError {
    return e instanceof Prisma.PrismaClientKnownRequestError;
  }

  private rethrowAsFriendlyError(e: unknown): never {
    // 将“数据库/事务偶发超时”转为 503，可重试；避免直接 500
    if (this.isKnownPrismaError(e)) {
      if (e.code === 'P2028') {
        throw new ServiceUnavailableException(
          '系统繁忙，请稍后重试（事务超时）',
        );
      }
      if (e.code === 'P1008') {
        throw new ServiceUnavailableException(
          '系统繁忙，请稍后重试（数据库超时）',
        );
      }
    }
    throw e;
  }

  /**
   * 创建订单（抢单）
   * - 关键：使用事务 + updateMany 条件更新，避免并发抢单导致脏写/重复抢占
   */
  async create(userId: number, taskId: number) {
    return this.prisma
      .$transaction(
        async (tx: Prisma.TransactionClient) => {
          const task = await tx.task.findUnique({ where: { id: taskId } });
          if (!task) throw new NotFoundException('任务不存在');

          if (task.status !== 'PENDING') {
            throw new BadRequestException(
              `该任务不可领取，当前状态: ${task.status}`,
            );
          }
          if (task.publisherId === userId) {
            throw new BadRequestException('不能领取自己发布的任务');
          }

          // 兜底：如果已经存在活跃订单（理论上不该发生），直接拒绝
          const existingOrder = await tx.order.findFirst({
            where: { taskId, status: { in: ['ASSIGNED', 'SUBMITTED'] } },
            select: { id: true },
          });
          if (existingOrder) {
            throw new BadRequestException('该任务已被抢占');
          }

          // 条件更新：只有仍为 PENDING 才能改为 ASSIGNED
          const taskUpdated = await tx.task.updateMany({
            where: { id: taskId, status: 'PENDING' },
            data: { status: 'ASSIGNED' },
          });

          if (taskUpdated.count !== 1) {
            throw new BadRequestException('该任务已被抢占');
          }

          return tx.order.create({
            data: {
              taskId,
              workerId: userId,
              status: 'ASSIGNED',
            },
          });
        },
        this.TX_OPTS,
      )
      .catch((e) => this.rethrowAsFriendlyError(e));
  }

  /**
   * 提交任务成果（仅执行者）
   * - 加固：改为 updateMany 状态闸门，避免重复提交/并发提交导致偶发 500 或状态错乱
   */
  async submitResult(orderId: number, workerId: number, dto: SubmitResultDto) {
    // 兼容字段差异：content 为主；若未来 dto 扩展 submissionContent，也能容错
    const content = (dto as any)?.content ?? (dto as any)?.submissionContent;
    const image =
      (dto as any)?.image ?? (dto as any)?.submissionImage ?? null;

    if (typeof content !== 'string' || !content.trim()) {
      throw new BadRequestException('content is required');
    }

    // 先读用于权限/基本提示（最终裁决在事务 updateMany）
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('订单不存在');

    if (order.workerId !== workerId) {
      throw new ForbiddenException('您无权操作此订单（仅执行者可提交）');
    }
    if (order.status !== 'ASSIGNED') {
      throw new BadRequestException(
        `当前订单状态 (${order.status}) 不允许提交成果`,
      );
    }

    return this.prisma
      .$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1) 抢占“提交权”：仅允许 ASSIGNED -> SUBMITTED
          const updated = await tx.order.updateMany({
            where: { id: orderId, workerId, status: 'ASSIGNED' },
            data: {
              status: 'SUBMITTED',
              submissionContent: content,
              submissionImage: image,
              submittedAt: new Date(),
            },
          });

          if (updated.count !== 1) {
            throw new ConflictException('订单状态已变化，无法提交');
          }

          // 2) 更新任务状态
          await tx.task.update({
            where: { id: order.taskId },
            data: { status: 'SUBMITTED' },
          });

          return tx.order.findUnique({ where: { id: orderId } });
        },
        this.TX_OPTS,
      )
      .catch((e) => this.rethrowAsFriendlyError(e));
  }

  /**
   * 发布者验收任务
   * - 关键：并发/幂等修复点
   *   1) 先读取订单+任务做权限校验
   *   2) 用 updateMany 做“只允许 SUBMITTED -> (COMPLETED/ASSIGNED)”的条件状态迁移
   *   3) count=0 说明已被其他请求处理 => 直接 409，绝不 500
   */
  async completeOrder(
    orderId: number,
    publisherId: number,
    dto: CompleteOrderDto,
  ) {
    if (typeof dto?.isAccepted !== 'boolean') {
      throw new BadRequestException('isAccepted is required');
    }

    // 先读用于权限/基本校验
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('订单不存在');

    if (order.task.publisherId !== publisherId) {
      throw new ForbiddenException('您无权验收此任务（仅发布者可验收）');
    }

    if (order.status !== 'SUBMITTED') {
      throw new ConflictException(
        `订单已被处理或状态不允许验收，当前状态: ${order.status}`,
      );
    }

    const taskPrice = order.task.price ?? 0;
    const serviceFee = order.task.serviceFee ?? 0;
    const netReward = taskPrice - serviceFee;

    if (dto.isAccepted) {
      return this.prisma
        .$transaction(
          async (tx: Prisma.TransactionClient) => {
            // 1) 抢占“处理权”：仅允许 SUBMITTED -> COMPLETED
            const updated = await tx.order.updateMany({
              where: { id: orderId, status: 'SUBMITTED' },
              data: { status: 'COMPLETED' },
            });

            if (updated.count !== 1) {
              throw new ConflictException(
                '订单已被处理或状态不允许验收，当前状态: COMPLETED',
              );
            }

            // 2) 更新任务状态
            await tx.task.update({
              where: { id: order.taskId },
              data: { status: 'COMPLETED' },
            });

            // 3) 给执行者入账 + 写流水
            await tx.user.update({
              where: { id: order.workerId },
              data: { balance: { increment: netReward } },
            });

            await tx.transaction.create({
              data: {
                amount: netReward,
                type: 'INCOME',
                status: 'SUCCESS',
                userId: order.workerId,
              },
            });

            return tx.order.findUnique({ where: { id: orderId } });
          },
          this.TX_OPTS,
        )
        .catch((e) => this.rethrowAsFriendlyError(e));
    }

    // 驳回：任务回到 ASSIGNED，订单回到 ASSIGNED（保持原来逻辑）
    return this.prisma
      .$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 先抢占“处理权”：仅允许 SUBMITTED -> ASSIGNED
          const updated = await tx.order.updateMany({
            where: { id: orderId, status: 'SUBMITTED' },
            data: { status: 'ASSIGNED' },
          });

          if (updated.count !== 1) {
            throw new ConflictException('订单已被处理（并发轮询命中）');
          }

          await tx.task.update({
            where: { id: order.taskId },
            data: { status: 'ASSIGNED' },
          });

          return tx.order.findUnique({ where: { id: orderId } });
        },
        this.TX_OPTS,
      )
      .catch((e) => this.rethrowAsFriendlyError(e));
  }

  /**
   * 发布者 / 执行者 查询任务订单
   */
  async findOrderByTaskId(taskId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { taskId },
      include: {
        task: {
          select: { publisherId: true },
        },
      },
    });

    if (!order) return null;
    if (order.workerId !== userId && order.task.publisherId !== userId) {
      return null;
    }

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
                email: true,
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
