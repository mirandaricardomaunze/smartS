import React, { useMemo, useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { useAuthStore } from '@/features/auth/store/authStore'
import Screen from '@/components/layout/Screen'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import Skeleton from '@/components/ui/Skeleton'
import { StatusBar } from 'expo-status-bar'
import {
  Package,
  AlertTriangle,
  Plus,
  ScanLine,
  ChevronRight,
  Bell,
  Activity,
  Users,
  Building2,
  LayoutDashboard,
  PieChart as PieChartIcon,
  TrendingUp,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  User,
  Wallet,
  Receipt,
  CalendarClock,
  History as HistoryIcon
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useNotificationStore } from '@/features/notifications/store/notificationStore'
import { notificationService } from '@/features/notifications/services/notificationService'
import { BarChart, ProgressChart, PieChart }
  from 'react-native-chart-kit'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated'
import { feedback } from '@/utils/haptics'
import TenantSwitcher from '@/features/dashboard/components/TenantSwitcher'
import { useCompanyStore } from '@/store/companyStore'
import { useFormatter } from '@/hooks/useFormatter'
import { useFinance } from '@/features/finance/hooks/useFinance'
import ExpenseFormModal from '@/features/finance/components/ExpenseFormModal'
import { hasPermission } from '@/utils/permissions'
import { intelligenceService, StockForecast, ABCAnalysis } from '@/services/intelligenceService'

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const {
    stats,
    stockHealth,
    salesPerformance,
    bestSellers,
    lowStockAlerts,
    isLoading
  } = useDashboard()

  const { user } = useAuthStore()
  const { unreadCount, fetchNotifications } = useNotificationStore()
  const { activeCompanyId, companies } = useCompanyStore()
  const [tenantSwitcherVisible, setTenantSwitcherVisible] = useState(false)
  const { stats: financeStats, fetchFinance, createTransaction } = useFinance()
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [stockForecast, setStockForecast] = useState<StockForecast[]>([])
  const [abcAnalysis, setAbcAnalysis] = useState<ABCAnalysis[]>([])

  const activeCompany = useMemo(() =>
    companies.find(c => c.id === activeCompanyId) || { name: 'Empresa Padrão' },
    [activeCompanyId, companies]
  )

  useEffect(() => {
    async function initNotifications() {
      await notificationService.checkLowStockAlerts()
      await notificationService.checkExpiryAlerts()
      await fetchNotifications()
      
      const forecast = intelligenceService.getStockForecast()
      const abc = intelligenceService.getABCAnalysis()
      setStockForecast(forecast)
      setAbcAnalysis(abc)
    }
    initNotifications()
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchFinance()
    setRefreshing(false)
  }, [fetchFinance])

  useEffect(() => {
    fetchFinance()
  }, [fetchFinance])

  const { formatCurrency } = useFormatter()

  const chartConfig = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientFrom: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(99, 102, 241, ${opacity})` : `rgba(79, 70, 229, ${opacity})`, // Indigo
    labelColor: (opacity = 1) => isDark ? `rgba(241, 245, 249, ${opacity})` : `rgba(71, 85, 105, ${opacity})`, // Slate-50 / Slate-600
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: isDark ? '#6366f1' : '#4f46e5' },
    barPercentage: 0.5,
  }

  if (isLoading) return <Loading />

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader={false} noSafeTop>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Soft Premium Header Section */}
        <View className="bg-indigo-600 dark:bg-slate-950 overflow-hidden rounded-b-[30px]">
            <LinearGradient
            colors={isDark ? ['#1e1b4b', '#0f172a'] : ['#4f46e5', '#4338ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: insets.top + 20 }}
            className="px-6 pb-10 rounded-b-[40px] shadow-premium-lg"
          >
            <View className="flex-row justify-between items-center mb-10">
               <TouchableOpacity
                 onPress={() => {
                   feedback.light()
                   setTenantSwitcherVisible(true)
                 }}
                 className="flex-row items-center bg-white/10 px-4 py-2.5 rounded-full border border-white/20"
               >
                 <Building2 size={14} color="white" className="mr-2" />
                 <Text className="text-white text-[11px] font-bold uppercase tracking-widest ml-2 mr-2">
                   {activeCompany.name}
                 </Text>
                 <ChevronRight size={12} color="white" />
               </TouchableOpacity>

               <TouchableOpacity
                 onPress={() => {
                   feedback.light()
                   router.push('/(app)/notifications')
                 }}
                 className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20"
               >
                 <Bell size={22} color="white" />
                  {unreadCount > 0 ? (
                    <View className="absolute top-[-2] right-[-2] w-5 h-5 bg-indigo-500 rounded-full border-2 border-[#4f46e5] items-center justify-center">
                       <Text className="text-[8px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  ) : null}
               </TouchableOpacity>
            </View>

            <Animated.View entering={FadeInDown}>
              <Text className="text-white/80 font-semibold text-lg mt-1">
                Resumo de Atividade
              </Text>
            </Animated.View>
          </LinearGradient>
        </View>
        {/* Premium Dashboard Metrics Hub */}
        {/* Premium Dashboard Metrics Hub */}
        <View className="px-6 mt-6">
            <Card variant="premium" className="w-full p-6 rounded-[32px] mb-4">
                <View className="flex-row justify-between items-center mb-4">
                  <View className="w-12 h-12 bg-indigo-500/20 rounded-2xl items-center justify-center">
                    <Activity size={24} color="#6366f1" />
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-1">Receita Total</Text>
                    <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(salesPerformance.revenue)}
                    </Text>
                  </View>
                </View>
            </Card>
            
            <View className="flex-row justify-between">
              <Card variant="premium" className="w-[48%] p-6 rounded-[32px]">
                  <View className="w-12 h-12 bg-rose-500/20 rounded-2xl items-center justify-center mb-4">
                    <ArrowDownRight size={24} color="#f43f5e" />
                  </View>
                  <Text className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-1">Despesas</Text>
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white" numberOfLines={1}>
                    {formatCurrency(financeStats.expense)}
                  </Text>
              </Card>

              <Card variant="premium" className="w-[48%] p-6 rounded-[32px]">
                  <View className="w-12 h-12 bg-emerald-500/20 rounded-2xl items-center justify-center mb-4">
                    <TrendingUp size={24} color="#10b981" />
                  </View>
                  <Text className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-1">Lucro Líquido</Text>
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white" numberOfLines={1}>
                    {formatCurrency(salesPerformance.profit)}
                  </Text>
              </Card>
            </View>
        </View>

        {/* Proactive Insights Section */}
        {stockForecast.length > 0 && (
          <View className="px-6 mt-10">
            <View className="flex-row items-center justify-between mb-4">
               <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Insights Proativos</Text>
               <TouchableOpacity onPress={() => router.push('/(app)/control')}>
                  <Text className="text-indigo-400 text-xs font-bold">Ver BI</Text>
               </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
                {stockForecast.map((item, index) => (
                  <Card key={index} variant="premium" className="w-64 p-5 mr-4 rounded-[24px] border-indigo-500/10 dark:border-indigo-500/5">
                     <View className="flex-row items-center mb-3">
                        <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${item.days_remaining <= 3 ? 'bg-rose-500/20' : 'bg-amber-500/20'}`}>
                           <CalendarClock size={16} color={item.days_remaining <= 3 ? '#f43f5e' : '#f59e0b'} />
                        </View>
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${item.days_remaining <= 3 ? 'text-rose-500' : 'text-amber-500'}`}>
                          Ruptura Iminente
                        </Text>
                     </View>
                     <Text className="text-slate-900 dark:text-white font-bold text-sm mb-2" numberOfLines={1}>{item.name}</Text>
                     <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-4">
                       Com base na média de vendas, o stock atual de <Text className="font-black text-slate-900 dark:text-white">{item.current_stock}</Text> esgotará em aprox. <Text className="font-black text-slate-900 dark:text-white">{item.days_remaining} dias</Text>.
                     </Text>
                  </Card>
                ))}
                
                {abcAnalysis.filter(a => a.classification === 'A').slice(0, 3).map((item, index) => (
                   <Card key={`abc-${index}`} variant="premium" className="w-64 p-5 mr-4 rounded-[24px] border-emerald-500/10 dark:border-emerald-500/5">
                      <View className="flex-row items-center mb-3">
                         <View className="w-8 h-8 bg-emerald-500/20 rounded-xl items-center justify-center mr-3">
                            <TrendingUp size={16} color="#10b981" />
                         </View>
                         <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Produto Estrela (A)</Text>
                      </View>
                      <Text className="text-slate-900 dark:text-white font-bold text-sm mb-2" numberOfLines={1}>{item.name}</Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-4">
                        Representa <Text className="font-black text-emerald-500">{item.percentage.toFixed(1)}%</Text> da faturação total mensal. Garanta sempre stock deste item!
                      </Text>
                   </Card>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Sales Chart Section */}
        <View className="px-6 mt-10">
           <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Receita de Vendas</Text>
              <View className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  <Text className="text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase">Últimos 7 dias</Text>
              </View>
           </View>

           <Card className="bg-white/90 dark:bg-slate-900/40 border border-slate-100 dark:border-white/10 p-4 items-center shadow-lg rounded-[24px]">
              <BarChart
                data={{
                  labels: salesPerformance.volumeLabels.length > 0 ? salesPerformance.volumeLabels : ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
                  datasets: [{ data: salesPerformance.volumeData.length > 0 ? salesPerformance.volumeData : [0, 0, 0, 0, 0, 0, 0] }]
                }}
                width={Dimensions.get('window').width - 80}
                height={180}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                fromZero
                showValuesOnTopOfBars={false}
                flatColor={true}
                withInnerLines={false}
                style={{ borderRadius: 16 }}
              />
           </Card>
        </View>

        {/* Stock Health Circular Chart Section */}
        <View className="px-6 mt-10">
           <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Saúde do Estoque</Text>
              <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">Estado Local</Text>
              </View>
           </View>

           <Card className="bg-white/90 dark:bg-slate-900/40 border border-slate-100 dark:border-white/10 p-4 items-center shadow-lg rounded-[24px]">
              <PieChart
                data={[
                  {
                    name: 'Bom',
                    population: stockHealth.exato,
                    color: '#10b981',
                    legendFontColor: isDark ? '#f8fafc' : '#475569',
                    legendFontSize: 12
                  },
                  {
                    name: 'Crítico',
                    population: stockHealth.faltas,
                    color: '#f59e0b',
                    legendFontColor: isDark ? '#f8fafc' : '#475569',
                    legendFontSize: 12
                  },
                  {
                    name: 'Esgotado',
                    population: stockHealth.sobras,
                    color: '#ef4444',
                    legendFontColor: isDark ? '#f8fafc' : '#475569',
                    legendFontSize: 12
                  },
                ]}
                width={Dimensions.get('window').width - 60}
                height={180}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
              />
           </Card>
        </View>

        {/* Best Sellers Section */}
        <View className="px-6 mt-10">
           <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-4">Mais Vendidos</Text>
           <Card className="bg-white/90 dark:bg-slate-900/40 border border-slate-100 dark:border-white/10 p-4 shadow-lg rounded-[24px]">
               {bestSellers.length > 0 ? bestSellers.map((item, index) => (
                 <View key={index} className={`flex-row items-center justify-between py-3 ${index !== bestSellers.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full items-center justify-center mr-3">
                           <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                           <Text className="text-slate-900 dark:text-white font-bold text-sm" numberOfLines={1}>{item.name}</Text>
                           <Text className="text-slate-500 dark:text-slate-100 text-[10px] font-bold">{item.quantity} unidades vendidas</Text>
                        </View>
                    </View>
                    <Text className="text-emerald-400 font-black text-xs">{formatCurrency(item.revenue)}</Text>
                 </View>
               )) : (
                 <Text className="text-slate-500 text-sm py-4 text-center">Nenhuma venda registada</Text>
               )}
           </Card>
        </View>

        {/* Low Stock (MinStock) Alerts */}
        <View className="px-6 mt-10">
           <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Alertas de Stock</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/notifications')}>
                 <Text className="text-indigo-400 text-xs font-bold">Ver todos</Text>
              </TouchableOpacity>
           </View>

           <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
               {lowStockAlerts.length > 0 ? lowStockAlerts.map((prod, index) => (
                <Card key={index} className="w-52 bg-white dark:bg-slate-900 border border-red-500/20 p-4 mr-4 shadow-md">
                   <View className="flex-row items-center mb-3">
                      <View className="w-6 h-6 bg-red-500/20 rounded-full items-center justify-center mr-2">
                        <AlertTriangle size={12} color="#ef4444" />
                      </View>
                      <Text className="text-red-500 dark:text-red-400 text-[10px] font-bold uppercase">Stock Crítico</Text>
                   </View>
                   <Text className="text-slate-900 dark:text-white font-bold text-sm mb-1" numberOfLines={1}>{prod.name}</Text>
                    <View className="flex-row items-center justify-between mt-2">
                         <View>
                            <Text className="text-slate-500 dark:text-slate-200 text-[8px] font-black uppercase tracking-tighter">Atual</Text>
                            <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white font-black text-xs">{prod.current_stock}</Text>
                         </View>
                         <View className="items-end">
                            <Text className="text-slate-500 dark:text-slate-200 text-[8px] font-black uppercase tracking-tighter">Mínimo</Text>
                            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-500 dark:text-slate-100 font-bold text-xs">{prod.minimum_stock}</Text>
                         </View>
                    </View>
                </Card>
               )) : (
                <Card className="w-full bg-white dark:bg-slate-900 border border-emerald-500/20 p-6 items-center flex-row justify-center shadow-md">
                   <View className="w-8 h-8 bg-emerald-500/10 rounded-full items-center justify-center mr-3">
                    <CheckCircle2 size={18} color="#10b981" />
                   </View>
                   <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Stock em níveis ideais</Text>
                </Card>
              )}
           </ScrollView>
        </View>

        {/* Quick Access Grid */}
        <View className="px-6 mt-12 mb-10">
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-6">Ações Rápidas</Text>
            
            <View className="gap-y-4">
                {hasPermission(user?.role || 'viewer', 'create_notes') && (
                  <TouchableOpacity 
                    onPress={() => { feedback.light(); router.push('/(app)/orders/create') }}
                    className="flex-row items-center w-full bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm"
                  >
                    <View className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl items-center justify-center mr-4 border border-emerald-100 dark:border-emerald-800">
                      <Plus size={24} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">Nova Venda</Text>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Registar saída de stock e faturação</Text>
                    </View>
                    <ChevronRight size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}

                {hasPermission(user?.role || 'viewer', 'create_notes') && (
                  <TouchableOpacity 
                    onPress={() => { feedback.light(); router.push('/(app)/pos') }}
                    className="flex-row items-center w-full bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm"
                  >
                    <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl items-center justify-center mr-4 border border-indigo-100 dark:border-indigo-800">
                      <ScanLine size={24} color="#6366f1" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">Frente de Caixa (PDV)</Text>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Venda rápida profissional com código de barras</Text>
                    </View>
                    <ChevronRight size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}

                {hasPermission(user?.role || 'viewer', 'create_notes') && (
                  <TouchableOpacity 
                    onPress={() => { feedback.light(); setIsExpenseModalVisible(true) }}
                    className="flex-row items-center w-full bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm"
                  >
                    <View className="w-12 h-12 bg-rose-50 dark:bg-rose-900/10 rounded-2xl items-center justify-center mr-4 border border-rose-100 dark:border-rose-800">
                      <Receipt size={24} color="#f43f5e" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">Registar Despesa</Text>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Controle de gastos e pagamentos</Text>
                    </View>
                    <ChevronRight size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  onPress={() => { feedback.light(); router.push('/(app)/scanner') }}
                  className="flex-row items-center w-full bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-white/10 shadow-sm"
                >
                  <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl items-center justify-center mr-4 border border-indigo-100 dark:border-indigo-800">
                    <ScanLine size={24} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">Scanner Inteligente</Text>
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Consultar ou adicionar via código</Text>
                  </View>
                  <ChevronRight size={18} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => { feedback.light(); router.push('/(app)/expiry') }}
                  className="flex-row items-center w-full bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-white/10 shadow-sm"
                >
                  <View className="w-12 h-12 bg-amber-50 dark:bg-amber-900/10 rounded-2xl items-center justify-center mr-4 border border-amber-100 dark:border-amber-800">
                    <CalendarClock size={24} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">Alertas de Validade</Text>
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Monitorizar vencimentos próximos</Text>
                  </View>
                  <ChevronRight size={18} color="#94a3b8" />
                </TouchableOpacity>

                {hasPermission(user?.role || 'viewer', 'view_reports') && (
                   <TouchableOpacity 
                      onPress={() => { feedback.light(); router.push('/(app)/reports') }}
                      className="flex-row items-center w-full bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-white/10 shadow-sm"
                    >
                      <View className="w-12 h-12 bg-blue-50 dark:bg-blue-900/10 rounded-2xl items-center justify-center mr-4 border border-blue-100 dark:border-blue-800">
                        <BarChart3 size={24} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">Relatórios PDF</Text>
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Exportar dados de vendas e stock</Text>
                      </View>
                      <ChevronRight size={18} color="#94a3b8" />
                   </TouchableOpacity>
                )}

                {hasPermission(user?.role || 'viewer', 'view_history') && (
                  <TouchableOpacity 
                    onPress={() => { feedback.light(); router.push('/(app)/history') }}
                    className="flex-row items-center w-full bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm"
                  >
                    <View className="w-12 h-12 bg-slate-50 dark:bg-slate-900/10 rounded-2xl items-center justify-center mr-4 border border-slate-100 dark:border-slate-800">
                      <HistoryIcon size={24} color="#64748b" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">Histórico de Auditoria</Text>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rastrear todas as ações do sistema</Text>
                    </View>
                    <ChevronRight size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity 
              onPress={() => { feedback.light(); router.push('/(app)/control') }}
              className="w-full h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[24px] items-center justify-center flex-row shadow-lg mt-8"
            >
              <LayoutDashboard size={20} color={isDark ? '#6366f1' : '#4f46e5'} className="mr-3" />
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">Painel de Controlo</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>

      <TenantSwitcher
        visible={tenantSwitcherVisible}
        onClose={() => setTenantSwitcherVisible(false)}
      />

      {/* Expense Modal */}
      <ExpenseFormModal
        visible={isExpenseModalVisible}
        onClose={() => setIsExpenseModalVisible(false)}
        onSubmit={async (data) => { await createTransaction(data) }}
      />
    </Screen>
  )
}
