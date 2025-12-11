import http from './http'

export interface Transaction {
  id: number
  amount: number
  type: 'DEPOSIT' | 'WITHDRAW' | 'PUBLISH' | 'INCOME'
  status: 'SUCCESS' | 'PENDING' | 'FAILED'
  createdAt: string
}

export const getWalletTransactions = () => {
  return http.get<Transaction[]>('/wallet/transactions')
}

export const deposit = (amount: number) => {
  return http.post('/wallet/deposit', { amount })
}

export const withdraw = (amount: number) => {
  return http.post('/wallet/withdraw', { amount })
}