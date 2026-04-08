import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Lock, Zap } from 'lucide-react-native'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { PlanLimits } from '@/utils/planLimits'
import { feedback } from '@/utils/haptics'

interface PlanGateProps {
  /** Feature booleana de PlanLimits que deve estar activa (ex: 'hasHR') */
  feature: keyof PlanLimits
  /** Conteúdo a mostrar quando o plano permite */
  children: React.ReactNode
  /** Mensagem customizada no ecrã de bloqueio */
  message?: string
  /** Label do plano mínimo exigido */
  requiredPlan?: string
}

/**
 * PlanGate — bloqueia o acesso a módulos premium com um overlay de upgrade.
 *
 * @example
 * <PlanGate feature="hasHR" requiredPlan="PRO">
 *   <HRScreen />
 * </PlanGate>
 */
export default function PlanGate({ feature, children, message, requiredPlan = 'PRO' }: PlanGateProps) {
  const { canUse } = usePlanLimits()

  if (canUse(feature)) {
    return <>{children}</>
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#0f172a] items-center justify-center px-8">
      {/* Ícone */}
      <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
        <Lock size={32} color="#6366f1" strokeWidth={1.5} />
      </View>

      {/* Texto */}
      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">
        Funcionalidade Premium
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-6 mb-2">
        {message ?? 'Este módulo não está disponível no teu plano actual.'}
      </Text>
      <Text className="text-primary font-semibold text-sm mb-8">
        Requer plano {requiredPlan} ou superior.
      </Text>

      {/* Botão upgrade */}
      <TouchableOpacity
        onPress={() => { feedback.light(); router.push('/(app)/settings/subscription') }}
        className="w-full h-14 bg-primary rounded-2xl flex-row items-center justify-center mb-3"
      >
        <Zap size={18} color="white" />
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white font-bold text-base ml-2">
          Ver Planos e Fazer Upgrade
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} className="h-12 items-center justify-center">
        <Text className="text-slate-500 text-sm">Voltar</Text>
      </TouchableOpacity>
    </View>
  )
}
