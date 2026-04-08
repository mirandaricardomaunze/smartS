import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList } from 'react-native'
import { X, PackageOpen, ArrowDownLeft, ArrowUpRight, SettingsIcon, Search } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { MovementType, CreateStockMovementData } from '@/types'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import BottomSheet from '@/components/ui/BottomSheet'
import { useProducts } from '@/features/products/hooks/useProducts'

interface MovementFormModalProps {
  visible: boolean
  onClose: () => void
  onSave: (data: CreateStockMovementData) => Promise<void>
  initialProductId?: string
}

export default function MovementFormModal({ 
  visible, 
  onClose, 
  onSave, 
  initialProductId = ''
}: MovementFormModalProps) {
  const { products } = useProducts()
  const showToast = useToastStore((state) => state.show)
  
  const [formData, setFormData] = useState({
    product_id: initialProductId,
    type: 'adjustment' as MovementType,
    quantity: '',
    reason: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProductPickerVisible, setIsProductPickerVisible] = useState(false)
  const [search, setSearch] = useState('')

  // Specialized: load initialProductId when modal opens, but don't loop
  useEffect(() => {
    if (visible) {
      setFormData({
        product_id: initialProductId,
        type: 'adjustment',
        quantity: '',
        reason: '',
      })
    }
  }, [visible])

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

  const handleSave = async () => {
    if (!formData.product_id) {
      showToast('Por favor, selecione um produto', 'warning')
      return
    }
    const qty = parseInt(formData.quantity)
    if (isNaN(qty) || qty <= 0) {
      showToast('A quantidade deve ser maior que zero', 'warning')
      return
    }

    if (formData.type === 'exit' && selectedProduct) {
      if (selectedProduct.current_stock < qty) {
        showToast(`Stock insuficiente. Atual: ${selectedProduct.current_stock}`, 'error')
        return
      }
    }

    try {
      setIsSubmitting(true)
      feedback.medium()
      await onSave({
        product_id: formData.product_id,
        type: formData.type,
        quantity: qty,
        reason: formData.reason || null
      })
      feedback.success()
      showToast('Movimento registado com sucesso', 'success')
      onClose()
    } catch (error) {
      feedback.error()
      showToast('Erro ao registar movimento', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const TypeButton = ({ type, label, icon: Icon, color }: { type: MovementType, label: string, icon: any, color: string }) => {
    const isActive = formData.type === type
    return (
      <TouchableOpacity 
        onPress={() => setFormData(prev => ({ ...prev, type }))}
        className={`flex-1 p-3 rounded-2xl items-center justify-center border-2 ${
          isActive 
            ? `bg-white dark:bg-slate-800 shadow-sm border-${color}-500` 
            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
        }`}
      >
        <Icon size={20} color={isActive ? (color === 'primary' ? '#4f46e5' : color === 'emerald' ? '#10b981' : '#f59e0b') : '#94a3b8'} className="mb-1" />
        <Text className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          {label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={onClose}
        height={0.85}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="bg-white dark:bg-slate-950 flex-1 overflow-hidden">
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-5">
              <View>
                <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
                  Ajuste de Stock
                </Text>
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Correção de Inventário
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
              >
                <X size={20} color="#4f46e5" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Produto Selecionado
              </Text>
              <TouchableOpacity 
                onPress={() => setIsProductPickerVisible(true)}
                className="flex-row items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6"
              >
                <View className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl items-center justify-center mr-4">
                  <PackageOpen size={24} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedProduct ? selectedProduct.name : 'Selecionar Produto...'}
                  </Text>
                  {selectedProduct && (
                    <Text className="text-xs text-slate-500">
                      Stock Atual: <Text className="font-bold text-primary">{selectedProduct.current_stock} {selectedProduct.unit}</Text>
                    </Text>
                  )}
                </View>
                <Search size={20} color="#94a3b8" />
              </TouchableOpacity>

              <View className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 mb-6 flex-row items-center">
                <View className="mr-3">
                   <SettingsIcon size={16} color="#d97706" />
                </View>
                <Text className="text-[10px] text-amber-700 dark:text-amber-400 font-bold flex-1 leading-4">
                  USE ESTE FORMULÁRIO APENAS PARA AJUSTES E CORREÇÕES. 
                  PARA VENDAS OU COMPRAS, UTILIZE PEDIDOS OU NOTAS.
                </Text>
              </View>

              <Text className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Tipo de Operação
              </Text>
              <View className="flex-row space-x-2 mb-6">
                <TypeButton type="entry" label="Entrada" icon={ArrowDownLeft} color="emerald" />
                <View className="mx-1" />
                <TypeButton type="exit" label="Saída" icon={ArrowUpRight} color="red" />
                <View className="mx-1" />
                <TypeButton type="adjustment" label="Ajuste" icon={SettingsIcon} color="amber" />
                <View className="mx-1" />
                <TypeButton type="transfer" label="Transfer" icon={ArrowUpRight} color="primary" />
              </View>

              <View className="mb-6">
                <Input
                  label="Quantidade *"
                  placeholder="0"
                  value={formData.quantity}
                  onChangeText={(v) => setFormData(prev => ({ ...prev, quantity: v }))}
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-6">
                <Input
                  label="Motivo / Observações"
                  placeholder="Ex: Quebra, Inventário, etc."
                  value={formData.reason}
                  onChangeText={(v) => setFormData(prev => ({ ...prev, reason: v }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View className="h-20" />
            </ScrollView>

            <View className="px-6 pt-6 pb-12 bg-white dark:bg-slate-950">
              <Button 
                variant="gradient"
                gradientColors={['#4f46e5', '#4338ca']}
                title="Registar Ajuste" 
                onPress={handleSave}
                isLoading={isSubmitting}
                className="shadow-lg shadow-primary/30"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      <BottomSheet
        visible={isProductPickerVisible}
        onClose={() => setIsProductPickerVisible(false)}
        height={0.7}
      >
        <View className="flex-1 px-6">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white mb-4">
            Selecionar Produto
          </Text>
          <Input 
            placeholder="Pesquisar..." 
            value={search} 
            onChangeText={setSearch} 
            icon={<Search size={20} color="#94a3b8" />}
          />
          
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="py-4 border-b border-slate-50 dark:border-slate-800/50 flex-row items-center"
                onPress={() => {
                  setFormData(prev => ({ ...prev, product_id: item.id }))
                  setIsProductPickerVisible(false)
                }}
              >
                <View className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg items-center justify-center mr-3">
                  <PackageOpen size={20} color="#64748b" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-800 dark:text-white">{item.name}</Text>
                  <Text className="text-xs text-slate-500">{item.sku} • {item.current_stock} em stock</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </BottomSheet>
    </>
  )
}
