<template>
  <div class="wallet-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="balance-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>💳 我的资产</span>
            </div>
          </template>
          <div class="balance-content">
            <div class="label">当前余额</div>
            <div class="amount">¥ {{ (balance / 100).toFixed(2) }}</div>
          </div>
          <div class="actions">
            <el-button type="primary" @click="openDialog('deposit')">充值</el-button>
            <el-button type="warning" @click="openDialog('withdraw')">提现</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📝 收支明细</span>
              <el-button :icon="Refresh" circle @click="fetchData" />
            </div>
          </template>
          <el-table :data="transactions" stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'DEPOSIT' || scope.row.type === 'INCOME' ? 'success' : 'danger'">
                  {{ getTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="150">
              <template #default="scope">
                <span :class="scope.row.amount > 0 ? 'text-green' : 'text-red'">
                  {{ scope.row.amount > 0 ? '+' : '' }}{{ (scope.row.amount / 100).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
            <el-table-column label="时间" width="180">
              <template #default="scope">
                {{ new Date(scope.row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'deposit' ? '充值金额' : '提现金额'" width="400px">
      <el-form>
        <el-form-item label="金额 (元)">
          <el-input-number v-model="formAmount" :min="1" :step="100" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransaction" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import http from '@/api/http'
import { getProfile } from '@/api/user'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const balance = ref(0)
// 🔥 核心修复：显式声明为 any[] 类型，解决 TS 警告
const transactions = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'deposit' | 'withdraw'>('deposit')
const formAmount = ref(100)
const submitting = ref(false)

// 获取钱包流水
const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await http.get('/wallet/transactions')
    transactions.value = Array.isArray(res) ? res : []
    fetchBalance()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取当前余额
const fetchBalance = async () => {
  try {
    const res = await getProfile()
    balance.value = res.balance || 0
  } catch (error) {
    console.error(error)
  }
}

const openDialog = (type: 'deposit' | 'withdraw') => {
  dialogType.value = type
  formAmount.value = 100
  dialogVisible.value = true
}

const handleTransaction = async () => {
  submitting.value = true
  try {
    const url = dialogType.value === 'deposit' ? '/wallet/deposit' : '/wallet/withdraw'
    await http.post(url, { amount: formAmount.value * 100 })
    
    ElMessage.success('操作成功')
    dialogVisible.value = false
    
    await fetchData()
    
    window.dispatchEvent(new Event('balance-change'))
    
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const getTypeName = (type: string) => {
  const map: any = {
    DEPOSIT: '充值',
    WITHDRAW: '提现',
    PAYMENT: '支付',
    INCOME: '收入'
  }
  return map[type] || type
}

onMounted(() => {
  fetchData()
  fetchBalance()
})
</script>

<style scoped>
.wallet-container { max-width: 1200px; margin: 20px auto; }
.balance-card { background: linear-gradient(135deg, #409eff 0%, #2c3e50 100%); color: #fff; border: none; }
.card-header { font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
.balance-content { text-align: center; padding: 40px 0; }
.balance-content .label { font-size: 14px; opacity: 0.8; margin-bottom: 10px; }
.balance-content .amount { font-size: 36px; font-weight: bold; }
.actions { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; }
.text-green { color: #67c23a; font-weight: bold; }
.text-red { color: #f56c6c; font-weight: bold; }
</style>