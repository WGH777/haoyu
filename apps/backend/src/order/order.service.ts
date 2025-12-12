import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { CompleteOrderDto } from './dto/complete-order.dto'; 

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建订单（抢单）：
   */
  async create(userId: number, taskId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    
    if (!task) throw new NotFoundException('任务不存在');
    if (task.status !== 'PENDING') throw new BadRequestException(`该任务不可领取，当前状态: ${task.status}`);

    if (task.publisherId === userId) {
      throw new BadRequestException('不能领取自己发布的任务');
    }

    const existingOrder = await this.prisma.order.findFirst({
      where: { taskId: taskId, status: { in: ['ASSIGNED', 'SUBMITTED'] } },
    });
    if (existingOrder) throw new BadRequestException('该任务已被抢占');
    
    return this.prisma.$transaction(async (tx: any) => {
        // 更新任务状态为 ASSIGNED
        await tx.task.update({
            where: { id: taskId },
            data: { status: 'ASSIGNED' } 
        });

        // 创建订单
        return tx.order.create({
            data: {
                taskId: taskId,
                workerId: userId,
                status: 'ASSIGNED',
            },
        });
    });
  }

  /**
   * 提交任务成果
   */
  async submitResult(orderId: number, workerId: number, dto: SubmitResultDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) throw new NotFoundException('订单不存在');
    if (order.workerId !== workerId) throw new UnauthorizedException('您无权操作此订单');
    if (order.status !== 'ASSIGNED') throw new BadRequestException(`当前订单状态 (${order.status}) 不允许提交成果`);
    
    return this.prisma.$transaction(async (tx: any) => {
        await tx.task.update({
            where: { id: order.taskId },
            data: { status: 'SUBMITTED' } 
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
   * 验收任务成果并结算
   */
  async completeOrder(orderId: number, publisherId: number, dto: CompleteOrderDto) {
    const order = await this.prisma.order.findUnique({ 
        where: { id: orderId },
        include: { task: true }
    });
    
    if (!order) throw new NotFoundException('订单不存在');
    
    // 1. 权限校验：必须是任务发布者本人
    if (order.task.publisherId !== publisherId) {
        throw new UnauthorizedException('您无权验收此任务');
    }
    
    // 2. 状态校验：必须是 SUBMITTED (待验收) 状态
    if (order.status !== 'SUBMITTED') {
        throw new BadRequestException(`当前订单状态 (${order.status}) 不允许验收`);
    }

    // 假设 price 和 serviceFee 是 Float (分)
    const taskPrice = order.task.price; 
    const serviceFee = order.task.serviceFee; 
    const netReward = taskPrice - serviceFee; 
    
    if (dto.isAccepted) {
        // 验收成功：执行结算事务
        return this.prisma.$transaction(async (tx: any) => {
            // A. 资金结算：将托管资金转给 Worker
            await tx.user.update({
                where: { id: order.workerId },
                data: { balance: { increment: netReward } },
            });
            
            // B. 记录资金流水 (收入)
            await tx.transaction.create({
                data: {
                    amount: netReward,
                    type: 'INCOME', // 任务收入
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
        // 验收失败：拒绝验收 (要求执行者返工)
        return this.prisma.$transaction(async (tx: any) => {
            // 将 Task 状态退回到 ASSIGNED
            await tx.task.update({
                where: { id: order.taskId },
                data: { status: 'ASSIGNED' },
            });
            
            // 将 Order 状态退回到 ASSIGNED
            return tx.order.update({
                where: { id: orderId },
                data: { status: 'ASSIGNED' }, 
            });
        });
        
    }
  }

  /**
   * 核心修复：查询任务的唯一订单，用于发布者验收和成果展示。
   */
  async findOrderByTaskId(taskId: number, userId: number) {
    // 查找该任务的唯一订单 (状态必须是非 PENDING)
    const order = await this.prisma.order.findFirst({
        where: { taskId, status: { not: 'PENDING' } },
        include: { 
            task: { 
                select: { publisherId: true } 
            } 
        }
    });

    if (!order) {
        throw new NotFoundException('该任务未被接取或订单已失效');
    }
    
    // 权限校验：只有 Worker 或 Publisher 才能查询此订单
    if (order.workerId !== userId && order.task.publisherId !== userId) {
        throw new UnauthorizedException('您无权查询此任务订单');
    }

    // 返回订单的详细信息，包括成果内容
    return {
        id: order.id,
        status: order.status,
        taskId: order.taskId,
        submissionContent: order.submissionContent,
        submissionImage: order.submissionImage,
        workerId: order.workerId
    };
  }
  
  /**
   * 获取当前用户针对某个任务的订单 (Worker 查询自己的订单)
   */
  async findMyOrderForTask(taskId: number, workerId: number) {
    const order = await this.prisma.order.findFirst({
        where: { taskId, workerId },
        select: { 
            id: true, 
            status: true, 
            taskId: true,
            submissionContent: true,
            submissionImage: true
        }
    });

    if (!order) {
        throw new NotFoundException('未找到您的订单记录');
    }
    return order;
  }

  /**
   * 查询我的订单列表
   */
  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: {
        task: {
            select: { id: true, title: true, price: true, status: true, image: true, publisher: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}