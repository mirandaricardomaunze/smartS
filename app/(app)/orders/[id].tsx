import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Share, StatusBar } from 'react-native'
import { useColorScheme } from 'nativewind'
import { useLocalSearchParams, router } from 'expo-router'
import { useOrderDetails } from '@/features/orders/hooks/useOrderDetails'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { useFormatter } from '@/hooks/useFormatter'
import { formatDate } from '@/utils/formatters'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { 
  FileText, 
  Printer, 
  CheckCircle2, 
  Timer, 
  XCircle, 
  User, 
  Calendar,
  Package,
  Receipt,
  Tag,
  ChevronRight,
  ArrowLeft,
  Share2
} from 'lucide-react-native'
import { feedback } from '@/utils/haptics'
import { useConfirmStore } from '@/store/useConfirmStore'
import { useToastStore } from '@/store/useToastStore'
import { printService } from '@/services/printService'
import { useCompanyStore } from '@/store/companyStore'
import Animated, { FadeInUp, FadeInRight, FadeIn } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { order, items, isLoading: detailsLoading } = useOrderDetails(id)
  const { startPicking, finishOrder, cancelOrder } = useOrders()
  const { formatCurrency } = useFormatter()
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [isProcessing, setIsProcessing] = useState(false)

  const handlePrint = async () => {
    if (!order) return
    feedback.light()
    const company = useCompanyStore.getState().companies.find(c => c.id === activeCompanyId)
    if (!company) {
      useToastStore.getState().show('Empresa não encontrada.', 'error')
      return
    }

    try {
      const receipt = printService.formatThermalReceipt(order, items, company)
      await printService.print(receipt)
      await Share.share({ message: receipt, title: `Recibo #${order.number}` })
    } catch (error) {
      useToastStore.getState().show('Erro ao processar recibo.', 'error')
    }
  }

  const handleAction = async (action: () => Promise<void>, message: string) => {
    setIsProcessing(true)
    feedback.medium()
    try {
      await action()
      useToastStore.getState().show(message, 'success')
      feedback.success()
    } catch (e: any) {
      useToastStore.getState().show(e.message, 'error')
      feedback.error()
    } finally {
      setIsProcessing(false)
    }
  }

  if (detailsLoading) return <Screen withHeader><Header title="Carregando..." showBack /><Loading fullScreen /></Screen>
  if (!order) return <Screen withHeader><Header title="Pedido" showBack /><EmptyState title="Pedido não encontrado" /></Screen>

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Novo Pedido', variant: 'warning' as const, colors: ['#f59e0b', '#d97706'] as [string, string], icon: Timer, step: 1 }
      case 'picking': return { label: 'Inspecção', variant: 'info' as const, colors: ['#3b82f6', '#2563eb'] as [string, string], icon: Package, step: 2 }
      case 'completed': return { label: 'Concluído', variant: 'success' as const, colors: ['#10b981', '#059669'] as [string, string], icon: CheckCircle2, step: 3 }
      case 'cancelled': return { label: 'Cancelado', variant: 'danger' as const, colors: ['#ef4444', '#dc2626'] as [string, string], icon: XCircle, step: 0 }
      default: return { label: status, variant: 'neutral' as const, colors: ['#64748b', '#475569'] as [string, string], icon: Receipt, step: 0 }
    }
  }

  const statusConfig = getStatusConfig(order.status)

  const TimelineItem = ({ label, active, current, icon: Icon }: any) => (
    <View className="flex-1 items-center">
       <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-2 ${active ? 'bg-white shadow-lg' : 'bg-white/10'}`}>
          <Icon size={20} color={active ? statusConfig.colors[0] : 'rgba(255,255,255,0.4)'} />
       </View>
       <Text style={{ fontFamily: active ? 'Inter-Bold' : 'Inter-Medium' }} className={`text-[9px] uppercase tracking-widest text-center ${active ? 'text-white' : 'text-white/40'}`}>
         {label}
       </Text>
    </View>
  )

  return (
    <Screen padHorizontal={false}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView className="flex-1" contentContainerClassName="pb-32" showsVerticalScrollIndicator={false}>
        {/* Dynamic Premium Header */}
        <LinearGradient
          colors={statusConfig.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-14 pb-10 px-6 rounded-b-[40px] shadow-2xl"
        >
          <View className="flex-row justify-between items-center mb-8">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center border border-white/30"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handlePrint}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center border border-white/30"
            >
              <Share2 size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInUp} className="items-center mb-8">
            <View className="bg-white/20 px-4 py-1.5 rounded-full border border-white/30 mb-4">
               <Text className="text-white text-[10px] font-black uppercase tracking-[3px]">{statusConfig.label}</Text>
            </View>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-white text-5xl font-black tracking-tighter">
              #{order.number}
            </Text>
            <Text className="text-white/70 text-xs mt-2 font-medium tracking-wide">
              {formatDate(order.created_at)}
            </Text>
          </Animated.View>

          {/* Timeline inside Header */}
          <View className="flex-row items-center px-4">
             <TimelineItem label="Novo" active={statusConfig.step >= 1} current={statusConfig.step === 1} icon={Timer} />
             <View className={`flex-1 h-[2px] mb-6 -mx-1 ${statusConfig.step >= 2 ? 'bg-white' : 'bg-white/20'}`} />
             <TimelineItem label="Inspecção" active={statusConfig.step >= 2} current={statusConfig.step === 2} icon={Package} />
             <View className={`flex-1 h-[2px] mb-6 -mx-1 ${statusConfig.step >= 3 ? 'bg-white' : 'bg-white/20'}`} />
             <TimelineItem label="Concluído" active={statusConfig.step >= 3} current={statusConfig.step === 3} icon={CheckCircle2} />
          </View>
        </LinearGradient>

        <View className="px-6 -mt-8">
          {/* Customer Card */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card variant="premium" className="p-5 flex-row items-center mb-8 shadow-premium-lg">
               <View className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center mr-4 border border-indigo-100 dark:border-indigo-500/20">
                  <User size={28} color="#6366f1" />
               </View>
               <View className="flex-1">
                  <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-1">Responsável / Cliente</Text>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-lg" numberOfLines={1}>
                    {order.customer_name || 'Venda a Dinheiro'}
                  </Text>
               </View>
               <TouchableOpacity 
                 className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center"
                 onPress={() => order.customer_id && router.push(`/(app)/customers?id=${order.customer_id}`)}
               >
                  <ChevronRight size={20} color="#6366f1" />
               </TouchableOpacity>
            </Card>
          </Animated.View>

          {/* Items Section */}
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-4 ml-1">
            Artigos Seleccionados
          </Text>
          
          <Animated.View entering={FadeInUp.delay(300)} className="mb-8">
            <Card className="p-0 overflow-hidden border-transparent bg-white dark:bg-[#0f172a] shadow-sm">
              {items.map((item, index) => (
                <View 
                  key={item.id} 
                  className={`p-4 flex-row items-center ${index !== items.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}
                >
                  <View className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 items-center justify-center mr-4">
                     <Package size={18} color="#94a3b8" />
                  </View>
                  <View className="flex-1">
                     <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-sm" numberOfLines={1}>
                       {item.name}
                     </Text>
                     <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-bold leading-5">
                       {item.quantity}un <Text className="text-slate-400 font-medium ml-1">× {formatCurrency(item.unit_price)}</Text>
                     </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white font-black text-base">
                     {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>

          {/* Financial Summary */}
          <Animated.View entering={FadeInUp.delay(400)}>
            <Card variant="glass" className="p-6 mb-10 border-indigo-100/10">
               <View className="flex-row justify-between mb-4">
                  <View className="flex-row items-center">
                    <Receipt size={16} color="#94a3b8" />
                    <Text className="text-slate-500 dark:text-slate-400 font-medium ml-2">Subtotal Bruto</Text>
                  </View>
                  <Text className="text-slate-900 dark:text-white font-bold">{formatCurrency((order.total_amount || 0) + (order.discount || 0))}</Text>
               </View>
               
               {order.discount > 0 && (
                  <View className="flex-row justify-between mb-4">
                     <View className="flex-row items-center">
                       <Tag size={16} color="#f43f5e" />
                       <Text className="text-rose-500 font-bold ml-2">Desconto Comercial</Text>
                     </View>
                     <Text className="text-rose-500 font-black">-{formatCurrency(order.discount)}</Text>
                  </View>
               )}
               
               <View className="h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />
               
               <View className="flex-row justify-between items-center">
                  <View>
                    <Text style={{ fontFamily: 'Inter-Black' }} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-3">Total Liquidado</Text>
                    <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                      {formatCurrency(order.total_amount)}
                    </Text>
                  </View>
                  <View className="w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/30">
                    <CheckCircle2 size={24} color="white" />
                  </View>
               </View>
            </Card>
          </Animated.View>

          {/* Interactive Footer Actions */}
          <Animated.View entering={FadeInUp.delay(500)} className="space-y-4">
            {order.status === 'pending' && (
              <Button 
                title="Iniciar Inspecção"
                variant="primary"
                onPress={() => handleAction(() => startPicking(order.id), 'Inspecção iniciada com sucesso!')}
                isLoading={isProcessing}
                icon={<Timer size={20} color="white" />}
                className="h-16 rounded-2xl shadow-xl shadow-indigo-500/20"
                textStyle={{ letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 13 }}
              />
            )}

            {order.status === 'picking' && (
              <Button 
                title="Concluir e Facturar"
                variant="primary"
                onPress={() => handleAction(() => finishOrder(order.id), 'Pedido finalizado e stock actualizado!')}
                isLoading={isProcessing}
                icon={<CheckCircle2 size={20} color="white" />}
                className="h-16 rounded-2xl bg-emerald-600 border-transparent shadow-xl shadow-emerald-500/20"
                textStyle={{ letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 13 }}
              />
            )}

            <Button 
              title="Reimprimir Recibo"
              variant="secondary"
              onPress={handlePrint}
              icon={<Printer size={20} color="white" />}
              className="h-16 rounded-2xl bg-slate-900 border-transparent"
              textStyle={{ letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 13 }}
            />

            {(order.status === 'pending' || order.status === 'picking') && (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                  feedback.heavy()
                  useConfirmStore.getState().show({
                    title: 'Confirmar Anulação',
                    message: 'Esta acção irá anular o pedido e devolver os artigos ao stock físico. Deseja continuar?',
                    confirmLabel: 'Anular Pedido',
                    isDestructive: true,
                    onConfirm: () => handleAction(() => cancelOrder(order.id, 'user-1'), 'Pedido anulado.')
                  })
                }}
                className="h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 items-center justify-center flex-row"
              >
                <XCircle size={20} color="#ef4444" />
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-rose-500 font-bold ml-3 uppercase tracking-widest text-xs">Anular Transacção</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </Screen>
  )
}
