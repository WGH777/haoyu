import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Phase 2: balance 已从 User 移除，改为通过 WalletService 查询
const safeUserSelect = {
  id: true,
  email: true,
  nickname: true,
  bio: true,
  role: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建用户
   */
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: safeUserSelect,
    });
  }

  /**
   * 获取所有用户列表
   */
  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: safeUserSelect,
    });
  }

  /**
   * 根据 ID 查询用户
   */
  async findById(id: number) {
    const [user, wallet] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        select: {
          ...safeUserSelect,
          createdAt: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              amount: true,
              type: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.wallet.findFirst({
        where: { userId: id, currency: 'CNY' },
        select: { available: true, frozen: true },
      }),
    ]);
    return { ...user, wallet };
  }

  /**
   * 根据邮箱查询
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 修改用户角色（含安全规则）
   */
  async changeRole(id: number, newRole: string) {
    // 规则 2: 禁止降级最后一个 SUPER_ADMIN
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (targetUser?.role === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN' },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('不能降级最后一个超级管理员');
      }
    }

    return this.update(id, { role: newRole } as any);
  }

  /**
   * 更新用户信息 (通用)
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
  }

  // Phase 2: updateBalance 已废弃 — 余额现通过 WalletService 操作
  // 保留为空方法避免编译报错，Phase 3 全部切换后可删除

  /**
   * 🔥 核心修复：级联删除用户
   * 
   * 删除顺序必须严格按照外键依赖层次，从最外层子表逐步向内层父表删除：
   * 
   * 第1层（直接依赖 User）：
   *   Transaction(userId), Notification(userId), OrderComment(userId),
   *   AdminActionLog(adminId), Wallet(userId)
   * 
   * 第2层（间接依赖 — 先清子再删父）：
   *   SubTask → Task, OrderComment → Order, Order → Task/User,
   *   Dispute → Order/Task/User
   * 
   * 第3层（父表）：
   *   先 Order(workerId/taskId), 再 Task(publisherId), 最后 User
   */
  async remove(id: number) {
    // 规则 4: 禁止删除最后一个 SUPER_ADMIN
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (targetUser?.role === 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN' },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('不能删除最后一个超级管理员');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // ─── 层1：直接关联 User 的叶子表 ───

      // 1. 资金流水
      await tx.transaction.deleteMany({ where: { userId: id } });

      // 2. 通知
      await tx.notification.deleteMany({ where: { userId: id } });

      // 3. 订单留言（用户直接留言）
      await tx.orderComment.deleteMany({ where: { userId: id } });

      // 4. 管理员审计日志
      await tx.adminActionLog.deleteMany({ where: { adminId: id } });

      // 5. 钱包（如果 Wallet 表存在）
      try { await tx.wallet.deleteMany({ where: { userId: id } }); } catch {}

      // ─── 层2：收集用户作为发布者的任务 ID ───
      const myTasks = await tx.task.findMany({
        where: { publisherId: id },
        select: { id: true },
      });
      const myTaskIds = myTasks.map(t => t.id);

      // ─── 层3：清理用户作为执行者接的单（先清关联子表）───
      const workerOrders = await tx.order.findMany({
        where: { workerId: id },
        select: { id: true },
      });
      const workerOrderIds = workerOrders.map(o => o.id);

      if (workerOrderIds.length > 0) {
        // 清除订单下的留言和争议
        await tx.orderComment.deleteMany({
          where: { orderId: { in: workerOrderIds } },
        });
        await tx.dispute.deleteMany({
          where: { orderId: { in: workerOrderIds } },
        });
        // 删除订单
        await tx.order.deleteMany({
          where: { id: { in: workerOrderIds } },
        });
      }

      // ─── 层4：清理用户发布的任务（先清子再删父）───
      if (myTaskIds.length > 0) {
        // 4.1 查找任务下所有订单
        const taskOrders = await tx.order.findMany({
          where: { taskId: { in: myTaskIds } },
          select: { id: true },
        });
        const taskOrderIds = taskOrders.map(o => o.id);

        // 4.2 清除子任务
        await tx.subTask.deleteMany({
          where: { taskId: { in: myTaskIds } },
        });

        // 4.3 清除留言 (order level)
        if (taskOrderIds.length > 0) {
          await tx.orderComment.deleteMany({
            where: { orderId: { in: taskOrderIds } },
          });
        }

        // 4.4 清除争议 (task level + order level)
        await tx.dispute.deleteMany({
          where: { taskId: { in: myTaskIds } },
        });
        if (taskOrderIds.length > 0) {
          await tx.dispute.deleteMany({
            where: { orderId: { in: taskOrderIds } },
          });
        }

        // 4.5 删除子订单
        if (taskOrderIds.length > 0) {
          await tx.order.deleteMany({
            where: { id: { in: taskOrderIds } },
          });
        }

        // 4.6 删除任务
        await tx.task.deleteMany({
          where: { id: { in: myTaskIds } },
        });
      }

      // ─── 层5：清理用户直接参与的争议（作为 opener）───
      await tx.dispute.deleteMany({ where: { openerId: id } });

      // ─── 最后：删除用户 ───
      return tx.user.delete({
        where: { id },
      });
    });
  }

  /**
   * 修改个人资料（仅本人）
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const data: any = {};

    if (typeof dto.nickname !== 'undefined') {
      data.nickname = dto.nickname;
    }
    if (typeof dto.bio !== 'undefined') {
      data.bio = dto.bio;
    }
    // ✅ 新增：头像（允许传 null 清空）
    if (typeof (dto as any).avatar !== 'undefined') {
      data.avatar = (dto as any).avatar;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: safeUserSelect,
    });
  }

  /**
   * 重置密码
   */
  async adminResetPassword(userId: number, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }
}
