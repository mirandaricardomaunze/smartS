import { View, Text, ScrollView, useColorScheme } from 'react-native'
import React, { useMemo } from 'react'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import {
  Users,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Briefcase,
  UserCheck,
  UserX,
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { useDepartments } from '@/features/hr/hooks/useDepartments'
import { usePayroll } from '@/features/hr/hooks/usePayroll'
import { useFormatter } from '@/hooks/useFormatter'
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Efectivos',
  'fixed-term': 'A Prazo',
  probation: 'Experiência',
}

export default function HRAnalyticsScreen() {
  const { employees, isLoading: loadingEmps } = useEmployees()
  const { departments, isLoading: loadingDepts } = useDepartments()
  const { payslips, isLoading: loadingPayroll } = usePayroll({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })
  const { formatCurrency } = useFormatter()
  const isDark = useColorScheme() === 'dark'

  const stats = useMemo(() => {
    const totalHeadcount = employees.length
    const activeEmployees = employees.filter(e => e.status === 'active' && e.is_active === 1).length
    const suspendedEmployees = employees.filter(e => e.status === 'suspended').length
    const terminatedEmployees = employees.filter(e => e.status === 'terminated').length

    const totalPayroll = payslips.reduce((acc, p) => acc + p.net_salary, 0)
    const totalGross = payslips.reduce((acc, p) => acc + p.base_salary, 0)
    const avgSalary = payslips.length > 0 ? totalPayroll / payslips.length : 0
    const totalINSS = payslips.reduce((acc, p) => acc + p.deduction_inss, 0)
    const totalIRPS = payslips.reduce((acc, p) => acc + p.deduction_irps, 0)

    // Distribuição por departamento (dados reais)
    const deptStats = departments.map(d => {
      const count = employees.filter(e => e.department === d.name).length
      return {
        name: d.name,
        count,
        percentage: totalHeadcount > 0 ? (count / totalHeadcount) * 100 : 0,
      }
    }).filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count)

    // Distribuição por tipo de contrato (dados reais)
    const contractTypes: Record<string, number> = {}
    employees.forEach(e => {
      contractTypes[e.employment_type] = (contractTypes[e.employment_type] || 0) + 1
    })

    // Contratos a expirar nos próximos 30 dias
    const now = Date.now()
    const expiringContracts = employees.filter(e => {
      if (!e.contract_end_date) return false
      const diff = (new Date(e.contract_end_date).getTime() - now) / (1000 * 60 * 60 * 24)
      return diff > 0 && diff <= 30
    })

    return {
      totalHeadcount, activeEmployees, suspendedEmployees, terminatedEmployees,
      totalPayroll, totalGross, avgSalary, totalINSS, totalIRPS,
      deptStats, contractTypes, expiringContracts,
    }
  }, [employees, departments, payslips])

  if (loadingEmps || loadingDepts || loadingPayroll) return <Loading />

  const now = new Date()
  const monthLabel = now.toLocaleString('pt-PT', { month: 'long', year: 'numeric' })

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Análise Estratégica RH" />

      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-4 px-6">

        {/* KPI Grid — Headcount */}
        <Animated.View entering={FadeInUp} className="flex-row flex-wrap justify-between mb-4">
          <KPICard
            icon={<Users size={18} color="#4f46e5" />}
            iconBg="bg-primary/10"
            label="Total Colaboradores"
            value={stats.totalHeadcount}
            sub={`${stats.activeEmployees} activos`}
            subColor="text-emerald-600"
          />
          <KPICard
            icon={<UserCheck size={18} color="#10b981" />}
            iconBg="bg-emerald-500/10"
            label="Activos"
            value={stats.activeEmployees}
            sub={`${stats.totalHeadcount > 0 ? Math.round(stats.activeEmployees / stats.totalHeadcount * 100) : 0}% do total`}
            subColor="text-slate-400"
          />
          <KPICard
            icon={<DollarSign size={18} color="#8b5cf6" />}
            iconBg="bg-violet-500/10"
            label="Custo Salarial"
            value={formatCurrency(stats.totalPayroll)}
            sub={monthLabel}
            subColor="text-slate-400"
          />
          <KPICard
            icon={<Briefcase size={18} color="#f59e0b" />}
            iconBg="bg-amber-500/10"
            label="Salário Médio"
            value={formatCurrency(stats.avgSalary)}
            sub={`${payslips.length} processados`}
            subColor="text-slate-400"
          />
        </Animated.View>

        {/* Resumo de Deduções */}
        {payslips.length > 0 && (
          <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
            <LinearGradient
              colors={isDark ? ['#1e293b', '#0f172a'] : ['#4f46e5', '#6366f1']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              className="p-6 rounded-[28px] overflow-hidden"
            >
              <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4">
                Resumo Fiscal — {monthLabel}
              </Text>
              <View className="flex-row">
                <View className="flex-1">
                  <Text className="text-white/60 text-[9px] uppercase font-bold">Salário Base Total</Text>
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-white text-base">{formatCurrency(stats.totalGross)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white/60 text-[9px] uppercase font-bold">INSS (Trabalhadores)</Text>
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-white text-base">{formatCurrency(stats.totalINSS)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white/60 text-[9px] uppercase font-bold">IRPS Retido</Text>
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-white text-base">{formatCurrency(stats.totalIRPS)}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Distribuição por Departamento */}
        {stats.deptStats.length > 0 && (
          <>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3 ml-1">
              Por Departamento
            </Text>
            <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5 mb-6">
              {stats.deptStats.map((dept, i) => (
                <View key={dept.name} className={i < stats.deptStats.length - 1 ? 'mb-5' : ''}>
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      <Building2 size={14} color="#64748b" />
                      <Text className="text-slate-600 dark:text-slate-300 font-bold text-xs ml-2">{dept.name}</Text>
                    </View>
                    <Text className="text-slate-900 dark:text-white font-black text-xs">
                      {dept.count} func. ({Math.round(dept.percentage)}%)
                    </Text>
                  </View>
                  <View className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <Animated.View
                      entering={FadeInRight.delay(200 + i * 80)}
                      className="h-full bg-primary"
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Distribuição por Tipo de Contrato */}
        {Object.keys(stats.contractTypes).length > 0 && (
          <>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3 ml-1">
              Por Tipo de Contrato
            </Text>
            <View className="flex-row flex-wrap mb-6">
              {Object.entries(stats.contractTypes).map(([type, count]) => (
                <View key={type} className="mr-3 mb-3 bg-white dark:bg-white/5 rounded-2xl px-4 py-3 border border-slate-100 dark:border-white/10">
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white text-lg font-black">{count}</Text>
                  <Text className="text-slate-400 text-[9px] font-bold uppercase">{EMPLOYMENT_TYPE_LABELS[type] ?? type}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Alertas — Contratos a expirar */}
        {stats.expiringContracts.length > 0 && (
          <>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3 ml-1">
              Contratos a Expirar (30 dias)
            </Text>
            <Card variant="premium" className="p-4 border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 mb-6">
              {stats.expiringContracts.map((emp, i) => (
                <View key={emp.id} className={`flex-row items-center ${i < stats.expiringContracts.length - 1 ? 'mb-3' : ''}`}>
                  <View className="w-8 h-8 rounded-xl bg-amber-500/20 items-center justify-center mr-3">
                    <Briefcase size={14} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm font-bold">{emp.name}</Text>
                    <Text className="text-amber-600 text-[10px] font-bold">Expira: {emp.contract_end_date}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Compliance */}
        <Card className="bg-emerald-500/5 border-emerald-500/10 p-5 flex-row items-center">
          <View className="bg-emerald-500/20 p-3 rounded-2xl mr-4">
            <ShieldCheck size={24} color="#10b981" />
          </View>
          <View className="flex-1">
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm">Conformidade Fiscal</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              INSS e IRPS calculados automaticamente conforme tabelas vigentes.
            </Text>
          </View>
        </Card>

      </ScrollView>
    </Screen>
  )
}

// ─── Sub-componente KPI ───────────────────────────────────────────────────────

function KPICard({
  icon, iconBg, label, value, sub, subColor,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string | number
  sub: string
  subColor: string
}) {
  return (
    <Card variant="premium" className="w-[48%] p-4 mb-4 border-slate-100 dark:border-white/5">
      <View className={`${iconBg} p-2 rounded-xl self-start mb-2`}>{icon}</View>
      <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">{label}</Text>
      <Text style={{ fontFamily: 'Inter-Black' }} className="text-lg text-slate-900 dark:text-white font-black mt-1">
        {value}
      </Text>
      <Text className={`${subColor} text-[9px] font-bold mt-1`}>{sub}</Text>
    </Card>
  )
}
