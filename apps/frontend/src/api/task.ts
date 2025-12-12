import http from '@/api/http'
import type { UserItem } from './user'

// =================== 类型定义 ===================

export interface Task {
  id: number
  title: string
  description: string
  price: number // 分（后端用分存）
  // 任务状态
  status: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'ASSIGNED' | 'SUBMITTED' | 'CANCELLED'
  image?: string | null
  publisherId: number              // 🔥 新增：发布者 ID
  publisher: UserItem
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDto {
  title: string
  description: string
  price: number // 元（前端输入）
  image?: string | null
}

// =================== 接口函数 ===================

export const getTaskList = () => {
  return http.get<Task[]>('/task')
}

export const createTask = (data: CreateTaskDto) => {
  return http.post('/task', {
    ...data,
    price: data.price * 100, // 元转分
  })
}

export const createOrder = (taskId: number) => {
  return http.post(`/order`, { taskId })
}

export const uploadTaskImage = (formData: FormData) => {
  return http.post<{ url: string }>('/task/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 任务详情接口，对应后端 /task/detail/:id
 */
export const findTaskDetail = (id: number) => {
  return http.get<Task>(`/task/detail/${id}`)
}

/**
 * 获取我发布的任务列表
 */
export const getMyPublishedTasks = () => {
  return http.get<Task[]>('/task/my-published')
}
