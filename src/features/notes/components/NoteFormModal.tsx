import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList } from 'react-native'
import { X, FileText, Plus, ShoppingBag, Trash2, Search, PackageOpen } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Product, NoteType, NoteItem, CreateNoteData } from '@/types'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import BottomSheet from '@/components/ui/BottomSheet'
import { useProducts } from '@/features/products/hooks/useProducts'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { notesRepository } from '@/repositories/notesRepository'
import { useCompanyStore } from '@/store/companyStore'

interface NoteFormModalProps {
  visible: boolean
  onClose: () => void
  onSave: (data: CreateNoteData & { number: string }) => Promise<void>
}

export default function NoteFormModal({
  visible,
  onClose,
  onSave
}: NoteFormModalProps) {
  const { products } = useProducts()
  const showToast = useToastStore((state) => state.show)
  const { activeCompanyId } = useCompanyStore()
  
  const [formData, setFormData] = useState({
    number: '',
    type: 'exit' as NoteType,
  })
  const [items, setItems] = useState<NoteItem[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProductPickerVisible, setIsProductPickerVisible] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (visible) {
      const nextNumber = activeCompanyId
        ? notesRepository.getNextNumber(activeCompanyId)
        : 'NT-0001'
      setFormData({ number: nextNumber, type: 'exit' })
      setItems([])
    }
  }, [visible, activeCompanyId])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const handleAddItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems([...items, { product_id: product.id, quantity: 1 }])
    }
    setIsProductPickerVisible(false)
    feedback.light()
  }

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(i => i.product_id !== productId))
    feedback.light()
  }

  const handleUpdateQty = (productId: string, qty: string) => {
    const n = parseInt(qty) || 0
    setItems(items.map(i => i.product_id === productId ? { ...i, quantity: n } : i))
  }

  const handleSave = async () => {
    if (items.length === 0) {
      showToast('Adicione pelo menos um item', 'warning')
      return
    }

    try {
      setIsSubmitting(true)
      feedback.medium()
      await onSave({
        number: formData.number,
        type: formData.type,
        items
      })
      feedback.success()
      showToast('Nota criada com sucesso', 'success')
      onClose()
    } catch (error) {
      feedback.error()
      showToast('Erro ao criar nota', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const TypeButton = ({ type, label, color }: { type: NoteType, label: string, color: string }) => {
    const isActive = formData.type === type
    const colorHex = color === 'emerald' ? '#10b981' : color === 'red' ? '#ef4444' : '#4f46e5'
    
    return (
      <TouchableOpacity 
        onPress={() => setFormData(prev => ({ ...prev, type }))}
        className={`flex-1 py-3 rounded-2xl items-center justify-center border-2 ${
          isActive 
            ? `bg-white dark:bg-slate-800 border-${color}-500 shadow-sm` 
            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
        }`}
      >
        <Text className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
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
        height={0.9}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="bg-white dark:bg-slate-950 flex-1">
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-5">
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
                Criar Nota
              </Text>
              <TouchableOpacity 
                onPress={onClose}
                className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
              >
                <X size={20} color="#4f46e5" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
              <View className="flex-row space-x-2 mb-6">
                <TypeButton type="entry" label="Entrada" color="emerald" />
                <View className="mx-1" />
                <TypeButton type="exit" label="Saída" color="red" />
                <View className="mx-1" />
                <TypeButton type="transfer" label="Transfer" color="primary" />
              </View>

              <View className="mb-6">
                <Input
                  label="Número do Documento"
                  value={formData.number}
                  onChangeText={(v) => setFormData(prev => ({ ...prev, number: v }))}
                  placeholder="Ex: NT-1234"
                />
              </View>

              <View className="flex-row justify-between items-center mb-4">
                <Text style={{ fontFamily: 'Inter-Black' }} className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Itens do Documento ({items.length})
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsProductPickerVisible(true)}
                  className="bg-primary/5 dark:bg-primary/10 px-4 py-2 rounded-xl flex-row items-center border border-primary/10 dark:border-primary/20"
                >
                  <Plus size={16} color="#4f46e5" className="mr-1" />
                  <Text className="text-primary dark:text-primary-dark font-bold text-xs">Adicionar</Text>
                </TouchableOpacity>
              </View>

              {items.length === 0 ? (
                <View className="py-10 items-center justify-center bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <ShoppingBag size={40} color="#cbd5e1" />
                  <Text className="text-slate-400 font-medium mt-3">Nenhum item adicionado</Text>
                </View>
              ) : (
                <View>
                  {items.map((item, index) => {
                    const product = products.find(p => p.id === item.product_id)
                    return (
                      <Card key={item.product_id} variant="glass" glassIntensity={10} className="p-4 border-slate-100 dark:border-slate-800 mb-3">
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg items-center justify-center mr-3">
                            <PackageOpen size={20} color="#64748b" />
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-slate-800 dark:text-white" numberOfLines={1}>{product?.name || 'Produto'}</Text>
                            <Text className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{product?.sku}</Text>
                          </View>
                          <View className="flex-row items-center">
                            <View className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 flex-row items-center">
                              <Text className="text-[10px] text-slate-400 mr-1 uppercase font-black">Qtd:</Text>
                              <Input 
                                value={item.quantity.toString()}
                                onChangeText={(v) => handleUpdateQty(item.product_id, v)}
                                keyboardType="numeric"
                                className="mb-0 h-8 border-0 p-0 text-center font-bold text-slate-900 dark:text-white"
                              />
                            </View>
                            <TouchableOpacity 
                              onPress={() => handleRemoveItem(item.product_id)}
                              className="w-10 h-10 items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl"
                            >
                              <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Card>
                    )
                  })}
                </View>
              )}
              
              <View className="h-20" />
            </ScrollView>

            <View className="px-6 pt-6 pb-12 bg-white dark:bg-slate-950">
              <Button 
                variant="gradient"
                gradientColors={['#4f46e5', '#4338ca']}
                title="Saldar e Guardar" 
                onPress={handleSave}
                isLoading={isSubmitting}
                className="h-14 rounded-2xl shadow-lg shadow-primary/30"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* Product Selection Sheet */}
      <BottomSheet
        visible={isProductPickerVisible}
        onClose={() => setIsProductPickerVisible(false)}
        height={0.7}
      >
        <View className="flex-1 px-6">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white mb-4">
            Escolher Produto
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
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="py-4 border-b border-slate-50 dark:border-slate-800/50 flex-row items-center"
                onPress={() => handleAddItem(item)}
              >
                <View className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg items-center justify-center mr-3">
                  <PackageOpen size={20} color="#64748b" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-800 dark:text-white">{item.name}</Text>
                  <Text className="text-xs text-slate-500">{item.sku} • {item.current_stock} em stock</Text>
                </View>
                <Plus size={20} color="#4f46e5" />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </BottomSheet>
    </>
  )
}
