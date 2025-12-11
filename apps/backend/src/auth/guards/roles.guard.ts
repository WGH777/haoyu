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
    // 1. 读取接口上要求的角色
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没贴 @Roles 标签，直接放行
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. 获取用户信息 (由 JwtStrategy 从数据库查出来的)
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: Role };

    // 3. 检查权限
    if (!user || !user.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('权限不足：您没有访问此接口的角色权限');
    }

    return true;
  }
}