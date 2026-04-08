import { View, Text, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native'
import React, { useState, useMemo } from 'react'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import {
  Plane,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Sun,
  ShieldAlert,
  HeartHandshake,
  Banknote,
  HelpCircle,
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { useLeaves } from '@/features/hr/hooks/useLeaves'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { useAuthStore } from '@/features/auth/store/authStore'
import { leavesRepository } from '@/repositories/leavesRepository'
import { Leave, LeaveType, LeaveStatus } from '@/features/hr/types'
import { feedback } from '@/utils/haptics'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, diff)
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const TYPE_CONFIG: Record<LeaveType, { label: string; icon: any; color: string; bg: string }> = {
  vacation:   { label: 'Férias',        icon: Sun,          color: '#6366f1', bg: 'bg-indigo-500/10' },
  sick:       { label: 'Doença',        icon: ShieldAlert,  color: '#f59e0b', bg: 'bg-amber-500/10' },
  maternity:  { label: 'Maternidade',   icon: HeartHandshake, color: '#ec4899', bg: 'bg-pink-500/10' },
  paternity:  { label: 'Paternidade',   icon: HeartHandshake, color: '#06b6d4', bg: 'bg-cyan-500/10' },
  unpaid:     { label: 'Sem Vencimento', icon: Banknote,    color: '#64748b', bg: 'bg-slate-500/10' },
  bereavement:{ label: 'Luto',          icon: HelpCircle,   color: '#8b5cf6', bg: 'bg-violet-500/10' },
  other:      { label: 'Outro',         icon: HelpCircle,   color: '#94a3b8', bg: 'bg-slate-400/10' },
}

const FILTER_TABS: { label: string; value: 'all' | LeaveStatus }[] = [
  { label: 'Todos',     value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Aprovados', value: 'approved' },
  { label: 'Recusados', value: 'rejected' },
]

const LEAVE_TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({
  label: cfg.label,
  value,
}))

const VACATION_ANNUAL_DAYS = 22 // dias anuais por lei

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function LeavesScreen() {
  const { user } = useAuthStore()
  const { leaves, isLoading, requestLeave, handleStatusUpdate } = useLeaves({})
  const { employees } = useEmployees()

  const [filterStatus, setFilterStatus] = useState<'all' | LeaveStatus>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [form, setForm] = useState({
    employee_id: '',
    type: 'vacation' as LeaveType,
    start_date: '',
    end_date: '',
    reason: '',
  })

  // ─── Filtro por estado ──────────────────────────────────────────────────
  const filteredLeaves = useMemo(() => {
    if (filterStatus === 'all') return leaves
    return leaves.filter(l => l.status === filterStatus)
  }, [leaves, filterStatus])

  // ─── Saldo de férias do ano actual ──────────────────────────────────────
  const vacationBalance = useMemo(() => {
    if (!user?.company_id || employees.length === 0) return null
    const currentYear = new Date().getFullYear()
    const totalAllocated = employees.length * VACATION_ANNUAL_DAYS
    const totalUsed = leaves
      .filter(l => l.type === 'vacation' && l.status === 'approved' &&
        l.start_date?.startsWith(currentYear.toString()))
      .reduce((acc, l) => acc + countDays(l.start_date, l.end_date), 0)
    return { allocated: totalAllocated, used: totalUsed, remaining: Math.max(0, totalAllocated - totalUsed) }
  }, [leaves, employees, user?.company_id])

  // ─── Contagens por estado ───────────────────────────────────────────────
  const counts = useMemo(() => ({
    all: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  }), [leaves])

  // ─── Novo pedido ─────────────────────────────────────────────────────────
  const handleRequest = async () => {
    try {
      if (!form.employee_id || !form.start_date || !form.end_date) {
        throw new Error('Preencha os campos obrigatórios: funcionário, data início e data fim.')
      }
      if (form.start_date > form.end_date) {
        throw new Error('A data de início não pode ser posterior à data de fim.')
      }
      await requestLeave({ ...form, status: 'pending' })
      setModalVisible(false)
      setForm({ employee_id: '', type: 'vacation', start_date: '', end_date: '', reason: '' })
      feedback.success()
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    }
  }

  // ─── Renderizar item ─────────────────────────────────────────────────────
  const renderLeave = ({ item }: { item: Leave }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.other
    const TypeIcon = cfg.icon
    const days = countDays(item.start_date, item.end_date)

    return (
      <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className={`w-10 h-10 rounded-xl ${cfg.bg} items-center justify-center mr-3`}>
              <TypeIcon size={20} color={cfg.color} />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                {item.employee_name || 'Funcionário'}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight mt-0.5">
                {cfg.label} • {days} dia{days !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          {getStatusBadge(item.status)}
        </View>

        {/* Datas */}
        <View className="flex-row mt-3 bg-slate-50 dark:bg-white/5 rounded-xl p-3">
          <View className="flex-1 items-center">
            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Início</Text>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-700 dark:text-slate-200 text-xs font-bold">
              {formatDate(item.start_date)}
            </Text>
          </View>
          <View className="w-[1px] bg-slate-200 dark:bg-white/10 mx-3" />
          <View className="flex-1 items-center">
            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Fim</Text>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-700 dark:text-slate-200 text-xs font-bold">
              {formatDate(item.end_date)}
            </Text>
          </View>
          <View className="w-[1px] bg-slate-200 dark:bg-white/10 mx-3" />
          <View className="flex-1 items-center">
            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Dias</Text>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-700 dark:text-slate-200 text-xs font-bold">
              {days}
            </Text>
          </View>
        </View>

        {/* Motivo */}
        {item.reason ? (
          <View className="mt-3 bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Motivo</Text>
            <Text className="text-slate-600 dark:text-slate-300 text-[11px] leading-4">{item.reason}</Text>
          </View>
        ) : null}

        {/* Botões de aprovação */}
        {item.status === 'pending' && (
          <View className="flex-row mt-4 space-x-2">
            <TouchableOpacity
              onPress={() => handleStatusUpdate(item.id, 'approved')}
              className="flex-1 bg-emerald-500/10 py-2.5 rounded-xl items-center flex-row justify-center border border-emerald-500/20"
            >
              <CheckCircle2 size={14} color="#10b981" />
              <Text className="text-emerald-600 font-black text-[10px] uppercase ml-1.5">Aprovar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStatusUpdate(item.id, 'rejected')}
              className="flex-1 bg-rose-500/10 py-2.5 rounded-xl items-center flex-row justify-center border border-rose-500/20"
            >
              <XCircle size={14} color="#f43f5e" />
              <Text className="text-rose-600 font-black text-[10px] uppercase ml-1.5">Recusar</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    )
  }

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Férias e Ausências" />

      {/* Saldo de Férias */}
      {vacationBalance && (
        <View className="px-6 pt-4 pb-2">
          <Card variant="premium" className="p-4 flex-row justify-between border-slate-100 dark:border-white/5">
            <View className="items-center flex-1">
              <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Alocados</Text>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-indigo-600 text-lg font-black">{vacationBalance.allocated}</Text>
              <Text className="text-slate-400 text-[9px]">dias</Text>
            </View>
            <View className="w-[1px] bg-slate-100 dark:bg-white/10" />
            <View className="items-center flex-1">
              <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Usados</Text>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-amber-600 text-lg font-black">{vacationBalance.used}</Text>
              <Text className="text-slate-400 text-[9px]">dias</Text>
            </View>
            <View className="w-[1px] bg-slate-100 dark:bg-white/10" />
            <View className="items-center flex-1">
              <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Restantes</Text>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-emerald-600 text-lg font-black">{vacationBalance.remaining}</Text>
              <Text className="text-slate-400 text-[9px]">dias</Text>
            </View>
          </Card>
        </View>
      )}

      {/* Filtros por estado */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-6 py-3 space-x-2"
      >
        {FILTER_TABS.map(tab => {
          const count = counts[tab.value]
          const active = filterStatus === tab.value
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => { feedback.light(); setFilterStatus(tab.value) }}
              className={`flex-row items-center px-4 py-2 rounded-xl border ${
                active
                  ? 'bg-indigo-600 border-indigo-500'
                  : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10'
              } mr-2`}
            >
              <Text
                className={`text-[10px] font-black uppercase ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View className={`ml-1.5 px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10'}`}>
                  <Text className={`text-[9px] font-black ${active ? 'text-white' : 'text-slate-500'}`}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Lista */}
      <FlatList
        data={filteredLeaves}
        renderItem={renderLeave}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 py-2 pb-32"
        ListEmptyComponent={
          isLoading ? (
            <Loading message="A carregar pedidos..." />
          ) : (
            <EmptyState
              title="Sem pedidos"
              description={
                filterStatus === 'all'
                  ? 'Nenhum pedido de ausência registado.'
                  : `Sem pedidos com estado "${FILTER_TABS.find(t => t.value === filterStatus)?.label}".`
              }
            />
          )
        }
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-premium-lg"
        onPress={() => { feedback.medium(); setModalVisible(true) }}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      {/* Novo Pedido Modal */}
      <BottomSheet visible={modalVisible} onClose={() => setModalVisible(false)} height={0.82}>
        <View className="px-6 flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-black text-slate-900 dark:text-white mb-6">
            Novo Pedido de Ausência
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
            <Select
              label="Funcionário *"
              placeholder="Seleccionar..."
              value={form.employee_id}
              onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}
              options={employees.map(e => ({ label: e.name, value: e.id }))}
            />

            <Select
              label="Tipo de Ausência *"
              value={form.type}
              onValueChange={v => setForm(f => ({ ...f, type: v as LeaveType }))}
              options={LEAVE_TYPE_OPTIONS}
            />

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Input
                  label="Data de Início *"
                  placeholder="AAAA-MM-DD"
                  value={form.start_date}
                  onChangeText={t => setForm(f => ({ ...f, start_date: t }))}
                  icon={<Calendar size={18} color="#94a3b8" />}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Data de Fim *"
                  placeholder="AAAA-MM-DD"
                  value={form.end_date}
                  onChangeText={t => setForm(f => ({ ...f, end_date: t }))}
                  icon={<Calendar size={18} color="#94a3b8" />}
                />
              </View>
            </View>

            {/* Pré-visualização de dias */}
            {form.start_date && form.end_date && form.start_date <= form.end_date && (
              <View className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 mb-4 flex-row items-center border border-indigo-100 dark:border-indigo-500/20">
                <Clock size={16} color="#6366f1" />
                <Text className="text-indigo-700 dark:text-indigo-300 text-xs font-bold ml-2">
                  {countDays(form.start_date, form.end_date)} dia(s) de ausência
                </Text>
              </View>
            )}

            <Input
              label="Motivo / Observações"
              placeholder="Escreva o motivo (opcional)"
              value={form.reason}
              onChangeText={t => setForm(f => ({ ...f, reason: t }))}
              multiline
              numberOfLines={3}
            />

            <View className="mt-4">
              <Button
                title="Enviar Pedido"
                variant="primary"
                onPress={handleRequest}
              />
            </View>
          </ScrollView>
        </View>
      </BottomSheet>
    </Screen>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved': return <Badge variant="success" label="Aprovado" />
    case 'rejected': return <Badge variant="danger" label="Recusado" />
    default:         return <Badge variant="warning" label="Pendente" />
  }
}
