import React, { useCallback, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Modal
} from 'react-native'
import { router } from 'expo-router'
import { ShieldAlert, RefreshCw, CheckCircle2, Clock, XCircle, ChevronDown } from 'lucide-react-native'

import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { useToastStore } from '@/store/useToastStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { subscriptionService, AdminSubscriptionRow } from '@/services/subscriptionService'
import { PlanType } from '@/types'
import { useFocusEffect } from 'expo-router'
import { feedback } from '@/utils/haptics'

type FilterTab = 'all' | 'trial' | 'active' | 'expired'

const PLANS: PlanType[] = ['TRIAL', 'BASIC', 'PRO', 'ELITE']

const PLAN_COLORS: Record<PlanType, { bg: string; text: string; border: string }> = {
  TRIAL:  { bg: 'bg-slate-500/10',  text: 'text-slate-500',  border: 'border-slate-500/20' },
  BASIC:  { bg: 'bg-blue-500/10',   text: 'text-blue-500',   border: 'border-blue-500/20' },
  PRO:    { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
  ELITE:  { bg: 'bg-amber-500/10',  text: 'text-amber-500',  border: 'border-amber-500/20' },
}

function StatusBadge({ row }: { row: AdminSubscriptionRow }) {
  if (row.plan !== 'TRIAL') {
    return (
      <View className="flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={10} color="#10b981" />
        <Text className="text-[10px] text-emerald-500 font-semibold">Ativo</Text>
      </View>
    )
  }
  if (row.days_left > 0) {
    return (
      <View className="flex-row items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
        <Clock size={10} color="#f59e0b" />
        <Text className="text-[10px] text-amber-500 font-semibold">{row.days_left}d trial</Text>
      </View>
    )
  }
  return (
    <View className="flex-row items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <XCircle size={10} color="#ef4444" />
      <Text className="text-[10px] text-red-500 font-semibold">Expirado</Text>
    </View>
  )
}

function PlanPicker({
  visible, onClose, onSelect, current
}: {
  visible: boolean
  onClose: () => void
  onSelect: (plan: PlanType) => void
  current: PlanType
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/60 items-center justify-center px-10"
      >
        <TouchableOpacity
          activeOpacity={1}
          className="w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <View className="px-5 pt-5 pb-3">
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-base text-slate-800 dark:text-white">
              Selecionar Plano
            </Text>
            <Text className="text-xs text-slate-500 mt-1">Escolha o novo plano para este utilizador</Text>
          </View>
          {PLANS.map((plan) => {
            const c = PLAN_COLORS[plan]
            const isSelected = plan === current
            return (
              <TouchableOpacity
                key={plan}
                onPress={() => { feedback.light(); onSelect(plan) }}
                className={`mx-4 mb-2 px-4 py-2 rounded-2xl border flex-row items-center justify-between ${c.bg} ${c.border}`}
              >
                <Text style={{ fontFamily: 'Inter-SemiBold' }} className={`text-sm ${c.text}`}>{plan}</Text>
                {isSelected && <CheckCircle2 size={16} color="#10b981" />}
              </TouchableOpacity>
            )
          })}
          <TouchableOpacity
            onPress={onClose}
            className="mx-4 mb-4 mt-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center"
          >
            <Text className="text-sm text-slate-500">Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

export default function AdminSubscriptionsScreen() {
  const { user } = useAuth()
  const showToast = useToastStore((s) => s.show)

  const [rows, setRows] = useState<AdminSubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<FilterTab>('all')
  const [activating, setActivating] = useState<string | null>(null)
  const [pickerTarget, setPickerTarget] = useState<AdminSubscriptionRow | null>(null)

  // Guard: admin only
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <Screen withHeader>
        <Header title="Acesso Negado" showBack />
        <View className="flex-1 items-center justify-center px-8">
          <ShieldAlert size={48} color="#ef4444" />
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg text-slate-800 dark:text-white mt-4 text-center">
            Acesso Restrito
          </Text>
          <Text className="text-sm text-slate-500 mt-2 text-center">
            Esta área é exclusiva para administradores do sistema.
          </Text>
        </View>
      </Screen>
    )
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await subscriptionService.adminGetAllSubscriptions()
      setRows(data)
    } catch (e: any) {
      showToast(e.message || 'Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleRefresh = () => { setRefreshing(true); load(true) }

  const handleActivate = async (row: AdminSubscriptionRow, plan: PlanType) => {
    setPickerTarget(null)
    setActivating(row.id)
    try {
      await subscriptionService.adminActivatePlan(row.id, plan)
      showToast(`Plano ${plan} ativado para ${row.name || row.email}`, 'success')
      await load(true)
    } catch (e: any) {
      showToast(e.message || 'Falha ao ativar plano', 'error')
    } finally {
      setActivating(null)
    }
  }

  const filtered = rows.filter((r) => {
    if (tab === 'trial')   return r.plan === 'TRIAL' && r.days_left > 0
    if (tab === 'active')  return r.plan !== 'TRIAL'
    if (tab === 'expired') return r.plan === 'TRIAL' && r.days_left <= 0
    return true
  })

  const counts = {
    all:     rows.length,
    trial:   rows.filter(r => r.plan === 'TRIAL' && r.days_left > 0).length,
    active:  rows.filter(r => r.plan !== 'TRIAL').length,
    expired: rows.filter(r => r.plan === 'TRIAL' && r.days_left <= 0).length,
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',     label: `Todos (${counts.all})` },
    { key: 'trial',   label: `Trial (${counts.trial})` },
    { key: 'active',  label: `Ativos (${counts.active})` },
    { key: 'expired', label: `Expirados (${counts.expired})` },
  ]

  return (
    <Screen padHorizontal={false} withHeader>
      <Header
        title="Gestão de Subscrições"
        showBack
        rightElement={
          <TouchableOpacity onPress={handleRefresh} className="p-2">
            <RefreshCw size={18} color="#6366f1" />
          </TouchableOpacity>
        }
      />

      <View className="h-[72px]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 gap-2 items-center"
          className="flex-grow-0"
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => { feedback.light(); setTab(t.key) }}
              className={`px-5 h-10 rounded-full border items-center justify-center ${
                tab === t.key
                  ? 'bg-primary border-primary'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text
                style={{ fontFamily: 'Inter-SemiBold' }}
                className={`text-xs ${tab === t.key ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Table Header */}
      <View className="flex-row items-center px-6 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
        <Text className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilizador</Text>
        <Text className="w-16 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Plano</Text>
        <Text className="w-16 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</Text>
        <Text className="w-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right"></Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-24"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        >
          {filtered.length === 0 ? (
            <View className="items-center justify-center pt-20">
              <Text className="text-slate-400 text-sm">Nenhum registo encontrado</Text>
            </View>
          ) : (
            filtered.map((row) => {
              const planColor = PLAN_COLORS[row.plan]
              const isActivating = activating === row.id

              return (
                <TouchableOpacity
                  key={row.id}
                  onPress={() => { feedback.light(); setPickerTarget(row) }}
                  className="flex-row items-center px-6 py-4 border-b border-slate-50 dark:border-white/5 active:bg-slate-50 dark:active:bg-white/5"
                >
                  {/* Coluna 1: Cliente */}
                  <View className="flex-1">
                    <Text
                      style={{ fontFamily: 'Inter-Bold' }}
                      className="text-sm text-slate-800 dark:text-white"
                      numberOfLines={1}
                    >
                      {row.name || 'Sem nome'}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5" numberOfLines={1}>{row.email}</Text>
                  </View>

                  {/* Coluna 2: Plano */}
                  <View className="w-16 items-center">
                    <View className={`px-2 py-0.5 rounded-full border ${planColor.bg} ${planColor.border}`}>
                      <Text style={{ fontFamily: 'Inter-SemiBold' }} className={`text-[8px] font-black ${planColor.text}`}>
                        {row.plan}
                      </Text>
                    </View>
                  </View>

                  {/* Coluna 3: Status */}
                  <View className="w-16 items-center">
                    <StatusBadge row={row} />
                  </View>

                  {/* Coluna 4: Acção */}
                  <View className="w-10 items-end">
                    {isActivating ? (
                      <ActivityIndicator size="small" color="#6366f1" />
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
                         <ChevronDown size={14} color="#6366f1" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </ScrollView>
      )}

      {pickerTarget && (
        <PlanPicker
          visible
          current={pickerTarget.plan}
          onClose={() => setPickerTarget(null)}
          onSelect={(plan) => handleActivate(pickerTarget, plan)}
        />
      )}
    </Screen>
  )
}
