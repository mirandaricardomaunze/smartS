import React, { useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import { CheckCircle2, AlertCircle, Info, Clock } from 'lucide-react-native'
import { useNotificationStore } from '@/features/notifications/store/notificationStore'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import pt from 'date-fns/locale/pt'

export default function NotificationsScreen() {
  const { notifications, isLoading, fetchNotifications, markAllAsRead, markAsRead } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const renderItem = ({ item }: { item: any }) => {
    let icon = <Info size={20} color="#4f46e5" />
    let colorClass = 'bg-primary/10 dark:bg-primary/20'
    
    if (item.type === 'warning') {
        icon = <AlertCircle size={20} color="#f59e0b" />
        colorClass = 'bg-amber-50 dark:bg-amber-900/20'
    } else if (item.type === 'error') {
        icon = <AlertCircle size={20} color="#ef4444" />
        colorClass = 'bg-red-50 dark:bg-red-900/20'
    }

    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: pt })

    return (
      <TouchableOpacity 
        className="mb-4"
        onPress={() => item.is_read === 0 && markAsRead(item.id)}
      >
        <Card 
          variant={item.is_read ? 'premium' : 'elevated'} 
          className={`p-5 flex-row items-start ${item.is_read ? 'opacity-70' : ''}`}
        >
          <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${colorClass} shadow-premium-sm`}>
             {icon}
          </View>
          
          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-base font-bold ${item.is_read ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                {item.title}
              </Text>
              {!item.is_read && <View className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />}
            </View>
            
            <Text className={`text-[13px] leading-5 mb-3 font-medium ${item.is_read ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
               {item.message}
            </Text>
            
            <View className="flex-row items-center bg-slate-50 dark:bg-white/5 self-start px-2 py-1 rounded-lg">
               <Clock size={10} color="#94a3b8" />
               <Text className="text-[9px] font-black text-slate-400 ml-1.5 uppercase tracking-tighter">{timeAgo}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  if (isLoading && notifications.length === 0) {
    return (
      <Screen padHorizontal={false} withHeader>
        <Loading fullScreen message="A carregar notificações..." />
      </Screen>
    )
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900" withHeader>
      <Header 
        title="Notificações" 
        rightElement={
          notifications.some(n => n.is_read === 0) ? (
            <TouchableOpacity 
              onPress={markAllAsRead} 
              className="px-4 py-2 bg-white/10 rounded-2xl border border-white/20"
            >
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">Marcar como Lidas</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerClassName="px-6 pt-6 pb-20"
        ListEmptyComponent={
          <EmptyState 
            title="Tudo Limpo!"
            description="Não tem notificações novas de momento."
          />
        }
      />
    </Screen>
  )
}
