import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { CheckCircle } from 'lucide-react-native'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/features/auth/hooks/useAuth'
import Button from '@/components/ui/Button'
import { feedback } from '@/utils/haptics'

/**
 * Ecrã de retorno após pagamento Stripe bem-sucedido.
 * O Stripe redirige para smarts://payment/success?session_id=...
 * O webhook já processou a activação — aqui apenas actualizamos o estado local.
 */
export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>()
  const { refresh } = useSubscription()
  const { user } = useAuth()

  useEffect(() => {
    feedback.success()
    // Refrescar subscrição após ~2s para dar tempo ao webhook processar
    const timer = setTimeout(() => {
      if (user?.company_id) refresh()
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View className="flex-1 bg-white dark:bg-[#0f172a] items-center justify-center px-8">
      <View className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mb-6">
        <CheckCircle size={48} color="#10b981" strokeWidth={1.5} />
      </View>

      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-2xl font-black text-slate-900 dark:text-white text-center mb-3">
        Pagamento Confirmado!
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-6 mb-8">
        A tua subscrição foi activada com sucesso.{'\n'}
        Já tens acesso a todas as funcionalidades do teu plano.
      </Text>

      {session_id && (
        <Text className="text-[10px] text-slate-400 mb-6 font-mono" numberOfLines={1}>
          Ref: {session_id.slice(-12)}
        </Text>
      )}

      <Button
        title="Voltar ao Painel"
        variant="gradient"
        gradientColors={['#10b981', '#059669']}
        className="w-full h-14"
        onPress={() => router.replace('/(app)/dashboard')}
      />
    </View>
  )
}
