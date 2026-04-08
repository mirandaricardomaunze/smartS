import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Users, Clock, FileText, Download, Search, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import IconButton from '@/components/ui/IconButton'
import { MonthlySummaryItem } from '../hooks/useAttendance'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface Props {
  summary: MonthlySummaryItem[]
  month: number
  year: number
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  onExport: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
  isCurrentMonth: boolean
}

const STAT_COLORS = {
  indigo: { icon: '#6366f1', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-transparent border border-indigo-100 dark:border-indigo-500/20' },
  emerald: { icon: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-transparent border border-emerald-100 dark:border-emerald-500/20' },
  amber: { icon: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-transparent border border-amber-100 dark:border-amber-500/20' },
} as const

export default function AttendanceMonthlySummaryView({
  summary,
  month,
  year,
  isLoading,
  searchQuery,
  setSearchQuery,
  onExport,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
}: Props) {
  const safeSummary = summary ?? []

  const stats = useMemo(() => {
    const totalDays = safeSummary.reduce((acc, item) => acc + (item.present_days ?? 0), 0)
    const totalHours = safeSummary.reduce((acc, item) => acc + (item.total_hours ?? 0), 0)
    const avgDays = safeSummary.length > 0 ? Math.round(totalDays / safeSummary.length) : 0

    return [
      { label: 'Total Dias', value: totalDays, Icon: Users, color: STAT_COLORS.indigo },
      { label: 'Horas Totais', value: `${Math.round(totalHours)}h`, Icon: Clock, color: STAT_COLORS.emerald },
      { label: 'Média/Func.', value: avgDays, Icon: FileText, color: STAT_COLORS.amber },
    ]
  }, [safeSummary])

  const filtered = useMemo(() => {
    if (!searchQuery) return safeSummary
    const q = searchQuery.toLowerCase()
    return safeSummary.filter(item => item.employee_name?.toLowerCase().includes(q))
  }, [safeSummary, searchQuery])

  if (isLoading && safeSummary.length === 0) {
    return <Loading />
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1"
      contentContainerClassName="px-6 pb-24"
    >
      {/* Navegador de Período */}
      <View className="flex-row items-center justify-between bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 px-4 py-3 mt-2 mb-5">
        <TouchableOpacity
          onPress={onPrevMonth}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
        >
          <ChevronLeft size={20} color="#6366f1" />
        </TouchableOpacity>

        <View className="items-center">
          <Text
            style={{ fontFamily: 'Inter-Black' }}
            className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest"
          >
            {MONTH_NAMES[month - 1]} {year}
          </Text>
          {isCurrentMonth && (
            <Text className="text-indigo-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
              Mês Actual
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={onNextMonth}
          disabled={isCurrentMonth}
          className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center ${isCurrentMonth ? 'opacity-30' : ''}`}
        >
          <ChevronRight size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Search + Export */}
      <View className="flex-row items-center mb-6">
        <View className="flex-1 mr-3">
          <Input
            placeholder="Pesquisar funcionário..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Search size={18} color="#94a3b8" />}
            className="mb-0 h-12"
          />
        </View>
        <IconButton icon={Download} variant="glass" onPress={onExport} className="h-12 w-12" />
      </View>

      {/* Stats Grid */}
      <View className="flex-row mb-6">
        {stats.map((stat, i) => (
          <View
            key={stat.label}
            className={`flex-1 p-4 rounded-3xl ${stat.color.bg} ${i < stats.length - 1 ? 'mr-3' : ''}`}
          >
            <stat.Icon size={20} color={stat.color.icon} />
            <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3 mb-1">
              {stat.label}
            </Text>
            <Text
              style={{ fontFamily: 'Inter-Black' }}
              className={`text-lg font-black ${stat.color.text}`}
            >
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <Text
        style={{ fontFamily: 'Inter-Bold' }}
        className="text-slate-900 dark:text-white text-md mb-4 uppercase tracking-tighter"
      >
        Detalhamento Individual
      </Text>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<UserCheck size={48} color="#94a3b8" />}
          title="Sem dados"
          description="Nenhum registo de assiduidade encontrado para este período."
        />
      ) : (
        filtered.map(item => (
          <Card
            key={item.employee_id}
            className="mb-4 p-4 border-slate-100 dark:border-white/5 shadow-sm"
          >
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-1 mr-2">
                <Text
                  style={{ fontFamily: 'Inter-Bold' }}
                  className="text-slate-900 dark:text-white font-bold text-base"
                  numberOfLines={1}
                >
                  {item.employee_name}
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  {Math.round(item.total_hours ?? 0)}h trabalhadas
                </Text>
              </View>
              <Badge label={`${Math.round(item.total_hours ?? 0)}h`} variant="info" />
            </View>

            <View className="flex-row bg-slate-50 dark:bg-white/5 rounded-2xl p-3 justify-between">
              <StatCell label="Presenças" value={item.present_days ?? 0} color="text-indigo-600" />
              <Divider />
              <StatCell label="Atrasos" value={item.late_days ?? 0} color="text-amber-600" />
              <Divider />
              <StatCell label="Faltas" value={item.absent_days ?? 0} color="text-rose-600" />
              <Divider />
              <StatCell label="Justif." value={item.justified_days ?? 0} color="text-emerald-600" />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  )
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="items-center flex-1">
      <Text className="text-[9px] font-bold text-slate-400 uppercase">{label}</Text>
      <Text className={`${color} font-bold text-sm`}>{value}</Text>
    </View>
  )
}

function Divider() {
  return <View className="w-[1px] h-full bg-slate-200 dark:bg-white/10 mx-2" />
}
