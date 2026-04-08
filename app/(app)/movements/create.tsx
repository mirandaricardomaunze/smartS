import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native'
import { MovementType } from '@/types'
import { useToastStore } from '@/store/useToastStore'
import { useConfirmStore } from '@/store/useConfirmStore'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { useProducts } from '@/features/products/hooks/useProducts'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import FormField from '@/components/forms/FormField'
import Input from '@/components/ui/Input'
import { PackageOpen, X, Code } from 'lucide-react-native'


export default function CreateMovementScreen() {
  const router = useRouter()
  // Optional pre-selected product
  const { productId } = useLocalSearchParams<{ productId?: string }>()
  const { createMovement } = useMovements()
  const { products } = useProducts()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProductModalOpen, setProductModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  const MOVEMENT_TYPES: MovementType[] = ['entry', 'exit', 'adjustment']

  const [formData, setFormData] = useState({
    product_id: productId || '',
    type: 'entry' as MovementType,
    quantity: '',
    reason: '',
  })

  const selectedProduct = useMemo(() => 
    products.find(p => p.id === formData.product_id), 
  [products, formData.product_id])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.product_id || !formData.quantity || !formData.type) {
      useToastStore.getState().show('Preencha Produto, Tipo e Quantidade.', 'warning')
      return
    }

    if (!MOVEMENT_TYPES.includes(formData.type)) {
      useToastStore.getState().show('Tipo de movimento inválido.', 'error')
      return
    }

    const qty = parseInt(formData.quantity)
    if (isNaN(qty) || qty <= 0) {
       useToastStore.getState().show('A quantidade deve ser maior que zero.', 'warning')
       return
    }

    if (formData.type === 'exit' && selectedProduct) {
        if (selectedProduct.current_stock < qty) {
            useToastStore.getState().show(`Stock insuficiente. Atual: ${selectedProduct.current_stock}`, 'error')
            return
        }
    }

    useConfirmStore.getState().show({
      title: 'Confirmar Registro',
      message: `Deseja registrar esta ${formData.type === 'entry' ? 'entrada' : formData.type === 'exit' ? 'saída' : 'operação'} de ${qty} unidades?`,
      confirmLabel: 'Confirmar',
      onConfirm: async () => {
        try {
          setIsSubmitting(true)
          await createMovement({
            product_id: formData.product_id,
            type: formData.type,
            quantity: qty,
            reason: formData.reason || null,
          })
          useConfirmStore.getState().show({
            title: 'Sucesso',
            message: 'Movimento registado com sucesso!',
            confirmLabel: 'OK',
            showCancel: false,
            onConfirm: () => router.back()
          })
        } catch (e: any) {
          useConfirmStore.getState().show({
            title: 'Erro',
            message: e.message || 'Falha ao registar movimento',
            confirmLabel: 'OK',
            showCancel: false,
            onConfirm: () => {}
          })
        } finally {
          setIsSubmitting(false)
        }
      }
    })
  }

  const TypeButton = ({ type, label }: { type: string, label: string }) => {
      const isActive = formData.type === type
      return (
        <TouchableOpacity 
          onPress={() => handleChange('type', type)}
          className={`flex-1 py-3 rounded-lg border ${isActive ? 'border-primary bg-primary/5 dark:bg-primary/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
        >
          <Text className={`text-center font-bold ${isActive ? 'text-primary dark:text-primary-dark' : 'text-slate-600 dark:text-slate-400'}`}>
             {label}
          </Text>
        </TouchableOpacity>
      )
  }

  return (
    <Screen padHorizontal={false}>
      <Header title="Novo Movimento" showBack />
      
      <Screen scrollable>
        <View className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
          
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
             Produto *
          </Text>
          <TouchableOpacity 
             onPress={() => setProductModalOpen(true)}
             className="flex-row items-center border border-slate-300 dark:border-slate-600 rounded-lg p-3 mb-4 bg-white dark:bg-slate-800 h-14"
          >
             {selectedProduct ? (
                <>
                  <PackageOpen size={20} color="#4f46e5" className="mr-3" />
                  <View className="flex-1">
                     <Text className="text-slate-900 dark:text-white font-medium">{selectedProduct.name}</Text>
                     <Text className="text-xs text-slate-500">
                       Stock atual: <Text className="font-bold">{selectedProduct.current_stock}</Text>
                     </Text>
                  </View>
                </>
             ) : (
                <Text className="text-slate-400">Selecionar produto...</Text>
             )}
          </TouchableOpacity>

          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
             Tipo de Movimento *
          </Text>
          <View className="flex-row space-x-2 mb-4">
             <View className="flex-1 pr-1"><TypeButton type="entry" label="Entrada" /></View>
             <View className="flex-1 px-1"><TypeButton type="exit" label="Saída" /></View>
             <View className="flex-1 pl-1"><TypeButton type="adjustment" label="Ajuste" /></View>
          </View>

          <FormField
            label="Quantidade *"
            placeholder="0"
            value={formData.quantity}
            onChangeText={(v) => handleChange('quantity', v)}
            keyboardType="numeric"
          />

          <FormField
            label="Motivo / Observações"
            placeholder="Ex: Recebimento de fornecedor, perda..."
            value={formData.reason}
            onChangeText={(v) => handleChange('reason', v)}
          />
          
          <Button 
            title="Gravar Movimento" 
            onPress={handleSave} 
            isLoading={isSubmitting}
            className="mt-6"
          />
        </View>
      </Screen>

      {/* Product Selection Modal */}
      <Modal visible={isProductModalOpen} animationType="slide" presentationStyle="pageSheet">
         <View className="flex-1 bg-slate-50 dark:bg-slate-900 pt-4">
            <View className="flex-row justify-between items-center px-4 mb-4">
               <Text className="text-xl font-bold text-slate-900 dark:text-white">Selecionar Produto</Text>
               <TouchableOpacity onPress={() => setProductModalOpen(false)} className="p-2">
                  <X size={24} color="#64748b" />
               </TouchableOpacity>
            </View>
            <View className="px-4 mb-2">
               <Input 
                 placeholder="Pesquisar..." 
                 value={search} 
                 onChangeText={setSearch} 
                 icon={<PackageOpen size={20} color="#94a3b8" />}
               />
               <Button 
                 title="Usar Scanner" 
                 variant="secondary"
                 icon={<Code size={20} color="white" />}
                 onPress={() => {
                     setProductModalOpen(false)
                     router.push('/(app)/scanner')
                 }} 
               />
            </View>
            <FlatList
               data={filteredProducts}
               keyExtractor={item => item.id}
               renderItem={({ item }) => (
                 <TouchableOpacity 
                   className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                   onPress={() => {
                      handleChange('product_id', item.id)
                      setProductModalOpen(false)
                   }}
                 >
                   <Text className="font-bold text-slate-800 dark:text-white text-base">{item.name}</Text>
                   <Text className="text-slate-500 text-sm">{item.sku} • Stock: {item.current_stock}</Text>
                 </TouchableOpacity>
               )}
            />
         </View>
      </Modal>
    </Screen>
  )
}
