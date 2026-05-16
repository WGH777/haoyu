// apps/frontend/src/api/wallet.ts
import http from '@/api/http'

export interface WalletInfo {
  id: string
  ownerType: string
  currency: string
  available: number   // 可用余额（分）
  frozen: number      // 冻结余额（分）
}

export interface LedgerEntry {
  id: string
  amount: number
  direction: string   // IN | OUT
  type: string
  balanceAfter: number | null
  remark: string | null
  createdAt: string
}

/** 获取钱包信息 */
export const getWallet = () => http.get<WalletInfo>('/wallet')

/** 获取账本流水 */
export const getLedger = () => http.get<LedgerEntry[]>('/wallet/ledger')
