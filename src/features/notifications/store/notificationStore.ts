import { create } from 'zustand'
import { Notification } from '../types'
import { notificationService } from '../services/notificationService'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const notifications = await notificationService.getAll()
      const unreadCount = notifications.filter(n => n.is_read === 0).length
      set({ notifications, unreadCount, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      set({ isLoading: false })
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      const { notifications } = get()
      const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, is_read: 1 as const } : n
      )
      const unreadCount = updatedNotifications.filter(n => n.is_read === 0).length
      set({ notifications: updatedNotifications, unreadCount })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead()
      const { notifications } = get()
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: 1 as const }))
      set({ notifications: updatedNotifications, unreadCount: 0 })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  },

  addNotification: async (data) => {
    try {
      const newNotification = await notificationService.create(data)
      const { notifications } = get()
      const updatedNotifications = [newNotification, ...notifications]
      const unreadCount = updatedNotifications.filter(n => n.is_read === 0).length
      set({ notifications: updatedNotifications, unreadCount })
    } catch (error) {
      console.error('Failed to add notification:', error)
    }
  }
}))
