import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native'
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
import { Plus, Trash2, User, Package, ChevronRight, ShoppingCart } from 'lucide-react-native'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useFormatter } from '@/hooks/useFormatter'
import { feedback } from '@/utils/haptics'
import ProductPickerModal from '@/features/products/components/ProductPickerModal'
import PickerModal from '@/components/ui/PickerModal'

export default function CreateOrderScreen() {
  const router = useRouter()
  const { createOrder } = useOrders()
  const { formatCurrency } = useFormatter()
  const { settings } = useSettings()
  const { customers, fetchCustomers } = useCustomers()
  const { products, reload: fetchProducts } = useProducts()
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const { user } = useAuthStore()

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
      // If including tax, the item total should already include it, 
      // or we calculate it here if needed. 
      // Assuming unit_price is base price.
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
    try {
      await createOrder({
        company_id: activeCompanyId!,
        customer_id: selectedCustomerId,
        customer_name: customerName,
        user_id: user!.id,
        number: Math.floor(1000 + Math.random() * 9000).toString(),
        status: 'pending',
        total_amount: total,
        discount: parseFloat(discount || '0'),
        tax_amount: settings.include_tax === 1 ? items.reduce((acc, item) => acc + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0) : 0,
        notes: ''
      }, items)

      feedback.success()
      useToastStore.getState().show('Pedido criado e stock atualizado!', 'success')
      router.back()
    } catch (e) {
      useToastStore.getState().show('Não foi possível criar o pedido.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen withHeader padHorizontal={false} className="bg-slate-50 dark:bg-slate-950">
      <Header title="Novo Pedido" />
      
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-10">
        {/* Cliente */}
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Identificação do Cliente</Text>
        <Input
           label="Nome do Cliente / Empresa"
           placeholder="Ex: João Silva ou Supermercado XYZ"
           value={customerName}
           onChangeText={setCustomerName}
           className="mb-4"
        />
        
        <TouchableOpacity 
          onPress={() => setIsCustomerModalVisible(true)}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex-row items-center justify-between mb-6 border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 bg-primary/5 dark:bg-primary/20 rounded-xl items-center justify-center mr-3">
              <User size={20} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text 
                style={{ fontFamily: 'Inter-Medium' }} 
                className="text-slate-700 dark:text-white text-base"
                numberOfLines={1}
              >
                {customers.find(c => c.id === selectedCustomerId)?.name || 'Vincular a Cliente Cadastrado (Opcional)'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* Itens */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">Itens do Pedido</Text>
          <TouchableOpacity onPress={() => setIsProductModalVisible(true)} className="flex-row items-center">
            <Plus size={16} color="#4f46e5" />
            <Text className="text-primary font-bold ml-1">Adicionar</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <Card className="items-center p-8 border-dashed border-slate-200 dark:border-slate-800 bg-transparent mb-6">
            <Package size={32} color="#cbd5e1" className="mb-2" />
            <Text className="text-slate-400 text-sm">Lista de itens vazia</Text>
          </Card>
        ) : (
          <View className="mb-6">
            {items.map((item, index) => (
              <Card key={index} className="mb-2 p-3 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-slate-800 dark:text-white font-semibold">{item.name}</Text>
                  <View className="flex-row items-center">
                    {item.reference && (
                      <Text className="text-[10px] font-bold text-primary mr-2 uppercase">REF: {item.reference}</Text>
                    )}
                    <Text className="text-xs text-slate-500">{item.quantity}x {formatCurrency(item.unit_price)}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-800 dark:text-white font-bold mr-3">{formatCurrency(item.total)}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.product_id)} className="p-2">
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Resumo */}
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Resumo de Valores</Text>
        <Card className="p-5 mb-8">
           <View className="flex-row justify-between mb-2">
              <Text className="text-slate-500">Subtotal</Text>
              <Text className="text-slate-700 dark:text-white font-medium">{formatCurrency(subtotal)}</Text>
           </View>
           <View className="flex-row justify-between items-center mb-4">
              <Text className="text-slate-500">Desconto</Text>
              <View className="w-24">
                <Input
                  className="bg-slate-50 dark:bg-slate-800 border-none h-8 text-right p-1"
                  placeholder="0.00"
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                />
              </View>
           </View>
           <View className="border-t border-slate-100 dark:border-slate-700 pt-4 flex-row justify-between items-center">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-slate-800 dark:text-white">Total</Text>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-primary dark:text-primary-dark">{formatCurrency(total)}</Text>
           </View>
        </Card>

        <Button
          title="Finalizar Pedido"
          icon={<Plus size={20} color="white" />}
          onPress={handleSaveOrder}
          isLoading={isSubmitting}
          className="py-4"
        />
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
