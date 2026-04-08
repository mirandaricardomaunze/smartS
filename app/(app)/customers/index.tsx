import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import IconButton from '@/components/ui/IconButton'
import { useToastStore } from '@/store/useToastStore'
import { useConfirmStore } from '@/store/useConfirmStore'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import CustomerFormModal from '@/features/customers/components/CustomerFormModal'
import { Plus, User, Phone, Mail, Search, Trash2, Edit2, BarChart2, AlertCircle, Wallet } from 'lucide-react-native'
import { useFormatter } from '@/hooks/useFormatter'
import Input from '@/components/ui/Input'
import { feedback } from '@/utils/haptics'
import { Customer } from '@/types'
import CustomerDetailModal from '@/features/customers/components/CustomerDetailModal'
import { usePlanLimits } from '@/hooks/usePlanLimits'

export default function CustomersScreen() {
  const router = useRouter()
  const { formatCurrency } = useFormatter()
  const { customers, isLoading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer, loadMore, hasMore } = useCustomers()
  const { canAdd, limitMessage } = usePlanLimits()
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleOpenCreate = () => {
    if (!canAdd('maxCustomers', customers.length)) {
      useToastStore.getState().show(limitMessage('maxCustomers'), 'warning')
      router.push('/(app)/settings/subscription')
      return
    }
    feedback.light()
    setSelectedCustomer(null)
    setModalVisible(true)
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (data: any) => {
    await createCustomer(data)
    useToastStore.getState().show('Cliente adicionado com sucesso', 'success')
    feedback.success()
  }

  const handleUpdate = async (data: any) => {
    if (!selectedCustomer) return
    await updateCustomer(selectedCustomer.id, data)
    useToastStore.getState().show('Dados do cliente atualizados', 'success')
    feedback.success()
    setSelectedCustomer(null)
  }

  const handleDelete = (id: string) => {
    useConfirmStore.getState().show({
      title: 'Eliminar Cliente',
      message: 'Tens a certeza que desejas eliminar este cliente?',
      confirmLabel: 'Eliminar',
      isDestructive: true,
      onConfirm: async () => {
        await deleteCustomer(id)
        useToastStore.getState().show('Cliente removido', 'success')
        feedback.heavy()
      }
    })
  }

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      onPress={() => {
        feedback.light()
        setSelectedCustomer(item)
        setDetailVisible(true)
      }}
      activeOpacity={0.7}
    >
      <Card className="mb-4 p-5">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl items-center justify-center mr-4 border border-indigo-100 dark:border-indigo-800/30">
            <User size={28} color="#4f46e5" />
          </View>
          <View className="flex-1">
            <Text 
              style={{ fontFamily: 'Inter-Bold' }} 
              className="text-lg text-slate-800 dark:text-white mb-1" 
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.total_debt && item.total_debt > 0 ? (
              <View className="flex-row items-center bg-rose-50 dark:bg-rose-900/10 self-start px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/20">
                <AlertCircle size={10} color="#ef4444" />
                <Text className="text-[10px] text-rose-600 dark:text-rose-400 font-bold ml-1">
                  Dívida: {formatCurrency(item.total_debt)}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/10 self-start px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/20">
                <Text className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Regularizado
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="mb-4 py-3 border-y border-slate-100 dark:border-slate-800/60">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 items-center justify-center mr-3">
            <Phone size={14} color="#64748b" />
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400 flex-1">
            {item.phone || 'Nenhum telefone'}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 items-center justify-center mr-3">
            <Mail size={14} color="#64748b" />
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400 flex-1" numberOfLines={1}>
            {item.email || 'Nenhum e-mail'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-end space-x-2">
        <Button 
          onPress={() => {
            feedback.light()
            setSelectedCustomer(item)
            setDetailVisible(true)
          }}
          title={item.total_debt && item.total_debt > 0 ? "Ver Dívida" : "Estatísticas"}
          variant="outline"
          size="sm"
          icon={item.total_debt && item.total_debt > 0 ? <Wallet size={16} color="#ef4444" /> : <BarChart2 size={16} color="#4f46e5" />}
          className={`h-11 px-4 rounded-xl ${item.total_debt && item.total_debt > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-indigo-100 bg-indigo-50/50'}`}
          textClassName={`text-[10px] font-bold ${item.total_debt && item.total_debt > 0 ? 'text-rose-600' : 'text-indigo-600'}`}
        />
        
        <IconButton 
           icon={Edit2}
           variant="outline"
           size="md"
           className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800"
           iconSize={18}
           onPress={() => {
             feedback.light()
             setSelectedCustomer(item)
             setModalVisible(true)
           }}
        />
        
        <IconButton 
           icon={Trash2}
           variant="outline"
           size="md"
           className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800"
           iconSize={18}
           color="#ef4444"
           onPress={() => handleDelete(item.id)} 
        />
      </View>
    </Card>
    </TouchableOpacity>
  )

  return (
    <Screen withHeader padHorizontal={false}>
      <Header 
        title="Clientes" 
        rightElement={
          <IconButton
            icon={Plus}
            onPress={handleOpenCreate}
          />
        }
      />

      <View className="px-6 mt-6 mb-4">
        <Input
          placeholder="Pesquisar clientes..."
          value={search}
          onChangeText={setSearch}
          icon={<Search size={20} color="#94a3b8" />}
          className="bg-white dark:bg-slate-900"
        />
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pb-20"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && customers.length > 0 ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? <Loading /> : <EmptyState 
            title="Nenhum cliente" 
            description="Começa por adicionar os teus clientes de confiança." 
            icon={<User size={48} color="#cbd5e1" />} 
            actionLabel="Adicionar Cliente"
            onAction={handleOpenCreate}
          />
        }
        onRefresh={() => fetchCustomers(true)}
        refreshing={isLoading}
      />

      <CustomerFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={selectedCustomer ? handleUpdate : handleCreate}
        initialData={selectedCustomer}
      />


      <CustomerDetailModal 
        visible={detailVisible}
        onClose={() => {
          setDetailVisible(false)
          setSelectedCustomer(null)
        }}
        customerId={selectedCustomer?.id || null}
        onEdit={() => {
          setDetailVisible(false)
          setModalVisible(true)
        }}
      />
    </Screen>
  )
}
