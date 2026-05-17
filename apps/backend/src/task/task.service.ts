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

    // 诈骗防范：新用户（注册<7天）首单限额 ¥500
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const daysSinceReg = (Date.now() - user.createdAt.getTime()) / 86400000;
      const completedOrders = await this.prisma.order.count({
        where: { task: { publisherId: userId }, status: 'COMPLETED' },
      });
      if (daysSinceReg < 7 && completedOrders < 1 && price > 50000) {
        throw new BadRequestException('新用户首单金额不能超过 ¥500');
      }
    }

    // 自动风险评估
    const autoRisk = assessRisk(createTaskDto, price);

    // TODO Phase 3: 阶梯费率 (0%/2%/5%/10%)
    const SERVICE_FEE_RATE = 0; // P0 阶段暂免服务费
    const serviceFee = Math.max(0, Math.round(price * SERVICE_FEE_RATE));
    const totalCost = price + serviceFee;

    return this.prisma.$tx(async (tx: Prisma.TransactionClient) => {
      // Phase 2: 通过 Wallet 冻结资金
      const wallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId, currency: 'CNY' } },
      });
      if (!wallet) throw new BadRequestException('钱包不存在，请先创建钱包');
      if (wallet.available < totalCost) {
        throw new BadRequestException(
          `余额不足，当前: ${wallet.available} 分，需要: ${totalCost} 分`,
        );
      }

      // 冻结发布者资金
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          available: { decrement: totalCost },
          frozen: { increment: totalCost },
        },
      });

      // 创建任务
      const task = await tx.task.create({
        data: {
          title,
          description: description ?? '',
          price,
          serviceFee,
          image: image || null,
          publisherId: userId,
          status: 'PENDING',
          riskLevel: autoRisk,
        },
      });

      // 写 LedgerEntry
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId,
          amount: totalCost,
          direction: 'OUT',
          type: 'FREEZE',
          balanceAfter: wallet.available - totalCost,
          frozenAfter: wallet.frozen + totalCost,
          remark: `发布任务 #${task.id}: ${title}`,
        },
      });

      return task;
    });
  }

  async findAll() {
    return this.prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'ASSIGNED', 'SUBMITTED', 'ONGOING'] },
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        serviceFee: true,
        category: true,
        serviceMode: true,
        serviceLocation: true,
        isPublicWelfare: true,
        isFamilyCare: true,
        isProxyRequest: true,
        needVerification: true,
        riskLevel: true,
        location: true,
        views: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        publisherId: true,
        publisher: {
          select: { id: true, nickname: true, avatar: true },
        },
        subTasks: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: {
        id: true, title: true, description: true, price: true,
        serviceFee: true, category: true, serviceMode: true,
        serviceLocation: true, isPublicWelfare: true, isFamilyCare: true,
        isProxyRequest: true, needVerification: true, riskLevel: true,
        location: true, views: true, status: true, image: true,
        createdAt: true, updatedAt: true, publisherId: true,
        publisher: {
          select: { id: true, nickname: true, avatar: true },
        },
        subTasks: { orderBy: { id: 'asc' } },
        _count: { select: { orders: true } },
      },
    });

    if (!task) throw new NotFoundException('任务不存在');

    // 增加浏览量
    await this.prisma.task.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

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

/** 自动风险评估引擎 */
function assessRisk(dto: { title?: string; description?: string; serviceMode?: string; category?: string }, price: number): string {
  let score = 0
  const text = `${dto.title || ''} ${dto.description || ''}`.toLowerCase()

  // 金额风险
  if (price > 100000) score += 3
  else if (price > 50000) score += 2
  else if (price > 10000) score += 1

  // 关键词风险
  const highRiskWords = ['密码','验证码','转账','银行卡','身份证','账号','贷款','刷单','佣金','返利','赌博']
  const medRiskWords = ['代购','代付','代收','垫付','押金','保证金']
  for (const w of highRiskWords) if (text.includes(w)) score += 3
  for (const w of medRiskWords) if (text.includes(w)) score += 1

  // 线下服务额外风险
  if (dto.serviceMode === 'OFFLINE') score += 1

  if (score >= 6) return 'HIGH'
  if (score >= 3) return 'MEDIUM'
  return 'LOW'
}
