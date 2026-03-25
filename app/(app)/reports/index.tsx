import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, useColorScheme } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import { 
  FileBarChart, 
  HardDriveDownload, 
  TrendingUp, 
  CalendarDays, 
  FileDown, 
  Box, 
  Layers, 
  Database,
  ArrowRight,
  Scan,
  Receipt,
  History
} from 'lucide-react-native'
import { reportService } from '@/features/reports/services/reportService'
import { reportRepository } from '@/repositories/reportRepository'
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { feedback } from '@/utils/haptics'

import { useFormatter } from '@/hooks/useFormatter'
import { useCompanyStore } from '@/store/companyStore'

export default function ReportsScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { formatCurrency } = useFormatter()
  const { activeCompanyId } = useCompanyStore()
  
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    categories: 0,
    scansToday: 0,
    totalValueCost: 0,
    totalValueSale: 0,
    potentialProfit: 0
  })

  useEffect(() => {
    if (!activeCompanyId) return
    
    const invData = reportRepository.getInventoryData()
    const movData = reportRepository.getMovementsData(1) // Get movements for today
    const finData = reportRepository.getFinancialData(activeCompanyId)
    
    setStats({
      totalProducts: invData.total_products,
      totalStock: invData.total_stock,
      categories: invData.active_categories.length,
      scansToday: (movData.total_entries || 0) + (movData.total_exits || 0),
      totalValueCost: finData.total_purchase_value,
      totalValueSale: finData.total_sale_value,
      potentialProfit: finData.potential_profit
    })
  }, [activeCompanyId])
  
  const handleExport = async (type: string) => {
    feedback.light()
    try {
      setIsGenerating(type)
      if (type === 'Stock Atual') {
        await reportService.generateInventoryReport()
      } else if (type === 'Movimentação') {
        await reportService.generateMovementsReport()
      } else if (type === 'Validades') {
        await reportService.generateExpiryReport()
      } else if (type === 'Vendas') {
        await reportService.generateSalesReport()
      } else if (type === 'Financeiro') {
        await reportService.generateFinancialReport()
      } else {
        useToastStore.getState().show('Funcionalidade Web: Explore análises avançadas no PC.', 'info')
      }
    } catch (e) {
      useToastStore.getState().show('Não foi possível gerar o PDF. Verifique os dados.', 'error')
      console.error(e)
    } finally {
      setIsGenerating(null)
    }
  }

  const ReportCard = ({ icon, title, description, color, onPress, index }: any) => {
    const colorMap: Record<string, string> = {
      primary: 'bg-primary/10 border-primary/20 text-primary',
      emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
      amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
    }
    
    const activeColor = colorMap[color] || colorMap.primary
    
    return (
      <Animated.View entering={FadeInUp.delay(600 + index * 100)}>
        <TouchableOpacity 
          onPress={onPress} 
          className="mb-4"
          disabled={!!isGenerating}
        >
          <Card variant="premium" className="flex-row items-center p-4 rounded-[28px] bg-white dark:bg-slate-900">
            <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${activeColor} bg-opacity-10 shadow-premium-sm`}>
               {icon}
            </View>
            <View className="flex-1">
               <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">{title}</Text>
               <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mt-1 leading-4">{description}</Text>
            </View>
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
               {isGenerating === title ? (
                 <ActivityIndicator size="small" color={isDark ? "white" : "#6366f1"} />
               ) : (
                 <FileDown size={18} color={isDark ? "white" : "#6366f1"} />
               )}
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Relatórios" showBack />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 20 }}>
        {/* Executive Summary Overhaul */}
        <View className="px-6 mb-8">
            <Animated.View entering={FadeInDown.duration(800)}>
              <LinearGradient
                colors={isDark ? ['#1e1b4b', '#0f172a'] : ['#4f46e5', '#6366f1']} 
                className="p-8 rounded-[40px] shadow-premium-lg border border-white/10 overflow-hidden"
              >
                 <View className="flex-row items-center justify-between mb-8">
                    <View>
                       <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-white tracking-tighter">Resumo</Text>
                       <Text className="text-white/70 font-bold text-[10px] uppercase tracking-[2px] mt-1">Estado do Negócio</Text>
                    </View>
                    <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20">
                       <FileBarChart size={24} color="white" />
                    </View>
                 </View>

                 <View className="flex-row justify-between mb-8">
                    <View>
                       <View className="flex-row items-center mb-2">
                          <Box size={12} color="#818cf8" className="mr-2" />
                          <Text className="text-indigo-200/60 text-[10px] font-black uppercase tracking-widest">Produtos</Text>
                       </View>
                        <Text style={{ fontFamily: 'Inter-Black' }} className="text-4xl font-black text-white">{String(stats.totalProducts)}</Text>
                     </View>
                    <View className="h-full w-[1px] bg-white/10" />
                    <View>
                       <View className="flex-row items-center mb-2">
                          <Database size={12} color="#818cf8" className="mr-2" />
                          <Text className="text-indigo-200/60 text-[10px] font-black uppercase tracking-widest">Unidades</Text>
                       </View>
                        <Text style={{ fontFamily: 'Inter-Black' }} className="text-4xl font-black text-white">{String(stats.totalStock)}</Text>
                     </View>
                     <View className="h-full w-[1px] bg-white/10" />
                     <View className="items-end">
                        <View className="flex-row items-center mb-2">
                           <Scan size={12} color="#818cf8" className="mr-2" />
                           <Text className="text-indigo-200/60 text-[10px] font-black uppercase tracking-widest">Atividade (Hoje)</Text>
                        </View>
                        <Text style={{ fontFamily: 'Inter-Black' }} className="text-4xl font-black text-white">{String(stats.scansToday)}</Text>
                     </View>
                 </View>

                  <View className="bg-white/10 p-4 rounded-2xl flex-row items-center border border-white/10">
                    <TrendingUp size={16} color="#34d399" />
                    <Text className="text-white/90 text-xs font-semibold ml-3 flex-1">Relatórios precisos baseados na sincronização local.</Text>
                  </View>
              </LinearGradient>
            </Animated.View>
        </View>

        {/* New Performance Finance Card */}
        <View className="px-6 mb-8">
           <Animated.View entering={FadeInDown.delay(200)}>
              <Card variant="glass" glassIntensity={10} className="p-6 border-slate-200/50 dark:border-slate-800/50 shadow-premium-sm">
                 <View className="flex-row items-center mb-6">
                    <View className="w-10 h-10 bg-emerald-500/10 rounded-xl items-center justify-center mr-3">
                       <TrendingUp size={20} color="#10b981" />
                    </View>
                    <View>
                       <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tighter">Performance Financeira</Text>
                       <Text className="text-slate-400 text-[10px] font-bold">Valoração Baseada no Stock</Text>
                    </View>
                 </View>

                 <View className="space-y-4">
                    <View className="flex-row justify-between items-center">
                       <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Valor em Stock (Custo)</Text>
                       <Text className="text-slate-900 dark:text-white font-black text-base">{formatCurrency(stats.totalValueCost)}</Text>
                    </View>
                    <View className="h-[1px] bg-slate-100 dark:bg-slate-800" />
                    <View className="flex-row justify-between items-center">
                       <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Venda Potencial</Text>
                       <Text className="text-slate-900 dark:text-white font-black text-base">{formatCurrency(stats.totalValueSale)}</Text>
                    </View>
                    <View className="h-[1px] bg-slate-100 dark:bg-slate-800" />
                    <View className="flex-row justify-between items-center">
                       <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase">Lucro Projetado</Text>
                       <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <Text className="text-emerald-600 dark:text-emerald-400 font-black text-base">{formatCurrency(stats.potentialProfit)}</Text>
                       </View>
                    </View>
                 </View>
              </Card>
           </Animated.View>
        </View>

        {/* Actionable Report Cards */}
        <View className="px-6 mb-10">
           <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-5 ml-2">Exportações PDF</Text>
           
           <ReportCard 
            title="Stock Atual"
            description="Inventário completo com valor estimado"
            icon={<HardDriveDownload size={24} color="#4f46e5" />}
            color="primary"
            index={0}
            onPress={() => handleExport('Stock Atual')}
          />

          <ReportCard 
            title="Movimentação"
            description="Resumo de entradas e saídas (30 dias)"
            icon={<TrendingUp size={24} color="#10b981" />}
            color="emerald"
            index={1}
            onPress={() => handleExport('Movimentação')}
          />

          <ReportCard 
            title="Validades"
            description="Relatório de itens próximos do vencimento"
            icon={<CalendarDays size={24} color="#f59e0b" />}
            color="amber"
            index={2}
            onPress={() => handleExport('Validades')}
          />
          
          <ReportCard 
            title="Vendas"
            description="Histórico detalhado das encomendas"
            icon={<Receipt size={24} color="#4f46e5" />}
            color="primary"
            index={3}
            onPress={() => handleExport('Vendas')}
          />

          <ReportCard 
            title="Financeiro"
            description="Resumo de lucros e despesas mensais"
            icon={<TrendingUp size={24} color="#6366f1" />}
            color="indigo"
            index={4}
            onPress={() => handleExport('Financeiro')}
          />

          <ReportCard 
            title="Relatórios de Scanner"
            description="Histórico de atividades e scans efetuados"
            icon={<Scan size={24} color="#8b5cf6" />}
            color="indigo"
            index={5}
            onPress={() => handleExport('Relatórios de Scanner')}
          />
        </View>

        {/* Pro Tip - Premium Style */}
         <Animated.View entering={FadeInUp.delay(1000)} className="px-6 mb-8">
            <View className="bg-indigo-500/10 p-6 rounded-[32px] border border-indigo-500/20 flex-row">
               <View className="w-10 h-10 bg-indigo-500/20 rounded-full items-center justify-center mr-4">
                  <ArrowRight size={18} color={isDark ? "#818cf8" : "#4f46e5"} />
               </View>
               <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase mb-1 tracking-widest">Dica de Gestão</Text>
                   <Text className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                     Exportações em formato Excel (XLSX) para auditorias externas estão disponíveis no separador Definições.
                   </Text>
               </View>
            </View>
         </Animated.View>
      </ScrollView>
    </Screen>
  )
}
