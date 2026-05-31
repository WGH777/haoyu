// apps/backend/src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Prisma } from '@prisma/client';
import { AdminAuditService } from './admin-audit.service';

type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'ONGOING'
  | 'CANCELLED';
type OrderStatus = 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';

@ApiTags('管理员接口（干预/仲裁）')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  // =========================
  // 危险操作：重置密码（仅 SUPER_ADMIN）
  // =========================

  @Post('users/:userId/reset-password')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: '（SUPER_ADMIN）重置用户密码（自动生成强密码，只显示一次）' })
  @ApiParam({ name: 'userId', type: Number, description: '目标用户 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: { type: 'string', example: '用户反馈忘记密码，已核实身份' },
      },
    },
  })
  async resetUserPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const adminId = Number(req?.user?.id);

    // ── 业务校验 ──
    if (!body?.reason || !body.reason.trim()) {
      throw new BadRequestException('操作原因不能为空');
    }

    if (adminId === userId) {
      throw new ForbiddenException('不能重置自己的密码');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    // 保护最后一个 SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN' },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('不能操作最后一个超级管理员');
      }
    }

    // ── 生成随机强密码 ──
    const generatedPassword = this.generateSecurePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // ── 更新密码 ──
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // ── 审计日志 ──
    await this.audit.log({
      adminId,
      action: 'RESET_PASSWORD',
      targetType: 'USER',
      targetId: userId,
      reason: body.reason.trim(),
      detail: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        passwordLength: generatedPassword.length,
      },
    });

    return {
      message: '密码已重置，请妥善记录下方临时密码（仅显示一次）',
      temporaryPassword: generatedPassword,
      targetEmail: targetUser.email,
    };
  }

  /** 生成满足安全要求的随机密码 */
  private generateSecurePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const all = upper + lower + digits;

    // 确保至少含有一个大写字母、一个小写字母和一个数字
    const chars = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
    ];

    // 填充到 12 个字符
    for (let i = 3; i < 12; i++) {
      chars.push(all[Math.floor(Math.random() * all.length)]);
    }

    // 打乱顺序
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }

  // =========================
  // 只读：审计日志（仅 SUPER_ADMIN）
  // =========================

  @Get('audit-logs')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: '（SUPER_ADMIN）查询管理员操作审计日志（只读）' })
  @ApiQuery({ name: 'action', required: false, description: '操作类型：FORCE_CANCEL_TASK / FORCE_COMPLETE_ORDER / FORCE_REJECT_ORDER' })
  @ApiQuery({ name: 'targetType', required: false, description: '目标类型：TASK / ORDER' })
  @ApiQuery({ name: 'adminId', required: false, description: '管理员ID' })
  @ApiQuery({ name: 'startDate', required: false, description: '起始时间 ISO 8601' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束时间 ISO 8601' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数，默认 20，最大 100' })
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('adminId') adminId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const where: any = {};

    if (action) where.action = action;
    if (targetType) where.targetType = targetType;

    if (adminId) {
      const idNum = parseInt(adminId, 10);
      if (!Number.isNaN(idNum)) where.adminId = idNum;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const d = new Date(startDate);
        if (!Number.isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        if (!Number.isNaN(d.getTime())) where.createdAt.lte = d;
      }
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));
    const skip = (pageNum - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.adminActionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          admin: {
            select: { id: true, email: true, nickname: true },
          },
        },
      }),
      this.prisma.adminActionLog.count({ where }),
    ]);

    return {
      items,
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================
  // 只读：任务/流水/订单
  // =========================

  @Get('tasks')
  @ApiOperation({ summary: '（管理员）查看任务列表（全状态，只读）' })
  @ApiQuery({ name: 'status', required: false, description: '任务状态或 all' })
  async getTasks(@Query('status') status?: string) {
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    return this.prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        publisher: { select: { id: true, email: true, nickname: true, avatar: true } },
      },
    });
  }

  @Get('transactions')
  @ApiOperation({ summary: '（管理员）查看全站流水（只读，最近 100 条）' })
  @ApiQuery({ name: 'userId', required: false, description: '用户ID' })
  @ApiQuery({ name: 'type', required: false, description: '流水类型或 all' })
  async getTransactions(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    const where: any = {};
    if (userId) {
      const idNum = parseInt(userId, 10);
      if (!Number.isNaN(idNum)) where.userId = idNum;
    }
    if (type && type !== 'all') where.type = type;

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, nickname: true } },
      },
    });
  }

  @Get('orders')
  @ApiOperation({ summary: '（管理员）查看订单列表（只读）' })
  @ApiQuery({ name: 'status', required: false, description: '订单状态或 all' })
  @ApiQuery({ name: 'taskId', required: false, description: '任务ID' })
  @ApiQuery({ name: 'workerId', required: false, description: '执行者ID' })
  async getOrders(
    @Query('status') status?: string,
    @Query('taskId') taskId?: string,
    @Query('workerId') workerId?: string,
  ) {
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    if (taskId) {
      const n = parseInt(taskId, 10);
      if (!Number.isNaN(n)) where.taskId = n;
    }

    if (workerId) {
      const n = parseInt(workerId, 10);
      if (!Number.isNaN(n)) where.workerId = n;
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: { id: true, title: true, status: true, publisherId: true, price: true, serviceFee: true },
        },
        worker: { select: { id: true, email: true, nickname: true } },
      },
      take: 200,
    });
  }

  // =========================
  // 仲裁 / 干预（RBAC 5.2 + 审计）
  // =========================

  @Post('tasks/:taskId/force-cancel')
  @ApiOperation({ summary: '（管理员）强制取消任务并退款给发布者' })
  @ApiParam({ name: 'taskId', type: Number, description: '任务ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: '违规/纠纷/无法继续' },
      },
    },
  })
  async forceCancelTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    const adminId = Number(req?.user?.id);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        publisherId: true,
        price: true,
        serviceFee: true,
      },
    });

    if (!task) throw new NotFoundException('任务不存在');

    const status = task.status as TaskStatus;
    if (status === 'COMPLETED') {
      throw new BadRequestException('任务已完成，禁止取消');
    }

    const refundAmount = (task.price || 0) + (task.serviceFee || 0);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.order.updateMany({
        where: {
          taskId,
          status: { in: ['ASSIGNED', 'SUBMITTED'] },
        },
        data: { status: 'CANCELLED' as any },
      });

      await tx.task.update({
        where: { id: taskId },
        data: { status: 'CANCELLED' as any },
      });

      if (refundAmount > 0) {
        // Phase 2: 迁移至 Wallet — 必须 frozen-- + available++ 保持资金守恒
        const publisherWallet = await tx.wallet.findUnique({
          where: { userId_currency: { userId: task.publisherId, currency: 'CNY' } },
        });
        if (!publisherWallet) {
          throw new BadRequestException('发布者钱包不存在');
        }
        if (publisherWallet.frozen < refundAmount) {
          throw new BadRequestException('冻结余额不足，无法退款');
        }
        // 原子操作：解冻
        await tx.wallet.update({
          where: { id: publisherWallet.id },
          data: {
            frozen: { decrement: refundAmount },
            available: { increment: refundAmount },
          },
        });
        const after = await tx.wallet.findUnique({
          where: { id: publisherWallet.id },
        });
        await tx.ledgerEntry.create({
          data: {
            walletId: publisherWallet.id,
            userId: task.publisherId,
            amount: refundAmount,
            direction: 'IN',
            type: 'REFUND',
            balanceAfter: after?.available,
            frozenAfter: after?.frozen,
            remark: `管理员退款 #${taskId}`,
          } as any,
        });
      }

      return {
        ok: true,
        taskId,
        newTaskStatus: 'CANCELLED',
        refundedToPublisher: refundAmount,
        reason: body?.reason || null,
      };
    });

    // ✅ 审计日志
    await this.audit.log({
      adminId,
      action: 'FORCE_CANCEL_TASK',
      targetType: 'TASK',
      targetId: taskId,
      reason: body?.reason || null,
      detail: result,
    });

    return result;
  }

  @Post('orders/:orderId/force-complete')
  @ApiOperation({ summary: '（管理员）强制结算订单（向执行者支付）' })
  @ApiParam({ name: 'orderId', type: Number, description: '订单ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: '发布者超时未验收，平台仲裁通过' },
      },
    },
  })
  async forceCompleteOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    const adminId = Number(req?.user?.id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        task: { select: { id: true, status: true, price: true, serviceFee: true, publisherId: true } },
      },
    });

    if (!order) throw new NotFoundException('订单不存在');

    const orderStatus = order.status as OrderStatus;
    if (orderStatus === 'COMPLETED') {
      const done = { ok: true, orderId, message: '订单已完成，无需重复结算' };

      await this.audit.log({
        adminId,
        action: 'FORCE_COMPLETE_ORDER',
        targetType: 'ORDER',
        targetId: orderId,
        reason: body?.reason || null,
        detail: done,
      });

      return done;
    }

    if (!['ASSIGNED', 'SUBMITTED'].includes(orderStatus)) {
      throw new BadRequestException(`当前订单状态 (${order.status}) 不允许强制结算`);
    }

    const taskStatus = (order.task.status as TaskStatus) || 'PENDING';
    if (taskStatus === 'CANCELLED') {
      throw new BadRequestException('任务已取消，禁止强制结算');
    }

    const taskPrice = order.task.price || 0;
    const serviceFee = order.task.serviceFee || 0;
    const netReward = taskPrice - serviceFee;

    if (netReward <= 0) {
      throw new BadRequestException('结算金额异常（netReward <= 0）');
    }

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Phase 2: 完整资金流 — 发布者 frozen 扣减 + 执行者入账 + 平台费
      const totalCost = taskPrice + serviceFee;

      const publisherWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: order.task.publisherId, currency: 'CNY' } },
      });
      if (!publisherWallet) throw new BadRequestException('发布者钱包不存在');
      if (publisherWallet.frozen < totalCost) throw new BadRequestException('冻结余额不足');

      const workerWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: order.workerId, currency: 'CNY' } },
      });
      if (!workerWallet) throw new BadRequestException('执行者钱包不存在');

      // 1) 发布者 frozen 扣除 totalCost
      await tx.wallet.update({
        where: { id: publisherWallet.id },
        data: { frozen: { decrement: totalCost } },
      });
      const pubAfter = await tx.wallet.findUnique({ where: { id: publisherWallet.id } });
      await tx.ledgerEntry.create({
        data: {
          walletId: publisherWallet.id, userId: publisherWallet.userId,
          amount: totalCost, direction: 'OUT', type: 'SETTLEMENT',
          balanceAfter: pubAfter?.available, frozenAfter: pubAfter?.frozen,
          remark: `管理员强制结算 #${orderId}（支出）`,
        } as any,
      });

      // 2) 执行者 available 增加 netReward
      await tx.wallet.update({
        where: { id: workerWallet.id },
        data: { available: { increment: netReward } },
      });
      const workAfter = await tx.wallet.findUnique({ where: { id: workerWallet.id } });
      await tx.ledgerEntry.create({
        data: {
          walletId: workerWallet.id, userId: workerWallet.userId,
          amount: netReward, direction: 'IN', type: 'SETTLEMENT',
          balanceAfter: workAfter?.available, frozenAfter: workAfter?.frozen,
          remark: `管理员强制结算 #${orderId}（收入）`,
        } as any,
      });

      // 3) 平台费入账（如果有）
      if (serviceFee > 0) {
        const platformWallet = await tx.wallet.findUnique({ where: { code: 'SYSTEM_PLATFORM_FEE' } });
        if (platformWallet) {
          await tx.wallet.update({
            where: { id: platformWallet.id },
            data: { available: { increment: serviceFee } },
          });
          const platAfter = await tx.wallet.findUnique({ where: { id: platformWallet.id } });
          await tx.ledgerEntry.create({
            data: {
              walletId: platformWallet.id, userId: platformWallet.userId,
              amount: serviceFee, direction: 'IN', type: 'PLATFORM_FEE',
              balanceAfter: platAfter?.available, frozenAfter: platAfter?.frozen,
              remark: `管理员强制结算 #${orderId}（平台费）`,
            } as any,
          });
        }
      }

      await tx.task.update({
        where: { id: order.taskId },
        data: { status: 'COMPLETED' as any },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' as any },
      });

      return {
        ok: true,
        orderId,
        taskId: order.taskId,
        newOrderStatus: 'COMPLETED',
        newTaskStatus: 'COMPLETED',
        paidToWorker: netReward,
        reason: body?.reason || null,
      };
    });

    await this.audit.log({
      adminId,
      action: 'FORCE_COMPLETE_ORDER',
      targetType: 'ORDER',
      targetId: orderId,
      reason: body?.reason || null,
      detail: result,
    });

    return result;
  }

  @Post('orders/:orderId/force-reject')
  @ApiOperation({ summary: '（管理员）强制驳回订单并回退到 ASSIGNED（允许重新提交）' })
  @ApiParam({ name: 'orderId', type: Number, description: '订单ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: '成果不符合要求，平台要求重新提交' },
      },
    },
  })
  async forceRejectOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    const adminId = Number(req?.user?.id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: { select: { id: true, status: true } } },
    });

    if (!order) throw new NotFoundException('订单不存在');

    const orderStatus = order.status as OrderStatus;
    if (orderStatus !== 'SUBMITTED') {
      throw new BadRequestException(`当前订单状态 (${order.status}) 不允许强制驳回`);
    }

    const taskStatus = (order.task.status as TaskStatus) || 'PENDING';
    if (taskStatus === 'CANCELLED') {
      throw new BadRequestException('任务已取消，禁止驳回');
    }
    if (taskStatus === 'COMPLETED') {
      throw new BadRequestException('任务已完成，禁止驳回');
    }

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.task.update({
        where: { id: order.taskId },
        data: { status: 'ASSIGNED' as any },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'ASSIGNED' as any },
      });

      return {
        ok: true,
        orderId,
        taskId: order.taskId,
        newOrderStatus: 'ASSIGNED',
        newTaskStatus: 'ASSIGNED',
        reason: body?.reason || null,
      };
    });

    await this.audit.log({
      adminId,
      action: 'FORCE_REJECT_ORDER',
      targetType: 'ORDER',
      targetId: orderId,
      reason: body?.reason || null,
      detail: result,
    });

    return result;
  }
}
