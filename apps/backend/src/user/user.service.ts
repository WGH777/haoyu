import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建用户（一般由注册流程或超级管理员调用）
   * 默认角色为 USER（由数据库默认值控制）
   */
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        // 不显式写 role，走 Prisma schema 里的默认 USER
      },
    });
  }

  /**
   * 获取所有用户列表（后台管理用）
   */
  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据 ID 查询用户（扩展了最近 20 条交易记录）
   */
  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  /**
   * 根据邮箱查询（登录 / 业务内部使用）
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 更新用户信息（仅后台使用）
   * - 如果传入了 password，会自动加密
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除用户（仅限后台管理使用）
   */
  async remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * ★ 当前登录用户修改自己的资料（昵称 / 简介等）
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname,
        bio: dto.bio,
      },
    });
  }

  /**
   * ★ 超级管理员重置指定用户密码
   * 不需要旧密码，直接覆盖为新密码
   */
  async adminResetPassword(userId: number, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }
}
