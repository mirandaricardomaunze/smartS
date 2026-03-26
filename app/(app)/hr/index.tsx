import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from 'react-native'
import React, { useMemo } from 'react'
import { useRouter } from 'expo-router'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  Users, 
  Building2, 
  Briefcase, 
  Clock, 
  CreditCard, 
  ChevronRight,
  GraduationCap,
  CalendarCheck2,
  AlertCircle,
  BarChart3,
  ShieldCheck
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { feedback } from '@/utils/haptics'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { useDepartments } from '@/features/hr/hooks/useDepartments'
import { LinearGradient } from 'expo-linear-gradient'

export default function HRDashboard() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  const { employees, isLoading: loadingEmps } = useEmployees()
  const { departments, isLoading: loadingDepts } = useDepartments()

  const hrModules = useMemo(() => [
    {
      id: 'employees',
      title: 'Funcionários',
      subtitle: 'Gestão de perfis e contratos',
      icon: <Users size={22} color="#10b981" />,
      route: '/(app)/hr/employees',
      color: 'emerald'
    },
    {
      id: 'attendance',
      title: 'Registo de Ponto',
      subtitle: 'Assiduidade e horários',
      icon: <Clock size={22} color="#0ea5e9" />,
      route: '/(app)/hr/attendance',
      color: 'sky'
    },
    {
      id: 'payroll',
      title: 'Salários e Recibos',
      subtitle: 'Processamento e IRPS/INSS',
      icon: <CreditCard size={22} color="#8b5cf6" />,
      route: '/(app)/hr/payroll',
      color: 'violet'
    },
    {
      id: 'leaves',
      title: 'Férias e Faltas',
      subtitle: 'Pedidos e autorizações',
      icon: <CalendarCheck2 size={22} color="#f59e0b" />,
      route: '/(app)/hr/leaves',
      color: 'amber'
    },
    {
      id: 'org',
      title: 'Estrutura Org.',
      subtitle: 'Departamentos e cargos',
      icon: <Building2 size={22} color="#4f46e5" />,
      route: '/(app)/hr/organization',
      color: 'indigo'
    },
    {
      id: 'analytics',
      title: 'Análise Estratégica',
      subtitle: 'Headcount e custos',
      icon: <BarChart3 size={22} color="#f43f5e" />,
      route: '/(app)/hr/analytics',
      color: 'rose'
    }
  ], [])

  const handleAction = (route: string) => {
    feedback.light()
    router.push(route as any)
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Recursos Humanos" />
      
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-20 pt-4">
        {/* Stats Summary */}
        <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
          <Card variant="glass" className="overflow-hidden p-0 border-none">
            <LinearGradient
              colors={isDark ? ['#1e293b', '#0f172a'] : ['#f1f5f9', '#ffffff']}
              className="p-5"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                    Total de Funcionários
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-3xl text-slate-900 dark:text-white font-black">
                    {loadingEmps ? '...' : employees.length}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mr-2">
                      {departments.length} Departamentos
                    </Text>
                  </View>
                </View>
                <View className="bg-emerald-500/10 p-3 rounded-2xl">
                  <Briefcase size={32} color="#10b981" />
                </View>
              </View>
            </LinearGradient>
          </Card>
        </Animated.View>

        {/* Quick Actions Grid */}
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 ml-1">
          Gestão de Capital Humano
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {hrModules.map((item, index) => {
            const colors: Record<string, string> = {
              emerald: 'bg-emerald-500/10 border-emerald-500/20',
              sky: 'bg-sky-500/10 border-sky-500/20',
              violet: 'bg-violet-500/10 border-violet-500/20',
              amber: 'bg-amber-500/10 border-amber-500/20',
              indigo: 'bg-indigo-500/10 border-indigo-500/20',
              rose: 'bg-rose-500/10 border-rose-500/20'
            }
            const iconBgs: Record<string, string> = {
              emerald: 'bg-emerald-500/20',
              sky: 'bg-sky-500/20',
              violet: 'bg-violet-500/20',
              amber: 'bg-amber-500/20',
              indigo: 'bg-indigo-500/20',
              rose: 'bg-rose-500/20'
            }

            return (
              <Animated.View 
                key={item.id} 
                entering={FadeInUp.delay(200 + index * 50)}
                className="w-[48%] mb-4"
              >
                <TouchableOpacity onPress={() => handleAction(item.route)}>
                  <Card variant="premium" className={`p-4 items-center justify-center min-h-[150px] ${colors[item.color]}`}>
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${iconBgs[item.color]} shadow-premium-sm`}>
                      {item.icon}
                    </View>
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-xs text-center">
                      {item.title}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-[9px] mt-1 text-center" numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </View>

        {/* Active Alerts */}
        <View className="mt-4">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 ml-1">
            Alertas e Monitoria
          </Text>
          
          {employees.filter(e => {
            if (!e.contract_end_date) return false
            const end = new Date(e.contract_end_date)
            const diff = (end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            return diff > 0 && diff <= 30
          }).map((emp, i) => (
            <Animated.View key={emp.id} entering={FadeInUp.delay(500 + i * 100)}>
              <Card className="bg-amber-500/5 border-amber-500/10 p-4 flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center mr-3">
                  <AlertCircle size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm">
                    Expiração de Contrato
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    O contrato de <Text className="font-bold text-slate-700 dark:text-white">{emp.name}</Text> expira em breve ({emp.contract_end_date}).
                  </Text>
                </View>
                <ChevronRight size={18} color="#94a3b8" />
              </Card>
            </Animated.View>
          ))}

          <Card className="bg-indigo-500/5 border-indigo-500/10 p-4 flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
              <ShieldCheck size={20} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm">
                Segurança Biométrica
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                O sistema de ponto está protegido por autenticação local.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  )
}
