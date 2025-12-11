// 路径：src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

// 统一一个常量，和 AuthModule 里的 JwtModule.register 保持完全一致
const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 过期就直接 401
      secretOrKey: JWT_SECRET, // 这里改成和 JwtModule 相同的密钥
    });
  }

  /**
   * JWT 验证通过后回调
   * payload = { sub: userId, email }
   */
  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        nickname: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }

    // 返回的对象会挂在 request.user 上
    return user;
  }
}
