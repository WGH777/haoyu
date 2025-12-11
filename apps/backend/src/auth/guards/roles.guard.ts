// apps/backend/src/auth/guards/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. 读取控制器 / 方法上声明的角色
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有声明角色，直接放行
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. 从 request.user 上拿到当前用户（JWT Strategy 里 validate 返回的）
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: Role };

    if (!user || !user.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}
