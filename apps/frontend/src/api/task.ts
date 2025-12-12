import http from '@/api/http'
import type { UserItem } from './user'

// =================== 类型定义 ===================

export interface SubTask {
  id: number
  title: string
  isDone: boolean
  taskId: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: number
  title: string
  description: string
  price: number // 分（后端用分存）
  // 任务状态
  status:
    | 'PENDING'
    | 'ONGOING'
    | 'COMPLETED'
    | 'ASSIGNED'
    | 'SUBMITTED'
    | 'CANCELLED'
  image?: string | null
  publisherId: number
  publisher: UserItem
  createdAt: string
  updatedAt: string

  // 子任务列表（部分接口会 include）
  subTasks?: SubTask[]
}

export interface CreateTaskDto {
  title: string
  description: string
  price: number // 元（前端输入）
  image?: string | null
}

// =================== 接口函数 ===================

/**
 * 任务大厅列表（用于任务广场）
 */
export const getTaskList = () => {
  return http.get<Task[]>('/task')
}

/**
 * 创建任务（前端以「元」为单位，发送给后端时转为「分」）
 */
export const createTask = (data: CreateTaskDto) => {
  return http.post('/task', {
    ...data,
    price: data.price * 100, // 元转分
  })
}

/**
 * 某些老页面如果从 task.ts 引用 createOrder 也仍然可用
 */
export const createOrder = (taskId: number) => {
  return http.post('/order', { taskId })
}

/**
 * 上传任务图片
 */
export const uploadTaskImage = (formData: FormData) => {
  return http.post<{ url: string }>('/task/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 任务详情接口，对应后端 /task/detail/:id
 * - 返回值中包含 subTasks
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

// =================== 子任务相关接口 ===================

/**
 * （发布者）新增子任务
 */
export const createSubTask = (taskId: number, title: string) => {
  return http.post<SubTask>(`/task/${taskId}/subtasks`, { title })
}

/**
 * （发布者）更新子任务（标题 / 完成状态）
 */
export const updateSubTask = (
  taskId: number,
  subTaskId: number,
  payload: { title?: string; isDone?: boolean },
) => {
  return http.patch<SubTask>(`/task/${taskId}/subtasks/${subTaskId}`, payload)
}

/**
 * （发布者）删除子任务
 */
export const deleteSubTask = (taskId: number, subTaskId: number) => {
  return http.delete(`/task/${taskId}/subtasks/${subTaskId}`)
}
