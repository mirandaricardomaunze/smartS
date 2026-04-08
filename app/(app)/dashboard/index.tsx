import React, { useMemo, useEffect, useState, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, RefreshControl } from "react-native"
import { TrendingUp, Package, AlertTriangle, Plus, QrCode, ShoppingCart, PieChart as PieIcon, Calendar, Wallet, Users as UsersIcon, LayoutGrid, History as HistoryIcon, Sparkles, Rocket, BarChart3, Brain, Building2 } from "lucide-react-native"
import { router } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useDashboard } from "@/features/dashboard/hooks/useDashboard"
import { useCompanyStore } from "@/store/companyStore"
import { useCompany } from "@/features/dashboard/hooks/useCompany"
import { useFormatter } from "@/hooks/useFormatter"
import { useFinance } from "@/features/finance/hooks/useFinance"
import { useIntelligence } from "@/hooks/useIntelligence"
import { useNotificationStore } from "@/features/notifications/store/notificationStore"
import { notificationService } from "@/features/notifications/services/notificationService"
import { LinearGradient } from "expo-linear-gradient"
import Animated from "react-native-reanimated"
import Loading from "@/components/ui/Loading"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import { feedback } from "@/utils/haptics"
import TenantSwitcher from "@/features/dashboard/components/TenantSwitcher"
import TrialBanner from "@/components/ui/TrialBanner"
import { useSubscription } from "@/hooks/useSubscription"
import NotificationBell from "@/features/notifications/components/NotificationBell"
import { usePermissions } from "@/hooks/usePermissions"

import FinancialTrendChart from "@/features/dashboard/components/FinancialTrendChart"
import InventoryValueChart from "@/features/dashboard/components/InventoryValueChart"
import AttendanceTrendChart from "@/features/dashboard/components/AttendanceTrendChart"

export default function DashboardScreen() {
  const { can } = usePermissions()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { stats, bestSellers, lowStockAlerts, inventoryValue, financialTrends, attendanceMetrics, todaySummary, isLoading: isDashLoading } = useDashboard()
  const { user } = useAuthStore()
  const { fetchNotifications } = useNotificationStore()
  const { activeCompanyId, companies, setActiveCompany } = useCompanyStore()
  const [tenantSwitcherVisible, setTenantSwitcherVisible] = useState(false)
  const { fetchFinance } = useFinance()
  const [refreshing, setRefreshing] = useState(false)
  const { forecast, abcData, refresh: refreshIntel } = useIntelligence()
  const { sub, isLoading: isSubLoading } = useSubscription()

  const isLoading = isDashLoading || isSubLoading
  const activeCompany = useMemo(() => {
    if (!companies || !activeCompanyId) return { name: "Nenhuma Empresa" }
    return companies.find(c => c.id === activeCompanyId) || { name: "Empresa..." }
  }, [companies, activeCompanyId])

  const { refreshCompanies } = useCompany()

  useEffect(() => {
    // Super Admin global initialization
    if (user?.role === 'super_admin') {
      refreshCompanies()
      if (!activeCompanyId && companies.length > 0) {
        setActiveCompany(companies[0].id)
      }
    }

    if (activeCompanyId) {
      fetchNotifications()
      if (sub?.trial_started_at) {
        notificationService.checkTrialNotifications(sub.trial_started_at, activeCompanyId)
      }
    }
    refreshIntel()
  }, [activeCompanyId, sub?.trial_started_at, user?.role, companies.length])

  const onRefresh = useCallback(async () => {
    setRefreshing(true); feedback.light()
    try { await Promise.all([fetchFinance(), refreshIntel(), fetchNotifications()]) }
    catch (e) { console.error(e) } finally { setRefreshing(false) }
  }, [fetchFinance, refreshIntel, fetchNotifications])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }, [])

  const { formatCurrency } = useFormatter()
  if (isLoading) return <Loading fullScreen message="A preparar o seu painel..." />

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
      <View style={{ paddingTop: insets.top + 10 }} className="px-6 pb-6 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => setTenantSwitcherVisible(true)} className="flex-row items-center flex-1 mr-4">
            <View className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 items-center justify-center mr-2"><Building2 size={20} color="#6366f1" /></View>
            <View className="flex-1 text-clip">
              <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider" numberOfLines={1}>{greeting}, {user?.name?.split(' ')[0] || "Comandante"}</Text>
              <Text style={{ fontFamily: "Inter-Bold" }} className="text-slate-900 dark:text-white text-base leading-5" numberOfLines={1}>{activeCompany?.name || "Minha Empresa"}</Text>
            </View>
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className="flex-row items-center mr-3 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
               <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
               <Text className="text-[8px] font-black text-emerald-600 uppercase">Sinc</Text>
            </View>
            <NotificationBell />
            <TouchableOpacity onPress={() => router.push("/(app)/profile")} className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500 bg-indigo-50 ml-3">
               {user?.logo_url ? <Animated.Image source={{ uri: user.logo_url }} className="w-full h-full" /> : <View className="flex-1 items-center justify-center"><Text className="text-indigo-600 font-bold">{user?.name?.charAt(0) || "U"}</Text></View>}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#4f46e5"} />}
      >
        <View className="px-6 mt-8">
          <LinearGradient 
            colors={isDark ? ["#1e293b", "#0f172a"] : ["#4f46e5", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-8 rounded-[32px] overflow-hidden shadow-premium-lg border border-white/10"
          >
            <View className="flex-row justify-between items-start mb-6">
              <View className="bg-white/20 p-3 rounded-2xl"><Package size={24} color="white" /></View>
              <View className="bg-white/20 px-4 py-2 rounded-full border border-white/30"><Text style={{ fontFamily: "Inter-Bold" }} className="text-white text-[10px] uppercase tracking-widest">Total Stock</Text></View>
            </View>
            <Text className="text-white/70 text-sm mb-1">Valor Total em Stock</Text>
            <View className="flex-row items-baseline">
              <Text style={{ fontFamily: "Inter-Black" }} className="text-white text-4xl">{formatCurrency(stats?.inventoryValue || 0)}</Text>
            </View>
          </LinearGradient>
        </View>

        <TrialBanner />

        {/* KPIs de Hoje */}
        <View className="px-6 mt-6">
          {/* Card Principal: Vendas Hoje */}
          <View className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-premium-sm mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 items-center justify-center mr-3">
                  <TrendingUp size={22} color="#10b981" />
                </View>
                <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Vendas Hoje</Text>
              </View>
              <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                <Text className="text-emerald-500 text-[10px] font-black uppercase">Realtime</Text>
              </View>
            </View>
            <Text style={{ fontFamily: "Inter-Black" }} className="text-emerald-500 text-3xl">{formatCurrency(todaySummary?.revenue || 0)}</Text>
          </View>

          {/* Segunda Linha: Lucro e Pedidos (Lucro escondido de Operadores por segurança) */}
          <View className="flex-row justify-between">
            {can('view_reports') && (
              <View className="flex-1 mr-4 bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-premium-sm">
                <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center mb-3">
                  <Wallet size={20} color="#6366f1" />
                </View>
                <Text className="text-[10px] uppercase font-bold text-slate-400 mb-1">Lucro Estimado</Text>
                <Text style={{ fontFamily: "Inter-Black" }} className="text-indigo-500 text-lg" numberOfLines={1}>{formatCurrency(todaySummary?.profit || 0)}</Text>
              </View>
            )}
            <View className={`bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-premium-sm ${can('view_reports') ? 'flex-1' : 'w-full'}`}>
              <View className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 items-center justify-center mb-3">
                <ShoppingCart size={20} color="#f59e0b" />
              </View>
              <Text className="text-[10px] uppercase font-bold text-slate-400 mb-1">Pedidos</Text>
              <Text style={{ fontFamily: "Inter-Black" }} className="text-slate-900 dark:text-white text-lg">{todaySummary?.orderCount || 0}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-6 mt-8">
          <View className="flex-1 mr-4">
            <Button 
              title="Módulos"
              variant="primary"
              icon={<LayoutGrid size={20} color="white" />}
              onPress={() => router.push("/(app)/modules")}
            />
          </View>
          <View className="flex-1">
            <Button 
              title="Venda PDV"
              variant="secondary"
              icon={<ShoppingCart size={20} color="#6366f1" />}
              onPress={() => router.push("/(app)/pos")}
            />
          </View>
        </View>

        <View className="mt-8 px-6">
           <View className="flex-row justify-between items-center mb-4">
             <Text style={{ fontFamily: "Inter-Bold" }} className="text-sm uppercase tracking-widest text-slate-400">Atalhos</Text>
           </View>
           <View className="flex-row justify-between">
              {can('create_products') && (
                <TouchableOpacity onPress={() => router.push("/(app)/products/create")} className="items-center">
                   <View className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center border border-indigo-100 dark:border-indigo-500/20"><Plus size={22} color="#6366f1" /></View>
                   <Text className="text-[10px] font-bold text-slate-500 mt-1">Produto</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => router.push("/(app)/customers")} className="items-center">
                 <View className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 items-center justify-center border border-sky-100 dark:border-sky-500/20"><UsersIcon size={22} color="#0ea5e9" /></View>
                 <Text className="text-[10px] font-bold text-slate-500 mt-1">Clientes</Text>
              </TouchableOpacity>
              {can('view_reports') && (
                <TouchableOpacity onPress={() => router.push("/(app)/reports")} className="items-center">
                   <View className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 items-center justify-center border border-amber-100 dark:border-amber-500/20"><PieIcon size={22} color="#f59e0b" /></View>
                   <Text className="text-[10px] font-bold text-slate-500 mt-1">Relatórios</Text>
                </TouchableOpacity>
              )}
              {can('view_history') && (
                <TouchableOpacity onPress={() => router.push("/(app)/movements")} className="items-center">
                   <View className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 items-center justify-center border border-slate-100 dark:border-slate-800"><HistoryIcon size={22} color="#64748b" /></View>
                   <Text className="text-[10px] font-bold text-slate-500 mt-1">Histórico</Text>
                </TouchableOpacity>
              )}
           </View>
        </View>

        <View className="mt-10">
          <View className="px-6 mb-4 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center mr-3">
                <Brain size={18} color="#6366f1" />
              </View>
              <Text style={{ fontFamily: "Inter-Bold" }} className="text-lg text-slate-800 dark:text-white">Inteligência SmartS</Text>
            </View>
          </View>
          {(abcData?.length > 0 || forecast?.length > 0) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6">
              {abcData?.slice(0, 5).map((item: any, i: number) => (
                <View key={`abc-${i}`} className="bg-indigo-600 p-4 rounded-3xl mr-4 w-64 shadow-premium-sm">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="bg-white/20 p-2 rounded-xl"><BarChart3 size={16} color="white" /></View>
                    <Badge variant="info" label={`Classe ${item.classification}`} />
                  </View>
                  <Text className="text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-indigo-100 text-xs text-opacity-80 mt-1">Gera {item.percentage.toFixed(1)}% da sua receita mensal</Text>
                  <TouchableOpacity onPress={() => router.push(`/(app)/products/${item.id}`)} className="mt-4 bg-white/10 p-2 rounded-2xl"><Text className="text-white font-black text-center text-xs">Acelerar Reposição</Text></TouchableOpacity>
                </View>
              ))}
              {forecast?.slice(0, 5).map((item: any, i: number) => (
                <View key={`risk-${i}`} className="bg-white dark:bg-slate-900 p-4 rounded-3xl mr-4 w-64 border border-slate-100 dark:border-slate-800 shadow-premium-sm">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className={`p-2 rounded-xl ${item.risk_level === 'critical' ? 'bg-rose-100' : 'bg-amber-100'}`}>
                      <AlertTriangle size={16} color={item.risk_level === 'critical' ? "#f43f5e" : "#f59e0b"} />
                    </View>
                    <Badge variant={item.risk_level === 'critical' ? 'danger' : 'warning'} label={`${item.days_remaining} dias restantes`} />
                  </View>
                  <Text className="text-slate-800 dark:text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-slate-500 text-xs mt-1">Stock atual: {item.current_stock} un</Text>
                  <TouchableOpacity onPress={() => router.push(`/(app)/products/${item.id}`)} className={`mt-4 p-2 rounded-2xl ${item.risk_level === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`}><Text className="text-white font-black text-center text-xs">Encomendar Agora</Text></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="mx-6 rounded-3xl overflow-hidden shadow-premium-lg">
              <LinearGradient
                colors={isDark ? ['#312e81', '#1e1b4b'] : ['#4f46e5', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-8 items-center"
              >
                <View className="w-20 h-20 rounded-full bg-white/15 items-center justify-center mb-4 border border-white/20">
                  <Sparkles size={36} color="white" />
                </View>
                <Text style={{ fontFamily: "Inter-Black" }} className="text-white text-lg text-center mb-2">Análise Inteligente</Text>
                <Text className="text-indigo-100 text-sm text-center leading-5 mb-6">Registe vendas no PDV para ativar a análise ABC, previsão de stock e sugestões de reposição.</Text>
                <Button 
                  title="Iniciar Primeira Venda"
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => router.push("/(app)/pos")}
                  className="bg-white px-8 rounded-full"
                  textStyle={{ color: '#4f46e5', fontSize: 13 }}
                />
              </LinearGradient>
            </View>
          )}
        </View>

        <View className="mt-10 px-6">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 items-center justify-center mr-3">
                <AlertTriangle size={18} color="#f59e0b" />
              </View>
              <Text style={{ fontFamily: "Inter-Bold" }} className="text-lg text-slate-800 dark:text-white">Alertas de Stock</Text>
            </View>
            {lowStockAlerts?.length > 0 && <Badge variant="warning" label={String(lowStockAlerts.length)} />}
          </View>
          {lowStockAlerts?.length > 0 ? (
            lowStockAlerts.map((item, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(`/(app)/products/${item?.id || ''}`)} className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-3xl flex-row items-center border border-amber-100 dark:border-amber-500/20 mb-3">
                <View className="w-10 h-10 rounded-2xl bg-amber-200/50 items-center justify-center mr-4"><Package size={20} color="#d97706" /></View>
                <View className="flex-1"><Text style={{ fontFamily: "Inter-SemiBold" }} className="text-slate-800 dark:text-slate-200 text-sm">{item?.name || 'Desconhecido'}</Text><Text className="text-amber-600 dark:text-amber-400 text-xs">Stock: {item?.current_stock || 0} | Mín: {item?.minimum_stock || 0}</Text></View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 flex-row items-center">
              <View className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 items-center justify-center mr-4">
                <Package size={22} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: "Inter-Bold" }} className="text-emerald-700 dark:text-emerald-400 text-sm">Stock Saudável</Text>
                <Text className="text-emerald-600/70 dark:text-emerald-500/60 text-xs mt-0.5">Nenhum produto abaixo do mínimo. Tudo sob controlo!</Text>
              </View>
            </View>
          )}
        </View>

        <View className="mt-10 mb-10 px-6">
          <View className="mb-4 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/10 items-center justify-center mr-3">
                <BarChart3 size={18} color="#8b5cf6" />
              </View>
              <Text style={{ fontFamily: "Inter-Bold" }} className="text-lg text-slate-800 dark:text-white">Análise Gráfica</Text>
            </View>
            <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <Calendar size={12} color="#6366f1" />
              <Text className="text-indigo-600 text-[10px] font-bold ml-1">30 dias</Text>
            </View>
          </View>
          <View>
            <Card className="p-6 rounded-[32px] mb-6">
              <InventoryValueChart {...(inventoryValue || { labels: [], data: [] })} />
            </Card>
            <Card className="p-6 rounded-[32px] mb-6">
              <FinancialTrendChart {...(financialTrends || { labels: [], revenue: [], expenses: [] })} />
            </Card>
            <Card className="p-6 rounded-[32px]">
              <AttendanceTrendChart {...(attendanceMetrics || { labels: [], data: [] })} />
            </Card>
          </View>
        </View>

        <View className="px-6 mt-10 mb-32">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 items-center justify-center mr-3">
                <Rocket size={18} color="#10b981" />
              </View>
              <Text style={{ fontFamily: "Inter-Bold" }} className="text-lg text-slate-800 dark:text-white">Mais Vendidos</Text>
            </View>
          </View>
          {!bestSellers || bestSellers.length === 0 ? (
            <Card className="p-6 items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <View className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center mb-4">
                <ShoppingCart size={28} color="#94a3b8" />
              </View>
              <Text style={{ fontFamily: "Inter-Bold" }} className="text-slate-900 dark:text-white text-base mb-1 text-center">Sem Ranking Ainda</Text>
              <Text className="text-slate-500 text-xs text-center leading-5">Conclua vendas no PDV para ver o top de produtos mais vendidos com receita gerada.</Text>
              <Button 
                title="Ir para o PDV"
                variant="primary"
                fullWidth={false}
                onPress={() => router.push("/(app)/pos")}
                className="mt-4 bg-emerald-500 px-8 rounded-full"
              />
            </Card>
          ) : (
            bestSellers?.map((item, i) => (
              <Card key={i} className="p-4 mb-3 bg-white dark:bg-slate-900 rounded-2xl"><View className="flex-row items-center"><View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center mr-4"><Text style={{ fontFamily: "Inter-Black" }} className="text-indigo-600">{i + 1}</Text></View><View className="flex-1"><Text style={{ fontFamily: "Inter-Bold" }} className="text-slate-900 dark:text-white text-sm" numberOfLines={1}>{item?.name || 'Produto'}</Text><Text className="text-slate-400 text-xs">{item?.quantity || 0} un</Text></View><Text style={{ fontFamily: "Inter-SemiBold" }} className="text-indigo-600 text-sm">{formatCurrency(item?.revenue || 0)}</Text></View></Card>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        onPress={() => router.push("/(app)/scanner")} 
        className="absolute bottom-28 right-8 w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center shadow-premium-lg border-2 border-white dark:border-slate-800"
      >
        <QrCode size={24} color="white" />
      </TouchableOpacity>
      <TenantSwitcher visible={tenantSwitcherVisible} onClose={() => setTenantSwitcherVisible(false)} />
    </View>
  )
}