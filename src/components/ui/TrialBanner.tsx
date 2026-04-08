import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSubscription } from '@/hooks/useSubscription'
import { Clock, ChevronRight } from 'lucide-react-native'
import { feedback } from '@/utils/haptics'

export default function TrialBanner() {
  const { plan, daysRemaining, isLoading } = useSubscription()

  if (isLoading || plan !== 'TRIAL') return null

  const isLowDays = daysRemaining < 7
  const colorClass = isLowDays ? 'bg-amber-500' : 'bg-indigo-600'
  const textClass = 'text-white'

  const handlePress = () => {
    try {
      // Simplified for maximum reliability
      router.push("/(app)/choose-plan")
    } catch (e) {
      router.replace("/(app)/choose-plan")
    }
  }

  return (
    <Pressable 
      onPress={handlePress}
      className={`mx-6 mt-6 p-4 rounded-3xl flex-row items-center justify-between shadow-premium-lg z-50 ${colorClass}`}
      style={({ pressed }: { pressed: boolean }) => ({
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }]
      })}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
          <Clock size={24} color="white" />
        </View>
        <View className="flex-1">
          <Text className={`${textClass} font-black text-sm uppercase tracking-widest`}>
            Período de Trial
          </Text>
          <Text className={`${textClass} text-xs opacity-90 mt-1`}>
            {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}. Subscreva agora!
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center bg-white/30 px-4 py-2 rounded-full ml-2">
        <Text className="text-white text-[10px] font-black uppercase mr-1">Ver Planos</Text>
        <ChevronRight size={14} color="white" />
      </View>
    </Pressable>
  )
}
