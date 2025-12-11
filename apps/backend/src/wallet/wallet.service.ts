import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getMyTransactions(userId: number) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      // 修正：Transaction 表没有关联 Task，因此不能 include: { task: true }
    });
  }

  async getBalance(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    return { balance: user?.balance || 0 };
  }
  
  // 充值 (核心逻辑)
  async deposit(userId: number, amount: number) {
    if (amount <= 0 || isNaN(amount)) {
        throw new BadRequestException('充值金额必须大于零');
    }

    return this.prisma.$transaction(async (tx: any) => {
        const user = await tx.user.update({
            where: { id: userId },
            data: { balance: { increment: amount } },
        });

        await tx.transaction.create({
            data: {
                amount: amount,
                type: 'RECHARGE',
                status: 'SUCCESS',
                userId: userId,
            },
        });

        return { balance: user.balance };
    });
  }
}