import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, useColorScheme } from 'react-native'
import { useBiometrics } from '@/hooks/useBiometrics'
import BiometricLock from '@/components/ui/BiometricLock'
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
  FileText,
  Download,
  Package,
  Share2,
  Mail
} from 'lucide-react-native'
import { reportService } from '@/features/reports/services/reportService'
import { reportRepository } from '@/repositories/reportRepository'
import { db } from '@/database/sqlite'
import { pdfService } from '@/services/pdfService'
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { feedback } from '@/utils/haptics'

import { useFormatter } from '@/hooks/useFormatter'
import { useCompanyStore } from '@/store/companyStore'
import { productsRepository } from '@/repositories/productsRepository'

export default function ReportsScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { formatCurrency } = useFormatter()
  const { activeCompanyId, getActiveCompany } = useCompanyStore()
  const activeCompany = getActiveCompany()

  const [isUnlocked, setIsUnlocked] = useState(false)
  const { authenticateAsync, isSupported, isEnrolled } = useBiometrics()

  useEffect(() => {
    if (isSupported && isEnrolled && !isUnlocked) {
       handleUnlock()
    } else if (!isSupported || !isEnrolled) {
       setIsUnlocked(true)
    }
  }, [isSupported, isEnrolled])

  const handleUnlock = async () => {
     const success = await authenticateAsync('Autenticação Biométrica Necessária')
     if (success) {
       setIsUnlocked(true)
     }
  }
  
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    categories: 0,
    scansToday: 0,
    totalValueCost: 0,
    totalValueSale: 0,
    potentialProfit: 0,
    revenue: 0,
    expenses: 0
  })

  useEffect(() => {
    if (!activeCompanyId) return
    
    try {
      const invData = reportRepository.getInventoryData(activeCompanyId)
      const movData = reportRepository.getMovementsData(activeCompanyId, 1) // Get movements for today
      const finData = reportRepository.getFinancialData(activeCompanyId)
      const pnlData = reportRepository.getPnLData(activeCompanyId)
      
      setStats({
        totalProducts: invData.total_products,
        totalStock: invData.total_stock,
        categories: invData.active_categories.length,
        scansToday: (movData.total_entries || 0) + (movData.total_exits || 0),
        totalValueCost: finData.total_purchase_value,
        totalValueSale: finData.total_sale_value,
        potentialProfit: finData.potential_profit,
        revenue: pnlData.revenue,
        expenses: pnlData.expenses + pnlData.cost
      })
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error)
      useToastStore.getState().show('Erro de base de dados. Verifique a consola.', 'error')
    }
  }, [activeCompanyId])
  
  const handleExportMovements = async () => {
    if (!activeCompanyId) return
    setIsGenerating('movements')
    feedback.light()
    try {
      const movements = reportRepository.getMovementsData(activeCompanyId, 30)
      // Note: reportRepository.getMovementsData returns summary + topMoved + byDay. 
      // We often need the raw list for PDF. Let's assume we need a raw list for a detailed PDF.
      // For now, I'll use the stats provided by reportRepository or query directly if needed.
      // Re-reading reportRepository: it doesn't return the raw list. I should use the repository directly.
      const rawMovements = db.getAllSync<any>(
        'SELECT m.*, p.name as product_name FROM movements m JOIN products p ON m.product_id = p.id WHERE m.company_id = ? ORDER BY m.created_at DESC LIMIT 100',
        [activeCompanyId]
      )
      await pdfService.generateMovementsReport(activeCompany || { name: 'SmartS' }, rawMovements)
      useToastStore.getState().show('Relatório de Movimentos gerado!', 'success')
    } catch (e) {
      useToastStore.getState().show('Erro ao gerar PDF de Movimentos', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleExportExpiry = async () => {
    if (!activeCompanyId) return
    setIsGenerating('expiry')
    feedback.light()
    try {
      const lots = reportRepository.getExpiryData(activeCompanyId)
      await pdfService.generateExpiryReport(activeCompany || { name: 'SmartS' }, lots)
      useToastStore.getState().show('Relatório de Validades gerado!', 'success')
    } catch (e) {
      useToastStore.getState().show('Erro ao gerar PDF de Validades', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleExportSales = async () => {
    if (!activeCompanyId) return
    setIsGenerating('sales')
    feedback.light()
    try {
      const sales = reportRepository.getSalesData(activeCompanyId, 30)
      await pdfService.generateSalesReport(activeCompany || { name: 'SmartS' }, sales)
      useToastStore.getState().show('Histórico de Vendas gerado!', 'success')
    } catch (e) {
      useToastStore.getState().show('Erro ao gerar PDF de Vendas', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleEmailMovements = async () => {
    if (!activeCompanyId) return
    setIsGenerating('email-movements')
    feedback.light()
    try {
      const rawMovements = db.getAllSync<any>(
        'SELECT m.*, p.name as product_name FROM movements m JOIN products p ON m.product_id = p.id WHERE m.company_id = ? ORDER BY m.created_at DESC LIMIT 100',
        [activeCompanyId]
      )
      const html = pdfService.getMovementsReportHtml(activeCompany || { name: 'SmartS' }, rawMovements)
      await pdfService.shareByEmail(html, `Relatório de Movimentos - ${activeCompany?.name}`, 'Relatório de stock em anexo.')
      useToastStore.getState().show('E-mail preparado!', 'success')
    } catch (e: any) {
      useToastStore.getState().show(e.message || 'Erro ao enviar e-mail', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleEmailExpiry = async () => {
    if (!activeCompanyId) return
    setIsGenerating('email-expiry')
    feedback.light()
    try {
      const lots = reportRepository.getExpiryData(activeCompanyId)
      const html = pdfService.getExpiryReportHtml(activeCompany || { name: 'SmartS' }, lots)
      await pdfService.shareByEmail(html, `Relatório de Validades - ${activeCompany?.name}`, 'Relatório de validades em anexo.')
      useToastStore.getState().show('E-mail preparado!', 'success')
    } catch (e: any) {
      useToastStore.getState().show(e.message || 'Erro ao enviar e-mail', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleEmailSales = async () => {
    if (!activeCompanyId) return
    setIsGenerating('email-sales')
    feedback.light()
    try {
      const sales = reportRepository.getSalesData(activeCompanyId, 30)
      const html = pdfService.getSalesReportHtml(activeCompany || { name: 'SmartS' }, sales)
      await pdfService.shareByEmail(html, `Histórico de Vendas - ${activeCompany?.name}`, 'Histórico de vendas em anexo.')
      useToastStore.getState().show('E-mail preparado!', 'success')
    } catch (e: any) {
      useToastStore.getState().show(e.message || 'Erro ao enviar e-mail', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleExportStock = async () => {
    if (!activeCompanyId) return
    setIsGenerating('stock')
    feedback.light()
    
    try {
      const allProducts = productsRepository.getAll(activeCompanyId)
      await pdfService.generateStockReport(activeCompany || { name: 'SmartS Inventário' }, allProducts)
      useToastStore.getState().show('Relatório de Stock gerado!', 'success')
    } catch (e) {
      useToastStore.getState().show('Erro ao gerar PDF de Stock', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleExportFinancial = async () => {
    setIsGenerating('financial')
    feedback.light()
    
    try {
      await pdfService.generateFinancialReport(activeCompany || { name: 'SmartS Financeiro' }, {
        totalIncomes: stats.revenue,
        totalExpenses: stats.expenses
      })
      useToastStore.getState().show('Relatório Financeiro gerado!', 'success')
    } catch (e) {
      useToastStore.getState().show('Erro ao gerar PDF Financeiro', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleEmailStock = async () => {
    if (!activeCompanyId) return
    setIsGenerating('email-stock')
    feedback.light()
    
    try {
      const allProducts = productsRepository.getAll(activeCompanyId)
      const html = pdfService.getStockReportHtml(activeCompany || { name: 'SmartS Inventário' }, allProducts)
      await pdfService.shareByEmail(
        html, 
        `Relatório de Stock - ${activeCompany?.name || 'SmartS'}`,
        'Em anexo o relatório de stock atualizado.'
      )
      useToastStore.getState().show('E-mail preparado!', 'success')
    } catch (e: any) {
      useToastStore.getState().show(e.message || 'Erro ao enviar e-mail', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleEmailFinancial = async () => {
    setIsGenerating('email-financial')
    feedback.light()
    
    try {
      const html = pdfService.getFinancialReportHtml(activeCompany || { name: 'SmartS Financeiro' }, {
        totalIncomes: stats.revenue,
        totalExpenses: stats.expenses
      })
      await pdfService.shareByEmail(
        html, 
        `Relatório Financeiro - ${activeCompany?.name || 'SmartS'}`,
        'Em anexo o relatório financeiro dos últimos 30 dias.'
      )
      useToastStore.getState().show('E-mail preparado!', 'success')
    } catch (e: any) {
      useToastStore.getState().show(e.message || 'Erro ao enviar e-mail', 'error')
    } finally {
      setIsGenerating(null)
    }
  }

  const ReportCard = ({ 
    title, 
    subtitle, 
    icon, 
    onShare,
    onEmail, 
    isExporting = false,
    color = "indigo" 
  }: { 
    title: string, 
    subtitle: string, 
    icon: React.ReactNode, 
    onShare: () => void,
    onEmail?: () => void,
    isExporting?: boolean,
    color?: "indigo" | "emerald" | "violet" | "sky"
  }) => {
    const bgColor = isDark 
      ? `bg-${color}-500/10` 
      : `bg-${color}-50`
      
    const iconBg = isDark
      ? `bg-${color}-500/20`
      : `bg-white`

    return (
      <View className="mb-4">
        <Card variant="premium" className={`p-4 border-slate-100 dark:border-white/5 ${bgColor}`}>
          <View className="flex-row items-center">
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${iconBg} shadow-sm border border-slate-100 dark:border-white/10`}>
              {icon}
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">{title}</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs">{subtitle}</Text>
            </View>
            
            <View className="flex-row space-x-2">
              <TouchableOpacity 
                onPress={onShare} 
                disabled={isExporting}
                className="w-10 h-10 rounded-full bg-indigo-500 items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Share2 size={18} color="white" />
                )}
              </TouchableOpacity>

              {onEmail && (
                <TouchableOpacity 
                  onPress={onEmail} 
                  disabled={isExporting}
                  className="w-10 h-10 rounded-full bg-slate-800 dark:bg-white items-center justify-center shadow-lg shadow-slate-500/20"
                >
                  <Mail size={18} color={isDark ? "#0f172a" : "white"} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>
      </View>
    )
  }

  if (!isUnlocked) {
     return <BiometricLock onRetry={handleUnlock} title="Relatórios" />
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
                        <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: 'Inter-Black' }} className="text-4xl font-black text-white">{String(stats.totalProducts)}</Text>
                     </View>
                    <View className="h-full w-[1px] bg-white/10" />
                    <View>
                       <View className="flex-row items-center mb-2">
                          <Database size={12} color="#818cf8" className="mr-2" />
                          <Text className="text-indigo-200/60 text-[10px] font-black uppercase tracking-widest">Unidades</Text>
                       </View>
                        <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: 'Inter-Black' }} className="text-4xl font-black text-white">{String(stats.totalStock)}</Text>
                     </View>
                     <View className="h-full w-[1px] bg-white/10" />
                     <View className="items-end">
                        <View className="flex-row items-center mb-2">
                           <Scan size={12} color="#818cf8" className="mr-2" />
                           <Text className="text-indigo-200/60 text-[10px] font-black uppercase tracking-widest">Atividade (Hoje)</Text>
                        </View>
                        <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: 'Inter-Black' }} className="text-4xl font-black text-white">{String(stats.scansToday)}</Text>
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
                       <Text adjustsFontSizeToFit numberOfLines={1} className="text-slate-900 dark:text-white font-black text-base flex-1 text-right ml-2">{formatCurrency(stats.totalValueCost)}</Text>
                    </View>
                    <View className="h-[1px] bg-slate-100 dark:bg-slate-800" />
                    <View className="flex-row justify-between items-center">
                       <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Venda Potencial</Text>
                       <Text adjustsFontSizeToFit numberOfLines={1} className="text-slate-900 dark:text-white font-black text-base flex-1 text-right ml-2">{formatCurrency(stats.totalValueSale)}</Text>
                    </View>
                    <View className="h-[1px] bg-slate-100 dark:bg-slate-800" />
                    <View className="flex-row justify-between items-center">
                       <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase">Lucro Projetado</Text>
                       <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <Text adjustsFontSizeToFit numberOfLines={1} className="text-emerald-600 dark:text-emerald-400 font-black text-base">{formatCurrency(stats.potentialProfit)}</Text>
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
            title="Relatório de Stock"
            subtitle="Inventário completo em PDF"
            icon={<Package size={24} color="#6366f1" />}
            onShare={handleExportStock}
            onEmail={handleEmailStock}
            isExporting={isGenerating === 'stock' || isGenerating === 'email-stock'}
            color="indigo"
          />

          <ReportCard
            title="Fluxo de Caixa"
            subtitle="Extrato financeiro mensal"
            icon={<TrendingUp size={24} color="#8b5cf6" />}
            onShare={handleExportFinancial}
            onEmail={handleEmailFinancial}
            isExporting={isGenerating === 'financial' || isGenerating === 'email-financial'}
            color="violet"
          />

          <ReportCard 
            title="Movimentação"
            subtitle="Resumo de entradas e saídas (30 dias)"
            icon={<TrendingUp size={24} color="#10b981" />}
            onShare={handleExportMovements}
            onEmail={handleEmailMovements}
            isExporting={isGenerating === 'movements' || isGenerating === 'email-movements'}
            color="emerald"
          />

          <ReportCard 
            title="Validades"
            subtitle="Relatório de itens próximos do vencimento"
            icon={<CalendarDays size={24} color="#f59e0b" />}
            onShare={handleExportExpiry}
            onEmail={handleEmailExpiry}
            isExporting={isGenerating === 'expiry' || isGenerating === 'email-expiry'}
            color="violet"
          />
          
          <ReportCard 
            title="Histórico de Vendas"
            subtitle="Documento consolidado de pedidos"
            icon={<Receipt size={24} color="#4f46e5" />}
            onShare={handleExportSales}
            onEmail={handleEmailSales}
            isExporting={isGenerating === 'sales' || isGenerating === 'email-sales'}
            color="indigo"
          />

          <ReportCard
            title="Lista de Fornecedores"
            subtitle="Contactos e dados fiscais"
            icon={<FileText size={24} color="#10b981" />}
            onShare={() => useToastStore.getState().show('Disponível brevemente', 'info')}
            color="emerald"
          />

          <ReportCard
            title="Atividade de Utilizadores"
            subtitle="Auditoria de ações no sistema"
            icon={<Download size={24} color="#0ea5e9" />}
            onShare={() => useToastStore.getState().show('Disponível brevemente', 'info')}
            color="sky"
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
