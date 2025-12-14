// apps/backend/src/order/order.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
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

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.task.update({
        where: { id: taskId },
        data: { status: 'ASSIGNED' },
      });

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
   * 提交任务成果（资源级权限：仅执行者）
   */
  async submitResult(orderId: number, workerId: number, dto: SubmitResultDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');

    if (order.workerId !== workerId) {
      throw new ForbiddenException('您无权操作此订单（仅执行者可提交）');
    }
    if (order.status !== 'ASSIGNED') {
      throw new BadRequestException(`当前订单状态 (${order.status}) 不允许提交成果`);
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
   * 验收任务（资源级权限：仅发布者）
   */
  async completeOrder(orderId: number, publisherId: number, dto: CompleteOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('订单不存在');

    if (order.task.publisherId !== publisherId) {
      throw new ForbiddenException('您无权验收此任务（仅发布者可验收）');
    }

    if (order.status !== 'SUBMITTED') {
      throw new BadRequestException(`当前订单状态 (${order.status}) 不允许验收`);
    }

    const taskPrice = order.task.price;
    const serviceFee = order.task.serviceFee;
    const netReward = taskPrice - serviceFee;

    if (dto.isAccepted) {
      return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

        await tx.task.update({
          where: { id: order.taskId },
          data: { status: 'COMPLETED' },
        });

        return tx.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' },
        });
      });
    }

    // 驳回：回到 ASSIGNED，允许执行者再次提交
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

  /**
   * 查询任务订单（资源级权限：发布者/执行者可见，旁观者返回 null）
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

    return order || null;
  }

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
            subTasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
