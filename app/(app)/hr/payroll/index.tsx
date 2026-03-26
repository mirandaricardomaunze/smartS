import { View, Text, TouchableOpacity, FlatList, TextInput, Alert, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  Printer,
  Calculator,
  Download
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { usePayroll } from '@/features/hr/hooks/usePayroll'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { Employee, Payroll } from '@/features/hr/types'
import { generatePayslipPDF } from '@/features/hr/utils/hrExportUtils'
import { useFormatter } from '@/hooks/useFormatter'
import { feedback } from '@/utils/haptics'
import Animated, { FadeInUp } from 'react-native-reanimated'

export default function PayrollScreen() {
  const router = useRouter()
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [search, setSearch] = useState('')
  const { formatCurrency, getCurrencySymbol } = useFormatter()
  const { payslips, isLoading, processEmployee } = usePayroll({ month, year })
  const { employees, isLoading: loadingEmps } = useEmployees()

  const stats = {
    totalHeadcount: employees.length,
    totalPayroll: payslips.reduce((acc, p) => acc + p.net_salary, 0),
    avgSalary: payslips.length > 0 
      ? payslips.reduce((acc, p) => acc + p.net_salary, 0) / payslips.length 
      : 0
  }

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleProcessAll = () => {
    feedback.medium()
    Alert.alert(
      'Processar Salários',
      `Deseja processar os salários de todos os ${employees.length} funcionários para ${month}/${year}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Processar Agora', 
          onPress: async () => {
            for (const emp of employees) {
              const alreadyProcessed = payslips.some(p => p.employee_id === emp.id)
              if (!alreadyProcessed) {
                await processEmployee(emp)
              }
            }
            feedback.success()
          } 
        }
      ]
    )
  }

  const handlePrint = async (item: Payroll, employee: Employee) => {
    feedback.light()
    try {
      await generatePayslipPDF(item, employee, getCurrencySymbol())
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.')
    }
  }

  const renderEmployeePayroll = ({ item }: { item: Employee }) => {
    const payslip = payslips.find(p => p.employee_id === item.id)
    
    return (
      <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
              {item.name}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tighter mt-0.5">
              {item.position || 'Sem Cargo'}
            </Text>
          </View>

          {payslip ? (
            <View className="items-end">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm">
                {formatCurrency(payslip.net_salary)}
              </Text>
              <View className="flex-row items-center mt-1">
                <Badge variant={payslip.status === 'paid' ? 'success' : 'warning'} label={payslip.status === 'paid' ? 'Pago' : 'Processado'} />
                <TouchableOpacity 
                   onPress={() => handlePrint(payslip, item)}
                   className="ml-2 bg-slate-100 dark:bg-white/10 p-1.5 rounded-lg"
                >
                  <Printer size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => processEmployee(item)}
              className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20"
            >
              <Text className="text-primary font-black text-[10px] uppercase">Processar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    )
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Gestão de Salários" />

      {/* Stats Summary */}
      <View className="px-6 pt-4">
        <Card variant="premium" className="bg-primary p-5 flex-row justify-between items-center border-none">
          <View>
            <Text className="text-white/60 text-[10px] font-bold uppercase mb-1">Total Processado</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl text-white font-black">
              {formatCurrency(payslips.reduce((acc, p) => acc + p.net_salary, 0))}
            </Text>
            <Text className="text-white/80 text-[10px] font-medium mt-1">
              {payslips.length} de {employees.length} funcionários
            </Text>
          </View>
          <View className="bg-white/20 p-3 rounded-2xl">
            <CreditCard size={28} color="white" />
          </View>
        </Card>
      </View>

      {/* Period Selector & Tools */}
      <View className="px-6 py-4 flex-row space-x-2">
        <View className="flex-1 bg-white dark:bg-white/5 rounded-2xl flex-row items-center px-4 border border-slate-100 dark:border-white/10 h-14">
          <Calendar size={20} color="#4f46e5" />
          <Text style={{ fontFamily: 'Inter-Bold' }} className="ml-3 text-slate-900 dark:text-white font-black text-sm uppercase">
            {month}/{year}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/(app)/hr/payroll/inss')}
          className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl items-center justify-center border border-slate-100 dark:border-white/10"
        >
          <ShieldCheck size={20} color="#4f46e5" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleProcessAll}
          className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center border border-primary/20"
        >
          <Calculator size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Employee List */}
      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployeePayroll}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pb-32"
        ListEmptyComponent={
          isLoading || loadingEmps ? (
            <Loading message="A carregar folha de pagamento..." />
          ) : (
            <EmptyState 
              title="Sem resultados"
              description="Nenhum funcionário encontrado."
            />
          )
        }
      />
    </Screen>
  )
}
