import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, FlatList, TextInput } from 'react-native'
import { CheckCircle2, XCircle, Search, User, LayoutGrid } from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { Attendance, Employee } from '../types'

interface EmployeeWithAttendance extends Employee {
  attendance_record?: Attendance
}

interface Props {
  employees: Employee[]
  attendance: Attendance[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  statusFilter: 'all' | 'present' | 'missing'
  setStatusFilter: (f: 'all' | 'present' | 'missing') => void
  onMarkPresence: (employee: EmployeeWithAttendance) => void
}

export default function AttendanceTodayView({
  employees,
  attendance,
  isLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onMarkPresence,
}: Props) {
  const presentCount = attendance.filter(a => a.clock_in).length
  const activeCount = employees.filter(e => e.is_active === 1).length
  const missingCount = Math.max(0, activeCount - presentCount)

  const filteredData = useMemo<EmployeeWithAttendance[]>(() => {
    const query = searchQuery.toLowerCase()
    return employees
      .filter(e => e.is_active === 1)
      .map(emp => ({
        ...emp,
        attendance_record: attendance.find(a => a.employee_id === emp.id),
      }))
      .filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(query)
        const hasRecord = Boolean(item.attendance_record)
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'present' && hasRecord) ||
          (statusFilter === 'missing' && !hasRecord)
        return matchesQuery && matchesStatus
      })
  }, [employees, attendance, searchQuery, statusFilter])

  const renderItem = ({ item }: { item: EmployeeWithAttendance }) => {
    const record = item.attendance_record
    const isPresent = record && !record.clock_out
    const isFinished = record && record.clock_out

    return (
      <TouchableOpacity activeOpacity={0.75} onPress={() => onMarkPresence(item)} className="mb-3">
        <Card
          variant="premium"
          className={`p-4 flex-row items-center justify-between border-slate-100 dark:border-white/5 shadow-premium-sm ${
            isPresent ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-800/20' : ''
          }`}
        >
          <View className="flex-row items-center flex-1">
            <View
              className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 border ${
                isPresent
                  ? 'bg-emerald-100 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-700/30'
                  : 'bg-slate-100 border-slate-200 dark:bg-white/5 dark:border-white/10'
              }`}
            >
              <User size={24} color={isPresent ? '#10b981' : '#64748b'} />
            </View>

            <View className="flex-1">
              <Text
                style={{ fontFamily: 'Inter-Black' }}
                className="text-base font-black text-slate-900 dark:text-white"
              >
                {item.name}
              </Text>
              {record ? (
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                  ENT: {record.clock_in}
                  {record.clock_out ? ` • SAI: ${record.clock_out}` : ''}
                </Text>
              ) : (
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                  Não Marcado Hoje
                </Text>
              )}
            </View>
          </View>

          <Badge
            variant={!record ? 'neutral' : isFinished ? 'info' : 'success'}
            label={!record ? 'Ausente' : isFinished ? 'Concluído' : 'Presente'}
          />
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1">
      {/* Stats Row */}
      <View className="px-6 py-4 flex-row">
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
          className={`flex-1 mr-2 p-4 rounded-2xl border ${
            statusFilter === 'present'
              ? 'bg-indigo-600 border-indigo-500'
              : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View
              className={`${
                statusFilter === 'present' ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-500/10'
              } p-2 rounded-xl`}
            >
              <CheckCircle2 size={20} color={statusFilter === 'present' ? 'white' : '#6366f1'} />
            </View>
            <Text
              className={`${
                statusFilter === 'present' ? 'text-white/60' : 'text-slate-400'
              } text-[10px] font-bold uppercase`}
            >
              Presentes
            </Text>
          </View>
          <Text
            style={{ fontFamily: 'Inter-Black' }}
            className={`text-2xl font-black ${
              statusFilter === 'present' ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            {presentCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setStatusFilter(statusFilter === 'missing' ? 'all' : 'missing')}
          className={`flex-1 ml-2 p-4 rounded-2xl border ${
            statusFilter === 'missing'
              ? 'bg-red-600 border-red-500'
              : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View
              className={`${
                statusFilter === 'missing' ? 'bg-white/20' : 'bg-red-50 dark:bg-red-500/10'
              } p-2 rounded-xl`}
            >
              <XCircle size={20} color={statusFilter === 'missing' ? 'white' : '#ef4444'} />
            </View>
            <Text
              className={`${
                statusFilter === 'missing' ? 'text-white/60' : 'text-slate-400'
              } text-[10px] font-bold uppercase`}
            >
              Em Falta
            </Text>
          </View>
          <Text
            style={{ fontFamily: 'Inter-Black' }}
            className={`text-2xl font-black ${
              statusFilter === 'missing' ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            {missingCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-white dark:bg-slate-900 px-4 h-12 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Search size={18} color="#6366f1" />
          <TextInput
            placeholder="Pesquisar funcionário..."
            className="flex-1 ml-3 text-slate-700 dark:text-white font-bold text-xs"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pb-40"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-20 items-center">
              <Loading />
            </View>
          ) : (
            <EmptyState
              title="Nenhum funcionário"
              description={searchQuery ? 'Sem resultados para a busca.' : 'Nenhum registo disponível.'}
              icon={<LayoutGrid size={48} color="#cbd5e1" />}
            />
          )
        }
      />
    </View>
  )
}
