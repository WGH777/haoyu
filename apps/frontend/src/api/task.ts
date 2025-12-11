import http from './http'

// 任务状态类型定义（可选，如果你的代码需要）
export type TaskStatus = 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELED';

// 任务接口模型（可选，如果你的代码需要）
export interface Task {
    id: number;
    title: string;
    description: string;
    price: number;
    status: TaskStatus;
    publisherId: number;
    createdAt: string;
    // ... 其他字段，如 publisher
}

// ------------------- 任务 API 接口 -------------------

// 1. 获取任务列表
export const getTaskList = () => {
    return http.get<Task[]>('/task')
}

// 2. 获取单个任务详情
export const getTaskDetail = (taskId: number) => {
    return http.get<Task>(`/task/${taskId}`)
}

// 3. 发布新任务 (假设后端需要 CreateTaskDto)
export const createTask = (data: any) => {
    return http.post('/task', data)
}

// 🔥 4. 接单/指派任务 (解决 TaskList.vue 的报错)
// 假设后端接口接收 workerId 作为接单人
export const assignTask = (taskId: number) => {
    // 通常是 PATCH 或 POST 到一个特定路由，表示用户接单
    return http.patch(`/task/${taskId}/assign`)
}

// 5. 完成任务 (由接单人或管理员操作)
export const completeTask = (taskId: number) => {
    return http.patch(`/task/${taskId}/complete`)
}

// 6. 删除任务 (由发布者或管理员操作)
export const deleteTask = (taskId: number) => {
    return http.delete(`/task/${taskId}`)
}