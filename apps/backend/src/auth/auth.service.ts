import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

type JwtPayload = {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
  jti?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // 注册
  async signUp(email: string, pass: string, nickname: string) {
    const exist = await this.prisma.user.findUnique({ where: { email } });
    if (exist) throw new UnauthorizedException('邮箱已被注册');

    const hashed = await bcrypt.hash(pass, 10);
    // Phase 2: 注册不再写 User.balance，改为创建 Wallet
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        nickname: nickname || '新用户',
        role: 'USER',
      },
    });

    // 创建 CNY 钱包
    await this.prisma.wallet.create({
      data: {
        ownerType: 'USER',
        userId: user.id,
        currency: 'CNY',
        available: 0,
        frozen: 0,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...result } = user as any;
    return { user: result, ...tokens };
  }

  // 登录
  async signIn(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('账号或密码错误');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('账号或密码错误');

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('账号已被封禁，请联系平台管理员');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...result } = user as any;
    return { user: result, ...tokens };
  }

  // ✅ Refresh：用 refreshToken 换新 accessToken（并轮换 refreshToken，一次性）
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('refreshToken is required');

    // 1) 验签 refreshToken（含 exp）
    let payload: JwtPayload;
    try {
      payload = (await this.jwt.verifyAsync(refreshToken)) as JwtPayload;
    } catch {
      throw new UnauthorizedException('refreshToken 无效或已过期');
    }

    const userId = Number(payload?.sub);
    if (!userId) throw new UnauthorizedException('refreshToken payload 无效');

    // 2) 查用户 + compare（必须匹配 DB hash）
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('账号已被封禁，请联系平台管理员');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('refreshToken 已失效，请重新登录');
    }

    const ok = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!ok) {
      throw new UnauthorizedException('refreshToken 不匹配或已被轮换，请重新登录');
    }

    // 3) 生成新 tokens（refreshToken 带 jti，确保每次都不同）
    const tokens = await this.generateTokens(user.id, user.email);

    // 4) ✅ 原子轮换：仅当 refreshToken hash 仍为“当前这份”时才更新成功
    //    这样并发/重复请求时，旧 RT 只能成功一次
    const newHashed = await bcrypt.hash(tokens.refreshToken, 10);

    const updated = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        refreshToken: user.refreshToken, // 条件：必须还是旧 hash
      },
      data: {
        refreshToken: newHashed,
      },
    });

    if (updated.count !== 1) {
      // 说明在你生成新 token 前后，refreshToken 已被别的请求轮换了
      throw new UnauthorizedException('refreshToken 已被轮换，请重新登录');
    }

    return tokens;
  }

  // 修改密码
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('旧密码不正确');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, refreshToken: null },
    });
  }

  // ✅ 退出登录：清空 refreshToken
  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { ok: true };
  }

  // 管理员重置密码
  async resetPasswordByAdmin(userId: number, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, refreshToken: null },
    });
  }

  private async generateTokens(userId: number, email: string) {
    const accessPayload: JwtPayload = { sub: userId, email };
    const refreshPayload: JwtPayload = { sub: userId, email, jti: randomUUID() };

    const ttl = process.env.JWT_EXPIRES_IN || '7d';
    const accessToken = await this.jwt.signAsync(accessPayload, { expiresIn: ttl as any });
    const refreshToken = await this.jwt.signAsync(refreshPayload, { expiresIn: ttl as any });

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
}
