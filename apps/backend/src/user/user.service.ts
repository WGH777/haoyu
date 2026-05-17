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

  /**
   * 🔥 核心修复：级联删除用户
   * 在删除用户前，必须先删除他产生的所有关联数据（流水、订单、任务、子任务）
   */
  async remove(id: number) {
    // 使用事务，确保要么全删，要么都不删
    return this.prisma.$transaction(async (tx) => {
      // 1. 删除该用户的资金流水 (Transactions)
      await tx.transaction.deleteMany({ where: { userId: id } });

      // 2. 删除该用户作为【执行者】接的单 (Orders as worker)
      await tx.order.deleteMany({ where: { workerId: id } });

      // 3. 处理该用户作为【发布者】发布的任务
      // 先找到他发布的所有任务ID
      const myTasks = await tx.task.findMany({
        where: { publisherId: id },
        select: { id: true }
      });
      const myTaskIds = myTasks.map(t => t.id);

      if (myTaskIds.length > 0) {
        // 3.1 删除这些任务下的所有子任务
        await tx.subTask.deleteMany({
          where: { taskId: { in: myTaskIds } }
        });

        // 3.2 删除这些任务下的所有订单 (哪怕是别人接的，任务都没了，订单也得删)
        await tx.order.deleteMany({
          where: { taskId: { in: myTaskIds } }
        });

        // 3.3 删除任务本身
        await tx.task.deleteMany({
          where: { id: { in: myTaskIds } }
        });
      }

      // 4. 一切清理干净后，最后删除用户本体
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
