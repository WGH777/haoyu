import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

type DisputeResult = 'REFUND_BUYER' | 'PAY_SELLER' | 'PARTIAL_REFUND' | 'CANCEL_ORDER';

const TX_OPTS = { timeout: 20000, maxWait: 10000 };

@Injectable()
export class DisputeService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  private isAdmin(role?: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  /** 用户发起争议 */
  async create(orderId: number, userId: number, reason: string, evidence?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: true },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.task.publisherId !== userId && order.workerId !== userId) {
      throw new ForbiddenException('无权对此订单发起争议');
    }
    if (!['IN_PROGRESS', 'SUBMITTED'].includes(order.status)) {
      if (order.status === 'COMPLETED') throw new BadRequestException('订单已完成，如需申诉请联系管理员');
      throw new BadRequestException(`当前订单状态 (${order.status}) 不允许发起争议`);
    }
    const existing = await this.prisma.dispute.findFirst({
      where: { orderId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    });
    if (existing) throw new ConflictException('该订单已有进行中的争议');

    const dispute = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const d = await tx.dispute.create({
        data: { orderId, taskId: order.taskId, openerId: userId, reason, evidence: evidence || null, status: 'OPEN' },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: 'DISPUTED' } });
      await tx.task.update({ where: { id: order.taskId }, data: { status: 'DISPUTED' } });
      return d;
    }, TX_OPTS);

    // 通知（事务外）
    this.notification.createBatch([
      { userId: order.task.publisherId, title: '订单争议', content: `订单 #${orderId} 已被发起争议：${reason}` },
      { userId: order.workerId, title: '订单争议', content: `订单 #${orderId} 已被发起争议：${reason}` },
    ], 'ORDER_DISPUTED').catch(() => {});

    return dispute;
  }

  /** 管理员处理争议 */
  async resolve(disputeId: number, adminId: number, result: DisputeResult, handledByRole: string) {
    if (!this.isAdmin(handledByRole)) throw new ForbiddenException('仅管理员可处理争议');
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId }, include: { order: { include: { task: true } } },
    });
    if (!dispute) throw new NotFoundException('争议不存在');
    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) throw new BadRequestException('争议已处理');

    const resolved = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: { status: 'RESOLVED', result, handledById: adminId, resolvedAt: new Date() },
      });
      const newStatus = (result === 'REFUND_BUYER' || result === 'CANCEL_ORDER') ? 'CANCELLED' : 'SUBMITTED';
      await tx.order.update({ where: { id: dispute.orderId }, data: { status: newStatus } });
      await tx.task.update({ where: { id: dispute.order.taskId }, data: { status: newStatus } });

      // 资金处理
      const taskPrice = dispute.order.task.price;
      const totalCost = taskPrice + (dispute.order.task.serviceFee ?? 0);

      if (result === 'REFUND_BUYER' || result === 'CANCEL_ORDER') {
        const pw = await tx.wallet.findUnique({ where: { userId_currency: { userId: dispute.order.task.publisherId, currency: 'CNY' } } });
        if (pw && pw.frozen >= totalCost) {
          await tx.wallet.update({ where: { id: pw.id }, data: { frozen: { decrement: totalCost }, available: { increment: totalCost } } });
          await tx.ledgerEntry.create({ data: { walletId: pw.id, userId: pw.userId, orderId: dispute.orderId, amount: totalCost, direction: 'IN', type: 'REFUND', remark: `争议 #${disputeId} 裁决退款` } });
        }
      } else if (result === 'PAY_SELLER') {
        const pw = await tx.wallet.findUnique({ where: { userId_currency: { userId: dispute.order.task.publisherId, currency: 'CNY' } } });
        if (pw && pw.frozen >= totalCost) {
          await tx.wallet.update({ where: { id: pw.id }, data: { frozen: { decrement: totalCost } } });
          await tx.ledgerEntry.create({ data: { walletId: pw.id, userId: pw.userId, orderId: dispute.orderId, amount: totalCost, direction: 'OUT', type: 'SETTLEMENT', remark: `争议 #${disputeId} 裁决付款` } });
          const ww = await tx.wallet.findUnique({ where: { userId_currency: { userId: dispute.order.workerId, currency: 'CNY' } } });
          if (ww) {
            const net = taskPrice - (dispute.order.task.serviceFee ?? 0);
            if (net > 0) {
              await tx.wallet.update({ where: { id: ww.id }, data: { available: { increment: net } } });
              await tx.ledgerEntry.create({ data: { walletId: ww.id, userId: ww.userId, orderId: dispute.orderId, amount: net, direction: 'IN', type: 'SETTLEMENT', remark: `争议 #${disputeId} 裁决收入` } });
            }
          }
        }
      }
      return tx.dispute.findUnique({ where: { id: disputeId } });
    }, TX_OPTS);

    // 通知（事务外）
    const labels: Record<string, string> = { REFUND_BUYER: '退款给发布者', PAY_SELLER: '付款给服务者', PARTIAL_REFUND: '部分退款', CANCEL_ORDER: '取消订单' };
    this.notification.createBatch([
      { userId: dispute.order.task.publisherId, title: '争议已处理', content: `订单 #${dispute.orderId} 争议结果：${labels[result]}` },
      { userId: dispute.order.workerId, title: '争议已处理', content: `订单 #${dispute.orderId} 争议结果：${labels[result]}` },
    ], 'DISPUTE_RESOLVED').catch(() => {});

    return resolved;
  }

  /** 撤回争议 */
  async cancel(disputeId: number, userId: number) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId }, include: { order: { include: { task: true } } },
    });
    if (!dispute) throw new NotFoundException('争议不存在');
    if (dispute.openerId !== userId) throw new ForbiddenException('仅发起人可撤回');
    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) throw new BadRequestException('争议已处理');

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.dispute.update({ where: { id: disputeId }, data: { status: 'CANCELLED' } });
      const prev = dispute.order.submittedAt ? 'SUBMITTED' : 'ASSIGNED';
      await tx.order.update({ where: { id: dispute.orderId }, data: { status: prev } });
      await tx.task.update({ where: { id: dispute.order.taskId }, data: { status: prev } });
      return tx.dispute.findUnique({ where: { id: disputeId } });
    }, TX_OPTS);
  }

  async findByOrder(orderId: number) {
    return this.prisma.dispute.findMany({ where: { orderId }, orderBy: { createdAt: 'desc' } });
  }

  async findAll(status?: string) {
    return this.prisma.dispute.findMany({
      where: status ? { status } : undefined,
      include: { order: { select: { id: true, task: { select: { title: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
