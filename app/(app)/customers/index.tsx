import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import CustomerFormModal from '@/features/customers/components/CustomerFormModal'
import { Plus, User, Phone, Mail, Search, Trash2, Edit2, BarChart2 } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import { feedback } from '@/utils/haptics'
import { Customer } from '@/types'
import CustomerStatsModal from '@/features/customers/components/CustomerStatsModal'

export default function CustomersScreen() {
  const { customers, isLoading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

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
    Alert.alert(
      'Eliminar Cliente',
      'Tens a certeza que desejas eliminar este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            await deleteCustomer(id)
            useToastStore.getState().show('Cliente removido', 'success')
            feedback.heavy()
          } 
        }
      ]
    )
  }

  const renderCustomer = ({ item }: { item: Customer }) => (
    <Card className="mb-3 p-4 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl items-center justify-center mr-4">
          <User size={24} color="#4f46e5" />
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-base font-bold text-slate-800 dark:text-white">
            {item.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <Phone size={12} color="#94a3b8" />
            <Text className="text-xs text-slate-500 ml-1 mr-3">{item.phone || 'Sem tlf'}</Text>
            <Mail size={12} color="#94a3b8" />
            <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>{item.email || 'Sem email'}</Text>
          </View>
        </View>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity 
            onPress={() => {
              feedback.light()
              setSelectedCustomer(item)
              setStatsVisible(true)
            }}
            className="p-2 w-10 h-10 bg-indigo-50 dark:bg-indigo-900/10 rounded-full items-center justify-center mr-2"
        >
          <BarChart2 size={18} color="#4f46e5" />
        </TouchableOpacity>
        
        <TouchableOpacity 
           onPress={() => {
             setSelectedCustomer(item)
             setModalVisible(true)
           }}
           className="p-2"
        >
          <Edit2 size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2">
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </Card>
  )

  return (
    <Screen withHeader padHorizontal={false}>
      <Header 
        title="Clientes" 
        rightElement={
          <TouchableOpacity 
            onPress={() => {
              feedback.light()
              setSelectedCustomer(null)
              setModalVisible(true)
            }}
            className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center border border-white/20 active:bg-white/20"
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <View className="px-6 mb-4">
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
        ListEmptyComponent={
          isLoading ? <Loading /> : <EmptyState title="Nenhum cliente" description="Começa por adicionar os teus clientes de confiança." icon={<User size={48} color="#cbd5e1" />} />
        }
        onRefresh={fetchCustomers}
        refreshing={isLoading}
      />

      <CustomerFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={selectedCustomer ? handleUpdate : handleCreate}
        initialData={selectedCustomer}
      />

      <CustomerStatsModal
        isVisible={statsVisible}
        onClose={() => setStatsVisible(false)}
        customer={selectedCustomer}
      />
    </Screen>
  )
}
