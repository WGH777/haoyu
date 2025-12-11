import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // 抢单
  async create(workerId: number, taskId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    
    if (!task) throw new NotFoundException('任务不存在');
    if (task.status !== 'PENDING') throw new BadRequestException('手慢了！该任务已被抢走');
    if (task.publisherId === workerId) throw new BadRequestException('不能抢自己发布的任务');

    // 事务：创建订单 + 改任务状态
    return this.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          taskId,
          workerId,
          status: 'PENDING',
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: { status: 'ONGOING' },
      });

      return order;
    });
  }

  // 查询我的订单
  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: {
        task: true, // 关联任务详情
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 结算订单
  async complete(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });

    if (!order) throw new NotFoundException('订单不存在');
    if (order.workerId !== userId) throw new BadRequestException('无权操作');
    if (order.status === 'COMPLETED') throw new BadRequestException('订单已完成');

    const price = order.task.price;

    // 事务：打钱 + 记账 + 改状态
    return this.prisma.$transaction(async (tx: any) => {
      // 1. 给工人加钱
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: price } },
      });

      // 2. 记一笔收入流水
      await tx.transaction.create({
        data: {
          amount: price,
          type: 'INCOME',
          userId: userId,
          status: 'SUCCESS'
        }
      });

      // 3. 完结订单
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      });

      // 4. 完结任务
      await tx.task.update({
        where: { id: order.taskId },
        data: { status: 'COMPLETED' },
      });
      
      return { success: true };
    });
  }
}