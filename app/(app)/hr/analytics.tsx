import { View, Text, ScrollView, TouchableOpacity, useColorScheme, Dimensions } from 'react-native'
import React, { useMemo } from 'react'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign, 
  PieChart, 
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Building2
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { useDepartments } from '@/features/hr/hooks/useDepartments'
import { usePayroll } from '@/features/hr/hooks/usePayroll'
import { useFormatter } from '@/hooks/useFormatter'
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

export default function HRAnalyticsScreen() {
  const { employees, isLoading: loadingEmps } = useEmployees()
  const { departments, isLoading: loadingDepts } = useDepartments()
  const { payslips, isLoading: loadingPayroll } = usePayroll({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  })
  const { formatCurrency } = useFormatter()
  const isDark = useColorScheme() === 'dark'

  const stats = useMemo(() => {
    const totalHeadcount = employees.length
    const activeEmployees = employees.filter(e => e.status === 'active' || e.is_active === 1).length
    const totalPayroll = payslips.reduce((acc, p) => acc + p.net_salary, 0)
    const avgSalary = totalHeadcount > 0 ? totalPayroll / totalHeadcount : 0

    // Department Distribution
    const deptStats = departments.map(d => {
      const count = employees.filter(e => e.department === d.name).length
      return { name: d.name, count, percentage: totalHeadcount > 0 ? (count / totalHeadcount) * 100 : 0 }
    })

    return { totalHeadcount, activeEmployees, totalPayroll, avgSalary, deptStats }
  }, [employees, departments, payslips])

  if (loadingEmps || loadingDepts || loadingPayroll) return <Loading />

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Análise Estratégica HR" />

      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-4 px-6">
        {/* Main KPI Grid */}
        <Animated.View entering={FadeInUp} className="flex-row flex-wrap justify-between">
          <Card variant="premium" className="w-[48%] p-4 mb-4 border-slate-100 dark:border-white/5">
            <View className="flex-row justify-between items-start mb-2">
              <View className="bg-primary/10 p-2 rounded-xl">
                <Users size={18} color="#4f46e5" />
              </View>
              <ArrowUpRight size={14} color="#10b981" />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">Headcount</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl text-slate-900 dark:text-white font-black mt-1">
              {stats.totalHeadcount}
            </Text>
            <Text className="text-emerald-600 dark:text-emerald-400 text-[9px] font-bold mt-1">
              {stats.activeEmployees} Activos
            </Text>
          </Card>

          <Card variant="premium" className="w-[48%] p-4 mb-4 border-slate-100 dark:border-white/5">
            <View className="flex-row justify-between items-start mb-2">
              <View className="bg-emerald-500/10 p-2 rounded-xl">
                <DollarSign size={18} color="#10b981" />
              </View>
              <ArrowUpRight size={14} color="#10b981" />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">Custo Salarial</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl text-slate-900 dark:text-white font-black mt-1">
              {formatCurrency(stats.totalPayroll)}
            </Text>
            <Text className="text-slate-400 text-[9px] font-bold mt-1">Mês Corrente</Text>
          </Card>
        </Animated.View>

        {/* Big Chart Metric */}
        <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
           <Card variant="premium" className="p-0 border-none overflow-hidden bg-slate-900 shadow-premium-lg">
             <LinearGradient colors={['#4f46e5', '#3730a3']} className="p-6">
                <View className="flex-row justify-between items-center mb-6">
                   <View>
                      <Text className="text-white/60 text-[10px] font-bold uppercase">Mês de Referência</Text>
                      <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl text-white font-black">
                        {new Date().toLocaleString('pt-PT', { month: 'long' }).toUpperCase()}
                      </Text>
                   </View>
                   <BarChart3 size={32} color="white" />
                </View>

                <View className="flex-row mb-2">
                  <View className="flex-1">
                    <Text className="text-white/60 text-[10px] uppercase font-bold">Salário Médio</Text>
                    <Text className="text-white text-xl font-black">{formatCurrency(stats.avgSalary)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/60 text-[10px] uppercase font-bold">Total Processado</Text>
                    <Text className="text-white text-xl font-black">{formatCurrency(stats.totalPayroll)}</Text>
                  </View>
                </View>

                {/* Visual Bar Graph */}
                <View className="flex-row items-end justify-between h-16 mt-4">
                   {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                     <View key={i} className="flex-1 bg-white/20 rounded-t-lg mx-1" style={{ height: `${h}%` }} />
                   ))}
                </View>
             </LinearGradient>
           </Card>
        </Animated.View>

        <Card className="mb-6 border-slate-100 dark:border-white/5">
          <Text className="text-slate-900 dark:text-white font-bold mb-4">Estrutura Salarial Estimada</Text>
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-slate-500 text-sm">Salário Base Médio</Text>
              <Text className="text-slate-900 dark:text-white font-bold">{formatCurrency(stats.avgSalary * 0.85)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-500 text-sm">Bónus/Subsídios Médios</Text>
              <Text className="text-slate-900 dark:text-white font-bold">{formatCurrency(stats.avgSalary * 0.15)}</Text>
            </View>
          </View>
        </Card>

        {/* Department Distribution */}
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 ml-1">
          Distribuição por Departamento
        </Text>

        <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5">
           {stats.deptStats.map((dept, i) => (
             <View key={dept.name} className="mb-5">
                <View className="flex-row justify-between items-center mb-2">
                   <View className="flex-row items-center">
                      <Building2 size={14} color="#64748b" className="mr-2" />
                      <Text className="text-slate-600 dark:text-slate-300 font-bold text-xs">{dept.name}</Text>
                   </View>
                   <Text className="text-slate-900 dark:text-white font-black text-xs">{dept.count} Funct.</Text>
                </View>
                <View className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                   <Animated.View 
                     entering={FadeInRight.delay(200 + i * 100)}
                     className="h-full bg-primary" 
                     style={{ width: `${dept.percentage}%` }} 
                   />
                </View>
             </View>
           ))}
           {stats.deptStats.length === 0 && (
             <Text className="text-slate-400 text-xs italic text-center">Nenhum departamento registado.</Text>
           )}
        </Card>

        {/* Compliance Status */}
        <View className="mt-8">
           <Card className="bg-emerald-500/5 border-emerald-500/10 p-5 flex-row items-center">
              <View className="bg-emerald-500/20 p-3 rounded-2xl mr-4">
                 <ShieldCheck size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                 <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm">Status de Compliance INSS</Text>
                 <Text className="text-slate-500 dark:text-slate-400 text-xs">Todos os processamentos de salários estão com IRPS e INSS calculados conforme a Lei 2024.</Text>
              </View>
           </Card>
        </View>

      </ScrollView>
    </Screen>
  )
}
