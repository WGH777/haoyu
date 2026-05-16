// apps/backend/src/wallet/wallet.service.ts
// Phase 2: WalletService 重写 — 基于 Wallet/LedgerEntry 模型的核心资金引擎
// 金额单位：Int 分 | 原则：所有资金可变必须走本服务，永不直接改 User/Wallet 余额

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  // ══════════════════════════════════════════════
  // 基础操作
  // ══════════════════════════════════════════════

  /** 获取用户钱包（默认 CNY） */
  async getWallet(userId: number, currency = 'CNY') {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    if (!wallet) throw new NotFoundException('钱包不存在');
    return wallet;
  }

  /** 获取系统钱包 */
  async getSystemWallet(code: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { code } });
    if (!wallet) throw new NotFoundException(`系统钱包 ${code} 不存在`);
    return wallet;
  }

  /** 创建钱包（幂等） */
  async createWallet(userId: number, currency = 'CNY') {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId_currency: { userId, currency } },
      update: {},
      create: { ownerType: 'USER', userId, currency, available: 0, frozen: 0 },
    });
    // 更新冗余计数器
    const count = await this.prisma.wallet.count({ where: { userId } });
    await this.prisma.user.update({
      where: { id: userId },
      data: { walletCount: count },
    });
    return wallet;
  }

  // ══════════════════════════════════════════════
  // 核心资金操作（全部原子事务 + LedgerEntry）
  // ══════════════════════════════════════════════

  /** 充值 */
  async deposit(
    walletId: string,
    amount: number,
    type = 'DEPOSIT',
    remark?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('金额必须大于 0');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.updateMany({
        where: { id: walletId },
        data: { available: { increment: amount } },
      });
      if (updated.count !== 1) throw new NotFoundException('钱包不存在');

      const wallet = await tx.wallet.findUnique({ where: { id: walletId } })!;

      await tx.ledgerEntry.create({
        data: {
          walletId,
          userId: wallet!.userId,
          amount,
          direction: 'IN',
          type,
          balanceAfter: wallet!.available,
          frozenAfter: wallet!.frozen,
          remark,
        },
      });

      return wallet;
    });
  }

  /** 冻结：从 available 扣 → frozen 加 */
  async freeze(
    walletId: string,
    amount: number,
    orderId?: number,
    remark?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('金额必须大于 0');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.updateMany({
        where: { id: walletId, available: { gte: amount } },
        data: {
          available: { decrement: amount },
          frozen: { increment: amount },
        },
      });
      if (updated.count !== 1) throw new BadRequestException('可用余额不足，冻结失败');

      const wallet = await tx.wallet.findUnique({ where: { id: walletId } })!;

      await tx.ledgerEntry.create({
        data: {
          walletId,
          userId: wallet!.userId,
          orderId,
          amount,
          direction: 'OUT',
          type: 'FREEZE',
          balanceAfter: wallet!.available,
          frozenAfter: wallet!.frozen,
          remark,
        },
      });

      return wallet;
    });
  }

  /** 解冻：从 frozen 扣 → available 加 */
  async unfreeze(
    walletId: string,
    amount: number,
    orderId?: number,
    remark?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('金额必须大于 0');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.updateMany({
        where: { id: walletId, frozen: { gte: amount } },
        data: {
          frozen: { decrement: amount },
          available: { increment: amount },
        },
      });
      if (updated.count !== 1) throw new BadRequestException('冻结余额不足，解冻失败');

      const wallet = await tx.wallet.findUnique({ where: { id: walletId } })!;

      await tx.ledgerEntry.create({
        data: {
          walletId,
          userId: wallet!.userId,
          orderId,
          amount,
          direction: 'IN',
          type: 'UNFREEZE',
          balanceAfter: wallet!.available,
          frozenAfter: wallet!.frozen,
          remark,
        },
      });

      return wallet;
    });
  }

  /** 结算：从 frozen 中真正转走（付给服务者） */
  async settle(
    walletId: string,
    amount: number,
    orderId?: number,
    remark?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('金额必须大于 0');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.updateMany({
        where: { id: walletId, frozen: { gte: amount } },
        data: { frozen: { decrement: amount } },
      });
      if (updated.count !== 1) throw new BadRequestException('托管余额不足，结算失败');

      const wallet = await tx.wallet.findUnique({ where: { id: walletId } })!;

      await tx.ledgerEntry.create({
        data: {
          walletId,
          userId: wallet!.userId,
          orderId,
          amount,
          direction: 'OUT',
          type: 'SETTLEMENT',
          balanceAfter: wallet!.available,
          frozenAfter: wallet!.frozen,
          remark,
        },
      });

      return wallet;
    });
  }

  /** 平台服务费：从托管冻结 → 转入 SYSTEM_PLATFORM_FEE */
  async platformFee(
    walletId: string,
    amount: number,
    orderId?: number,
    remark?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('金额必须大于 0');

    return this.prisma.$transaction(async (tx) => {
      const feeWallet = await tx.wallet.findUnique({
        where: { code: 'SYSTEM_PLATFORM_FEE' },
      });
      if (!feeWallet) throw new NotFoundException('系统平台费钱包不存在');

      // 从用户钱包扣 frozen
      const updated = await tx.wallet.updateMany({
        where: { id: walletId, frozen: { gte: amount } },
        data: { frozen: { decrement: amount } },
      });
      if (updated.count !== 1) throw new BadRequestException('托管余额不足，扣费失败');

      // 转入平台费系统账户
      await tx.wallet.update({
        where: { id: feeWallet.id },
        data: { available: { increment: amount } },
      });

      const wallet = await tx.wallet.findUnique({ where: { id: walletId } })!;

      await tx.ledgerEntry.create({
        data: {
          walletId,
          userId: wallet!.userId,
          orderId,
          amount,
          direction: 'OUT',
          type: 'PLATFORM_FEE',
          balanceAfter: wallet!.available,
          frozenAfter: wallet!.frozen,
          remark: remark || '平台服务费',
        },
      });

      return wallet;
    });
  }

  /** 退款：从托管冻结解冻退回 */
  async refund(
    walletId: string,
    amount: number,
    orderId?: number,
    remark?: string,
  ) {
    return this.unfreeze(walletId, amount, orderId, remark || '退款');
  }

  // ══════════════════════════════════════════════
  // 查询
  // ══════════════════════════════════════════════

  /** 获取钱包的账本流水 */
  async getLedger(walletId: string, limit = 50) {
    return this.prisma.ledgerEntry.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
