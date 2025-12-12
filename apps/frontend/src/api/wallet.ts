// apps/frontend/src/api/wallet.ts
import http from './http'

/**
 * 钱包交易流水
 * - amount 单位：分
 */
export interface WalletTransaction {
  id: number
  amount: number
  type: 'DEPOSIT' | 'WITHDRAW' | 'PUBLISH' | 'INCOME' | 'PAYMENT' | string
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string
  createdAt: string
  // 后端动态附加的说明字段
  description?: string
}

/**
 * 获取当前用户交易流水（最近 50 条）
 */
export const getWalletTransactions = () => {
  return http.get<WalletTransaction[]>('/wallet/transactions')
}

/**
 * 充值
 * @param amountInYuan 金额（元）
 */
export const deposit = (amountInYuan: number) => {
  // 统一在这里完成 元 -> 分 的转换
  return http.post('/wallet/deposit', { amount: amountInYuan * 100 })
}

/**
 * 提现
 * @param amountInYuan 金额（元）
 */
export const withdraw = (amountInYuan: number) => {
  return http.post('/wallet/withdraw', { amount: amountInYuan * 100 })
}
