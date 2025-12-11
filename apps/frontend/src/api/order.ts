import http from './http'

export interface Order {
  id: number
  taskId: number
  workerId: number
  status: 'PENDING' | 'COMPLETED'
  task: {
    id: number
    title: string
    description: string
    price: number
    status: string
    publisher?: {
      nickname: string
    }
  }
}

// 获取我抢到的任务列表
export const getMyOrders = () => {
  return http.get<Order[]>('/order')
}

// 🔥 新增：提交验收/结算任务
export const completeOrder = (orderId: number) => {
  return http.post(`/order/${orderId}/complete`)
}