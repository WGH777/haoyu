import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationType =
  | 'REQUEST_RESPONDED'
  | 'SERVICE_STARTED'
  | 'SERVICE_SUBMITTED'
  | 'SERVICE_COMPLETED'
  | 'ORDER_DISPUTED'
  | 'REFUND_CREATED'
  | 'SETTLEMENT_CREATED'
  | 'RISK_ALERT'
  | 'SYSTEM'
  | 'PAYMENT_RECEIVED'
  | 'AUTO_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'DISPUTE_RESOLVED'
  | 'DEADLINE_WARNING'
  | 'PROVIDER_UNRESPONSIVE'
  | 'MATCHING_ALERT'
  | 'NEWBIE_NUDGE';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /** 创建通知 */
  async create(params: {
    userId: number;
    title: string;
    content: string;
    type: NotificationType;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        content: params.content,
        type: params.type,
      },
    });
  }

  /** 批量创建通知（同一类型发给多人） */
  async createBatch(
    recipients: { userId: number; title: string; content: string }[],
    type: NotificationType,
  ) {
    if (recipients.length === 0) return [];
    return this.prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.userId,
        title: r.title,
        content: r.content,
        type,
      })),
    });
  }

  /** 用户的通知列表 */
  async findByUser(userId: number, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** 未读数量 */
  async unreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  /** 标记已读 */
  async markRead(notificationId: number, userId: number) {
    const n = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!n || n.userId !== userId) return null;
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  /** 全部已读 */
  async markAllRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
