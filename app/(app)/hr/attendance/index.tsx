import { View, Text, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native'
import React, { useState, useMemo } from 'react'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  Clock, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Search,
  Users,
  FileText,
  Download,
  MoreVertical,
  Filter,
  User
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { useAttendance } from '@/features/hr/hooks/useAttendance'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { Attendance, AttendanceStatus } from '@/features/hr/types'
import { feedback } from '@/utils/haptics'
import { generateAttendancePDF } from '@/features/hr/utils/hrExportUtils'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Animated, { FadeInUp } from 'react-native-reanimated'

type AttendanceTab = 'hoje' | 'resumo'

export default function AttendanceScreen() {
  const [activeTab, setActiveTab] = useState<AttendanceTab>('hoje')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  
  const { attendance, summary, isLoading, addManualEntry, error: attendanceError } = useAttendance({
    month: activeTab === 'resumo' ? month : undefined,
    year: activeTab === 'resumo' ? year : undefined
  })
  
  React.useEffect(() => {
    if (attendanceError) {
      Alert.alert('Erro de Dados', attendanceError)
    }
  }, [attendanceError])
  const { employees } = useEmployees()
  
  const [modalVisible, setModalVisible] = useState(false)
  const [form, setForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: '08:00',
    clock_out: '17:00',
    status: 'present' as AttendanceStatus,
    justification: ''
  })

  const handleManualEntry = async () => {
    try {
      if (!form.employee_id || !form.date) throw new Error('Preencha os campos obrigatórios')
      
      const clockInArr = form.clock_in.split(':')
      const clockOutArr = form.clock_out.split(':')
      const diffMs = (parseInt(clockOutArr[0]) * 60 + parseInt(clockOutArr[1])) - 
                     (parseInt(clockInArr[0]) * 60 + parseInt(clockInArr[1]))
      
      await addManualEntry({
        ...form,
        total_minutes: diffMs > 0 ? diffMs : 0,
        breaks: null
      })
      
      setModalVisible(false)
      feedback.success()
      Alert.alert('Sucesso', 'Registo manual efectuado.')
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    }
  }

  const renderToday = () => (
    <Animated.View entering={FadeInUp} className="px-6 flex-1">
      <FlatList
        data={attendance}
        keyExtractor={item => item.id}
        contentContainerClassName="pb-32"
        renderItem={({ item }) => (
          <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <User size={20} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                  {item.employee_name || 'Funcionário'}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight mt-0.5">
                  ENT: {item.clock_in} • SAI: {item.clock_out || '--:--'}
                </Text>
              </View>
            </View>
            <Badge variant={item.status === 'present' ? 'success' : 'warning'} label={item.status === 'present' ? 'Presente' : 'Atrasado'} />
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Sem registos" description="Ninguém marcou ponto hoje." />}
      />
    </Animated.View>
  )

  const handleExportSummary = async () => {
    feedback.medium()
    try {
      if (summary.length === 0) throw new Error('Sem dados para exportar.')
      await generateAttendancePDF(summary, month, year)
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    }
  }

  const renderSummary = () => (
    <Animated.View entering={FadeInUp} className="px-6 flex-1">
       <View className="mb-4 flex-row justify-between items-center">
         <Text className="text-slate-400 text-[10px] font-bold uppercase">Resultados: {summary.length}</Text>
         <TouchableOpacity 
           onPress={handleExportSummary}
           className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
          >
           <Download size={14} color="#4f46e5" className="mr-2" />
           <Text className="text-primary font-bold text-[10px] uppercase">Exportar PDF</Text>
         </TouchableOpacity>
       </View>
       <FlatList
        data={summary}
        keyExtractor={item => item.id}
        contentContainerClassName="pb-32"
        renderItem={({ item }) => (
          <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                {item.employee_name}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight mt-0.5">
                {item.present_days} Dias Presentes • {Math.round(item.total_minutes / 60)}h Total
              </Text>
            </View>
            <TouchableOpacity className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl">
               <Download size={16} color="#64748b" />
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Sem dados" description="Nenhum resumo disponível para este mês." />}
      />
    </Animated.View>
  )

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Assiduidade" />

      {/* Stats Header */}
      {activeTab === 'hoje' && (
        <View className="px-6 py-4">
          <Card variant="premium" className="bg-indigo-600 p-5 flex-row justify-between items-center border-none">
            <View>
              <Text className="text-white/60 text-[10px] font-bold uppercase mb-1">Presentes Agora</Text>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl text-white font-black">
                {attendance.filter(a => a.clock_in && !a.clock_out).length}
              </Text>
              <Text className="text-white/80 text-[10px] font-medium mt-1">
                Total de {attendance.length} registos hoje
              </Text>
            </View>
            <View className="bg-white/20 p-3 rounded-2xl">
              <Clock size={28} color="white" />
            </View>
          </Card>
        </View>
      )}

      {/* Tabs */}
      <View className="px-6 mb-6">
        <View className="bg-white dark:bg-white/5 p-1 rounded-2xl flex-row border border-slate-100 dark:border-white/10">
          {(['hoje', 'resumo'] as AttendanceTab[]).map(tab => (
            <TouchableOpacity 
              key={tab}
              onPress={() => { feedback.light(); setActiveTab(tab); }}
              className={`flex-1 py-3 items-center rounded-xl ${activeTab === tab ? 'bg-primary shadow-sm' : ''}`}
            >
              <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-[10px] font-black uppercase ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}>
                {tab === 'hoje' ? 'Hoje' : 'Resumo Mensal'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Content */}
      {isLoading ? <Loading /> : activeTab === 'hoje' ? renderToday() : renderSummary()}

      {/* FAB (Manual Entry) */}
      {activeTab === 'hoje' && (
        <TouchableOpacity 
          className="absolute bottom-8 right-6 w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-premium-lg"
          onPress={() => setModalVisible(true)}
        >
          <Plus size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Manual Entry BottomSheet */}
      <BottomSheet visible={modalVisible} onClose={() => setModalVisible(false)} height={0.8}>
        <View className="px-6 flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-black text-slate-900 dark:text-white mb-6">
            Entrada de Ponto Manual
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            <Select
              label="Funcionário"
              placeholder="Seleccionar..."
              value={form.employee_id}
              onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}
              options={employees.map(e => ({ label: e.name, value: e.id }))}
            />

            <Input
              label="Data"
              placeholder="AAAA-MM-DD"
              value={form.date}
              onChangeText={t => setForm(f => ({ ...f, date: t }))}
              icon={<Calendar size={18} color="#94a3b8" />}
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
              options={[
                { label: 'Presente', value: 'present' },
                { label: 'Atrasado', value: 'late' },
                { label: 'Ausente', value: 'absent' },
                { label: 'Justificado', value: 'justified' }
              ]}
            />

            <Input
              label="Justificação / Nota"
              placeholder="Ex: Esquecimento do cartão"
              value={form.justification}
              onChangeText={t => setForm(f => ({ ...f, justification: t }))}
              multiline
              numberOfLines={3}
            />

            <View className="mt-4 mb-10">
              <Button
                title="Registar Ponto Manual"
                variant="primary"
                onPress={handleManualEntry}
              />
            </View>
          </ScrollView>
        </View>
      </BottomSheet>
    </Screen>
  )
}
