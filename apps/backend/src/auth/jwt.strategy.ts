import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY'; // 确保和 Module 里一致

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, 
      secretOrKey: JWT_SECRET,
    });
  }

  // 验证通过后，去数据库查最新的用户信息
  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // 如果用户被删了，Token 也就失效了
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }

    // 返回完整的 user 对象 (包含 role, avatar 等)
    return user;
  }
}