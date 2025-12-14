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
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 没贴 @Roles 就放行
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: string } | undefined;

    // 兼容：DB role 是 string，这里按 Role 进行判断
    const role = (user?.role || 'USER') as Role;

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException('权限不足：您没有访问此接口的角色权限');
    }
    return true;
  }
}
