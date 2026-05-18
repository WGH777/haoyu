import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_CONFIRMATION_KEY } from '../decorators/require-confirmation.decorator';

/**
 * 人工确认守卫（AI断点）
 * 
 * 标注 @RequireConfirmation() 的端点需要请求头 X-Confirm: yes 才能执行。
 * 这确保：资金操作/封禁/删除等敏感操作必须经过人类显式确认。
 */
@Injectable()
export class ConfirmationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_CONFIRMATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const confirmation = request.headers['x-confirm'];

    if (confirmation !== 'yes') {
      throw new BadRequestException(
        '此操作需要人工确认。请在请求头中添加 X-Confirm: yes',
      );
    }

    return true;
  }
}
