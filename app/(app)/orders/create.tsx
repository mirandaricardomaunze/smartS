import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import { useRouter } from 'expo-router'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useCompanyStore } from '@/store/companyStore'
import { useAuthStore } from '@/features/auth/store/authStore'
import { 
  Plus, 
  Trash2, 
  User, 
  Package, 
  ChevronRight, 
  ShoppingCart, 
  Tag, 
  Calculator 
} from 'lucide-react-native'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useFormatter } from '@/hooks/useFormatter'
import { orderRepository } from '@/repositories/orderRepository'
import { feedback } from '@/utils/haptics'
import ProductPickerModal from '@/features/products/components/ProductPickerModal'
import PickerModal from '@/components/ui/PickerModal'
import { useColorScheme } from 'nativewind'
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

export default function CreateOrderScreen() {
  const router = useRouter()
  const { createOrder } = useOrders()
  const { formatCurrency } = useFormatter()
  const { settings } = useSettings()
  const { customers, fetchCustomers } = useCustomers()
  const { products, reload: fetchProducts } = useProducts()
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const { user } = useAuthStore()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [discount, setDiscount] = useState('0')
  const [isProductModalVisible, setIsProductModalVisible] = useState(false)
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchProducts()
  }, [])

  const subtotal = items.reduce((acc, item) => {
    const itemTotal = item.quantity * item.unit_price
    if (settings.include_tax === 1) {
      return acc + itemTotal + (itemTotal * (item.tax_rate / 100))
    }
    return acc + itemTotal
  }, 0)
  const total = subtotal - parseFloat(discount || '0')

  const handleAddItem = (product: any) => {
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price } : i))
    } else {
      setItems([...items, {
        product_id: product.id,
        name: product.name,
        reference: product.reference,
        quantity: 1,
        unit_price: product.sale_price,
        tax_rate: product.tax_rate,
        total: product.sale_price
      }])
    }
    setIsProductModalVisible(false)
    feedback.light()
  }

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(i => i.product_id !== productId))
    feedback.medium()
  }

  const handleSaveOrder = async () => {
    if (!customerName || items.length === 0) {
      useToastStore.getState().show('Indica o nome do cliente e adiciona produtos.', 'warning')
      return
    }

    setIsSubmitting(true)
    feedback.medium()
    try {
      await createOrder({
        company_id: activeCompanyId!,
        customer_id: selectedCustomerId,
        customer_name: customerName,
        user_id: user!.id,
        number: orderRepository.getNextNumber(activeCompanyId!),
        status: 'pending',
        total_amount: total,
        discount: parseFloat(discount || '0'),
        tax_amount: settings.include_tax === 1 ? items.reduce((acc, item) => acc + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0) : 0,
        notes: ''
      }, items)

      feedback.success()
      useToastStore.getState().show('Pedido criado com sucesso!', 'success')
      router.back()
    } catch (e) {
      useToastStore.getState().show('Erro ao criar pedido.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen withHeader padHorizontal={false}>
      <Header title="Novo Pedido" showBack />
      
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-4 pb-32" showsVerticalScrollIndicator={false}>
        {/* Cliente Section */}
        <Animated.View entering={FadeInUp.delay(100)} className="mb-8">
          <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-3 ml-1">Identificação do Cliente</Text>
          
          <Input
             label="Nome do Cliente"
             placeholder="Identificação rápida na lista"
             value={customerName}
             onChangeText={setCustomerName}
             className="mb-4"
             icon={<User size={20} color="#6366f1" />}
          />
          
          <TouchableOpacity 
            onPress={() => { feedback.light(); setIsCustomerModalVisible(true); }}
            activeOpacity={0.7}
          >
            <Card variant="default" className="p-4 flex-row items-center border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl items-center justify-center mr-4 border border-indigo-100 dark:border-indigo-500/20">
                <User size={22} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-base">
                  {customers.find(c => c.id === selectedCustomerId)?.name || 'Vincular Cliente Cadastrado'}
                </Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">Opcional para histórico de conta</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </Card>
          </TouchableOpacity>
        </Animated.View>

        {/* Itens Section */}
        <Animated.View entering={FadeInUp.delay(200)} className="mb-8">
          <View className="flex-row justify-between items-end mb-4 px-1">
            <View>
              <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Carrinho de Compras</Text>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white text-xl font-black">{items.length} Artigos</Text>
            </View>
            <TouchableOpacity 
              onPress={() => { feedback.light(); setIsProductModalVisible(true); }}
              className="bg-indigo-600 px-4 py-2.5 rounded-xl flex-row items-center shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} color="white" />
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white font-bold ml-2 text-xs uppercase">Adicionar</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <Card className="items-center p-12 border-dashed border-slate-200 dark:border-slate-800 bg-transparent">
              <View className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full items-center justify-center mb-4">
                <ShoppingCart size={32} color="#cbd5e1" />
              </View>
              <Text className="text-slate-400 font-bold text-center">Seu carrinho está vazio</Text>
              <Text className="text-slate-300 dark:text-slate-600 text-[10px] uppercase mt-1 tracking-widest">Clique em adicionar para começar</Text>
            </Card>
          ) : (
            <View className="space-y-3">
              {items.map((item) => (
                <Animated.View key={item.product_id} layout={Layout} entering={FadeInDown}>
                  <Card className="p-4 flex-row items-center bg-white dark:bg-slate-900 shadow-sm border-slate-50 dark:border-slate-800/60">
                    <View className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl items-center justify-center mr-4">
                      <Package size={20} color="#94a3b8" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-800 dark:text-white font-bold text-sm" numberOfLines={1}>{item.name}</Text>
                      <View className="flex-row items-center mt-0.5">
                        <Text style={{ fontFamily: 'Inter-Medium' }} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{item.quantity}un</Text>
                        <Text className="text-slate-300 mx-1.5">•</Text>
                        <Text className="text-[11px] text-slate-400">{formatCurrency(item.unit_price)}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center ml-2">
                      <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white font-black text-base mr-3">{formatCurrency(item.total)}</Text>
                      <TouchableOpacity 
                        onPress={() => handleRemoveItem(item.product_id)}
                        className="w-8 h-8 bg-rose-50 dark:bg-rose-500/10 rounded-lg items-center justify-center"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </Card>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Resumo Section */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-3 ml-1">Resumo Financeiro</Text>
          
          <Card className="p-6 mb-8 bg-white dark:bg-slate-900 shadow-premium-sm border-indigo-50 dark:border-indigo-500/10">
            <View className="flex-row justify-between mb-4">
              <View className="flex-row items-center">
                 <Calculator size={14} color="#94a3b8" />
                 <Text className="text-slate-500 dark:text-slate-400 ml-2 font-medium">Subtotal</Text>
              </View>
              <Text className="text-slate-700 dark:text-slate-300 font-bold">{formatCurrency(subtotal)}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                 <Tag size={14} color="#f43f5e" />
                 <Text className="text-slate-500 dark:text-slate-400 ml-2 font-medium">Desconto Aplicado</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-3 h-12 rounded-xl border border-slate-100 dark:border-slate-700">
                <Text className="text-slate-400 mr-2 font-bold">MT</Text>
                <TextInput
                  style={{ fontFamily: 'Inter-Bold', paddingVertical: 0, includeFontPadding: false }}
                  className="w-24 text-right text-base text-slate-900 dark:text-white font-bold"
                  placeholder="0,00"
                  placeholderTextColor="#94a3b8"
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  cursorColor="#6366f1"
                />
              </View>
            </View>

            <LinearGradient
               colors={(isDark ? ['#312e81', '#1e1b4b'] : ['#f5f3ff', '#ede9fe']) as [string, string]}
               className="p-5 rounded-2xl flex-row justify-between items-center border border-indigo-100 dark:border-indigo-500/20"
            >
               <View>
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Total a Receber</Text>
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-indigo-900 dark:text-white mt-1">
                   {formatCurrency(total)}
                 </Text>
               </View>
               <View className="w-12 h-12 bg-white dark:bg-indigo-500/20 rounded-full items-center justify-center shadow-sm">
                 <ShoppingCart size={24} color={isDark ? "white" : "#6366f1"} />
               </View>
            </LinearGradient>
          </Card>

          <Button
            title="Confirmar e Finalizar"
            icon={<Plus size={20} color="white" />}
            onPress={handleSaveOrder}
            isLoading={isSubmitting}
            className="h-16 rounded-2xl shadow-xl shadow-indigo-500/30"
            textStyle={{ letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 13 }}
          />
        </Animated.View>
      </ScrollView>

      <ProductPickerModal
        visible={isProductModalVisible}
        onClose={() => setIsProductModalVisible(false)}
        onSelect={handleAddItem}
      />

      <PickerModal
        visible={isCustomerModalVisible}
        onClose={() => setIsCustomerModalVisible(false)}
        title="Selecionar Cliente"
        selectedValue={selectedCustomerId || ''}
        onSelect={(value) => {
           setSelectedCustomerId(value)
           const cust = customers.find(c => c.id === value)
           if (cust) setCustomerName(cust.name)
        }}
        options={customers.map(c => ({ label: c.name, value: c.id }))}
      />
    </Screen>
  )
}
