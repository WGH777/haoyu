// apps/frontend/src/api/task.ts
import http from '@/api/http'
import type { UserItem } from '@/api/user'

export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'SUBMITTED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | string

export interface SubTask {
  id: number
  title: string
  isDone: boolean
  taskId: number
  createdAt?: string
  updatedAt?: string
}

/**
 * 任务发布者（用于任务列表/详情展示）
 * - 关键：avatar 必须是 string，避免 HomeView 头像 getFullUrl(...) 触发 TS 严格检查错误
 */
export type TaskPublisher = Omit<UserItem, 'avatar'> & { avatar: string; verified?: boolean }

/**
 * 任务模型（任务大厅 / 任务详情通用）
 * 关键：publisher 必须包含 avatar，否则 HomeView Task 列表展示头像会报错
 */
export interface TaskItem {
  id: number
  title: string
  description: string
  /**
   * 金额：单位「0.01煜米」（内部×100存储）
   * （显示时前端除以 100 转为煜米）
   */
  price: number
  /** 服务费：单位「0.01煜米」 */
  serviceFee?: number
  /** 热度：浏览量 */
  views?: number
  status: TaskStatus
  image?: string | null
  category?: string
  riskLevel?: string
  isPublicWelfare?: boolean
  serviceMode?: 'ONLINE' | 'OFFLINE' | 'BOTH' | string
  createdAt: string
  updatedAt: string

  publisherId: number
  /** 注意：这里改为必有，且 avatar 永远 string（通过 normalizeTaskItem 保证） */
  publisher: TaskPublisher

  subTasks?: SubTask[]
}

/**
 * 兼容旧代码：部分页面 import { type Task } from '@/api/task'
 */
export type Task = TaskItem

export interface CreateTaskDto {
  title: string
  description?: string
  /**
   * 金额：单位「0.01煜米」（内部×100存储）
   */
  price: number
  image?: string | null
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  image?: string | null
}

/** ========== 归一化：兼容后端可能缺失 publisher / avatar 的返回 ========== */

type TaskItemFromServer = Omit<TaskItem, 'publisher' | 'subTasks'> & {
  publisher?: Partial<UserItem> | null
  subTasks?: SubTask[] | null
}

const normalizePublisher = (p: Partial<UserItem> | null | undefined, publisherId: number): TaskPublisher => {
  const u = (p ?? {}) as Partial<UserItem>

  return {
    id: typeof u.id === 'number' ? u.id : publisherId,
    email: typeof u.email === 'string' ? u.email : '',
    nickname: u.nickname ?? null,
    role: (u.role as any) ?? 'USER',
    balance: typeof u.balance === 'number' ? u.balance : undefined,
    avatar: typeof u.avatar === 'string' ? u.avatar : '',
    createdAt: typeof u.createdAt === 'string' ? u.createdAt : undefined,
    updatedAt: typeof u.updatedAt === 'string' ? u.updatedAt : undefined,
  }
}

const normalizeTaskItem = (t: TaskItemFromServer): TaskItem => {
  const publisherId = typeof t.publisherId === 'number' ? t.publisherId : 0
  const publisher = normalizePublisher(t.publisher, publisherId)

  return {
    ...(t as any),
    publisherId,
    publisher,
    subTasks: Array.isArray(t.subTasks) ? t.subTasks : undefined,
  }
}

/**
 * 任务大厅列表
 */
export const getTaskList = async () => {
  const list = await http.get<TaskItemFromServer[]>('/task')
  return Array.isArray(list) ? list.map(normalizeTaskItem) : []
}

/**
 * 任务详情
 */
export const getTaskDetail = async (id: number) => {
  const t = await http.get<TaskItemFromServer>(`/task/detail/${id}`)
  return normalizeTaskItem(t)
}

/**
 * 兼容旧代码：findTaskDetail = getTaskDetail
 */
export const findTaskDetail = (id: number) => {
  return getTaskDetail(id)
}

export const getRelatedTasks = (id: number) => {
  return http.get<Task[]>('/task/related/' + id)
}

/**
 * 我发布的任务（含子任务）
 */
export const getMyPublishedTasks = async () => {
  const list = await http.get<TaskItemFromServer[]>('/task/my-published')
  return Array.isArray(list) ? list.map(normalizeTaskItem) : []
}

/**
 * 创建任务
 */
export const createTask = async (data: CreateTaskDto) => {
  const t = await http.post<TaskItemFromServer>('/task', data)
  return normalizeTaskItem(t)
}

/**
 * 更新任务
 */
export const updateTask = async (id: number, data: UpdateTaskDto) => {
  const t = await http.patch<TaskItemFromServer>(`/task/${id}`, data)
  return normalizeTaskItem(t)
}

/**
 * 上传任务图片
 * - 兼容两种调用方式：
 *   1) uploadTaskImage(file: File)
 *   2) uploadTaskImage(formData: FormData) 其中必须含 key=file
 */
export const uploadTaskImage = (input: File | FormData) => {
  const formData = input instanceof FormData ? input : new FormData()
  if (!(input instanceof FormData)) {
    formData.append('file', input)
  }
  // 不手动设置 Content-Type，让浏览器/axios 自动附带 boundary
  return http.post<{ url: string }>('/task/upload-image', formData)
}

/**
 * ============ 子任务相关 ============
 */
export const createSubTask = (taskId: number, title: string) => {
  return http.post<SubTask>(`/task/${taskId}/subtasks`, { title })
}

export const updateSubTask = (
  taskId: number,
  subTaskId: number,
  data: { title?: string; isDone?: boolean },
) => {
  return http.patch<SubTask>(`/task/${taskId}/subtasks/${subTaskId}`, data)
}

export const deleteSubTask = (taskId: number, subTaskId: number) => {
  return http.delete(`/task/${taskId}/subtasks/${subTaskId}`)
}
