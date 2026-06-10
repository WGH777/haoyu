<template>
  <div class="wallet-page">
    <h2>我的钱包</h2>

    <div class="balance-cards">
      <div class="bal-card available">
        <span class="bal-label">可用余额</span>
        <span class="bal-amount">{{ formatYumiFromCent(wallet?.available) }}</span>
      </div>
      <div class="bal-card frozen">
        <span class="bal-label">冻结中</span>
        <span class="bal-amount">{{ formatYumiFromCent(wallet?.frozen) }}</span>
        <span class="bal-hint">托管中的资金</span>
      </div>
      <div class="bal-card total">
        <span class="bal-label">总资产</span>
        <span class="bal-amount">{{ formatYumiFromCent((wallet?.available || 0) + (wallet?.frozen || 0)) }}</span>
      </div>
    </div>

    <div class="ledger-section">
      <h3>收支明细</h3>
      <el-empty v-if="!ledger.length" description="还没有交易记录，完成协作后会出现在这里" />
      <div v-else class="ledger-list">
        <div v-for="entry in ledger" :key="entry.id" class="ledger-item">
          <div class="ledger-left">
            <span class="ledger-type" :class="entry.direction">
              {{ typeLabel(entry.type) }}
            </span>
            <span class="ledger-remark">{{ entry.remark || '-' }}</span>
          </div>
          <div class="ledger-right">
            <span class="ledger-amount" :class="entry.direction">
              {{ entry.direction === 'IN' ? '+' : '-' }}{{ formatYumiCompactFromCent(entry.amount) }}
            </span>
            <span class="ledger-time">{{ formatTime(entry.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatYumiFromCent, formatYumiCompactFromCent } from '@/utils/money'
import { getWallet, getLedger, type WalletInfo, type LedgerEntry } from '@/api/wallet'

const wallet = ref<WalletInfo | null>(null)
const ledger = ref<LedgerEntry[]>([])

const typeLabel = (t: string) => {
  const m: Record<string, string> = {
    DEPOSIT: '充值', FREEZE: '冻结', UNFREEZE: '解冻',
    SETTLEMENT: '收入', PLATFORM_FEE: '服务费', REFUND: '退款',
    WITHDRAW: '提现', ADMIN_ADJUST: '调账', RISK_RESERVE: '准备金',
  }
  return m[t] || t
}

const formatTime = (t: string) => new Date(t).toLocaleString('zh-CN')

onMounted(async () => {
  try {
    const [w, l] = await Promise.all([getWallet(), getLedger()])
    wallet.value = w as any
    ledger.value = (Array.isArray(l) ? l : (l as any)?.data || [])
  } catch { /* 静默 */ }
})
</script>

<style scoped>
.wallet-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.wallet-page h2 { font-size: 20px; font-weight: 700; margin-bottom: 20px; }

.balance-cards { display: flex; gap: 16px; margin-bottom: 32px; }
.bal-card {
  flex: 1; padding: 20px; border-radius: 12px; color: #fff;
}
.bal-card.available { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.bal-card.frozen { background: linear-gradient(135deg, #f59e0b, #f97316); }
.bal-card.total { background: linear-gradient(135deg, #10b981, #059669); }
.bal-label { display: block; font-size: 13px; opacity: 0.85; margin-bottom: 6px; }
.bal-amount { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
.bal-hint { display: block; font-size: 11px; opacity: 0.7; margin-top: 4px; }

.ledger-section h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.ledger-list { display: flex; flex-direction: column; gap: 2px; }
.ledger-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  background: rgba(17, 24, 39, 0.45);
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  transition: background 0.2s ease;
}
.ledger-item:hover {
  background: rgba(17, 24, 39, 0.65);
}
.ledger-left { display: flex; gap: 10px; align-items: center; }
.ledger-type {
  font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
}
.ledger-type.IN { background: rgba(16, 185, 129, 0.12); color: #6ee7b7; }
.ledger-type.OUT { background: rgba(239, 68, 68, 0.12); color: #fca5a5; }
.ledger-remark { font-size: 13px; color: #94a3b8; }
.ledger-right { text-align: right; }
.ledger-amount { font-size: 15px; font-weight: 600; display: block; font-variant-numeric: tabular-nums; }
.ledger-amount.IN { color: #6ee7b7; }
.ledger-amount.OUT { color: #fca5a5; }
.ledger-time { font-size: 11px; color: #64748b; }

/* 移动端适配 */
@media (max-width: 768px) {
  .wallet-page {
    padding: 14px;
    max-width: 100%;
    position: relative;
  }
  .wallet-page::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/assets/haoyu/mobile/vertical_backgrounds_03_mobile_light_trail_bg.webp') no-repeat 50% 0 / cover;
    opacity: 0.08;
    pointer-events: none;
    z-index: 0;
  }
  .wallet-page > * { position: relative; z-index: 1; }

  .wallet-page h2 { font-size: 18px; margin-bottom: 16px; }

  .balance-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 24px;
  }
  .bal-card {
    padding: 16px;
    border-radius: 14px;
  }
  .bal-card.total {
    grid-column: 1 / -1;
  }
  .bal-amount { font-size: 22px; }
  .bal-label { font-size: 12px; margin-bottom: 4px; }
  .bal-hint { font-size: 10px; }

  .ledger-section h3 { font-size: 15px; margin-bottom: 10px; }
  .ledger-item {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 14px;
  }
  .ledger-left {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ledger-right {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
  }
  .ledger-amount {
    font-size: 17px;
    display: inline;
  }
  .ledger-time { font-size: 11px; }
  .ledger-remark { font-size: 12px; }
}
</style>
