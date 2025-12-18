// apps/frontend/src/api/admin.ts
import http from '@/api/http'
import type { Task } from './task'

// ===================== 1. 任务监控 =====================

/**
 * 管理员任务监控：全状态任务列表
 */
export const getAdminTasks = (params?: { status?: string }) => {
  return http.get<Task[]>('/admin/tasks', { params })
}

/**
 * 强制取消/下架任务 (干预)
 */
export const forceCancelTask = (taskId: number, reason?: string) => {
  return http.post(`/admin/tasks/${taskId}/force-cancel`, { reason })
}

// ===================== 2. 资金流水监控 =====================

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

export const getAdminTransactions = (params?: { userId?: number; type?: string }) => {
  const query: Record<string, any> = {}
  if (params?.userId) query.userId = params.userId
  if (params?.type) query.type = params.type
  return http.get<AdminTransaction[]>('/admin/transactions', { params: query })
}

// ===================== 3. 订单仲裁 (新增) =====================

export interface AdminOrderItem {
  id: number
  taskId: number
  workerId: number
  status: string
  createdAt?: string
  updatedAt?: string
  task?: {
    id: number
    title: string
    status: string
    publisherId: number
    price: number
  }
  worker?: {
    id: number
    email: string
    nickname?: string | null
  }
}

/**
 * 获取订单列表
 */
export const getAdminOrders = (params?: { status?: string; taskId?: number; workerId?: number }) => {
  const query: Record<string, any> = {}
  if (params?.status) query.status = params.status
  if (params?.taskId) query.taskId = params.taskId
  if (params?.workerId) query.workerId = params.workerId
  return http.get<AdminOrderItem[]>('/admin/orders', { params: query })
}

/**
 * 强制完成订单 (判给执行者)
 */
export const forceCompleteOrder = (orderId: number, reason?: string) => {
  return http.post(`/admin/orders/${orderId}/force-complete`, { reason })
}

/**
 * 强制驳回订单 (判给发布者)
 */
export const forceRejectOrder = (orderId: number, reason?: string) => {
  return http.post(`/admin/orders/${orderId}/force-reject`, { reason })
}