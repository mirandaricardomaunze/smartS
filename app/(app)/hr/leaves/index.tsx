import { View, Text, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native'
import React, { useState } from 'react'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  Plane, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Calendar,
  User,
  Info
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { useLeaves } from '@/features/hr/hooks/useLeaves'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { Leave, LeaveType } from '@/features/hr/types'
import { feedback } from '@/utils/haptics'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

export default function LeavesScreen() {
  const { leaves, isLoading, requestLeave, handleStatusUpdate } = useLeaves({})
  const { employees } = useEmployees()
  
  const [modalVisible, setModalVisible] = useState(false)
  const [form, setForm] = useState({
    employee_id: '',
    type: 'vacation' as LeaveType,
    start_date: '',
    end_date: '',
    reason: ''
  })

  const handleRequest = async () => {
    try {
      if (!form.employee_id || !form.start_date || !form.end_date) {
        throw new Error('Preencha os campos obrigatórios')
      }
      // status: 'pending' is handled by service
      await requestLeave({ ...form, status: 'pending' })
      setModalVisible(false)
      setForm({
        employee_id: '',
        type: 'vacation',
        start_date: '',
        end_date: '',
        reason: ''
      })
      feedback.success()
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success" label="Aprovado" />
      case 'rejected': return <Badge variant="danger" label="Recusado" />
      default: return <Badge variant="warning" label="Pendente" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vacation: 'Férias',
      sick: 'Doença',
      maternity: 'Maternidade',
      paternity: 'Paternidade',
      other: 'Outro'
    }
    return labels[type] || type
  }

  const renderLeave = ({ item }: { item: Leave }) => (
    <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-3">
             <Plane size={20} color="#4f46e5" />
          </View>
          <View className="flex-1">
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
              {item.employee_name || 'Funcionário'}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight mt-0.5">
              {getTypeLabel(item.type)} • {item.start_date} até {item.end_date}
            </Text>
          </View>
        </View>
        {getStatusBadge(item.status)}
      </View>

      {item.status === 'pending' && (
        <View className="flex-row mt-4 space-x-2">
          <TouchableOpacity 
            onPress={() => handleStatusUpdate(item.id, 'approved')}
            className="flex-1 bg-emerald-500/10 py-2 rounded-xl items-center flex-row justify-center border border-emerald-500/20"
          >
            <CheckCircle2 size={14} color="#10b981" className="mr-2" />
            <Text className="text-emerald-600 font-black text-[10px] uppercase">Aprovar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleStatusUpdate(item.id, 'rejected')}
            className="flex-1 bg-rose-500/10 py-2 rounded-xl items-center flex-row justify-center border border-rose-500/20"
          >
            <XCircle size={14} color="#f43f5e" className="mr-2" />
            <Text className="text-rose-600 font-black text-[10px] uppercase">Recusar</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.reason && (
        <View className="mt-3 bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
          <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Motivo</Text>
          <Text className="text-slate-600 dark:text-slate-300 text-[11px] leading-4">
            {item.reason}
          </Text>
        </View>
      )}
    </Card>
  )

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Férias e Ausências" />

      <FlatList
        data={leaves}
        renderItem={renderLeave}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 py-4 pb-32"
        ListEmptyComponent={
          isLoading ? (
            <Loading message="A carregar pedidos..." />
          ) : (
            <EmptyState 
              title="Sem pedidos"
              description="Nenhum pedido de férias ou ausência registado."
            />
          )
        }
      />

      {/* FAB */}
      <TouchableOpacity 
        className="absolute bottom-8 right-6 w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-premium-lg"
        onPress={() => {
          feedback.medium()
          setModalVisible(true)
        }}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      {/* Request Modal */}
      <BottomSheet visible={modalVisible} onClose={() => setModalVisible(false)} height={0.75}>
        <View className="px-6 flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-black text-slate-900 dark:text-white mb-6">
            Novo Pedido
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Select
              label="Funcionário"
              placeholder="Seleccionar..."
              value={form.employee_id}
              onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}
              options={employees.map(e => ({ label: e.name, value: e.id }))}
            />

            <Select
              label="Tipo de Ausência"
              value={form.type}
              onValueChange={v => setForm(f => ({ ...f, type: v as LeaveType }))}
              options={[
                { label: 'Férias', value: 'vacation' },
                { label: 'Doença (Baixa)', value: 'sick' },
                { label: 'Maternidade', value: 'maternity' },
                { label: 'Paternidade', value: 'paternity' },
                { label: 'Outro', value: 'other' }
              ]}
            />

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Input
                  label="Data de Início"
                  placeholder="AAAA-MM-DD"
                  value={form.start_date}
                  onChangeText={t => setForm(f => ({ ...f, start_date: t }))}
                  icon={<Calendar size={18} color="#94a3b8" />}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Data de Fim"
                  placeholder="AAAA-MM-DD"
                  value={form.end_date}
                  onChangeText={t => setForm(f => ({ ...f, end_date: t }))}
                  icon={<Calendar size={18} color="#94a3b8" />}
                />
              </View>
            </View>

            <Input
              label="Motivo / Comentário"
              placeholder="Escreva o motivo (opcional)"
              value={form.reason}
              onChangeText={t => setForm(f => ({ ...f, reason: t }))}
              multiline
              numberOfLines={3}
            />

            <View className="mt-4 mb-10">
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
