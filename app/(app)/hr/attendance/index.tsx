import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Plus } from 'lucide-react-native'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import IconButton from '@/components/ui/IconButton'
import { useAttendance } from '@/features/hr/hooks/useAttendance'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { useToastStore } from '@/store/useToastStore'
import { feedback } from '@/utils/haptics'
import { generateAttendancePDF } from '@/features/hr/utils/hrExportUtils'
import { useCountryConfig } from '@/hooks/useCountryConfig'
import AttendanceTodayView from '@/features/hr/components/AttendanceTodayView'
import AttendanceMonthlySummaryView from '@/features/hr/components/AttendanceMonthlySummaryView'
import AttendanceDetailModal from '@/features/hr/components/AttendanceDetailModal'
import { Attendance, AttendanceStatus } from '@/features/hr/types'

type Tab = 'hoje' | 'resumo'

const STATUS_OPTIONS: { label: string; value: AttendanceStatus }[] = [
  { label: 'Presente', value: 'present' },
  { label: 'Atrasado', value: 'late' },
  { label: 'Ausente', value: 'absent' },
  { label: 'Justificado', value: 'justified' },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function currentTime() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

export default function AttendanceScreen() {
  const { show: showToast } = useToastStore()
  const countryConfig = useCountryConfig()

  const now = new Date()

  // ─── Tab & search state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('hoje')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'missing'>('all')

  // ─── Período dinâmico para o resumo mensal ────────────────────────────────
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const handlePrevMonth = useCallback(() => {
    feedback.light()
    if (month === 1) {
      setMonth(12)
      setYear(y => y - 1)
    } else {
      setMonth(m => m - 1)
    }
  }, [month])

  const handleNextMonth = useCallback(() => {
    const isCurrentOrFuture =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1)
    if (isCurrentOrFuture) return
    feedback.light()
    if (month === 12) {
      setMonth(1)
      setYear(y => y + 1)
    } else {
      setMonth(m => m + 1)
    }
  }, [month, year, now])

  // ─── Attendance hook ──────────────────────────────────────────────────────
  const attendanceConfig = useMemo(
    () => (activeTab === 'resumo' ? { month, year } : {}),
    [activeTab, month, year]
  )
  const { attendance, summary, isLoading, clockIn, clockOut, addManualEntry, error } =
    useAttendance(attendanceConfig)

  const { employees } = useEmployees()

  React.useEffect(() => {
    if (error) showToast(error, 'error')
  }, [error])

  // ─── Detail modal ────────────────────────────────────────────────────────
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null)

  // ─── Manual entry modal ──────────────────────────────────────────────────
  const [manualVisible, setManualVisible] = useState(false)
  const [form, setForm] = useState({
    employee_id: '',
    date: todayISO(),
    clock_in: '08:00',
    clock_out: '17:00',
    status: 'present' as AttendanceStatus,
    justification: '',
  })

  const openManual = useCallback(() => {
    feedback.light()
    setForm({
      employee_id: '',
      date: todayISO(),
      clock_in: '08:00',
      clock_out: '17:00',
      status: 'present',
      justification: '',
    })
    setManualVisible(true)
  }, [])

  const handleTabChange = useCallback((tab: Tab) => {
    feedback.light()
    setActiveTab(tab)
    setSearchQuery('')
    setStatusFilter('all')
  }, [])

  // ─── Clock in / out ───────────────────────────────────────────────────────
  const handleMarkPresence = useCallback(
    async (employee: any) => {
      const record: Attendance | undefined = employee.attendance_record
      const nowTime = currentTime()

      try {
        feedback.medium()

        if (!record) {
          await clockIn(employee.id, nowTime)
          showToast(`${employee.name} marcou entrada`, 'success')
        } else if (!record.clock_out) {
          const [hIn, mIn] = (record.clock_in ?? '00:00').split(':').map(Number)
          const [hOut, mOut] = nowTime.split(':').map(Number)
          const diff = hOut * 60 + mOut - (hIn * 60 + mIn)
          await clockOut(record.id, nowTime, diff > 0 ? diff : 0)
          showToast(`${employee.name} marcou saída`, 'success')
        } else {
          setSelectedRecord(record)
          setDetailVisible(true)
        }

        feedback.success()
      } catch (e: any) {
        showToast(e?.message ?? 'Erro ao processar ponto', 'error')
      }
    },
    [clockIn, clockOut, showToast]
  )

  // ─── Manual entry submit ──────────────────────────────────────────────────
  const handleManualSubmit = useCallback(async () => {
    if (!form.employee_id || !form.date) {
      showToast('Preencha os campos obrigatórios', 'error')
      return
    }

    try {
      const [hIn, mIn] = form.clock_in.split(':').map(Number)
      const [hOut, mOut] = form.clock_out.split(':').map(Number)
      const totalMinutes = Math.max(0, hOut * 60 + mOut - (hIn * 60 + mIn))

      await addManualEntry({
        employee_id: form.employee_id,
        date: form.date,
        clock_in: form.clock_in,
        clock_out: form.clock_out,
        status: form.status,
        justification: form.justification,
        total_minutes: totalMinutes,
        breaks: null,
      })

      setManualVisible(false)
      feedback.success()
      showToast('Registo manual efectuado.', 'success')
    } catch (e: any) {
      showToast(e?.message ?? 'Erro ao guardar registo', 'error')
    }
  }, [form, addManualEntry, showToast])

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    feedback.medium()
    try {
      if (summary.length === 0) throw new Error('Sem dados para exportar.')
      await generateAttendancePDF(summary, month, year, countryConfig)
      feedback.success()
    } catch (e: any) {
      showToast(e?.message ?? 'Erro ao exportar', 'error')
    }
  }, [summary, month, year, showToast, countryConfig])

  const employeeOptions = useMemo(
    () => employees.map(e => ({ label: e.name, value: e.id })),
    [employees]
  )

  return (
    <Screen padHorizontal={false} withHeader>
      <Header
        title="Assiduidade"
        rightElement={
          <IconButton icon={Plus} variant="glass" onPress={openManual} />
        }
      />

      {/* Tab Switcher */}
      <View className="px-6 mb-4 mt-6">
        <View className="bg-white dark:bg-white/5 p-1 rounded-2xl flex-row border border-slate-100 dark:border-white/10">
          {(['hoje', 'resumo'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabChange(tab)}
              className={`flex-1 py-3 items-center rounded-xl ${activeTab === tab ? 'bg-indigo-600 shadow-sm' : ''}`}
            >
              <Text
                style={{ fontFamily: 'Inter-Bold' }}
                className={`text-[10px] font-black uppercase ${
                  activeTab === tab ? 'text-white' : 'text-slate-500'
                }`}
              >
                {tab === 'hoje' ? 'Hoje' : 'Resumo Mensal'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {activeTab === 'hoje' ? (
        <AttendanceTodayView
          employees={employees}
          attendance={attendance}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onMarkPresence={handleMarkPresence}
        />
      ) : (
        <AttendanceMonthlySummaryView
          summary={summary}
          month={month}
          year={year}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onExport={handleExport}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          isCurrentMonth={
            month === now.getMonth() + 1 && year === now.getFullYear()
          }
        />
      )}

      {/* Manual Entry Bottom Sheet */}
      <BottomSheet visible={manualVisible} onClose={() => setManualVisible(false)} height={0.8}>
        <View className="px-6 flex-1">
          <Text
            style={{ fontFamily: 'Inter-Bold' }}
            className="text-lg font-black text-slate-900 dark:text-white mb-6"
          >
            Registo Manual
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            <Select
              label="Funcionário"
              placeholder="Seleccionar..."
              value={form.employee_id}
              onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}
              options={employeeOptions}
            />

            <Input
              label="Data (AAAA-MM-DD)"
              placeholder={todayISO()}
              value={form.date}
              onChangeText={t => setForm(f => ({ ...f, date: t }))}
            />

            <View className="flex-row">
              <View className="flex-1 mr-3">
                <Input
                  label="Entrada"
                  placeholder="08:00"
                  value={form.clock_in}
                  onChangeText={t => setForm(f => ({ ...f, clock_in: t }))}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Saída"
                  placeholder="17:00"
                  value={form.clock_out}
                  onChangeText={t => setForm(f => ({ ...f, clock_out: t }))}
                />
              </View>
            </View>

            <Select
              label="Estado"
              value={form.status}
              onValueChange={v => setForm(f => ({ ...f, status: v as AttendanceStatus }))}
              options={STATUS_OPTIONS}
            />

            <Input
              label="Justificação"
              placeholder="Opcional..."
              value={form.justification}
              onChangeText={t => setForm(f => ({ ...f, justification: t }))}
              multiline
              numberOfLines={3}
            />

            <View className="mt-8 mb-10">
              <Button
                title="Salvar Registo"
                variant="primary"
                onPress={handleManualSubmit}
                className="h-14 rounded-2xl"
              />
            </View>
          </ScrollView>
        </View>
      </BottomSheet>

      {/* Detail Modal */}
      <AttendanceDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        attendance={selectedRecord}
      />
    </Screen>
  )
}
