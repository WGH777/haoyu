import { Injectable } from '@nestjs/common';
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
  isBanned: true,
  banReason: true,
  isTest: true,
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
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...safeUserSelect,
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
    });
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

  async verify(id: number, verified: boolean, certLevel: string) {
    return this.prisma.user.update({
      where: { id },
      data: { verified, certLevel },
      select: { id: true, email: true, nickname: true, verified: true, certLevel: true },
    });
  }

  async requestVerify(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { certLevel: 'PENDING' },
      select: { id: true, verified: true, certLevel: true },
    });
  }

  /** 用户信用统计 */
  async getCreditStats(userId: number) {
    const [completed, cancelled, allAsWorker] = await Promise.all([
      this.prisma.order.count({ where: { workerId: userId, status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { workerId: userId, status: 'CANCELLED' } }),
      this.prisma.order.count({ where: { workerId: userId } }),
    ]);
    const completionRate = allAsWorker > 0 ? Math.round((completed / allAsWorker) * 100) : 0;
    return { completed, cancelled, totalAsWorker: allAsWorker, completionRate };
  }

  /**
   * 🔥 核心修复：级联删除用户
   * 在删除用户前，必须先删除他产生的所有关联数据（流水、订单、任务、子任务）
   */
  async remove(id: number) {
    // 使用事务，确保要么全删，要么都不删
    return this.prisma.$transaction(async (tx) => {
      // 0. 先查用户钱包（用于清理账本）
      const userWallets = await tx.wallet.findMany({
        where: { userId: id },
        select: { id: true },
      });
      const walletIds = userWallets.map(w => w.id);

      // 0.1 删除账本记录（FK 引用 walletId / userId）
      if (walletIds.length > 0) {
        await tx.ledgerEntry.deleteMany({
          where: {
            OR: [
              { walletId: { in: walletIds } },
              { userId: id },
            ],
          },
        });
      }

      // 1. 删除该用户的资金流水 (Legacy Transactions)
      await tx.transaction.deleteMany({ where: { userId: id } });

      // 2. 删除通知
      await tx.notification.deleteMany({ where: { userId: id } });

      // 3. 删除钱包
      if (walletIds.length > 0) {
        await tx.wallet.deleteMany({ where: { userId: id } });
      }

      // 4. 处理该用户作为【发布者】发布的任务
      const myTasks = await tx.task.findMany({
        where: { publisherId: id },
        select: { id: true }
      });
      const myTaskIds = myTasks.map(t => t.id);

      // 4.1 找出所有需要删除的订单（workerId + taskId）
      const ordersToDelete = await tx.order.findMany({
        where: {
          OR: [
            { workerId: id },
            ...(myTaskIds.length > 0 ? [{ taskId: { in: myTaskIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const orderIds = ordersToDelete.map(o => o.id);

      // 4.2 先删除订单的下游关联（FK: OrderComment, Dispute, LedgerEntry.orderId）
      if (orderIds.length > 0) {
        await tx.orderComment.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.dispute.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.ledgerEntry.deleteMany({ where: { orderId: { in: orderIds } } });
      }

      // 4.3 删除该用户作为【执行者】接的单
      await tx.order.deleteMany({ where: { workerId: id } });

      if (myTaskIds.length > 0) {
        // 5.1 删除这些任务下的子任务
        await tx.subTask.deleteMany({
          where: { taskId: { in: myTaskIds } }
        });

        // 5.2 删除这些任务下的所有订单
        await tx.order.deleteMany({
          where: { taskId: { in: myTaskIds } }
        });

        // 5.3 删除任务本身
        await tx.task.deleteMany({
          where: { id: { in: myTaskIds } }
        });
      }

      // 6. 一切清理干净后，最后删除用户本体
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

  /**
   * 封禁用户
   */
  async ban(userId: number, reason?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, bannedAt: new Date(), banReason: reason || null },
      select: { id: true, email: true, nickname: true, isBanned: true, bannedAt: true, banReason: true },
    });
  }

  /**
   * 解封用户
   */
  async unban(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, bannedAt: null, banReason: null },
      select: { id: true, email: true, nickname: true, isBanned: true },
    });
  }

  /**
   * 封禁检查：返回用户封禁状态
   */
  async checkBanStatus(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, bannedAt: true, banReason: true },
    });
    if (!user) throw new Error('用户不存在');
    return user;
  }

  /**
   * 查找当前超级管理员（用于唯一性校验）
   */
  async findSuperAdmin() {
    return this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, email: true, nickname: true, role: true },
    });
  }

  /**
   * （超管）修改任意用户的昵称
   */
  async updateNickname(userId: number, nickname: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
      select: { id: true, email: true, nickname: true, role: true },
    });
  }

  /**
   * 批量删除用户（超管专用，级联删除关联数据）
   */
  async removeBatch(ids: number[]) {
    if (!ids || ids.length === 0) return { deleted: 0 };

    // 找到这些用户发布的任务
    const tasks = await this.prisma.task.findMany({
      where: { publisherId: { in: ids } },
      select: { id: true },
    });
    const taskIds = tasks.map(t => t.id);

    // 找到这些用户的钱包（先查，用于清理账本）
    const wallets = await this.prisma.wallet.findMany({
      where: { userId: { in: ids } },
      select: { id: true },
    });
    const walletIds = wallets.map(w => w.id);

    // 找到所有需要删除的订单（用于清理 FK 关联）
    const ordersToDelete = await this.prisma.order.findMany({
      where: {
        OR: [
          { workerId: { in: ids } },
          ...(taskIds.length > 0 ? [{ taskId: { in: taskIds } }] : []),
        ],
      },
      select: { id: true },
    });
    const orderIds = ordersToDelete.map(o => o.id);

    await this.prisma.$transaction(async (tx) => {
      // 0. 先删除账本记录（FK 引用 walletId / userId / orderId）
      await tx.ledgerEntry.deleteMany({
        where: {
          OR: [
            { walletId: { in: walletIds } },
            { userId: { in: ids } },
            ...(orderIds.length > 0 ? [{ orderId: { in: orderIds } }] : []),
          ],
        },
      });
      // 1. 删除关联的流水（Legacy）
      await tx.transaction.deleteMany({ where: { userId: { in: ids } } });
      // 2. 删除通知
      await tx.notification.deleteMany({ where: { userId: { in: ids } } });
      // 3. 删除钱包
      if (walletIds.length > 0) {
        await tx.wallet.deleteMany({ where: { userId: { in: ids } } });
      }
      // 3.5 删除订单的下游关联（FK: OrderComment, Dispute）
      if (orderIds.length > 0) {
        await tx.orderComment.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.dispute.deleteMany({ where: { orderId: { in: orderIds } } });
      }
      // 4. 删除相关订单
      await tx.order.deleteMany({
        where: {
          OR: [
            { workerId: { in: ids } },
            ...(taskIds.length > 0 ? [{ taskId: { in: taskIds } }] : []),
          ],
        },
      });
      // 5. 删除子任务
      if (taskIds.length > 0) {
        await tx.subTask.deleteMany({ where: { taskId: { in: taskIds } } });
      }
      // 6. 删除任务
      await tx.task.deleteMany({ where: { publisherId: { in: ids } } });
      // 7. 删除用户
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    });

    return { deleted: ids.length };
  }

  /**
   * 一键清理所有测试账号（级联删除关联数据）
   */
  async deleteTestUsers() {
    const testUsers = await this.prisma.user.findMany({
      where: { isTest: true },
      select: { id: true },
    });
    if (testUsers.length === 0) return { deleted: 0 };

    const ids = testUsers.map(u => u.id);

    // 找到这些用户发布的任务
    const tasks = await this.prisma.task.findMany({
      where: { publisherId: { in: ids } },
      select: { id: true },
    });
    const taskIds = tasks.map(t => t.id);

    // 找到这些用户的钱包
    const wallets = await this.prisma.wallet.findMany({
      where: { userId: { in: ids } },
      select: { id: true },
    });
    const walletIds = wallets.map(w => w.id);

    // 找到所有需要删除的订单（用于清理 FK 关联）
    const ordersToDelete = await this.prisma.order.findMany({
      where: {
        OR: [
          { workerId: { in: ids } },
          ...(taskIds.length > 0 ? [{ taskId: { in: taskIds } }] : []),
        ],
      },
      select: { id: true },
    });
    const orderIds = ordersToDelete.map(o => o.id);

    await this.prisma.$transaction(async (tx) => {
      // 0. 先删除账本记录（FK 引用 walletId / userId / orderId）
      await tx.ledgerEntry.deleteMany({
        where: {
          OR: [
            { walletId: { in: walletIds } },
            { userId: { in: ids } },
            ...(orderIds.length > 0 ? [{ orderId: { in: orderIds } }] : []),
          ],
        },
      });
      // 1. 删除关联的流水（Legacy）
      await tx.transaction.deleteMany({ where: { userId: { in: ids } } });
      // 2. 删除通知
      await tx.notification.deleteMany({ where: { userId: { in: ids } } });
      // 3. 删除钱包
      if (walletIds.length > 0) {
        await tx.wallet.deleteMany({ where: { userId: { in: ids } } });
      }
      // 3.5 删除订单的下游关联（FK: OrderComment, Dispute）
      if (orderIds.length > 0) {
        await tx.orderComment.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.dispute.deleteMany({ where: { orderId: { in: orderIds } } });
      }
      // 4. 删除相关订单（测试用户接的 + 测试用户任务下的）
      await tx.order.deleteMany({
        where: {
          OR: [
            { workerId: { in: ids } },
            ...(taskIds.length > 0 ? [{ taskId: { in: taskIds } }] : []),
          ],
        },
      });
      // 5. 删除子任务
      if (taskIds.length > 0) {
        await tx.subTask.deleteMany({ where: { taskId: { in: taskIds } } });
      }
      // 6. 删除任务
      await tx.task.deleteMany({ where: { publisherId: { in: ids } } });
      // 7. 删除用户
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    });

    return { deleted: testUsers.length };
  }
}
