import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { Check, Star, Shield, RotateCcw, Calendar, CalendarDays } from 'lucide-react-native'

import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { revenueCatService } from '@/services/revenueCatService'
import { subscriptionService } from '@/services/subscriptionService'
import { PLAN_LIMITS } from '@/utils/planLimits'
import { PlanType } from '@/types'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import { PurchasesPackage } from 'react-native-purchases'

// ==============================================================================
// Componentes auxiliares
// ==============================================================================

function FeatureRow({ label, available }: { label: string; available: boolean }) {
  return (
    <View className="flex-row items-center py-1.5">
      <View className={`w-4 h-4 rounded-full mr-3 items-center justify-center ${available ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
        {available && <Check size={10} color="white" strokeWidth={3} />}
      </View>
      <Text className={`text-xs ${available ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600 line-through'}`}>
        {label}
      </Text>
    </View>
  )
}

function PackageCard({
  pkg,
  isCurrentPlan,
  onSelect,
  loading,
}: {
  pkg: PurchasesPackage
  isCurrentPlan: boolean
  onSelect: (pkg: PurchasesPackage) => void
  loading: boolean
}) {
  const isMonthly = pkg.identifier === '$rc_monthly'
  const limits = PLAN_LIMITS['PRO']

  return (
    <View className={`mx-4 mb-4 rounded-3xl border p-5 bg-violet-500/10 ${isCurrentPlan ? 'border-violet-500/30' : 'border-slate-200 dark:border-slate-800'}`}>
      {/* Cabeçalho */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 items-center justify-center mr-3">
            {isMonthly ? <Calendar size={22} color="#8b5cf6" /> : <CalendarDays size={22} color="#8b5cf6" />}
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-base font-bold text-violet-500">
              SmartS Pro — {isMonthly ? 'Mensal' : 'Anual'}
            </Text>
            <Text className="text-[10px] text-slate-500">
              {isMonthly ? 'Renovação mensal automática' : 'Melhor valor — poupas 2 meses'}
            </Text>
          </View>
        </View>

        {!isMonthly && (
          <View className="px-2 py-1 rounded-full bg-violet-500">
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[10px] text-white font-bold">Popular</Text>
          </View>
        )}
      </View>

      {/* Preço vindo do Play Store */}
      <View className="flex-row items-baseline mb-4">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-2xl font-black text-slate-800 dark:text-white">
          {pkg.product.priceString}
        </Text>
        <Text className="text-xs text-slate-500 ml-1">
          {isMonthly ? '/mês' : '/ano'}
        </Text>
      </View>

      {/* Funcionalidades */}
      <View className="mb-4">
        <FeatureRow label={`Até ${limits.maxProducts} produtos`} available />
        <FeatureRow label={`Até ${limits.maxUsers} utilizadores`} available />
        <FeatureRow label="Módulo POS" available={limits.hasPOS} />
        <FeatureRow label="Módulo Financeiro" available={limits.hasFinance} />
        <FeatureRow label="Módulo RH" available={limits.hasHR} />
        <FeatureRow label="Relatórios avançados" available={limits.hasReports} />
        <FeatureRow label="Backup automático" available={limits.hasBackup} />
        <FeatureRow label="Sync em tempo real" available={limits.hasRealtime} />
      </View>

      {/* Botão */}
      {isCurrentPlan ? (
        <View className="h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 items-center justify-center flex-row">
          <Check size={16} color="#10b981" strokeWidth={2.5} />
          <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-emerald-500 font-semibold text-sm ml-2">
            Plano Actual
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => { feedback.light(); onSelect(pkg) }}
          disabled={loading}
          className={`h-12 rounded-2xl items-center justify-center bg-violet-500 ${loading ? 'opacity-60' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ fontFamily: 'Inter-Bold' }} className="font-bold text-sm text-white">
              Subscrever {isMonthly ? 'Mensal' : 'Anual'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

// ==============================================================================
// Ecrã principal
// ==============================================================================

export default function SubscriptionScreen() {
  const { plan, daysRemaining, isTrialExpired, refresh } = useSubscription()
  const { user } = useAuth()
  const showToast = useToastStore(s => s.show)

  const [loadingPkg, setLoadingPkg]           = useState<string | null>(null)
  const [isRestoring, setIsRestoring]         = useState(false)
  const [packages, setPackages]               = useState<PurchasesPackage[]>([])
  const [offeringLoading, setOfferingLoading] = useState(true)

  const companyId = user?.company_id ?? ''
  const isPro = plan === 'PRO' || plan === 'ELITE'

  useEffect(() => {
    revenueCatService.getOffering().then(pkgs => {
      // Filtrar só Monthly e Annual, ignorar Lifetime
      const relevant = Object.values(pkgs).filter(
        p => p && (p.identifier === '$rc_monthly' || p.identifier === '$rc_annual')
      ) as PurchasesPackage[]
      setPackages(relevant)
      setOfferingLoading(false)
    })
  }, [])

  const activatePlan = useCallback(async (newPlan: PlanType) => {
    if (!companyId) return
    await subscriptionService.activatePlan(companyId, newPlan)
    refresh()
  }, [companyId, refresh])

  async function handleSelectPackage(pkg: PurchasesPackage) {
    if (!companyId) {
      Alert.alert('Erro', 'Nenhuma empresa seleccionada.')
      return
    }

    setLoadingPkg(pkg.identifier)
    try {
      const result = await revenueCatService.purchase(pkg)

      if (result.status === 'success') {
        feedback.success()
        await activatePlan(result.plan)
        Alert.alert(
          'Subscrição Activada!',
          'O teu plano SmartS Pro foi activado. Obrigado!',
          [{ text: 'Continuar', onPress: () => router.back() }]
        )
      } else if (result.status === 'cancelled') {
        // Utilizador cancelou — sem mensagem
      } else {
        Alert.alert('Erro no Pagamento', result.message)
      }
    } finally {
      setLoadingPkg(null)
    }
  }

  async function handleRestore() {
    setIsRestoring(true)
    try {
      const result = await revenueCatService.restore()
      if (result.status === 'success') {
        feedback.success()
        await activatePlan(result.plan)
        showToast('Plano restaurado com sucesso!', 'success')
      } else if (result.status === 'error') {
        showToast(result.message, 'warning')
      }
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Planos e Subscrição" />

      <ScrollView className="flex-1" contentContainerClassName="pb-24">

        {/* Banner estado actual */}
        <View className={`mx-4 mt-2 mb-6 p-4 rounded-3xl border ${isTrialExpired ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
          <View className="flex-row items-center">
            <Shield size={18} color={isTrialExpired ? '#ef4444' : '#6366f1'} />
            <Text style={{ fontFamily: 'Inter-Bold' }} className={`ml-2 font-bold text-sm flex-1 ${isTrialExpired ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
              {isTrialExpired
                ? 'O teu período de experimentação expirou'
                : plan === 'TRIAL'
                  ? `Experimentação gratuita — ${daysRemaining} dias restantes`
                  : `Plano ${plan} activo`
              }
            </Text>
          </View>
          {isTrialExpired && (
            <Text className="text-xs text-red-400 mt-1">
              Subscreve um plano abaixo para continuar a usar o SmartS.
            </Text>
          )}
        </View>

        {/* Título */}
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[10px] text-slate-400 uppercase tracking-widest px-6 mb-2">
          SmartS Pro
        </Text>
        <Text className="text-xs text-slate-500 px-6 mb-4">
          Acesso completo a todas as funcionalidades. Escolhe a periodicidade.
        </Text>

        {/* Cards de packages */}
        {offeringLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#6366f1" />
            <Text className="text-xs text-slate-400 mt-3">A carregar preços da Play Store...</Text>
          </View>
        ) : packages.length === 0 ? (
          <View className="mx-4 p-6 bg-slate-100 dark:bg-slate-800 rounded-3xl items-center">
            <Star size={32} color="#8b5cf6" />
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-700 dark:text-white font-bold mt-3 mb-1">
              SmartS Pro
            </Text>
            <Text className="text-xs text-slate-500 text-center leading-5">
              A Play Store ainda não está configurada.{'\n'}Contacta o suporte para activar o teu plano.
            </Text>
          </View>
        ) : (
          // Mostrar Anual primeiro (melhor valor), depois Mensal
          [...packages]
            .sort((a, b) => a.identifier === '$rc_annual' ? -1 : 1)
            .map(pkg => (
              <PackageCard
                key={pkg.identifier}
                pkg={pkg}
                isCurrentPlan={isPro}
                onSelect={handleSelectPackage}
                loading={loadingPkg === pkg.identifier}
              />
            ))
        )}

        {/* Restaurar compras */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring}
          className="mx-4 mt-2 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 items-center justify-center flex-row"
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <>
              <RotateCcw size={14} color="#6366f1" />
              <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-primary text-sm ml-2">
                Restaurar Compras
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Nota de segurança */}
        <View className="mx-4 mt-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex-row items-start">
          <Shield size={14} color="#94a3b8" style={{ marginTop: 1 }} />
          <Text className="text-[10px] text-slate-500 ml-2 flex-1 leading-4">
            Pagamento seguro via Google Play Store. A subscrição renova automaticamente. Podes cancelar a qualquer momento nas definições da Play Store.
          </Text>
        </View>

      </ScrollView>
    </Screen>
  )
}
