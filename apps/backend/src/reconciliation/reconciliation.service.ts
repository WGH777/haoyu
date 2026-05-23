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
    totalLedgerIN: number;
    totalLedgerOUT: number;
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
          select: { amount: true, direction: true, type: true },
        },
      },
    });

    let totalAvailable = 0;
    let totalFrozen = 0;
    let totalLedgerVolume = 0;
    let totalLedgerIN = 0;
    let totalLedgerOUT = 0;

    for (const wallet of wallets) {
      // 从 Ledger 按类型重放计算应有余额
      let computedAvailable = 0;
      let computedFrozen = 0;

      for (const entry of wallet.ledgerEntries) {
        if (entry.type === 'DEPOSIT' || entry.type === 'ADMIN_ADJUST') {
          // 充值/管理员调账: available 增加
          computedAvailable += entry.amount;
        } else if (entry.type === 'FREEZE') {
          // 冻结: available 减少, frozen 增加
          computedAvailable -= entry.amount;
          computedFrozen += entry.amount;
        } else if (entry.type === 'UNFREEZE' || entry.type === 'REFUND') {
          // 解冻/退款: available 增加, frozen 减少
          computedAvailable += entry.amount;
          computedFrozen -= entry.amount;
        } else if (entry.type === 'SETTLEMENT' || entry.type === 'PLATFORM_FEE') {
          // 结算/平台费: frozen 减少（资金真正转出，不回流 available）
          computedFrozen -= entry.amount;
        } else if (entry.type === 'WITHDRAW') {
          // 提现: available 减少
          computedAvailable -= entry.amount;
        } else {
          // 未知类型：保守处理按 IN/OUT 方向
          if (entry.direction === 'IN') {
            computedAvailable += entry.amount;
          } else {
            computedAvailable -= entry.amount;
          }
        }
        totalLedgerVolume += entry.amount;
        if (entry.direction === 'IN') {
          totalLedgerIN += entry.amount;
        } else {
          totalLedgerOUT += entry.amount;
        }
      }

      // 校验：computed 与实际余额比对
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

    const globalDrift = totalLedgerIN - totalLedgerOUT - (totalAvailable + totalFrozen);

    return {
      checkedAt,
      walletsChecked: wallets.length,
      mismatches,
      globalBalance: {
        totalAvailable,
        totalFrozen,
        totalLedgerIN,
        totalLedgerOUT,
        drift: globalDrift,
        ok: mismatches.length === 0 && globalDrift === 0,
      },
    };
  }
}
