// apps/frontend/src/api/order.ts
import http from '@/api/http'
import type { Task } from './task'

// =================== 类型定义 ===================

export type OrderStatus = 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED' | string

export interface SubmitResultData {
  content: string
  image?: string
}

export interface CompleteResultData {
  isAccepted: boolean
  comment?: string
}

/**
 * 订单（执行者针对某个任务的接单记录）
 */
export interface OrderItem {
  id: number
  taskId: number
  workerId: number
  status: OrderStatus
  task: Task
  // 用于 TaskDetail 展示成果
  submissionContent?: string | null
  submissionImage?: string | null
  // 可选：用于列表展示时间（后端有的话会返回，没有则为 undefined）
  createdAt?: string
  updatedAt?: string
}

// =================== 接口函数 ===================

/**
 * 服务者开始服务
 */
export const startService = (orderId: number) => {
  return http.patch(`/order/${orderId}/start`)
}

/**
 * 抢单 / 创建订单
 */
export const createOrder = (taskId: number) => {
  return http.post('/order', { taskId })
}

/**
 * 执行者提交成果
 */
export const submitTaskResult = (orderId: number, data: SubmitResultData) => {
  return http.patch(`/order/${orderId}/submit`, data)
}

/**
 * Worker 查询自己针对某个任务的订单
 */
export const getMyOrderForTask = (taskId: number) => {
  return http.get<OrderItem>(`/order/task/${taskId}`)
}

/**
 * 获取指定任务的订单详情（用于验收 / 成果展示）
 * - 发布者 / 执行者都可调用
 */
export const findTaskOrderForDetail = (taskId: number) => {
  return http.get<OrderItem>(`/order/task/detail/${taskId}`)
}

/**
 * 获取我接取的所有订单
 */
export const getMyOrders = () => {
  return http.get<OrderItem[]>(`/order/my`)
}

/**
 * 验收 / 结算订单
 */
export const completeOrder = (orderId: number, data: CompleteResultData) => {
  return http.patch(`/order/${orderId}/complete`, data)
}
