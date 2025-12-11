import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

// 💰 定义平台抽成比例 (例如 10%)
const SERVICE_FEE_RATE = 0.1; 

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // 1. 抢单 (保持不变)
  async create(workerId: number, createOrderDto: CreateOrderDto) {
    const { taskId } = createOrderDto;

    return this.prisma.$transaction(async (tx:any) => {
      const task = await tx.task.findUnique({ where: { id: taskId } });

      if (!task) throw new BadRequestException('任务不存在');
      if (task.status !== 'PENDING') throw new BadRequestException('任务不可抢');
      if (task.publisherId === workerId) throw new BadRequestException('不能抢自己发布的任务');

      await tx.task.update({ where: { id: taskId }, data: { status: 'ONGOING' } });

      return tx.order.create({
        data: {
          status: 'PENDING',
          task: { connect: { id: taskId } },
          worker: { connect: { id: workerId } }
        },
      });
    });
  }

  // 2. 查询列表 (保持不变)
  async findAll(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: { task: true }
    });
  }

  // 3. 查询单个 (保持不变)
  async findOne(id: number) {
    return this.prisma.order.findUnique({ where: { id }, include: { task: true } });
  }

  // 🔥 4. 结算任务 (已增加抽成逻辑)
  async complete(userId: number, orderId: number) {
    return this.prisma.$transaction(async (tx:any) => {
      // 4.1 查询订单
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { task: true }
      });

      if (!order) throw new BadRequestException('订单不存在');
      if (order.workerId !== userId) throw new ForbiddenException('权限不足');
      if (order.status !== 'PENDING') throw new BadRequestException('状态不正确');

      // --- 💰 计算分账 ---
      const totalReward = order.task.price;
      const platformFee = Math.floor(totalReward * SERVICE_FEE_RATE); // 平台抽成 (向下取整)
      const workerIncome = totalReward - platformFee;              // 打工仔实得

      console.log(`[结算] 总价: ${totalReward}, 抽成: ${platformFee}, 实发: ${workerIncome}`);

      // 4.2 发钱 (只给 Worker 发扣除手续费后的钱)
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: workerIncome } }
      });

      // 4.3 记流水 (记录打工仔的实际收入)
      await tx.transaction.create({
        data: {
          amount: workerIncome, // 👈 存的是税后收入
          type: 'INCOME',
          status: 'SUCCESS',
          userId: userId
        }
      });
      
      // (可选) 你也可以在这里给管理员账号加钱，记录平台收入，暂略...

      // 4.4 更新状态
      await tx.task.update({
        where: { id: order.taskId },
        data: { status: 'COMPLETED' }
      });

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' }
      });
    });
  }
}