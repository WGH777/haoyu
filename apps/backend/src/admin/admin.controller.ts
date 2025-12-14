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
        await tx.user.update({
          where: { id: task.publisherId },
          data: { balance: { increment: refundAmount } },
        });

        await tx.transaction.create({
          data: {
            amount: refundAmount,
            type: 'ADMIN_REFUND',
            status: 'SUCCESS',
            userId: task.publisherId,
          },
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
        task: { select: { id: true, status: true, price: true, serviceFee: true } },
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
      await tx.user.update({
        where: { id: order.workerId },
        data: { balance: { increment: netReward } },
      });

      await tx.transaction.create({
        data: {
          amount: netReward,
          type: 'ADMIN_PAYOUT',
          status: 'SUCCESS',
          userId: order.workerId,
        },
      });

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
