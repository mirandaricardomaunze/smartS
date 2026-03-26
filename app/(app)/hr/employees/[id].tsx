import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native'
import React, { useState, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  User, 
  Briefcase, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard,
  Building2,
  Clock,
  Plane,
  FileText,
  Edit2,
  Heart,
  Globe,
  Download,
  ShieldCheck,
  Plus
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { useAttendance } from '@/features/hr/hooks/useAttendance'
import { usePayroll } from '@/features/hr/hooks/usePayroll'
import { useLeaves } from '@/features/hr/hooks/useLeaves'
import { useFormatter } from '@/hooks/useFormatter'
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated'
import { feedback } from '@/utils/haptics'

type TabType = 'geral' | 'ponto' | 'financeiro' | 'ferias' | 'documentos'

export default function EmployeeProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('geral')
  const { formatCurrency } = useFormatter()

  const { employees, isLoading: loadingEmp } = useEmployees()
  const employee = employees.find(e => e.id === id)

  const { attendance, isLoading: loadingAttendance } = useAttendance({})
  const empAttendance = attendance.filter(a => a.employee_id === id)

  const { payslips, isLoading: loadingPayroll } = usePayroll({})
  const empPayslips = payslips.filter(p => p.employee_id === id)

  const { leaves, isLoading: loadingLeaves } = useLeaves({ employeeId: id })

  if (loadingEmp && !employee) return <Loading />
  if (!employee) return <EmptyState title="Não encontrado" description="Funcionário não localizado." />

  const renderGeral = () => (
    <Animated.View entering={FadeInUp} className="px-6 space-y-4 pb-20">
      <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-primary uppercase tracking-widest mb-4">
          Dados Pessoais
        </Text>
        <View className="space-y-4">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 items-center justify-center mr-3">
              <Globe size={16} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Nacionalidade / Estado Civil</Text>
              <Text className="text-slate-800 dark:text-white font-medium">{employee.nacionality} • {employee.civil_status}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 items-center justify-center mr-3">
              <User size={16} color="#64748b" />
            </View>
            <View>
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Documentos (BI / NUIT)</Text>
              <Text className="text-slate-800 dark:text-white font-medium">{employee.bi_number || '---'} / {employee.nit || '---'}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
             <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 items-center justify-center mr-3">
              <Heart size={16} color="#f43f5e" />
            </View>
            <View>
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Contacto de Emergência</Text>
              <Text className="text-slate-800 dark:text-white font-medium">{employee.emergency_contact || 'Não registado'}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
             <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 items-center justify-center mr-3">
              <MapPin size={16} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Endereço</Text>
              <Text className="text-slate-800 dark:text-white font-medium" numberOfLines={2}>
                {employee.address || 'Não registado'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-primary uppercase tracking-widest mb-4">
          Dados Bancários
        </Text>
        <View className="space-y-4">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-emerald-500/10 items-center justify-center mr-3">
              <Building2 size={16} color="#10b981" />
            </View>
            <View>
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Instituição</Text>
              <Text className="text-slate-800 dark:text-white font-black text-sm">{employee.bank_name || 'Não definido'}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Conta</Text>
              <Text className="text-slate-800 dark:text-white font-medium">{employee.bank_account || '---'}</Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">NIB</Text>
              <Text className="text-slate-800 dark:text-white font-medium">{employee.nib || '---'}</Text>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  )

  const renderAttendance = () => (
    <Animated.View entering={FadeInUp} className="px-6 pb-20">
      <FlatList
        data={empAttendance}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center mr-3`}>
                <Clock size={20} color="#10b981" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                  {item.date}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight">
                  ENT: {item.clock_in} • SAI: {item.clock_out || '--:--'}
                </Text>
              </View>
            </View>
            <Badge variant="success" label="Presente" />
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Sem registos" description="Nenhum registo de ponto encontrado." />}
      />
    </Animated.View>
  )

  const renderFinanceiro = () => (
    <Animated.View entering={FadeInUp} className="px-6 pb-20">
      <FlatList
        data={empPayslips}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <CreditCard size={20} color="#4f46e5" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                  Recibo {item.period_month}/{item.period_year}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight">
                  {formatCurrency(item.net_salary)}
                </Text>
              </View>
            </View>
            <TouchableOpacity className="p-2">
              <FileText size={20} color="#64748b" />
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Sem recibos" description="Nenhum salário processado ainda." />}
      />
    </Animated.View>
  )

  const renderFerias = () => (
    <Animated.View entering={FadeInUp} className="px-6 pb-20">
       <FlatList
        data={leaves}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-3">
                <Plane size={20} color="#4f46e5" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                  {item.start_date} até {item.end_date}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight capitalize">
                  {item.type}
                </Text>
              </View>
            </View>
            <Badge variant={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'} label={item.status} />
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Sem pedidos" description="Nenhum pedido de férias registado." />}
      />
    </Animated.View>
  )

  const renderDocumentos = () => (
    <Animated.View entering={FadeInUp} className="px-6 space-y-3 pb-20">
      <Card variant="premium" className="p-4 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <FileText size={20} color="#64748b" className="mr-3" />
          <Text className="text-slate-800 dark:text-white font-bold text-xs">Cópia do BI / Documento</Text>
        </View>
        <Badge variant="info" label="Não Carregado" />
      </Card>
      <Card variant="premium" className="p-4 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <FileText size={20} color="#64748b" className="mr-3" />
          <Text className="text-slate-800 dark:text-white font-bold text-xs">Contrato de Trabalho</Text>
        </View>
        <Badge variant="info" label="Não Carregado" />
      </Card>
      <TouchableOpacity className="mt-4 bg-primary/10 py-4 rounded-2xl items-center border border-dashed border-primary/30">
        <Plus size={20} color="#4f46e5" />
        <Text className="text-primary font-black text-[10px] uppercase mt-1">Carregar Documento</Text>
      </TouchableOpacity>
    </Animated.View>
  )

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Perfil do Func." />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View entering={FadeInUp} className="px-6 py-6 items-center">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center border-2 border-white dark:border-white/5 relative shadow-sm">
            <User size={48} color="#4f46e5" />
            <TouchableOpacity className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-slate-800 rounded-full items-center justify-center shadow-md border border-slate-100 dark:border-white/5">
              <Edit2 size={12} color="#4f46e5" />
            </TouchableOpacity>
          </View>
          
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white mt-4">
            {employee.name}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
             {employee.position || 'Sem Cargo'} • {employee.status === 'active' ? 'Activo' : 'Inactivo'}
          </Text>

          <View className="flex-row mt-6 space-x-2">
            <TouchableOpacity className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
               <Phone size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
               <Mail size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity className="px-6 bg-primary rounded-2xl items-center justify-center flex-1 shadow-premium-sm">
               <Text className="text-white font-black text-xs uppercase">Gerir Contrato</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tabs Bar */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            <View className="bg-white dark:bg-white/5 p-1 rounded-2xl flex-row border border-slate-100 dark:border-white/10 shadow-sm">
              {(['geral', 'ponto', 'financeiro', 'ferias', 'documentos'] as TabType[]).map((tab) => (
                <TouchableOpacity 
                  key={tab}
                  onPress={() => { feedback.light(); setActiveTab(tab); }}
                  className={`px-4 py-3 items-center rounded-xl ${activeTab === tab ? 'bg-primary shadow-sm' : ''}`}
                >
                  <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-[9px] font-black uppercase tracking-tight ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === 'geral' && renderGeral()}
        {activeTab === 'ponto' && renderAttendance()}
        {activeTab === 'financeiro' && renderFinanceiro()}
        {activeTab === 'ferias' && renderFerias()}
        {activeTab === 'documentos' && renderDocumentos()}

      </ScrollView>
    </Screen>
  )
}
