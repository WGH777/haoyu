import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建订单（抢单）
   */
  async create(userId: number, taskId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!task) throw new NotFoundException('任务不存在');
    if (task.status !== 'PENDING') {
      throw new BadRequestException(`该任务不可领取，当前状态: ${task.status}`);
    }

    if (task.publisherId === userId) {
      throw new BadRequestException('不能领取自己发布的任务');
    }

    const existingOrder = await this.prisma.order.findFirst({
      where: { taskId, status: { in: ['ASSIGNED', 'SUBMITTED'] } },
    });
    if (existingOrder) {
      throw new BadRequestException('该任务已被抢占');
    }

    return this.prisma.$transaction(async (tx) => {
      // 更新任务状态为 ASSIGNED
      await tx.task.update({
        where: { id: taskId },
        data: { status: 'ASSIGNED' },
      });

      // 创建订单
      return tx.order.create({
        data: {
          taskId,
          workerId: userId,
          status: 'ASSIGNED',
        },
      });
    });
  }

  /**
   * 提交任务成果（执行者）
   */
  async submitResult(orderId: number, workerId: number, dto: SubmitResultDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new NotFoundException('订单不存在');
    if (order.workerId !== workerId) {
      throw new UnauthorizedException('您无权操作此订单');
    }
    if (order.status !== 'ASSIGNED') {
      throw new BadRequestException(
        `当前订单状态 (${order.status}) 不允许提交成果`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: order.taskId },
        data: { status: 'SUBMITTED' },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'SUBMITTED',
          submissionContent: dto.content,
          submissionImage: dto.image || null,
          submittedAt: new Date(),
        },
      });
    });
  }

  /**
   * 验收任务成果并结算（发布者）
   */
  async completeOrder(
    orderId: number,
    publisherId: number,
    dto: CompleteOrderDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });

    if (!order) throw new NotFoundException('订单不存在');

    // 1. 权限校验：必须是任务发布者本人
    if (order.task.publisherId !== publisherId) {
      throw new UnauthorizedException('您无权验收此任务');
    }

    // 2. 状态校验：必须是 SUBMITTED
    if (order.status !== 'SUBMITTED') {
      throw new BadRequestException(
        `当前订单状态 (${order.status}) 不允许验收`,
      );
    }

    const taskPrice = order.task.price;
    const serviceFee = order.task.serviceFee;
    const netReward = taskPrice - serviceFee;

    if (dto.isAccepted) {
      // 验收成功：结算
      return this.prisma.$transaction(async (tx) => {
        // A. 资金结算：将托管资金转给 Worker
        await tx.user.update({
          where: { id: order.workerId },
          data: { balance: { increment: netReward } },
        });

        // B. 记录资金流水 (收入)
        await tx.transaction.create({
          data: {
            amount: netReward,
            type: 'INCOME',
            status: 'SUCCESS',
            userId: order.workerId,
          },
        });

        // C. 更新 Task 状态为 COMPLETED
        await tx.task.update({
          where: { id: order.taskId },
          data: { status: 'COMPLETED' },
        });

        // D. 更新 Order 状态为 COMPLETED
        return tx.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' },
        });
      });
    } else {
      // 验收失败：退回到 ASSIGNED
      return this.prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: order.taskId },
          data: { status: 'ASSIGNED' },
        });

        return tx.order.update({
          where: { id: orderId },
          data: { status: 'ASSIGNED' },
        });
      });
    }
  }

  /**
   * 查询任务的订单，用于发布者/执行者在详情页查看提交内容
   *
   * 没有订单时返回 null（正常场景），只有权限不合法时才抛异常。
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

    // 没有订单：说明任务尚未被接取，这是正常情况，直接返回 null
    if (!order) {
      return null;
    }

    // 有订单，但当前用户既不是执行者也不是发布者 => 权限异常
    if (order.workerId !== userId && order.task.publisherId !== userId) {
      throw new UnauthorizedException('您无权查询此任务订单');
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
   * 获取当前用户针对某个任务的订单 (执行者视角)
   *
   * 没有订单时返回 null，不再抛异常。
   */
  async findMyOrderForTask(taskId: number, workerId: number) {
    const order = await this.prisma.order.findFirst({
      where: { taskId, workerId },
      select: {
        id: true,
        status: true,
        taskId: true,
        submissionContent: true,
        submissionImage: true,
      },
    });

    // 没有接过这个任务 => 正常情况，返回 null
    if (!order) {
      return null;
    }

    return order;
  }

  /**
   * 查询我的订单列表（用于“我接取的任务”）
   */
  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
            image: true,
            publisher: true,
            subTasks: true, // 带出子任务，前端可算完成度
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
