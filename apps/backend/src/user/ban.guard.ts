import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 封禁守卫：拦截被封禁用户的写操作
 * 
 * 封禁用户仍可浏览（读），但禁止：
 * - 发布任务、修改任务
 * - 接单、提交、取消订单
 * - 发起争议
 * - 修改个人资料
 */
@Injectable()
export class BanGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) return true; // 未认证用户走其他守卫

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, banReason: true },
    });

    if (user?.isBanned) {
      throw new ForbiddenException(
        user.banReason
          ? `账户已被封禁：${user.banReason}`
          : '账户已被封禁，如有疑问请联系平台',
      );
    }

    return true;
  }
}
