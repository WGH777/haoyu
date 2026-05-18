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
  NotFoundException,
  Req,
} from '@nestjs/common';
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
import { RequireConfirmation } from '../auth/decorators/require-confirmation.decorator';

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

  /** 管理员给指定用户钱包充值（测试用） */
  @Post('credit')
  @RequireConfirmation()
  async creditWallet(
    @Req() req: any,
    @Body() body: { userId: number; amount: number; remark?: string },
  ) {
    if (!body.userId || !body.amount || body.amount <= 0) {
      throw new BadRequestException('userId 和 amount(分) 必填，amount 必须大于 0');
    }
    await this.prisma.$tx(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: body.userId, currency: 'CNY' } },
      });
      if (!wallet) throw new BadRequestException('目标用户钱包不存在');

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { available: { increment: body.amount } },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId: body.userId,
          amount: body.amount,
          direction: 'IN',
          type: 'ADMIN_ADJUST',
          balanceAfter: wallet.available + body.amount,
          frozenAfter: wallet.frozen,
          remark: body.remark || `管理员 #${req.user.id} 充值`,
        },
      });
    });
    await this.audit.log({
      adminId: req.user.id, action: 'CREDIT_WALLET', targetType: 'USER', targetId: body.userId,
      detail: `amount=${body.amount} remark=${body.remark || ''}`,
    }).catch(() => {});
    return { message: `已为用户 #${body.userId} 充值 ${body.amount} 分` };
  }

  /** 仪表盘统计数据 */
  @Get('dashboard')
  async dashboard() {
    const [totalTasks, totalOrders, totalUsers, completedOrders] = await Promise.all([
      this.prisma.task.count(),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.order.findMany({ where: { status: 'COMPLETED' }, select: { task: { select: { price: true } } } }),
    ]);
    const totalVolume = completedOrders.reduce((sum: number, o: any) => sum + (o.task?.price || 0), 0);
    const taskByCategory = await this.prisma.task.groupBy({ by: ['category'], _count: true });
    const orderByStatus = await this.prisma.order.groupBy({ by: ['status'], _count: true });
    return { totalTasks, totalOrders, totalUsers, totalVolume, taskByCategory, orderByStatus };
  }

  /** 审计日志列表 */
  @Get('audit-logs')
  async getAuditLogs() {
    return this.prisma.adminActionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // =========================
  // 仲裁 / 干预（RBAC 5.2 + 审计）
  // =========================

  @Post('tasks/:taskId/force-cancel')
  @RequireConfirmation()
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
  @RequireConfirmation()
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
  @RequireConfirmation()
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
