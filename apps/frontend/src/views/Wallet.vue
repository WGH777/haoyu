<template>
  <div class="wallet-container">
    <el-row :gutter="20">
      <!-- 左侧：余额卡片 -->
      <el-col :span="8">
        <el-card class="balance-card" shadow="hover">
          <template #header>
            <div class="balance-card-header">
              <span>💳 我的资产</span>
            </div>
          </template>
          <div class="balance-content">
            <div class="label">当前余额</div>
            <div class="amount">¥ {{ (balance / 100).toFixed(2) }}</div>
          </div>
          <div class="actions">
            <el-button type="success" @click="openDialog('deposit')">充值</el-button>
            <el-button type="danger" @click="openDialog('withdraw')">提现</el-button>
          </div>
          <div class="balance-tip">
            金额单位：系统内部以「分」存储，这里已自动换算为「元」展示
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：流水列表 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="wallet-header">
              <div class="wallet-header-title">
                📝 收支明细
              </div>
              <div class="wallet-header-filters">
                <el-form :inline="true" size="small">
                  <el-form-item label="类型">
                    <el-select
                      v-model="typeFilter"
                      placeholder="全部类型"
                      style="width: 150px"
                    >
                      <el-option label="全部" value="all" />
                      <el-option label="充值" value="DEPOSIT" />
                      <el-option label="提现" value="WITHDRAW" />
                      <el-option label="发布任务" value="PUBLISH" />
                      <el-option label="任务收入" value="INCOME" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="时间">
                    <el-date-picker
                      v-model="dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                    />
                  </el-form-item>

                  <el-form-item>
                    <el-button :icon="Refresh" @click="refresh" />
                    <el-button @click="resetFilters">重置</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </template>

          <el-table
            :data="filteredTransactions"
            stripe
            style="width: 100%"
            v-loading="loading"
            empty-text="暂无流水记录"
          >
            <el-table-column label="类型" width="100">
              <template #default="scope">
                <el-tag
                  :type="scope.row.amount > 0 ? 'success' : 'danger'"
                  size="small"
                >
                  {{ getTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="金额" width="150">
              <template #default="scope">
                <span :class="scope.row.amount > 0 ? 'text-green' : 'text-red'">
                  {{ formatAmount(scope.row.amount) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="说明">
              <template #default="scope">
                {{ getDescription(scope.row) }}
              </template>
            </el-table-column>

            <el-table-column label="时间" width="180">
              <template #default="scope">
                {{ new Date(scope.row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 充值 / 提现弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'deposit' ? '充值金额' : '提现金额'"
      width="400px"
    >
      <el-form label-position="top">
        <el-form-item label="金额 (元)">
          <el-input-number
            v-model="formAmount"
            :min="1"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransaction" :loading="submitting">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getProfile } from '@/api/user'
import {
  getWalletTransactions,
  deposit,
  withdraw,
  type Transaction,
  type TransactionType,
} from '@/api/wallet'

type FilterType = 'all' | TransactionType

const balance = ref(0)
const rawTransactions = ref<Transaction[]>([])
const loading = ref(false)

const typeFilter = ref<FilterType>('all')
const dateRange = ref<[Date, Date] | null>(null)

const dialogVisible = ref(false)
const dialogType = ref<'deposit' | 'withdraw'>('deposit')
const formAmount = ref<number | null>(100)
const submitting = ref(false)

/**
 * 过滤后的流水：按类型 + 时间范围
 */
const filteredTransactions = computed<Transaction[]>(() => {
  let list = rawTransactions.value.slice()

  // 类型筛选
  if (typeFilter.value !== 'all') {
    list = list.filter((tx) => tx.type === typeFilter.value)
  }

  // 时间筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    const startTime = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      0,
      0,
      0,
      0,
    ).getTime()
    const endTime = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      23,
      59,
      59,
      999,
    ).getTime()

    list = list.filter((tx) => {
      const t = new Date(tx.createdAt).getTime()
      return t >= startTime && t <= endTime
    })
  }

  return list
})

/**
 * 获取当前余额
 */
const fetchBalance = async () => {
  try {
    const res = await getProfile()
    balance.value = res.balance ?? 0
  } catch (error) {
    console.error('获取余额失败:', error)
  }
}

/**
 * 获取流水
 */
const fetchTransactions = async () => {
  loading.value = true
  try {
    const res = await getWalletTransactions()
    rawTransactions.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取钱包流水失败:', error)
    ElMessage.error('获取钱包流水失败')
  } finally {
    loading.value = false
  }
}

/**
 * 刷新：同时刷新余额 + 流水
 */
const refresh = async () => {
  await Promise.all([fetchTransactions(), fetchBalance()])
}

/**
 * 重置筛选条件
 */
const resetFilters = () => {
  typeFilter.value = 'all'
  dateRange.value = null
}

/**
 * 打开充值 / 提现弹窗
 */
const openDialog = (type: 'deposit' | 'withdraw') => {
  dialogType.value = type
  formAmount.value = 100
  dialogVisible.value = true
}

/**
 * 提交充值 / 提现
 */
const handleTransaction = async () => {
  if (!formAmount.value || formAmount.value <= 0) {
    return ElMessage.warning('请输入正确的金额')
  }

  submitting.value = true
  try {
    if (dialogType.value === 'deposit') {
      await deposit(formAmount.value)
      ElMessage.success('充值成功')
    } else {
      await withdraw(formAmount.value)
      ElMessage.success('提现成功')
    }

    dialogVisible.value = false
    await refresh()

    // 通知头部余额刷新
    window.dispatchEvent(new Event('balance-change'))
  } catch (error: any) {
    console.error('钱包操作失败:', error)
    const msg =
      error?.message ||
      error?.error ||
      error?.data?.message ||
      '操作失败，请稍后重试'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

/**
 * 类型中文名
 */
const getTypeName = (type: TransactionType) => {
  const map: Record<TransactionType, string> = {
    DEPOSIT: '充值',
    WITHDRAW: '提现',
    PUBLISH: '发布任务',
    INCOME: '任务收入',
  }
  return map[type] || type
}

/**
 * 说明文案
 */
const getDescription = (tx: Transaction) => {
  switch (tx.type) {
    case 'DEPOSIT':
      return '用户充值'
    case 'WITHDRAW':
      return '用户提现'
    case 'PUBLISH':
      return '发布任务托管赏金'
    case 'INCOME':
      return '任务完成收入'
    default:
      return ''
  }
}

/**
 * 金额格式化：带正负号，单位元
 */
const formatAmount = (amount: number) => {
  const sign = amount > 0 ? '+' : ''
  return `${sign}${(amount / 100).toFixed(2)}`
}

onMounted(async () => {
  await refresh()
})
</script>

<style scoped>
.wallet-container {
  max-width: 1200px;
  margin: 20px auto;
}

/* 左侧余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #409eff 0%, #2c3e50 100%);
  color: #fff;
  border: none;
}

.balance-card-header {
  font-weight: bold;
}

.balance-content {
  text-align: center;
  padding: 40px 0;
}

.balance-content .label {
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 10px;
}

.balance-content .amount {
  font-size: 36px;
  font-weight: bold;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 12px;
}

.balance-tip {
  font-size: 12px;
  opacity: 0.85;
  text-align: center;
}

/* 右侧：头部布局 */
.wallet-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wallet-header-title {
  font-weight: bold;
  font-size: 14px;
}

.wallet-header-filters {
  display: flex;
  align-items: center;
}

/* 颜色样式 */
.text-green {
  color: #67c23a;
  font-weight: bold;
}

.text-red {
  color: #f56c6c;
  font-weight: bold;
}
</style>
