import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    // 包含 title, description, price, image
    const { title, description, price, image } = createTaskDto;

    // 服务费比例：10%（这里可后续抽出来做配置）
    const SERVICE_FEE_RATE = 0.1;

    // 服务费：按比例计算，向最近的 1 分取整，最少为 0
    const serviceFee = Math.max(0, Math.round(price * SERVICE_FEE_RATE));

    // 总扣款 = 赏金 + 服务费
    const totalCost = price + serviceFee;

    // 使用事务保证扣款和任务创建的原子性
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

      // 4. 创建任务记录，落库 serviceFee 和 image URL
      return tx.task.create({
        data: {
          title,
          description,
          price,
          serviceFee,
          // 🔥 融合点：保存图片 URL
          image: image || null, 
          publisherId: userId,
          status: 'PENDING',
        },
      });
    });
  }

  /**
   * 查询所有待领取和进行中的任务（任务大厅用）
   */
  async findAll() {
    return this.prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'ONGOING'] }
      },
      include: {
        publisher: {
          select: { nickname: true, email: true, id: true, avatar: true }, // 🔥 包含头像信息
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 查询单个任务
   */
  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        publisher: { select: { nickname: true, email: true, avatar: true } }, // 🔥 包含头像信息
      },
    });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
  }

  /**
   * 查询我发布的任务
   */
  async findCreatedBy(userId: number) {
    return this.prisma.task.findMany({
      where: { publisherId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  /**
   * 查询我抢到的任务（通过订单表）
   * 注意：此方法应由 OrderService 提供更专业的实现
   */
  async findAssignedTo(userId: number) {
    // 兼容旧接口：直接调用 Order 表，但更建议将此逻辑移到 OrderService
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: {
        task: true,
        worker: { select: { nickname: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 更新任务
   */
  async update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto as any,
    });
  }

  /**
   * 删除任务
   */
  async remove(id: number) {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  // 兼容旧接口
  async assignTask(_taskId: number, _userId: number) {
    throw new BadRequestException('接口已升级，请使用 POST /order 进行抢单');
  }

  async completeTask(_taskId: number, _userId: number) {
    throw new BadRequestException(
      '接口已升级，请使用 POST /order/:id/complete 接口结算',
    );
  }
}