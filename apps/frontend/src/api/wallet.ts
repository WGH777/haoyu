import http from '@/api/http'

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'PUBLISH' | 'INCOME'

export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED'

/**
 * 钱包流水记录
 * amount 单位：分（后端统一使用分，前端展示时除以 100）
 */
export interface Transaction {
  id: number
  amount: number
  type: TransactionType
  status: TransactionStatus
  createdAt: string
}

/**
 * 获取当前登录用户最近的流水记录
 */
export const getWalletTransactions = () => {
  return http.get<Transaction[]>('/wallet/transactions')
}

/**
 * 充值
 * 入参：金额（元）
 * 内部：转换为「分」发送给后端
 */
export const deposit = (amountYuan: number) => {
  const cents = Math.round(amountYuan * 100)
  return http.post('/wallet/deposit', { amount: cents })
}

/**
 * 提现
 * 入参：金额（元）
 * 内部：转换为「分」发送给后端
 */
export const withdraw = (amountYuan: number) => {
  const cents = Math.round(amountYuan * 100)
  return http.post('/wallet/withdraw', { amount: cents })
}
