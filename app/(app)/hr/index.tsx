import { View, Text, TouchableOpacity, ScrollView, useColorScheme, Dimensions } from 'react-native'
import React, { useMemo } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BackButton from '@/components/ui/BackButton'
import PlanGate from '@/components/ui/PlanGate'
import {
  Users,
  Building2,
  Clock,
  CreditCard,
  ChevronRight,
  CalendarCheck2,
  AlertCircle,
  BarChart3,
  ShieldCheck,
  UserCheck,
  LayoutGrid
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { feedback } from '@/utils/haptics'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { useDepartments } from '@/features/hr/hooks/useDepartments'
import { useAttendance } from '@/features/hr/hooks/useAttendance'
import { LinearGradient } from 'expo-linear-gradient'
import { ProgressChart } from 'react-native-chart-kit'
import IconButton from '@/components/ui/IconButton'

const SCREEN_WIDTH = Dimensions.get('window').width

function HRDashboardContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  const { employees, isLoading: loadingEmps } = useEmployees()
  const { departments } = useDepartments()
  const { attendance, isLoading: loadingAttendance } = useAttendance()

  // Calculate Dashboard Metrics
  const metrics = useMemo(() => {
    const total = employees.length
    const present = attendance.filter(a => a.clock_in).length
    const rate = total > 0 ? present / total : 0
    const missing = total - present
    
    // Dept distribution
    const deptStats: Record<string, number> = {}
    employees.forEach(emp => {
      const deptName = emp.department || 'Sem Dep.'
      deptStats[deptName] = (deptStats[deptName] || 0) + 1
    })

    return { total, present, rate, missing, deptStats }
  }, [employees, attendance])

  const expiringContracts = useMemo(() => {
    const now = new Date().getTime()
    return employees.filter(e => {
      if (!e.contract_end_date) return false
      const diff = (new Date(e.contract_end_date).getTime() - now) / (1000 * 60 * 60 * 24)
      return diff > 0 && diff <= 30
    })
  }, [employees])

  const chartConfig = {
    backgroundGradientFrom: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
    color: (opacity = 1) => isDark ? `rgba(99, 102, 241, ${opacity})` : `rgba(79, 70, 229, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
      fontFamily: 'Inter-Bold'
    }
  }

  const hrModules = useMemo(() => [
    {
      id: 'employees',
      title: 'Funcionários',
      subtitle: 'Gestão de perfis e contratos',
      icon: <Users size={24} color="#10b981" />,
      route: '/(app)/hr/employees',
      color: 'emerald',
      bgClass: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
    },
    {
      id: 'attendance',
      title: 'Assiduidade',
      subtitle: 'Controlo de ponto e horários',
      icon: <Clock size={24} color="#0ea5e9" />,
      route: '/(app)/hr/attendance',
      color: 'sky',
      bgClass: 'bg-sky-50 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20',
    },
    {
      id: 'payroll',
      title: 'Salários e Recibos',
      subtitle: 'Processamento e IRPS/INSS',
      icon: <CreditCard size={24} color="#8b5cf6" />,
      route: '/(app)/hr/payroll',
      color: 'violet',
      bgClass: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20',
    },
    {
      id: 'leaves',
      title: 'Férias e Faltas',
      subtitle: 'Pedidos e autorizações',
      icon: <CalendarCheck2 size={24} color="#f59e0b" />,
      route: '/(app)/hr/leaves',
      color: 'amber',
      bgClass: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
    },
    {
      id: 'org',
      title: 'Estrutura Org.',
      subtitle: 'Departamentos e cargos',
      icon: <Building2 size={24} color="#4f46e5" />,
      route: '/(app)/hr/organization',
      color: 'indigo',
      bgClass: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20',
    },
    {
      id: 'analytics',
      title: 'Análise Estratégica',
      subtitle: 'Headcount e custos',
      icon: <BarChart3 size={24} color="#f43f5e" />,
      route: '/(app)/hr/analytics',
      color: 'rose',
      bgClass: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20',
    },
  ], [])

  const handleAction = (route: string) => {
    feedback.light()
    router.push(route as any)
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop: Math.max(insets.top, 16) }} className="px-6 pb-6 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <View className="flex-row items-center">
          <View className="mr-4">
            <BackButton variant="glass" />
          </View>
          <View className="flex-1">
             <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Painel Operacional</Text>
             <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white text-xl font-black">Recursos Humanos</Text>
          </View>
          <IconButton 
            icon={LayoutGrid} 
            onPress={() => router.push("/(app)/modules")} 
          />
        </View>
      </View>
      
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium KPI Header */}
        <Animated.View entering={FadeInUp.delay(100)} className="px-6 mt-8">
          <LinearGradient 
            colors={isDark ? ["#1e293b", "#0f172a"] : ["#4f46e5", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-8 rounded-[32px] overflow-hidden shadow-premium-lg border border-white/10"
          >
            <View className="flex-row justify-between items-start mb-6">
              <View className="bg-white/20 p-3 rounded-2xl"><Users size={24} color="white" /></View>
              <View className="bg-white/20 px-4 py-2 rounded-full border border-white/30">
                <Text style={{ fontFamily: "Inter-Bold" }} className="text-white text-[10px] uppercase tracking-widest">Ativos</Text>
              </View>
            </View>
            <Text className="text-white/70 text-sm mb-1">Total de Colaboradores</Text>
            <View className="flex-row items-baseline">
              <Text style={{ fontFamily: "Inter-Black" }} className="text-white text-4xl">{loadingEmps ? '...' : metrics.total}</Text>
              <Text className="text-white/60 text-sm ml-2 font-bold">{departments.length} Departamentos</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Real-time KPIs Line */}
        <View className="px-6 mt-6 flex-row">
          <Card variant="glass" className="flex-1 mr-4 p-5 rounded-[32px]">
            <View className="flex-row items-center justify-between mb-3">
              <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center">
                <UserCheck size={20} color="#4f46e5" />
              </View>
              <Text className="text-primary font-black text-[10px]">{Math.round(metrics.rate * 100)}%</Text>
            </View>
            <Text className="text-[10px] uppercase font-bold text-slate-400 mb-1">Presentes Hoje</Text>
            <Text style={{ fontFamily: "Inter-Black" }} className="text-slate-900 dark:text-white text-lg">{loadingAttendance ? '...' : metrics.present}</Text>
          </Card>

          <Card variant="glass" className="flex-1 p-5 rounded-[32px]">
            <View className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 items-center justify-center mb-3">
              <Clock size={20} color="#f59e0b" />
            </View>
            <Text className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ausentes / Em Falta</Text>
            <Text style={{ fontFamily: "Inter-Black" }} className="text-amber-600 text-lg">{metrics.missing}</Text>
          </Card>
        </View>

        {/* Analytics Section */}
        <View className="mt-10 px-6">
           <Text style={{ fontFamily: "Inter-Bold" }} className="text-sm uppercase tracking-widest text-slate-400 mb-4">Análise de Assiduidade</Text>
           <Card variant="premium" className="p-6 rounded-[32px] items-center">
              <ProgressChart
                data={{ data: [metrics.rate] }}
                width={SCREEN_WIDTH - 96}
                height={160}
                strokeWidth={16}
                radius={60}
                chartConfig={{
                  ...chartConfig,
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`
                }}
                hideLegend={false}
              />
              <View className="absolute inset-0 items-center justify-center pt-8">
                <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl text-indigo-600 font-black">{Math.round(metrics.rate * 100)}%</Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase">Taxa de Presença</Text>
              </View>
           </Card>
        </View>

        <View className="mt-8 px-6">
           <Text style={{ fontFamily: "Inter-Bold" }} className="text-sm uppercase tracking-widest text-slate-400 mb-4">Atalhos de Gestão</Text>
           <View className="flex-row flex-wrap justify-between">
              {hrModules.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleAction(item.route)}
                  className="w-[30%] items-center mb-6"
                >
                  <View className={`w-16 h-16 rounded-[24px] items-center justify-center border ${item.bgClass} shadow-sm`}>
                    {item.icon}
                  </View>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-800 dark:text-slate-300 text-[10px] font-bold mt-2 text-center" numberOfLines={1}>
                    {item.title.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        {/* Alerts & Monitoria */}
        <View className="mt-4 px-6">
          <Text style={{ fontFamily: "Inter-Bold" }} className="text-sm uppercase tracking-widest text-slate-400 mb-4">Alertas e Monitoria</Text>
          
          <View className="bg-white dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-white/10 overflow-hidden shadow-premium-sm">
            {expiringContracts.length > 0 ? (
              expiringContracts.map((emp) => (
                <TouchableOpacity key={emp.id} className="p-5 flex-row items-center border-b border-slate-50 dark:border-slate-800/50">
                  <View className="w-10 h-10 rounded-2xl bg-amber-500/10 items-center justify-center mr-4">
                    <AlertCircle size={20} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm">Contrato a Expirar</Text>
                    <Text className="text-slate-500 text-xs mt-0.5">{emp.name} — até {emp.contract_end_date}</Text>
                  </View>
                  <ChevronRight size={16} color="#cbd5e1" />
                </TouchableOpacity>
              ))
            ) : null}

            {expiringContracts.length === 0 && (
              <View className="p-5 flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-emerald-500/10 items-center justify-center mr-4">
                  <ShieldCheck size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm">Sem Alertas</Text>
                  <Text className="text-slate-500 text-xs mt-0.5">Nenhum contrato a expirar nos próximos 30 dias.</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default function HRDashboard() {
  return (
    <PlanGate
      feature="hasHR"
      requiredPlan="PRO"
      message="O módulo de Recursos Humanos requer o plano PRO ou superior."
    >
      <HRDashboardContent />
    </PlanGate>
  )
}
