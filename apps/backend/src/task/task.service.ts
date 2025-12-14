// apps/backend/src/task/task.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type RoleStr = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | string;
type TaskStatus = 'PENDING' | 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'ONGOING';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  /* ==================== RBAC 第 5.1：任务状态机 ==================== */

  private readonly taskTransitions: Record<TaskStatus, TaskStatus[]> = {
    PENDING: ['ASSIGNED'],
    ASSIGNED: ['SUBMITTED'],
    SUBMITTED: ['COMPLETED', 'ASSIGNED'],
    COMPLETED: [],
    ONGOING: [], // 兼容旧状态，不允许再流转
  };

  private assertTaskTransition(from: TaskStatus, to: TaskStatus) {
    const allowed = this.taskTransitions[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `非法任务状态流转：${from} -> ${to}`,
      );
    }
  }

  /* ==================== RBAC 第 4：资源级权限 ==================== */

  private isAdmin(role?: RoleStr) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private async assertTaskOwnerOrAdmin(
    taskId: number,
    userId: number,
    role?: RoleStr,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, publisherId: true },
    });

    if (!task) throw new NotFoundException('任务不存在');

    if (task.publisherId !== userId && !this.isAdmin(role)) {
      throw new ForbiddenException('无权操作该任务（仅发布者或管理员可操作）');
    }

    return task;
  }

  /* ==================== 核心业务 ==================== */

  async create(userId: number, createTaskDto: CreateTaskDto) {
    const { title, description, price, image } = createTaskDto;

    const SERVICE_FEE_RATE = 0.1;
    const serviceFee = Math.max(0, Math.round(price * SERVICE_FEE_RATE));
    const totalCost = price + serviceFee;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!user || user.balance < totalCost) {
        throw new BadRequestException(
          `余额不足，当前: ${user?.balance || 0}，需要: ${totalCost}`,
        );
      }

      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalCost } },
      });

      await tx.transaction.create({
        data: {
          amount: -totalCost,
          type: 'PUBLISH',
          status: 'SUCCESS',
          userId,
        },
      });

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

  async update(
    id: number,
    updateTaskDto: UpdateTaskDto,
    userId: number,
    role?: RoleStr,
  ) {
    await this.assertTaskOwnerOrAdmin(id, userId, role);

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

  async remove(id: number, userId: number, role?: RoleStr) {
    await this.assertTaskOwnerOrAdmin(id, userId, role);

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

  /* ==================== 子任务相关（保持原逻辑） ==================== */

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
