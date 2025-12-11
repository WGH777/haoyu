import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private userService: UserService,
  ) {}

  /**
   * 注册 (SignUp)
   */
  async signUp(email: string, pass: string, nickname: string) {
    const exist = await this.prisma.user.findUnique({
      where: { email },
    });

    if (exist) {
      throw new UnauthorizedException('邮箱已被注册');
    }

    const hashed = await bcrypt.hash(pass, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        nickname: nickname || '新用户',
        balance: 100000, // 单位：分，= 1000.00 元
        role: 'USER',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...result } = user;

    return {
      user: result,
      ...tokens,
    };
  }

  /**
   * 登录 (SignIn)
   */
  async signIn(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...result } = user;

    return {
      user: result,
      ...tokens,
    };
  }

  /**
   * 刷新 Token
   */
  async refresh(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh Token 无效');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Refresh Token 不正确或已过期');
    }

    const newTokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, newTokens.refreshToken);

    return newTokens;
  }

  /**
   * 当前用户修改自己的密码
   */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('旧密码不正确');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        // 为安全起见，修改密码后清空 refreshToken，强制重新登录
        refreshToken: null,
      },
    });
  }

  /**
   * 超级管理员重置任意用户密码
   * （不需要旧密码，直接覆盖新密码）
   */
  async resetPasswordByAdmin(userId: number, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('要重置的用户不存在');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        refreshToken: null,
      },
    });
  }

  /**
   * 生成 Access + Refresh Token
   */
  private async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * 保存 refresh token（哈希存储）
   */
  private async updateRefreshToken(userId: number, token: string) {
    const hashed = await bcrypt.hash(token, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
}
