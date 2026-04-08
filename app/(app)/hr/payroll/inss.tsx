import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import {
  ShieldCheck,
  Calendar,
  Download,
  FileText,
  Users,
  Building2,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import { usePayroll } from '@/features/hr/hooks/usePayroll'
import { useFormatter } from '@/hooks/useFormatter'
import { feedback } from '@/utils/haptics'
import { generateINSSReportPDF } from '@/features/hr/utils/hrExportUtils'
import Animated, { FadeInUp } from 'react-native-reanimated'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function INSSReportScreen() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const isCurrentOrFuture =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1)

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const handleNextMonth = () => {
    if (isCurrentOrFuture) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const { formatCurrency } = useFormatter()
  const { getINSSData, lockPeriod, payslips, isLoading, countryConfig } = usePayroll({ month, year })
  const inssData = getINSSData()

  const { tax } = countryConfig
  const totalRate = ((tax.socialSecurity.employeeRate + tax.socialSecurity.employerRate) * 100).toFixed(1)
  const empRate = (tax.socialSecurity.employeeRate * 100).toFixed(1)
  const emplRate = (tax.socialSecurity.employerRate * 100).toFixed(1)

  const allPaid = payslips.length > 0 && payslips.every(p => p.status === 'paid')

  const handleLock = () => {
    feedback.heavy()
    Alert.alert(
      'Confirmar Pagamentos',
      `Confirmar todos os ${payslips.length} salários de ${MONTH_NAMES[month - 1]} ${year}? Esta acção vai bloquear o período.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar e Bloquear',
          onPress: async () => {
            await lockPeriod()
            feedback.success()
            Alert.alert('Concluído', 'Período bloqueado com sucesso.')
          }
        }
      ]
    )
  }

  const handleExportPDF = async () => {
    feedback.medium()
    try {
      if (!inssData) return
      await generateINSSReportPDF(inssData, month, year, countryConfig)
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o relatório PDF.')
    }
  }

  if (isLoading) return <Loading />

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title={tax.socialSecurity.reportTitle} />

      <ScrollView className="flex-1" contentContainerClassName="pb-32 px-6">
        {/* Selector de Período */}
        <Card variant="glass" className="p-4 flex-row items-center justify-between mb-6 mt-4">
          <TouchableOpacity
            onPress={handlePrevMonth}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
          >
            <ChevronLeft size={20} color="#6366f1" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Calendar size={16} color="#6366f1" />
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white text-sm uppercase tracking-widest mx-3">
              {MONTH_NAMES[month - 1]} {year}
            </Text>
            <Badge variant={allPaid ? 'success' : 'warning'} label={allPaid ? 'Bloqueado' : 'Aberto'} />
          </View>

          <TouchableOpacity
            onPress={handleNextMonth}
            disabled={isCurrentOrFuture}
            className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center ${isCurrentOrFuture ? 'opacity-30' : ''}`}
          >
            <ChevronRight size={20} color="#6366f1" />
          </TouchableOpacity>
        </Card>

        {!inssData ? (
          <Card variant="premium" className="p-6 items-center border-slate-100 dark:border-white/5">
            <ShieldCheck size={40} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-3 text-center">
              Sem dados para {MONTH_NAMES[month - 1]} {year}.{'\n'}Processe primeiro os salários.
            </Text>
          </Card>
        ) : (
          <>
            {/* Estatísticas Globais */}
            <Animated.View entering={FadeInUp} className="space-y-4">
              <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5 bg-indigo-500">
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
                      Total {tax.socialSecurity.employeeLabel} ({totalRate}%)
                    </Text>
                    <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl text-white font-black">
                      {formatCurrency(inssData.total_inss)}
                    </Text>
                  </View>
                  <View className="bg-white/10 p-3 rounded-2xl">
                    <ShieldCheck size={32} color="white" />
                  </View>
                </View>
              </Card>

              <View className="flex-row">
                <Card variant="premium" className="flex-1 p-4 border-slate-100 dark:border-white/5 mr-3">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">
                    {tax.socialSecurity.employeeLabel} ({empRate}%)
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-base">
                    {formatCurrency(inssData.total_inss_employee)}
                  </Text>
                  <Text className="text-slate-400 text-[9px] mt-1">Retido ao colaborador</Text>
                </Card>
                <Card variant="premium" className="flex-1 p-4 border-slate-100 dark:border-white/5">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">
                    {tax.socialSecurity.employerLabel} ({emplRate}%)
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-base">
                    {formatCurrency(inssData.inss_employer)}
                  </Text>
                  <Text className="text-slate-400 text-[9px] mt-1">Contribuição patronal</Text>
                </Card>
              </View>
            </Animated.View>

            {/* Sumário */}
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 mt-8 ml-1">
              Sumário do Período
            </Text>

            <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5">
              <View className="flex-row justify-between items-center border-b border-slate-50 dark:border-white/5 pb-3 mb-4">
                <View className="flex-row items-center">
                  <Users size={16} color="#64748b" />
                  <Text className="text-slate-600 dark:text-slate-300 font-medium ml-3">Colaboradores Processados</Text>
                </View>
                <Text className="text-slate-900 dark:text-white font-black">{inssData.employee_count}</Text>
              </View>

              <View className="flex-row justify-between items-center border-b border-slate-50 dark:border-white/5 pb-3 mb-4">
                <View className="flex-row items-center">
                  <Building2 size={16} color="#64748b" />
                  <Text className="text-slate-600 dark:text-slate-300 font-medium ml-3">Total Salário Base</Text>
                </View>
                <Text className="text-slate-900 dark:text-white font-black">{formatCurrency(inssData.total_base)}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <FileText size={16} color="#64748b" />
                  <Text className="text-slate-600 dark:text-slate-300 font-medium ml-3">{tax.incomeTax.label} (Retido)</Text>
                </View>
                <Text className="text-slate-900 dark:text-white font-black">{formatCurrency(inssData.total_irps)}</Text>
              </View>
            </Card>

            {/* Acções */}
            <View className="mt-8">
              {!allPaid ? (
                <Button
                  title="Bloquear Período e Confirmar Pagamentos"
                  icon={<Lock size={18} color="white" />}
                  onPress={handleLock}
                  variant="primary"
                  className="mb-3"
                />
              ) : (
                <View className="bg-emerald-500/10 p-4 rounded-2xl flex-row items-center border border-emerald-500/20 mb-3">
                  <ShieldCheck size={20} color="#10b981" />
                  <Text className="text-emerald-700 dark:text-emerald-400 font-bold text-sm ml-3">
                    Este período está bloqueado e os recibos finalizados.
                  </Text>
                </View>
              )}

              <Button
                title={`Exportar Declaração ${tax.socialSecurity.employeeLabel} (PDF)`}
                icon={<Download size={18} color="#4f46e5" />}
                onPress={handleExportPDF}
                variant="ghost"
                className="border border-primary/20"
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
