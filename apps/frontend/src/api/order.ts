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
    publisher?: { nickname: string }
  }
}

// 🔥 核心：抢单接口
export const createOrder = (taskId: number) => {
  return http.post('/order', { taskId })
}

// 获取我抢到的任务
export const getMyOrders = () => {
  return http.get<Order[]>('/order/my-orders')
}

// 结算任务
export const completeOrder = (orderId: number) => {
  return http.post(`/order/${orderId}/complete`)
}