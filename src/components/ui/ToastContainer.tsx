import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Animated, { FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated'
import { useToastStore, ToastType } from '@/store/useToastStore'
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react-native'

const { width } = Dimensions.get('window')

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-emerald-500',
        icon: <CheckCircle2 size={20} color="white" />,
        shadow: 'shadow-emerald-500/20',
      }
    case 'error':
      return {
        bg: 'bg-red-500',
        icon: <XCircle size={20} color="white" />,
        shadow: 'shadow-red-500/20',
      }
    case 'warning':
      return {
        bg: 'bg-amber-500',
        icon: <AlertCircle size={20} color="white" />,
        shadow: 'shadow-amber-500/20',
      }
    default:
      return {
        bg: 'bg-primary',
        icon: <Info size={20} color="white" />,
        shadow: 'shadow-primary/20',
      }
  }
}

export default function ToastContainer() {
  const { toasts } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type)
        return (
          <Animated.View
            key={toast.id}
            entering={FadeInUp}
            exiting={FadeOutUp}
            layout={Layout.springify()}
            className={`${config.bg} mx-6 mb-3 p-4 rounded-2xl flex-row items-center shadow-lg ${config.shadow} border border-white/20`}
          >
            <View className="mr-3">
              {config.icon}
            </View>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-sm font-bold flex-1">
              {toast.message}
            </Text>
          </Animated.View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
})
