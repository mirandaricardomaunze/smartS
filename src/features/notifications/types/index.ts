export type NotificationType = 'info' | 'warning' | 'error'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  is_read: 0 | 1
  created_at: string
}
