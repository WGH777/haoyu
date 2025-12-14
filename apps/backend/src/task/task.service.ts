// apps/backend/src/task/task.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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
          type: 'PUBLISH',
          status: 'SUCCESS',
          userId,
        },
      });

      // 4. 创建任务记录
      return tx.task.create({
        data: {
          title,
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
        status: { in: ['PENDING', 'ASSIGNED', 'SUBMITTED', 'ONGOING'] },
      },
      include: {
        publisher: {
          select: { nickname: true, email: true, id: true, avatar: true },
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
          select: { nickname: true, email: true, id: true, avatar: true },
        },
        subTasks: { orderBy: { id: 'asc' } },
      },
    });

    if (!task) throw new NotFoundException('任务不存在');
    return task;
  }

  /**
   * 更新任务基础信息
   */
  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('任务不存在');

    return this.prisma.task.update({
      where: { id },
      data: {
        title: updateTaskDto.title ?? existing.title,
        description: updateTaskDto.description ?? existing.description,
        image: updateTaskDto.image ?? existing.image,
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('任务不存在');
    return this.prisma.task.delete({ where: { id } });
  }

  async findCreatedBy(userId: number) {
    return this.prisma.task.findMany({
      where: { publisherId: userId },
      include: { subTasks: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAssignedTo(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: {
        task: {
          include: {
            subTasks: true,
            publisher: {
              select: { nickname: true, email: true, id: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

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
    if (!task) throw new NotFoundException('任务不存在');

    if (task.publisherId !== userId) {
      throw new ForbiddenException('只有发布者才能管理子任务');
    }

    const safeTitle = (title || '').trim();
    if (!safeTitle) throw new BadRequestException('子任务标题不能为空');

    return this.prisma.subTask.create({
      data: { title: safeTitle, taskId },
    });
  }

  /**
   * 更新子任务（标题 / 完成状态）
   *
   * 规则：
   * - 发布者：可改 title、isDone
   * - 执行者（已接单/已提交）：只能改 isDone
   */
  async updateSubTask(
    taskId: number,
    subTaskId: number,
    userId: number,
    payload: { title?: string; isDone?: boolean },
  ) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('任务不存在');

    const subTask = await this.prisma.subTask.findUnique({
      where: { id: subTaskId },
    });
    if (!subTask || subTask.taskId !== taskId) {
      throw new NotFoundException('子任务不存在');
    }

    const hasTitle = payload.title !== undefined;
    const hasIsDone = payload.isDone !== undefined;

    if (!hasTitle && !hasIsDone) {
      throw new BadRequestException('请至少提交一个可更新字段');
    }

    const isPublisher = task.publisherId === userId;

    // 发布者：可更新 title / isDone
    if (isPublisher) {
      if (hasTitle) {
        const t = (payload.title || '').trim();
        if (!t) throw new BadRequestException('子任务标题不能为空');
      }

      return this.prisma.subTask.update({
        where: { id: subTaskId },
        data: {
          ...(hasTitle ? { title: payload.title!.trim() } : {}),
          ...(hasIsDone ? { isDone: payload.isDone } : {}),
        },
      });
    }

    // 执行者：必须是该任务当前执行者（ASSIGNED 或 SUBMITTED），且只能改 isDone
    const order = await this.prisma.order.findFirst({
      where: {
        taskId,
        workerId: userId,
        status: { in: ['ASSIGNED', 'SUBMITTED'] },
      },
      select: { id: true },
    });

    if (!order) {
      throw new ForbiddenException('只有发布者或当前执行者才能更新子任务');
    }

    if (hasTitle) {
      throw new BadRequestException('执行者只能修改完成状态（isDone）');
    }
    if (!hasIsDone) {
      throw new BadRequestException('执行者更新子任务必须提供 isDone');
    }

    return this.prisma.subTask.update({
      where: { id: subTaskId },
      data: { isDone: payload.isDone },
    });
  }

  /**
   * 删除子任务（仅发布者）
   */
  async deleteSubTask(taskId: number, subTaskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('任务不存在');

    if (task.publisherId !== userId) {
      throw new ForbiddenException('只有发布者才能管理子任务');
    }

    const subTask = await this.prisma.subTask.findUnique({
      where: { id: subTaskId },
    });
    if (!subTask || subTask.taskId !== taskId) {
      throw new NotFoundException('子任务不存在');
    }

    return this.prisma.subTask.delete({ where: { id: subTaskId } });
  }
}
