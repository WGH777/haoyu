import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  // 获取流水
  async getTransactions(userId: number) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // 只取最近50条
    });
  }

  // 充值
  async deposit(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('金额必须大于0');
    
    return this.prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });
      return tx.transaction.create({
        data: {
          amount: amount,
          type: 'DEPOSIT',
          userId,
          status: 'SUCCESS'
        }
      });
    });
  }

  // 提现
  async withdraw(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('金额必须大于0');

    return this.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user.balance < amount) throw new BadRequestException('余额不足');

      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });
      
      // 提现记录为负数
      return tx.transaction.create({
        data: {
          amount: -amount,
          type: 'WITHDRAW',
          userId,
          status: 'SUCCESS'
        }
      });
    });
  }
}