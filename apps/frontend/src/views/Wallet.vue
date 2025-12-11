<template>
  <div class="wallet-page">
    <!-- 钱包卡片 -->
    <el-card class="wallet-card">
      <div class="wallet-header">
        <div class="title">
          <span class="icon">💰</span>
          <span>我的钱包</span>
        </div>
        <el-button type="primary" @click="handleRecharge">充值</el-button>
      </div>

      <div class="wallet-balance">
        <div class="label">当前余额</div>
        <div class="amount">¥ {{ displayBalance }}</div>
      </div>
    </el-card>

    <!-- 交易明细（暂时为空） -->
    <el-card class="wallet-table-card">
      <div class="table-header">交易明细</div>
      <el-table :data="[]" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="amount" label="金额" width="120" />
        <el-table-column prop="createdAt" label="时间" />
        <el-table-column prop="status" label="状态" width="120" />
      </el-table>
      <div class="empty-tip">No Data</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 目前余额是从登录时保存的 currentUser 里拿，
 * 后端单位是「分」，这里统一转成「元」保留两位小数。
 */
interface CurrentUser {
  id: number
  email: string
  nickname: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  balance?: number // 单位：分
}

const currentUser = computed<CurrentUser | null>(() => {
  try {
    const raw = localStorage.getItem('currentUser')
    if (!raw) return null
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
})

const displayBalance = computed(() => {
  const cents = currentUser.value?.balance
  if (typeof cents !== 'number' || Number.isNaN(cents)) {
    return '0.00'
  }
  return (cents / 100).toFixed(2)
})

const handleRecharge = () => {
  // 目前只做占位提示；真正的充值流程后面再接支付模块
  window.alert('充值功能稍后接入支付模块，这里先占位。')
}
</script>

<style scoped>
.wallet-page {
  padding: 24px;
}

.wallet-card {
  margin-bottom: 24px;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.icon {
  margin-right: 8px;
}

.wallet-balance {
  margin-top: 40px;
  text-align: center;
}

.wallet-balance .label {
  color: #999;
  margin-bottom: 12px;
}

.wallet-balance .amount {
  font-size: 36px;
  color: #409eff;
  font-weight: 700;
}

.wallet-table-card {
  margin-top: 12px;
}

.table-header {
  font-weight: 600;
  margin-bottom: 16px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 16px 0;
}
</style>
