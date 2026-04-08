import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Share } from 'react-native'
import { useRouter } from 'expo-router'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { useFormatter } from '@/hooks/useFormatter'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useToastStore } from '@/store/useToastStore'
import { useConfirmStore } from '@/store/useConfirmStore'
import { useCompanyStore } from '@/store/companyStore'
import { orderRepository } from '@/repositories/orderRepository'
import { printService } from '@/services/printService'
import { formatDate } from '@/utils/formatters'
import { feedback } from '@/utils/haptics'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import IconButton from '@/components/ui/IconButton'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import {
  Plus,
  Search,
  XCircle,
  Timer,
  CheckCircle2,
  Printer,
  FileText,
  LayoutGrid
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'

type TabType = 'pending' | 'picking' | 'completed' | 'all'

export default function OrdersScreen() {
  const router = useRouter()
  const { orders, isLoading, fetchOrders, startPicking, finishOrder, cancelOrder, loadMore, hasMore } = useOrders()
  const { formatCurrency } = useFormatter()
  const { user } = useAuthStore()
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null)

  const filteredOrders = useMemo(() => {
    let result = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab)
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(o => 
        o.number.toLowerCase().includes(q) || 
        o.customer_name.toLowerCase().includes(q)
      )
    }
    return result
  }, [orders, activeTab, searchQuery])

  const handleAction = async (id: string, action: (id: string) => Promise<void>, message: string) => {
    setIsProcessingId(id)
    feedback.medium()
    try {
      await action(id)
      useToastStore.getState().show(message, 'success')
      feedback.success()
    } catch (e: any) {
      useToastStore.getState().show(e.message || 'Erro ao processar', 'error')
      feedback.error()
    } finally {
      setIsProcessingId(null)
    }
  }

  const handlePrint = async (order: any) => {
    feedback.light()
    const company = useCompanyStore.getState().companies.find(c => c.id === activeCompanyId)
    if (!company) {
      useToastStore.getState().show('Empresa não encontrada.', 'error')
      return
    }

    try {
      const items = orderRepository.getOrderItems(activeCompanyId!, order.id)
      const receipt = printService.formatThermalReceipt(order, items, company)
      await printService.print(receipt)
      await Share.share({ message: receipt, title: `Recibo #${order.number}` })
    } catch (error) {
      useToastStore.getState().show('Erro ao imprimir.', 'error')
    }
  }

  const FilterPill = ({ label, value }: { label: string, value: TabType }) => (
    <TouchableOpacity 
      onPress={() => { feedback.light(); setActiveTab(value); }}
      className={`px-5 py-2.5 rounded-full mr-2 border shadow-sm ${activeTab === value ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
    >
      <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-xs font-bold ${activeTab === value ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const renderOrder = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => { feedback.light(); router.push(`/(app)/orders/${item.id}`); }}
      activeOpacity={0.7}
      className="mb-4"
    >
      <Card variant="premium" className="p-5">
        <View className="flex-row justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center mr-3 border border-indigo-100 dark:border-indigo-800/20">
              <FileText size={24} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-lg font-black text-slate-900 dark:text-white">#{item.number}</Text>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest" numberOfLines={1}>
                {item.customer_name || 'Venda a Dinheiro'}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-indigo-600 dark:text-indigo-400 text-lg font-black">
              {formatCurrency(item.total_amount)}
            </Text>
            <Text className="text-slate-400 text-[9px] font-bold uppercase">{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex-row items-center">
          {item.status === 'pending' && (
            <Button 
              title="Iniciar Inspeção"
              variant="primary"
              onPress={() => handleAction(item.id, startPicking, 'Inspeção iniciada!')}
              isLoading={isProcessingId === item.id}
              icon={<Timer size={18} color="white" />}
              className="flex-1 h-12 rounded-xl"
              textStyle={{ fontSize: 12, textTransform: 'uppercase' }}
            />
          )}

          {item.status === 'picking' && (
            <View className="flex-1 flex-row">
              <Button 
                title="Finalizar"
                variant="primary"
                onPress={() => handleAction(item.id, finishOrder, 'Venda concluída!')}
                isLoading={isProcessingId === item.id}
                icon={<CheckCircle2 size={18} color="white" />}
                className="flex-[2] h-12 rounded-xl bg-emerald-600 border-transparent mr-2"
                textStyle={{ fontSize: 12, textTransform: 'uppercase' }}
              />
              <TouchableOpacity 
                onPress={() => handlePrint(item)}
                className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl items-center justify-center"
              >
                <Printer size={20} color={isDark ? '#cbd5e1' : '#64748b'} />
              </TouchableOpacity>
            </View>
          )}

          {item.status === 'completed' && (
            <Button 
              title="Reimprimir Recibo"
              variant="secondary"
              onPress={() => handlePrint(item)}
              icon={<Printer size={18} color="white" />}
              className="flex-1 h-12 rounded-xl"
              textStyle={{ fontSize: 12, textTransform: 'uppercase' }}
            />
          )}

          {(item.status === 'pending' || item.status === 'picking') && isProcessingId !== item.id && (
            <TouchableOpacity 
              onPress={() => {
                feedback.heavy()
                useConfirmStore.getState().show({
                  title: 'Anular Pedido',
                  message: 'Deseja anular esta venda? O stock será reposto.',
                  confirmLabel: 'Confirmar',
                  isDestructive: true,
                  onConfirm: () => handleAction(item.id, (id) => cancelOrder(id, user?.id ?? ''), 'Pedido anulado.')
                })
              }}
              className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-xl items-center justify-center ml-2 border border-rose-100 dark:border-rose-900/30"
            >
              <XCircle size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  ), [isProcessingId, isDark])

  return (
    <Screen withHeader padHorizontal={false}>
      <Header 
        title="Gestão de Pedidos" 
        rightElement={
          <IconButton 
            icon={Plus} 
            onPress={() => router.push('/(app)/orders/create')}
          />
        }
      />

      <View className="px-6 py-4">
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'Novos', value: 'pending' },
            { label: 'Inspeção', value: 'picking' },
            { label: 'Prontos', value: 'completed' },
            { label: 'Todos', value: 'all' },
          ]}
          keyExtractor={i => i.value}
          renderItem={({ item }) => <FilterPill label={item.label} value={item.value as TabType} />}
          className="mb-4"
        />

        <View className="flex-row items-center bg-white dark:bg-slate-900 px-4 h-12 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Search size={18} color="#6366f1" />
          <TextInput 
            placeholder="Pesquisar nº ou cliente..."
            className="flex-1 ml-3 text-slate-700 dark:text-white font-bold"
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && orders.length > 0 ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? <Loading /> : (
            <EmptyState 
              title="Sem Pedidos" 
              description={searchQuery ? 'Sem resultados para a busca.' : 'Não há pedidos nesta categoria.'} 
              icon={<LayoutGrid size={48} color="#cbd5e1" />} 
            />
          )
        }
        onRefresh={() => fetchOrders(true)}
        refreshing={isLoading}
      />
    </Screen>
  )
}
