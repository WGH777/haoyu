import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OrderService } from '../order/order.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private orderService: OrderService,
    private notification: NotificationService,
  ) {}

  /**
   * 每分钟检查超时订单
   * - 服务者接单 48h 未开始 → 自动取消
   * - 提交完成 72h 未确认 → 按风险等级处理
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkTimeoutOrders() {
    this.logger.log('⏰ 开始检查超时订单...');
    await this.checkProviderTimeout();
    await this.checkConfirmationTimeout();
  }

  /** 服务者接单 48h 未开始 → 自动取消+退款 */
  private async checkProviderTimeout() {
    const deadline = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const staleOrders = await this.prisma.order.findMany({
      where: {
        status: 'ASSIGNED',
        createdAt: { lte: deadline },
      },
      include: { task: true },
      take: 20,
    });

    for (const order of staleOrders) {
      try {
        await this.orderService.autoCancel(order.id, '服务者超时48h未开始');
        this.logger.log(`⏱ 订单 #${order.id} 超时取消（服务者未开始）`);

        await this.notification.create({
          userId: order.workerId,
          title: '订单超时取消',
          content: `订单 #${order.id} 因超时48小时未开始服务已被取消`,
          type: 'PROVIDER_UNRESPONSIVE',
        }).catch(() => {});
      } catch (e: any) {
        this.logger.warn(`订单 #${order.id} 超时取消失败: ${e?.message}`);
      }
    }
  }

  /** 提交完成 72h 未确认 → 按风险等级处理 */
  private async checkConfirmationTimeout() {
    const now = Date.now();
    const firstWarnDeadline = new Date(now - 48 * 60 * 60 * 1000); // 48h 发预警
    const autoConfirmDeadline = new Date(now - 72 * 60 * 60 * 1000); // 72h 自动确认

    // 48h 预警
    const warnOrders = await this.prisma.order.findMany({
      where: {
        status: 'SUBMITTED',
        submittedAt: { lte: firstWarnDeadline, gt: autoConfirmDeadline },
      },
      include: { task: true },
      take: 20,
    });

    for (const order of warnOrders) {
      try {
        await this.notification.create({
          userId: order.task.publisherId,
          title: '请尽快验收',
          content: `订单 #${order.id} 已提交超过48小时，请在24小时内验收，超时将自动确认`,
          type: 'DEADLINE_WARNING',
        }).catch(() => {});
        this.logger.log(`⚠️ 订单 #${order.id} 超时预警（48h）`);
      } catch {}
    }

    // 72h 自动处理
    const confirmOrders = await this.prisma.order.findMany({
      where: {
        status: 'SUBMITTED',
        submittedAt: { lte: autoConfirmDeadline },
      },
      include: { task: true },
      take: 20,
    });

    for (const order of confirmOrders) {
      try {
        const riskLevel = order.task.riskLevel;

        if (riskLevel === 'HIGH') {
          // 高风险：通知管理员，不自动处理
          await this.notification.create({
            userId: order.task.publisherId,  // 临时：通知发布者
            title: '订单需人工处理',
            content: `订单 #${order.id} 已超时72小时未确认，因风险等级为HIGH，请联系管理员处理`,
            type: 'DEADLINE_WARNING',
          }).catch(() => {});
          this.logger.warn(`🔴 订单 #${order.id} 高风险超时，需人工处理`);
        } else {
          // LOW/MEDIUM：自动确认
          const confirmed = await this.orderService.autoConfirm(order.id);
          if (confirmed === null) {
            this.logger.log(`⏭️ 跳过 legacy 订单 #${order.id}`);
          } else {
            this.logger.log(`✅ 订单 #${order.id} 自动确认完成`);
            await this.notification.createBatch(
              [
                {
                  userId: order.task.publisherId,
                  title: '系统自动确认',
                  content: `订单 #${order.id} 已超时72小时，系统自动确认完成`,
                },
                {
                  userId: order.workerId,
                  title: '订单已确认',
                  content: `订单 #${order.id} 已超时72小时，系统自动确认完成，收入已到账`,
                },
              ],
              'AUTO_CONFIRMED',
            ).catch(() => {});
          }
        }
      } catch (e: any) {
        this.logger.error(`订单 #${order.id} 自动处理失败: ${e?.message}`);
      }
    }
  }
}
