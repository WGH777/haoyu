// apps/backend/src/task/task.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
    const { title, description, price, image } = createTaskDto;

    // 服务费比例：10%
    const SERVICE_FEE_RATE = 0.1;
    const serviceFee = Math.max(0, Math.round(price * SERVICE_FEE_RATE));
    const totalCost = price + serviceFee;

    return this.prisma.$transaction(async (tx) => {
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
          // description 是必填字段，这里确保一定是字符串
          description: description ?? '',
          price,
          serviceFee,
          image: image || null,
          publisherId: userId,
          status: 'PENDING',
        },
      });
    });
  }

  /**
   * 任务大厅：查询所有待领取和进行中的任务
   */
  async findAll() {
    return this.prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'ONGOING'] },
      },
      include: {
        publisher: {
          select: {
            nickname: true,
            email: true,
            id: true,
            avatar: true,
          },
        },
        subTasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 任务详情（包含发布者信息 + 子任务）
   */
  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        publisher: {
          select: {
            nickname: true,
            email: true,
            id: true,
            avatar: true,
          },
        },
        subTasks: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    return task;
  }

  /**
   * 更新任务基础信息
   */
  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('任务不存在');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        title: updateTaskDto.title ?? existing.title,
        description: updateTaskDto.description ?? existing.description,
        image: updateTaskDto.image ?? existing.image,
      },
    });
  }

  /**
   * 删除任务（如后续需要再开放）
   */
  async remove(id: number) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('任务不存在');
    }

    return this.prisma.task.delete({ where: { id } });
  }

  /**
   * 我发布的任务列表（带子任务）
   */
  async findCreatedBy(userId: number) {
    return this.prisma.task.findMany({
      where: { publisherId: userId },
      include: {
        subTasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 我接取的任务（老接口，当前前端已用 /order/my，可以保留兼容）
   */
  async findAssignedTo(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: {
        task: {
          include: {
            subTasks: true,
            publisher: {
              select: {
                nickname: true,
                email: true,
                id: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 旧版本 completeTask 占位，提示使用订单结算接口
   */
  async completeTask(_taskId: number, _userId: number) {
    throw new BadRequestException(
      '接口已升级，请使用 POST /order/:id/complete 接口结算',
    );
  }

  // ==================== 子任务相关 ====================

  /**
   * 新增子任务（仅发布者可操作）
   */
  async createSubTask(taskId: number, userId: number, title: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    if (task.publisherId !== userId) {
      throw new UnauthorizedException('只有发布者才能管理子任务');
    }

    return this.prisma.subTask.create({
      data: {
        title,
        taskId,
      },
    });
  }

  /**
   * 更新子任务（标题 / 完成状态）
   */
  async updateSubTask(
    taskId: number,
    subTaskId: number,
    userId: number,
    payload: { title?: string; isDone?: boolean },
  ) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    if (task.publisherId !== userId) {
      throw new UnauthorizedException('只有发布者才能管理子任务');
    }

    return this.prisma.subTask.update({
      where: { id: subTaskId },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.isDone !== undefined ? { isDone: payload.isDone } : {}),
      },
    });
  }

  /**
   * 删除子任务
   */
  async deleteSubTask(taskId: number, subTaskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    if (task.publisherId !== userId) {
      throw new UnauthorizedException('只有发布者才能管理子任务');
    }

    return this.prisma.subTask.delete({
      where: { id: subTaskId },
    });
  }
}
