import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import SupplierFormModal from '@/features/suppliers/components/SupplierFormModal'
import { Plus, Building2, Phone, Mail, Search, Trash2, Edit2, ShoppingCart, AlertCircle } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import { feedback } from '@/utils/haptics'
import { Supplier } from '@/types'
import RestockModal from '@/features/suppliers/components/RestockModal'

export default function SuppliersScreen() {
  const { suppliers, isLoading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [restockVisible, setRestockVisible] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.contact_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (data: any) => {
    try {
      await createSupplier(data)
      useToastStore.getState().show('Fornecedor adicionado', 'success')
      feedback.success()
    } catch (e) {
      useToastStore.getState().show('Falha ao adicionar fornecedor', 'error')
    }
  }

  const handleUpdate = async (data: any) => {
    if (!selectedSupplier) return
    try {
      await updateSupplier(selectedSupplier.id, data)
      useToastStore.getState().show('Dados atualizados', 'success')
      feedback.success()
      setSelectedSupplier(null)
    } catch (e) {
      useToastStore.getState().show('Falha ao atualizar dados', 'error')
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar Fornecedor',
      'Eliminar este fornecedor pode afetar o histórico de produtos vinculados. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteSupplier(id)
              useToastStore.getState().show('Fornecedor removido', 'success')
              feedback.heavy()
            } catch (e) {
              useToastStore.getState().show('Falha ao remover fornecedor', 'error')
            }
          } 
        }
      ]
    )
  }

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <Card className="mb-3 p-4 flex-row items-center justify-between border-slate-100 dark:border-slate-800">
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 bg-slate-50 dark:bg-slate-800 items-center justify-center rounded-2xl mr-4">
          <Building2 size={24} color="#64748b" />
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-base font-bold text-slate-800 dark:text-white">
            {item.name}
          </Text>
          <Text className="text-xs text-slate-500 font-medium">Cont: {item.contact_name || 'N/A'}</Text>
          <View className="flex-row items-center mt-1">
            <Phone size={10} color="#94a3b8" />
            <Text className="text-[10px] text-slate-400 ml-1 mr-2">{item.phone || '--'}</Text>
            <Mail size={10} color="#94a3b8" />
            <Text className="text-[10px] text-slate-400 ml-1" numberOfLines={1}>{item.email || '--'}</Text>
          </View>
          {item.low_stock_count && item.low_stock_count > 0 ? (
            <View className="flex-row items-center mt-2 bg-rose-50 dark:bg-rose-900/10 self-start px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/20">
              <AlertCircle size={10} color="#ef4444" />
              <Text className="text-[10px] text-rose-600 dark:text-rose-400 font-bold ml-1">
                {item.low_stock_count} {item.low_stock_count === 1 ? 'item em falta' : 'itens em falta'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity 
            onPress={() => {
              feedback.light()
              setSelectedSupplier(item)
              setRestockVisible(true)
            }}
            className={`p-2 w-10 h-10 ${item.low_stock_count && item.low_stock_count > 0 ? 'bg-rose-500' : 'bg-indigo-50 dark:bg-indigo-900/10'} rounded-full items-center justify-center mr-2`}
        >
          <ShoppingCart size={18} color={item.low_stock_count && item.low_stock_count > 0 ? '#ffffff' : '#4f46e5'} />
        </TouchableOpacity>

        <TouchableOpacity 
           onPress={() => {
             setSelectedSupplier(item)
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
        title="Fornecedores" 
        rightElement={
          <TouchableOpacity 
            onPress={() => {
              feedback.light()
              setSelectedSupplier(null)
              setModalVisible(true)
            }}
            className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center border border-white/20 active:bg-white/20"
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <View className="px-6 top-0 mt-6 mb-4">
        <Input
          placeholder="Procurar fornecedores..."
          value={search}
          onChangeText={setSearch}
          icon={<Search size={20} color="#94a3b8" />}
          className="bg-white dark:bg-slate-900"
        />
      </View>

      <FlatList
        data={filteredSuppliers}
        renderItem={renderSupplier}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pb-20"
        ListEmptyComponent={
          isLoading ? <Loading /> : <EmptyState title="Sem fornecedores" description="Regista quem fornece stock à tua empresa." icon={<Building2 size={48} color="#cbd5e1" />} />
        }
        onRefresh={fetchSuppliers}
        refreshing={isLoading}
      />

      <SupplierFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={selectedSupplier ? handleUpdate : handleCreate}
        initialData={selectedSupplier}
      />

      <RestockModal
        isVisible={restockVisible}
        onClose={() => setRestockVisible(false)}
        supplier={selectedSupplier}
      />
    </Screen>
  )
}
