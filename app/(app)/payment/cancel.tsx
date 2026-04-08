import React from 'react'
import { View, Text } from 'react-native'
import { router } from 'expo-router'
import { XCircle } from 'lucide-react-native'
import Button from '@/components/ui/Button'

/**
 * Ecrã de retorno quando o utilizador cancela o checkout Stripe.
 * Redirige para smarts://payment/cancel
 */
export default function PaymentCancelScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-[#0f172a] items-center justify-center px-8">
      <View className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
        <XCircle size={48} color="#94a3b8" strokeWidth={1.5} />
      </View>

      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-2xl font-black text-slate-900 dark:text-white text-center mb-3">
        Pagamento Cancelado
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-6 mb-8">
        Não foi efectuado qualquer débito.{'\n'}
        Podes tentar novamente quando quiseres.
      </Text>

      <View className="w-full gap-3">
        <Button
          title="Ver Planos"
          variant="gradient"
          gradientColors={['#4f46e5', '#6366f1']}
          className="w-full h-14"
          onPress={() => router.replace('/(app)/settings/subscription')}
        />
        <Button
          title="Voltar ao Painel"
          variant="ghost"
          className="w-full h-14"
          onPress={() => router.replace('/(app)/dashboard')}
        />
      </View>
    </View>
  )
}
