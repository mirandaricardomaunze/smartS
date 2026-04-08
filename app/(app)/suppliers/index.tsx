import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import IconButton from '@/components/ui/IconButton'
import { useToastStore } from '@/store/useToastStore'
import { useConfirmStore } from '@/store/useConfirmStore'
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
import SupplierDetailModal from '@/features/suppliers/components/SupplierDetailModal'
import { usePlanLimits } from '@/hooks/usePlanLimits'

export default function SuppliersScreen() {
  const router = useRouter()
  const { suppliers, isLoading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  const { canAdd, limitMessage } = usePlanLimits()
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [restockVisible, setRestockVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleOpenCreate = () => {
    if (!canAdd('maxSuppliers', suppliers.length)) {
      useToastStore.getState().show(limitMessage('maxSuppliers'), 'warning')
      router.push('/(app)/settings/subscription')
      return
    }
    feedback.light()
    setSelectedSupplier(null)
    setModalVisible(true)
  }

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
    useConfirmStore.getState().show({
      title: 'Eliminar Fornecedor',
      message: 'Eliminar este fornecedor pode afetar o histórico de produtos vinculados. Continuar?',
      confirmLabel: 'Eliminar',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteSupplier(id)
          useToastStore.getState().show('Fornecedor removido', 'success')
          feedback.heavy()
        } catch (e) {
          useToastStore.getState().show('Falha ao remover fornecedor', 'error')
        }
      }
    })
  }

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <TouchableOpacity 
      onPress={() => {
        feedback.light()
        setSelectedSupplier(item)
        setDetailVisible(true)
      }}
      activeOpacity={0.7}
    >
      <Card className="mb-4 p-5">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl items-center justify-center mr-4 border border-slate-100 dark:border-slate-800">
            <Building2 size={28} color="#4f46e5" />
          </View>
          <View className="flex-1">
            <Text 
              style={{ fontFamily: 'Inter-Bold' }} 
              className="text-lg text-slate-800 dark:text-white mb-1" 
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.low_stock_count && item.low_stock_count > 0 ? (
              <View className="flex-row items-center bg-rose-50 dark:bg-rose-900/10 self-start px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/20">
                <AlertCircle size={10} color="#ef4444" />
                <Text className="text-[10px] text-rose-600 dark:text-rose-400 font-bold ml-1">
                  {item.low_stock_count} {item.low_stock_count === 1 ? 'item em falta' : 'itens em falta'}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/10 self-start px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/20">
                <Text className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Stock em Dia
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="mb-4 py-3 border-y border-slate-100 dark:border-slate-800/60">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 items-center justify-center mr-3">
            <Building2 size={12} color="#64748b" />
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400 flex-1">
            Resp: {item.contact_name || 'N/A'}
          </Text>
        </View>

        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 items-center justify-center mr-3">
            <Phone size={12} color="#64748b" />
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400 flex-1">
            {item.phone || 'Sem telefone'}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 items-center justify-center mr-3">
            <Mail size={12} color="#64748b" />
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400 flex-1" numberOfLines={1}>
            {item.email || 'Sem e-mail'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-end space-x-2">
        <Button 
            onPress={() => {
              feedback.light()
              setSelectedSupplier(item)
              setRestockVisible(true)
            }}
            title="Fazer Pedido"
            variant="outline"
            size="sm"
            icon={<ShoppingCart size={16} color={item.low_stock_count && item.low_stock_count > 0 ? '#ffffff' : '#4f46e5'} />}
            className={`h-11 px-4 rounded-xl ${item.low_stock_count && item.low_stock_count > 0 ? 'bg-rose-500 border-rose-500' : 'bg-indigo-50/50 border-indigo-100'}`}
            textClassName={`text-[10px] font-bold ${item.low_stock_count && item.low_stock_count > 0 ? 'text-white' : 'text-indigo-600'}`}
        />
        
        <IconButton 
           icon={Edit2}
           variant="outline"
           size="md"
           className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800"
           iconSize={18}
           onPress={() => {
             feedback.light()
             setSelectedSupplier(item)
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
        title="Fornecedores" 
        rightElement={
          <IconButton
            icon={Plus}
            onPress={handleOpenCreate}
          />
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
          isLoading ? <Loading /> : <EmptyState 
            title="Sem fornecedores" 
            description="Regista quem fornece stock à tua empresa." 
            icon={<Building2 size={48} color="#cbd5e1" />} 
            actionLabel="Adicionar Fornecedor"
            onAction={handleOpenCreate}
          />
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

      <SupplierDetailModal 
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        supplierId={selectedSupplier?.id || null}
        onEdit={() => {
          setDetailVisible(false)
          setModalVisible(true)
        }}
      />
    </Screen>
  )
}
