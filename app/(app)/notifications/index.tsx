import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useNotificationStore } from '@/features/notifications/store/notificationStore'
import Header from '@/components/layout/Header'
import Screen from '@/components/layout/Screen'
import { Bell, AlertTriangle, Info, CheckCircle2, Trash2, Calendar, Package } from 'lucide-react-native'
import EmptyState from '@/components/ui/EmptyState'
import { feedback } from '@/utils/haptics'
import Animated, { FadeInUp } from 'react-native-reanimated'

export default function NotificationsScreen() {
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const handleMarkAllRead = () => {
    feedback.success()
    markAllAsRead()
  }

  const renderIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />
      case 'error':
        return <AlertTriangle size={20} color="#ef4444" />
      case 'info':
        return <Info size={20} color="#3b82f6" />
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />
      default:
        return <Bell size={20} color="#64748b" />
    }
  }

  return (
    <Screen className="bg-slate-50 dark:bg-[#0b0f1a]">
      <Header 
        title="Notificações" 
        rightElement={
          notifications.some(n => n.is_read === 0) ? (
            <TouchableOpacity onPress={handleMarkAllRead} className="bg-white/10 px-4 py-2 rounded-xl">
              <Text className="text-white text-xs font-bold font-black">Ler Tudo</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <View className="flex-1 px-4">
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Bell size={48} color="#94a3b8" />}
              title="Sem notificações"
              description="Você está em dia! Nada por aqui no momento."
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 50)}>
              <TouchableOpacity
                onPress={() => markAsRead(item.id)}
                disabled={item.is_read === 1}
                className={`p-4 rounded-3xl mb-3 flex-row border shadow-premium-sm ${
                  item.is_read === 0 
                    ? 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-500/20' 
                    : 'bg-slate-50/50 dark:bg-slate-950/30 border-transparent opacity-70'
                }`}
              >
                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                  item.is_read === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {renderIcon(item.type)}
                </View>

                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text 
                      style={{ fontFamily: 'Inter-Black' }}
                      className={`font-black text-sm flex-1 mr-2 ${item.is_read === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {item.title}
                    </Text>
                    {item.is_read === 0 && <View className="w-2 h-2 rounded-full bg-indigo-500 mt-1" />}
                  </View>
                  
                  <Text className={`text-xs mb-2 leading-relaxed ${item.is_read === 0 ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'}`}>
                    {item.message}
                  </Text>

                  <View className="flex-row items-center">
                    <Calendar size={12} color="#94a3b8" />
                    <Text className="text-[10px] text-slate-400 ml-1">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        />
      </View>
    </Screen>
  )
}
