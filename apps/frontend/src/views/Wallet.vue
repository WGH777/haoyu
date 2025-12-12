<template>
  <div class="wallet-container">
    <el-row :gutter="20">
      <!-- 左侧：资产概览 -->
      <el-col :span="8">
        <el-card class="balance-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>我的资产</span>
            </div>
          </template>

          <div class="balance-content">
            <div class="label">当前余额</div>
            <div class="amount">¥ {{ (balance / 100).toFixed(2) }}</div>
          </div>

          <div class="actions">
            <el-button type="primary" @click="openDialog('deposit')">
              充值
            </el-button>
            <el-button type="warning" @click="openDialog('withdraw')">
              提现
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：收支明细 -->
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>收支明细</span>
              <el-button :icon="Refresh" circle @click="fetchData" />
            </div>
          </template>

          <el-table
            :data="transactions"
            stripe
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="type" label="类型" width="110">
              <template #default="scope">
                <el-tag
                  :type="scope.row.amount >= 0 ? 'success' : 'danger'"
                  size="small"
                >
                  {{ getTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="金额（元）" width="160">
              <template #default="scope">
                <span :class="scope.row.amount >= 0 ? 'text-green' : 'text-red'">
                  {{ scope.row.amount >= 0 ? '+' : '' }}
                  {{ (scope.row.amount / 100).toFixed(2) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="description" label="说明" />

            <el-table-column label="时间" width="200">
              <template #default="scope">
                {{ formatTime(scope.row.createdAt) }}
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
      <el-form>
        <el-form-item label="金额（元）">
          <el-input-number
            v-model="formAmount"
            :min="1"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleTransaction"
          :loading="submitting"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

import { getProfile } from '@/api/user'
import {
  getWalletTransactions,
  deposit,
  withdraw,
  type WalletTransaction,
} from '@/api/wallet'

const balance = ref(0) // 单位：分
const transactions = ref<WalletTransaction[]>([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogType = ref<'deposit' | 'withdraw'>('deposit')
const formAmount = ref(100) // 元
const submitting = ref(false)

/**
 * 加载流水 + 余额
 */
const fetchData = async () => {
  loading.value = true
  try {
    const list = await getWalletTransactions()
    transactions.value = Array.isArray(list) ? list : []
    await fetchBalance()
  } catch (error) {
    console.error('获取钱包数据失败：', error)
  } finally {
    loading.value = false
  }
}

/**
 * 获取当前余额
 */
const fetchBalance = async () => {
  try {
    const profile = await getProfile()
    balance.value = profile.balance || 0
  } catch (error) {
    console.error('获取余额失败：', error)
  }
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
 * 执行充值 / 提现
 */
const handleTransaction = async () => {
  if (formAmount.value <= 0) {
    ElMessage.warning('金额必须大于 0')
    return
  }

  submitting.value = true
  try {
    if (dialogType.value === 'deposit') {
      await deposit(formAmount.value)
    } else {
      await withdraw(formAmount.value)
    }

    ElMessage.success('操作成功')
    dialogVisible.value = false

    await fetchData()

    // 通知其他组件刷新余额（例如头部导航）
    window.dispatchEvent(new Event('balance-change'))
  } catch (error: any) {
    console.error('钱包操作失败：', error)
  } finally {
    submitting.value = false
  }
}

/**
 * 类型展示文本
 */
const getTypeName = (type: string) => {
  const map: Record<string, string> = {
    DEPOSIT: '充值',
    WITHDRAW: '提现',
    PAYMENT: '支付',
    PUBLISH: '任务托管',
    INCOME: '任务收入',
  }
  return map[type] || type
}

/**
 * 时间格式化
 */
const formatTime = (value: string) => {
  if (!value) return ''
  try {
    const d = new Date(value)
    return d.toLocaleString()
  } catch {
    return value
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.wallet-container {
  max-width: 1200px;
  margin: 20px auto;
}

.balance-card {
  background: linear-gradient(135deg, #409eff 0%, #2c3e50 100%);
  color: #fff;
  border: none;
}

.card-header {
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  margin-bottom: 20px;
}

.text-green {
  color: #67c23a;
  font-weight: bold;
}

.text-red {
  color: #f56c6c;
  font-weight: bold;
}
</style>
