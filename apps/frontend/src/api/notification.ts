import http from './http'

export const notificationApi = {
  list: () => http.get('/notification'),
  unreadCount: () => http.get('/notification/unread-count'),
  markRead: (id: number) => http.post(`/notification/${id}/read`),
  markAllRead: () => http.post('/notification/read-all'),
}
