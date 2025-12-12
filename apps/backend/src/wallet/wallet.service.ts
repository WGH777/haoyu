import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取当前用户的交易流水（最近 50 条）
   * - 金额单位：分
   * - 返回时额外附加 description 字段（不落库）
   */
  async getTransactions(userId: number) {
    const list = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return list.map((tx) => ({
      ...tx,
      description: this.buildDescription(tx.type),
    }));
  }

  /**
   * 充值（模拟）
   * @param amount 单位：分（前端已经 *100）
   */
  async deposit(userId: number, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('金额必须大于 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // 增加用户余额（分）
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });

      // 记录充值流水（正数）
      return tx.transaction.create({
        data: {
          amount,
          type: 'DEPOSIT',
          userId,
          status: 'SUCCESS',
        },
      });
    });
  }

  /**
   * 提现（模拟）
   * @param amount 单位：分（前端已经 *100）
   */
  async withdraw(userId: number, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('金额必须大于 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.balance < amount) {
        throw new BadRequestException('余额不足');
      }

      // 减少余额
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });

      // 提现流水记为负数
      return tx.transaction.create({
        data: {
          amount: -amount,
          type: 'WITHDRAW',
          userId,
          status: 'SUCCESS',
        },
      });
    });
  }

  /**
   * 按交易类型生成说明文本（不落库，只在返回时附加）
   */
  private buildDescription(type: string): string {
    switch (type) {
      case 'DEPOSIT':
        return '账户充值';
      case 'WITHDRAW':
        return '账户提现';
      case 'PUBLISH':
        return '发布任务托管资金';
      case 'PAYMENT':
        return '任务支付';
      case 'INCOME':
        return '任务结算收入';
      default:
        return '账户变动';
    }
  }
}
