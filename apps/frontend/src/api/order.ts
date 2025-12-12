import http from '@/api/http'
import type { Task } from './task' 

// =================== 类型定义 ===================

export interface SubmitResultData {
  content: string;
  image?: string;
}

export interface CompleteResultData {
    isAccepted: boolean;
    comment?: string;
}

export interface OrderItem {
    id: number;
    taskId: number;
    workerId: number;
    status: 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED'; 
    task: Task;
    // 用于 TaskDetail 展示成果
    submissionContent?: string | null; 
    submissionImage?: string | null; 
}

// =================== 接口函数 ===================

export const createOrder = (taskId: number) => {
  return http.post('/order', { taskId });
}

export const submitTaskResult = (orderId: number, data: SubmitResultData) => {
    return http.patch(`/order/${orderId}/submit`, data);
}

// 获取当前用户针对某个任务的订单状态 (Worker 查询自己的订单)
export const getMyOrderForTask = (taskId: number) => {
    return http.get<OrderItem>(`/order/task/${taskId}`);
}

// 🔥 核心修复：获取指定 Task 的订单详情（发布者/执行者通用）
export const findTaskOrderForDetail = (taskId: number) => {
    return http.get<OrderItem>(`/order/task/detail/${taskId}`);
}

export const getMyOrders = () => {
    return http.get<OrderItem[]>(`/order/my`);
}

/**
 * 🔥 核心修复：验收/结算接口。使用 completeOrder 名称，兼容所有旧引用。
 */
export const completeOrder = (orderId: number, data: CompleteResultData) => {
    return http.patch(`/order/${orderId}/complete`, data);
}