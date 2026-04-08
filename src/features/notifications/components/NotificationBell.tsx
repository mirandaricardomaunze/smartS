import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Bell } from 'lucide-react-native'
import { useNotificationStore } from '../store/notificationStore'
import { router } from 'expo-router'
import { feedback } from '@/utils/haptics'

export default function NotificationBell() {
  const unreadCount = useNotificationStore((state) => state.unreadCount)

  const handlePress = () => {
    feedback.light()
    router.push('/notifications')
  }

  return (
    <TouchableOpacity 
      onPress={handlePress}
      accessibilityLabel={`Notificações: ${unreadCount} não lidas`}
      className="relative items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20"
    >
      <Bell size={24} color="#6366f1" />
      
      {unreadCount > 0 && (
        <View 
          className="absolute -top-1 -right-1 bg-rose-500 border-2 border-white dark:border-[#0f172a] min-w-[20px] h-[20px] rounded-full items-center justify-center px-1"
        >
          <Text className="text-white text-[10px] font-black leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
