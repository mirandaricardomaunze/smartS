import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Share } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import { useOrders } from '@/features/orders/hooks/useOrders'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import { 
  Plus, 
  ShoppingCart, 
  FileText, 
  ChevronRight, 
  Search, 
  Package, 
  CheckCircle2, 
  Printer, 
  XCircle, 
  Timer,
  LayoutGrid
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { formatDate } from '@/utils/formatters'
import { useFormatter } from '@/hooks/useFormatter'
import { feedback } from '@/utils/haptics'
import { orderRepository } from '@/repositories/orderRepository'
import { printService } from '@/services/printService'
import { useCompanyStore } from '@/store/companyStore'
import { orderService } from '@/services/orderService'

type TabType = 'pending' | 'picking' | 'completed'

export default function OrdersScreen() {
  const router = useRouter()
  const { orders, isLoading, fetchOrders, startPicking, finishOrder, cancelOrder } = useOrders()
  const { formatCurrency } = useFormatter()
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    let base = orders.filter(o => {
      if (activeTab === 'pending') return o.status === 'pending'
      if (activeTab === 'picking') return o.status === 'picking'
      if (activeTab === 'completed') return o.status === 'completed'
      return false
    })

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      base = base.filter(o => 
        o.number.toLowerCase().includes(q) || 
        o.customer_name.toLowerCase().includes(q)
      )
    }

    return base
  }, [orders, activeTab, searchQuery])

  const handleStartPicking = async (id: string) => {
    feedback.medium()
    setIsProcessing(id)
    try {
      await startPicking(id)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleFinish = async (id: string) => {
    feedback.success()
    setIsProcessing(id)
    try {
      await finishOrder(id)
    } finally {
      setIsProcessing(null)
    }
  }

  const handlePrint = async (order: any) => {
    feedback.light()
    // Need company for print
    const company = useCompanyStore.getState().companies.find(c => c.id === activeCompanyId)
    if (!company) {
      useToastStore.getState().show('Empresa não encontrada para gerar o recibo.', 'error')
      return
    }

    try {
      const items = orderRepository.getOrderItems(order.id)
      const receipt = printService.formatThermalReceipt(order, items, company)
      
      // Simulate physical print
      await printService.print(receipt)
      
      // Real digital share/print
      await Share.share({
        message: receipt,
        title: `Recibo #${order.number}`
      })
    } catch (error) {
      useToastStore.getState().show('Falha ao processar o recibo.', 'error')
    }
  }

  const renderOrder = ({ item }: { item: any }) => {
    return (
      <Card variant="premium" className="mb-4 p-5 bg-white dark:bg-slate-900 rounded-[24px]">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
             <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center mr-3">
                <FileText size={20} color="#6366f1" />
             </View>
             <View>
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">#{item.number}</Text>
                <Text className="text-slate-400 text-[10px] font-medium uppercase tracking-tighter" numberOfLines={1}>{item.customer_name}</Text>
             </View>
          </View>
          <View className="items-end">
             <Text style={{ fontFamily: 'Inter-Black' }} className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{formatCurrency(item.total_amount)}</Text>
             <Text className="text-slate-400 text-[9px] mt-0.5">{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View className="flex-row space-x-2">
          {item.status === 'pending' && (
            <TouchableOpacity 
              onPress={() => handleStartPicking(item.id)}
              disabled={!!isProcessing}
              className="flex-1 bg-indigo-600 h-10 rounded-xl items-center justify-center flex-row"
            >
              {isProcessing === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Timer size={16} color="white" className="mr-2" />
                  <Text className="text-white font-bold text-xs">Iniciar Separação</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {item.status === 'picking' && (
             <>
               <TouchableOpacity 
                 onPress={() => handlePrint(item)}
                 className="flex-1 bg-slate-100 dark:bg-slate-800 h-10 rounded-xl items-center justify-center flex-row"
               >
                 <Printer size={16} color="#64748b" className="mr-2" />
                 <Text className="text-slate-600 dark:text-slate-300 font-bold text-xs">Imprimir</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => handleFinish(item.id)}
                 disabled={!!isProcessing}
                 className="flex-[1.5] bg-emerald-500 h-10 rounded-xl items-center justify-center flex-row"
               >
                 {isProcessing === item.id ? (
                   <ActivityIndicator size="small" color="white" />
                 ) : (
                   <>
                     <CheckCircle2 size={16} color="white" className="mr-2" />
                     <Text className="text-white font-bold text-xs">Finalizar</Text>
                   </>
                 )}
               </TouchableOpacity>
             </>
          )}

          {item.status === 'completed' && (
             <TouchableOpacity 
                onPress={() => handlePrint(item)}
                className="flex-1 border border-slate-200 dark:border-slate-800 h-10 rounded-xl items-center justify-center flex-row"
             >
                <Printer size={16} color="#64748b" className="mr-2" />
                <Text className="text-slate-600 dark:text-slate-300 font-bold text-xs">Reimprimir Comprovante</Text>
             </TouchableOpacity>
          )}

          {(item.status === 'pending' || item.status === 'picking') && !isProcessing && (
            <TouchableOpacity 
              onPress={() => {
                Alert.alert('Cancelar Pedido', 'Deseja realmente cancelar este pedido e restaurar o estoque?', [
                  { text: 'Não' },
                  { text: 'Sim, Cancelar', style: 'destructive', onPress: () => cancelOrder(item.id, 'user-1') }
                ])
              }}
              className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl items-center justify-center"
            >
              <XCircle size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    )
  }

  return (
    <Screen withHeader padHorizontal={false} className="bg-slate-50 dark:bg-slate-950">
      <Header 
        title="Gestão de Pedidos" 
        rightElement={
          <TouchableOpacity 
            onPress={() => router.push('/(app)/orders/create')}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 active:bg-white/20"
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      {/* Modern Tabs */}
      <View className="px-6 mt-6 mb-4 flex-row space-x-2">
         {[
           { id: 'pending', label: 'Novos', icon: <ShoppingCart size={14} color={activeTab === 'pending' ? 'white' : '#64748b'} /> },
           { id: 'picking', label: 'Separação', icon: <Package size={14} color={activeTab === 'picking' ? 'white' : '#64748b'} /> },
           { id: 'completed', label: 'Prontos', icon: <CheckCircle2 size={14} color={activeTab === 'completed' ? 'white' : '#64748b'} /> }
         ].map(tab => (
           <TouchableOpacity 
            key={tab.id}
            onPress={() => { feedback.light(); setActiveTab(tab.id as TabType) }}
            className={`flex-1 h-10 rounded-2xl flex-row items-center justify-center ${activeTab === tab.id ? 'bg-indigo-600' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800'}`}
           >
             {tab.icon}
             <Text className={`ml-2 text-[11px] font-bold ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`}>{tab.label}</Text>
           </TouchableOpacity>
         ))}
      </View>

      {/* Advanced Search */}
      <View className="px-6 mb-6">
         <View className="flex-row items-center bg-white dark:bg-slate-900 px-4 h-12 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Search size={18} color="#94a3b8" />
            <TextInput 
              placeholder="Pesquisar cliente ou nº pedido..."
              className="flex-1 ml-3 text-slate-700 dark:text-white font-medium"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
         </View>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pb-24"
        ListEmptyComponent={
          isLoading ? <Loading /> : (
            <EmptyState 
              title={searchQuery ? 'Sem resultados' : 'Tudo limpo!'} 
              description={searchQuery ? 'Tenta pesquisar por outro termo.' : `Não há pedidos ${activeTab === 'pending' ? 'novos' : activeTab === 'picking' ? 'em separação' : 'finalizados'}.`} 
              icon={<LayoutGrid size={48} color="#cbd5e1" />} 
            />
          )
        }
        onRefresh={fetchOrders}
        refreshing={isLoading}
      />
    </Screen>
  )
}
