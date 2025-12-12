// apps/frontend/src/api/admin.ts
// 管理后台相关接口（仅管理员可用）
import http from '@/api/http'
import type { Task } from './task'

/**
 * 管理员任务监控：全状态任务列表
 */
export const getAdminTasks = (params?: { status?: string }) => {
  return http.get<Task[]>('/admin/tasks', { params })
}

/**
 * 管理员查看全站钱包流水
 */
export interface AdminTransaction {
  id: number
  amount: number
  type: string
  status: string
  createdAt: string
  userId: number
  user?: {
    id: number
    email: string
    nickname?: string | null
  }
}

export const getAdminTransactions = (params?: {
  userId?: number
  type?: string
}) => {
  const query: any = {}
  if (params?.userId) query.userId = params.userId
  if (params?.type) query.type = params.type

  return http.get<AdminTransaction[]>('/admin/transactions', {
    params: query,
  })
}
