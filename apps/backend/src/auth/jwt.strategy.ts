// apps/backend/src/auth/jwt.strategy.ts
// Phase 0-1 & 0-2: 移除 JWT_SECRET 弱默认回退，且 validate 不返回 password
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET: string = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Please set JWT_SECRET in environment variables.');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }

    return user; // req.user
  }
}
