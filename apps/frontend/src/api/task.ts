import http from '@/api/http'
import type { UserItem } from './user'

// =================== 类型定义 ===================

export interface Task {
  id: number
  title: string
  description: string
  price: number // 分
  status: 'PENDING' | 'ONGOING' | 'COMPLETED'
  image?: string | null 
  publisher: UserItem
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDto {
  title: string
  description: string
  price: number // 元 (前端输入)
  image?: string | null 
}

// =================== 接口函数 ===================

export const getTaskList = () => {
  return http.get<Task[]>('/task')
}

export const createTask = (data: CreateTaskDto) => {
  return http.post('/task', {
    ...data,
    price: data.price * 100 // 元转分
  })
}

// 抢单 (使用 order 模块的接口)
export const createOrder = (taskId: number) => {
  return http.post(`/order`, { taskId })
}

// 上传任务图片
export const uploadTaskImage = (formData: FormData) => {
  return http.post<{ url: string }>('/task/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}