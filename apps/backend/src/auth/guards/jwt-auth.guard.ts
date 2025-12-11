// 路径：src/auth/guards/jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../public.decorator'; // ✅ 注意是 ../

/**
 * JwtAuthGuard
 * - 默认使用 passport 的 'jwt' 策略
 * - 支持 @Public() 装饰器跳过鉴权
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 1. 检查 handler / class 上是否有 @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // 有 @Public()，直接放行
      return true;
    }

    // 2. 否则走默认的 JWT 认证逻辑
    return super.canActivate(context);
  }
}
