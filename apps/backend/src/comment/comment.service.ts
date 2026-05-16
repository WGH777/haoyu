import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async addComment(orderId: number, userId: number, content: string) {
    if (!content?.trim()) throw new BadRequestException('内容不能为空');
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { task: { select: { publisherId: true } } },
    });
    if (!order) throw new BadRequestException('订单不存在');
    if (order.workerId !== userId && order.task.publisherId !== userId) {
      throw new ForbiddenException('仅订单参与方可留言');
    }
    return this.prisma.orderComment.create({
      data: { orderId, userId, content: content.trim() },
    });
  }

  async getComments(orderId: number) {
    return this.prisma.orderComment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
