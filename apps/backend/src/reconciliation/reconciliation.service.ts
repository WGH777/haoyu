import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export interface ReconciliationReport {
  checkedAt: string;
  walletsChecked: number;
  mismatches: WalletMismatch[];
  globalBalance: {
    totalAvailable: number;
    totalFrozen: number;
    totalLedgerCredit: number;
    totalLedgerDebit: number;
    drift: number;
    ok: boolean;
  };
}

interface WalletMismatch {
  walletId: string;
  userId: number | null;
  expectedAvailable: number;
  actualAvailable: number;
  expectedFrozen: number;
  actualFrozen: number;
  drift: number;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private prisma: PrismaService) {}

  /** 每日凌晨 3:00 自动对账 */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async autoReconcile() {
    this.logger.log('🔍 开始每日自动对账...');
    const report = await this.reconcile();
    if (report.mismatches.length > 0 || !report.globalBalance.ok) {
      this.logger.error(`❌ 对账发现异常: ${report.mismatches.length} 个钱包不一致, 全局漂移 ${report.globalBalance.drift} 分`);
      // TODO: 后续接入告警通知
    } else {
      this.logger.log(`✅ 对账完成: ${report.walletsChecked} 个钱包, 全部一致`);
    }
    return report;
  }

  /** 手动触发对账（管理员） */
  async reconcile(): Promise<ReconciliationReport> {
    const checkedAt = new Date().toISOString();
    const mismatches: WalletMismatch[] = [];

    // 获取所有钱包
    const wallets = await this.prisma.wallet.findMany({
      include: {
        ledgerEntries: {
          select: { amount: true, direction: true },
        },
      },
    });

    let totalAvailable = 0;
    let totalFrozen = 0;
    let totalLedgerCredit = 0;
    let totalLedgerDebit = 0;

    for (const wallet of wallets) {
      // 从 Ledger 计算应有余额
      let computedAvailable = 0;
      let computedFrozen = 0;

      for (const entry of wallet.ledgerEntries) {
        if (entry.direction === 'IN') {
          totalLedgerCredit += entry.amount;
          // IN 通常影响 available（除非是 FREEZE 类型需特殊处理）
          computedAvailable += entry.amount;
        } else {
          totalLedgerDebit += entry.amount;
          computedAvailable -= entry.amount;
        }
      }

      // 简化校验：available 应该 >= 0 且与 ledger 推算一致
      // 注意：冻结合并计在 available 调整中（实际业务中 FREEZE/UNFREEZE 也走 ledger）
      if (computedAvailable !== wallet.available || computedFrozen !== wallet.frozen) {
        mismatches.push({
          walletId: wallet.id,
          userId: wallet.userId,
          expectedAvailable: computedAvailable,
          actualAvailable: wallet.available,
          expectedFrozen: computedFrozen,
          actualFrozen: wallet.frozen,
          drift: (wallet.available + wallet.frozen) - (computedAvailable + computedFrozen),
        });
      }

      totalAvailable += wallet.available;
      totalFrozen += wallet.frozen;
    }

    const globalDrift = totalLedgerCredit - totalLedgerDebit - totalAvailable - totalFrozen;

    return {
      checkedAt,
      walletsChecked: wallets.length,
      mismatches,
      globalBalance: {
        totalAvailable,
        totalFrozen,
        totalLedgerCredit,
        totalLedgerDebit,
        drift: globalDrift,
        ok: mismatches.length === 0 && globalDrift === 0,
      },
    };
  }
}
