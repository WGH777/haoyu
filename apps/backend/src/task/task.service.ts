// apps/backend/src/task/task.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建任务（赏金 + 服务费 一次性扣款）
   * @param userId 发布人 ID
   * @param createTaskDto 任务数据（price 为分）
   */
  async create(userId: number, createTaskDto: CreateTaskDto) {
    const { title, description, price } = createTaskDto;

    // 服务费比例：10%（这里可后续抽出来做配置）
    const SERVICE_FEE_RATE = 0.1;

    // 服务费：按比例计算，向最近的 1 分取整，最少为 0
    const serviceFee = Math.max(0, Math.round(price * SERVICE_FEE_RATE));

    // 总扣款 = 赏金 + 服务费
    const totalCost = price + serviceFee;

    return this.prisma.$transaction(async (tx: any) => {
      // 1. 检查余额是否足够
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!user || user.balance < totalCost) {
        throw new BadRequestException(
          `余额不足，当前: ${user?.balance || 0}，需要: ${totalCost} (含服务费 ${serviceFee})`,
        );
      }

      // 2. 从余额中扣除总金额
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: totalCost,
          },
        },
      });

      // 3. 记录资金流水（负数代表支出）
      await tx.transaction.create({
        data: {
          amount: -totalCost,
          type: 'PUBLISH', // 发布任务
          status: 'SUCCESS',
          userId,
        },
      });

      // 4. 创建任务记录，落库 serviceFee
      return tx.task.create({
        data: {
          title,
          description,
          price,
          serviceFee,
          publisherId: userId,
          status: 'PENDING',
        },
      });
    });
  }

  // 查询所有任务
  async findAll() {
    return this.prisma.task.findMany({
      include: {
        publisher: {
          select: { nickname: true, email: true, id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 查询单个任务
  async findOne(id: number) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        publisher: { select: { nickname: true, email: true } },
      },
    });
  }

  // 查询我发布的任务
  async findCreatedBy(userId: number) {
    return this.prisma.task.findMany({
      where: { publisherId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 查询我参与的任务（通过订单表）
  async findAssignedTo(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: {
        task: true,
        worker: { select: { nickname: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 更新任务
  async update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto as any,
    });
  }

  // 删除任务
  async remove(id: number) {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  // 兼容旧接口：直接提示已升级
  async assignTask(_taskId: number, _userId: number) {
    throw new BadRequestException('接口已升级，请使用 POST /order 进行抢单');
  }

  async completeTask(_taskId: number, _userId: number) {
    throw new BadRequestException(
      '接口已升级，请使用 POST /order/:id/complete 接口结算',
    );
  }
}
