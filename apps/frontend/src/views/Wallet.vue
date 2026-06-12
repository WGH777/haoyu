<template>
  <div class="wallet-page">
    <section class="wallet-hero">
      <span>Escrow Wallet</span>
      <h2>我的钱包</h2>
      <p>资金托管、收支流水与冻结金额集中展示，让每一笔协作资金都清晰可追溯。</p>
    </section>

    <div class="balance-cards">
      <div class="bal-card available">
        <span class="bal-label">可用余额</span>
        <span class="bal-amount">{{ formatYumiFromCent(wallet?.available) }}</span>
        <span class="bal-hint">可用于发布需求或提现</span>
      </div>
      <div class="bal-card frozen">
        <span class="bal-label">冻结中</span>
        <span class="bal-amount">{{ formatYumiFromCent(wallet?.frozen) }}</span>
        <span class="bal-hint">托管中的资金</span>
      </div>
      <div class="bal-card total">
        <span class="bal-label">总资产</span>
        <span class="bal-amount">{{ formatYumiFromCent((wallet?.available || 0) + (wallet?.frozen || 0)) }}</span>
        <span class="bal-hint">可用与托管合计</span>
      </div>
    </div>

    <section class="ledger-section">
      <div class="section-heading">
        <span>Ledger</span>
        <h3>收支明细</h3>
      </div>
      <div v-if="!ledger.length" class="wallet-empty">
        <div class="empty-mark">¥</div>
        <strong>还没有交易记录</strong>
        <p>完成协作、充值或结算后，资金流水会出现在这里。</p>
      </div>
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
    </section>
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
.wallet-page {
  position: relative;
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px;
  color: #fff2d6;
  overflow: hidden;
}

.wallet-page::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 28px;
  background:
    radial-gradient(circle at 12% 16%, rgba(255, 214, 145, .16), transparent 26%),
    radial-gradient(circle at 84% 20%, rgba(16, 185, 129, .14), transparent 26%),
    linear-gradient(180deg, rgba(5, 10, 20, .76), rgba(5, 10, 20, .95));
}

.wallet-hero {
  padding: 34px;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 24px;
  background:
    linear-gradient(120deg, rgba(8, 14, 28, .86), rgba(8, 23, 38, .66)),
    radial-gradient(circle at 84% 20%, rgba(242, 179, 77, .18), transparent 28%);
  box-shadow: 0 22px 54px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255,255,255,.06);
}

.wallet-hero span,
.section-heading span {
  color: #ffd073;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.wallet-hero h2 {
  margin: 8px 0 10px;
  color: #ffe8ae;
  font-size: 34px;
}

.wallet-hero p {
  max-width: 620px;
  margin: 0;
  color: rgba(255, 232, 196, .66);
  line-height: 1.8;
}

.balance-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 22px 0;
}

.bal-card {
  min-height: 150px;
  padding: 22px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 20px;
  color: #fff2d6;
  background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
}

.bal-card.available { background: radial-gradient(circle at 90% 12%, rgba(255, 214, 145, .20), transparent 32%), rgba(255,255,255,.045); }
.bal-card.frozen { background: radial-gradient(circle at 90% 12%, rgba(242, 179, 77, .20), transparent 32%), rgba(255,255,255,.045); }
.bal-card.total { background: radial-gradient(circle at 90% 12%, rgba(45, 212, 191, .16), transparent 32%), rgba(255,255,255,.045); }

.bal-label { display: block; color: rgba(255,232,196,.66); font-size: 13px; margin-bottom: 10px; }
.bal-amount { display: block; color: #ffe8ae; font-size: 30px; font-weight: 900; font-variant-numeric: tabular-nums; }
.bal-hint { display: block; color: rgba(183, 200, 220, .58); font-size: 12px; margin-top: 12px; }

.ledger-section {
  padding: 24px;
  border: 1px solid rgba(255, 214, 145, .14);
  border-radius: 22px;
  background: rgba(4, 9, 17, .42);
}

.section-heading h3 { margin: 6px 0 18px; color: #ffe8ae; font-size: 24px; }
.ledger-list { display: flex; flex-direction: column; gap: 8px; }
.ledger-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border: 1px solid rgba(255, 214, 145, .12); border-radius: 14px; background: rgba(255,255,255,.035); transition: all .18s ease; }
.ledger-item:hover { border-color: rgba(255, 214, 145, .28); transform: translateY(-1px); }
.ledger-left { display: flex; gap: 10px; align-items: center; }
.ledger-type { font-size: 12px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
.ledger-type.IN { background: rgba(45, 212, 191, .14); color: #8ff5df; }
.ledger-type.OUT { background: rgba(207, 97, 74, .14); color: #ffc4b2; }
.ledger-remark { font-size: 13px; color: rgba(255, 232, 196, .64); }
.ledger-right { text-align: right; }
.ledger-amount { font-size: 15px; font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
.ledger-amount.IN { color: #8ff5df; }
.ledger-amount.OUT { color: #ffc4b2; }
.ledger-time { font-size: 11px; color: rgba(166, 183, 207, .56); }

.wallet-empty {
  min-height: 260px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 34px;
  border: 1px dashed rgba(255, 214, 145, .18);
  border-radius: 20px;
  background: radial-gradient(circle at 50% 12%, rgba(255, 214, 145, .10), transparent 26%);
}

.empty-mark {
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  border-radius: 26px;
  color: #2a1a05;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  font-size: 34px;
  font-weight: 900;
  box-shadow: 0 18px 38px rgba(242,179,77,.18);
}

.wallet-empty strong { color: #fff7dd; font-size: 18px; }
.wallet-empty p { margin: 0; color: rgba(255,232,196,.58); }

@media (max-width: 768px) {
  .wallet-page { padding: 14px; max-width: 100%; }
  .wallet-hero { padding: 24px; }
  .balance-cards { grid-template-columns: 1fr; }
  .ledger-item { flex-direction: column; align-items: stretch; gap: 6px; }
  .ledger-right { display: flex; justify-content: space-between; text-align: left; }
}
</style>