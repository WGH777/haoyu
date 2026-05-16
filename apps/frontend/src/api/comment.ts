import http from './http'

export const commentApi = {
  list: (orderId: number) => http.get(`/comment/order/${orderId}`),
  send: (orderId: number, content: string) => http.post('/comment', { orderId, content }),
}
