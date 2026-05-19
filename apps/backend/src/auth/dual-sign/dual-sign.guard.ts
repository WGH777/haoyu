import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DUAL_SIGN_KEY } from './dual-sign.decorator';
import { DualSignService } from './dual-sign.service';

@Injectable()
export class DualSignGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dualSignService: DualSignService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requireDualSign = this.reflector.getAllAndOverride<boolean>(DUAL_SIGN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireDualSign) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-dual-sign'] as string | undefined;

    if (!token) {
      throw new ForbiddenException(
        '此操作需要双签确认。请先由另一位管理员 POST /admin/dual-sign/approve 批准，然后将返回的 token 放入 X-Dual-Sign 请求头',
      );
    }

    const valid = this.dualSignService.verifyToken(token);
    if (!valid) {
      throw new ForbiddenException('双签 token 无效或已过期（一次有效，3分钟超时）');
    }

    return true;
  }
}
