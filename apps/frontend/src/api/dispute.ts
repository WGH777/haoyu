import http from './http'

export const disputeApi = {
  create: (data: { orderId: number; reason: string; evidence?: string }) =>
    http.post('/dispute', data),
  resolve: (id: number, result: string) =>
    http.post(`/dispute/${id}/resolve`, { result }),
  cancel: (id: number) => http.post(`/dispute/${id}/cancel`),
  findByOrder: (orderId: number) => http.get(`/dispute/order/${orderId}`),
  findAll: (status?: string) =>
    http.get('/dispute', { params: status ? { status } : {} }),
}
