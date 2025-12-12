import {
  Controller,
  Get,
  UseGuards,
  Req,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 确保当前用户是管理员（ADMIN 或 SUPER_ADMIN）
   */
  private ensureAdmin(user: any) {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new ForbiddenException('只有管理员可以访问此接口');
    }
  }

  /**
   * 管理员查看任务列表（全状态），仅只读
   * GET /admin/tasks?status=ASSIGNED
   */
  @Get('tasks')
  async getTasks(@Req() req: any, @Query('status') status?: string) {
    this.ensureAdmin(req.user);

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    return this.prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        publisher: {
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * 管理员查看钱包流水（全站）
   * GET /admin/transactions?userId=1&type=DEPOSIT
   * 目前 userId 可选；type 可选；不传则看所有最新 100 条
   */
  @Get('transactions')
  async getTransactions(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    this.ensureAdmin(req.user);

    const where: any = {};

    if (userId) {
      const idNum = parseInt(userId, 10);
      if (!Number.isNaN(idNum)) {
        where.userId = idNum;
      }
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // 只看最近 100 条流水，避免数据过大
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
      },
    });
  }
}
