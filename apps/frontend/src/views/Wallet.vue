<template>
  <div class="wallet-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="asset-card" shadow="hover">
          <template #header><div class="card-header">💳 我的资产</div></template>
          <div class="balance-box">
            <div class="label">当前余额</div>
            <div class="amount">¥ {{ (balance / 100).toFixed(2) }}</div>
          </div>
          <div class="action-buttons">
            <el-button type="primary" class="btn" @click="openDeposit">充值</el-button>
            <el-button type="warning" class="btn" @click="openWithdraw">提现</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📝 收支明细</span>
              <el-button circle icon="Refresh" @click="fetchTransactions" :loading="loading" />
            </div>
          </template>
          <el-table :data="transactions" v-loading="loading" stripe style="width: 100%">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="getTypeTag(scope.row.type)">{{ getTypeLabel(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="scope">
                <span :style="{ color: scope.row.amount > 0 ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
                  {{ scope.row.amount > 0 ? '+' : '' }}{{ (scope.row.amount / 100).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="时间">
              <template #default="scope">{{ new Date(scope.row.createdAt).toLocaleString() }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px">
      <el-form><el-form-item label="金额 (元)"><el-input-number v-model="amountForm" :min="1" :step="100" style="width: 100%" /></el-form-item></el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransaction" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getWalletTransactions, deposit, withdraw, type Transaction } from '../api/wallet'
import { getProfile } from '../api/user'

const balance = ref(0)
const transactions = ref<Transaction[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const transactionType = ref<'deposit' | 'withdraw'>('deposit')
const amountForm = ref(100)
const submitting = ref(false)

const fetchTransactions = async () => {
  loading.value = true
  try {
    const res = await getWalletTransactions()
    transactions.value = Array.isArray(res) ? res : []
  } finally { loading.value = false }
}

const fetchBalance = async () => {
  try {
    const res = await getProfile()
    balance.value = res.balance
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch (e) {}
}

const openDeposit = () => { dialogTitle.value = '充值'; transactionType.value = 'deposit'; dialogVisible.value = true }
const openWithdraw = () => { dialogTitle.value = '提现'; transactionType.value = 'withdraw'; dialogVisible.value = true }

const handleTransaction = async () => {
  submitting.value = true
  try {
    const amount = amountForm.value * 100
    if (transactionType.value === 'deposit') await deposit(amount)
    else await withdraw(amount)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    await fetchBalance()
    await fetchTransactions()
  } finally { submitting.value = false }
}

const getTypeTag = (type: string) => {
  switch (type) {
    case 'DEPOSIT': return 'success'; case 'INCOME': return 'danger';
    case 'WITHDRAW': return 'warning'; default: return 'info';
  }
}
const getTypeLabel = (type: string) => {
  const map: any = { DEPOSIT: '充值', WITHDRAW: '提现', PUBLISH: '发布任务', INCOME: '任务收益' }
  return map[type] || type
}

onMounted(() => { fetchBalance(); fetchTransactions() })
</script>

<style scoped>
.wallet-container { max-width: 1200px; margin: 20px auto; }
.asset-card { background: linear-gradient(135deg, #409eff 0%, #2c3e50 100%); color: #fff; margin-bottom: 20px; }
.balance-box { text-align: center; padding: 30px 0; }
.balance-box .amount { font-size: 36px; font-weight: bold; }
.action-buttons { display: flex; justify-content: center; gap: 20px; padding-bottom: 20px; }
.btn { width: 100px; }
</style>