import React from 'react'
import { View, Text, useColorScheme } from 'react-native'
import { Fingerprint, Lock } from 'lucide-react-native'
import Button from './Button'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp } from 'react-native-reanimated'
import Screen from '../layout/Screen'
import Header from '../layout/Header'

interface BiometricLockProps {
  onRetry: () => void;
  title?: string;
}

export default function BiometricLock({ onRetry, title = 'Acesso Restrito' }: BiometricLockProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Screen padHorizontal={false} withHeader className="bg-slate-50 dark:bg-slate-950 flex-1">
      <Header title={title} showBack />
      <View className="flex-1 items-center justify-center px-6 -mt-10">
         <Animated.View entering={FadeInUp.delay(200)} className="w-32 h-32 rounded-[32px] overflow-hidden mb-8 shadow-premium-lg border border-slate-200 dark:border-white/10">
            <LinearGradient
               colors={isDark ? ['#1e1b4b', '#0f172a'] : ['#4f46e5', '#3730a3']}
               className="flex-1 items-center justify-center"
            >
               <Fingerprint size={56} color="white" />
            </LinearGradient>
         </Animated.View>
         
         <Animated.View entering={FadeInUp.delay(300)} className="items-center mb-10">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">
              Área Protegida
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center font-medium px-4 leading-5">
              Esta secção contém métricas e informações estratégicas do inventário, requerendo autenticação visual ou por código para aceder.
            </Text>
         </Animated.View>
         
         <Animated.View entering={FadeInUp.delay(400)} className="w-full max-w-sm">
            <Button
              title="Desbloquear"
              icon={<Lock size={18} color="white" />}
              onPress={onRetry}
              variant="gradient"
              gradientColors={isDark ? ['#1e1b4b', '#4338ca'] : ['#4f46e5', '#6366f1']}
              className="h-14 rounded-2xl shadow-xl shadow-indigo-500/30"
            />
         </Animated.View>
      </View>
    </Screen>
  )
}
