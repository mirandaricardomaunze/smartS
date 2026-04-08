import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { usePOSStore, CartItem } from '../store/posStore'
import { useFormatter } from '@/hooks/useFormatter'

interface CartSummaryProps {
  onCheckout: () => void
}

export default function CartSummary({ onCheckout }: CartSummaryProps) {
  const { cart, updateQuantity, removeFromCart, getTotal, getSubtotal, getTaxTotal, clearCart } = usePOSStore()
  const { formatCurrency } = useFormatter()

  if (cart.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
          <ShoppingBag size={40} color="#64748b" />
        </View>
        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Carrinho Vazio
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-center">
          Adicione produtos para iniciar uma venda
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#0f172a]/95 shadow-premium-lg rounded-t-[32px]">
      <View className="p-4 border-b border-slate-100 dark:border-white/5 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-slate-900 dark:text-white">
          Carrinho ({cart.length})
        </Text>
        <TouchableOpacity onPress={clearCart}>
          <Text className="text-red-500 font-medium">Limpar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-2">
        {cart.map((item) => (
          <View key={item.id} className="flex-row items-center mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl">
            <View className="flex-1">
              <Text className="font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                {item.name}
              </Text>
              <View className="flex-row items-center">
                {item.reference && (
                  <Text className="text-[10px] font-bold text-primary mr-2 uppercase">REF: {item.reference}</Text>
                )}
                <Text className="text-xs text-slate-500">
                  {formatCurrency(item.sale_price || 0)} / un
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-xl px-2 py-1 mx-2">
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} className="p-1">
                <Minus size={16} color="#4f46e5" />
              </TouchableOpacity>
              <Text className="mx-3 font-bold text-slate-900 dark:text-white">
                {item.quantity}
              </Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} className="p-1">
                <Plus size={16} color="#4f46e5" />
              </TouchableOpacity>
            </View>

            <View className="items-end min-w-[70px]">
              <Text className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(item.total)}
              </Text>
              <TouchableOpacity onPress={() => removeFromCart(item.id)} className="mt-1">
                <Trash2 size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="p-6 bg-slate-50 dark:bg-slate-900 rounded-t-[32px]">
        <View className="flex-row justify-between mb-2">
          <Text className="text-slate-500 dark:text-slate-400">Subtotal</Text>
          <Text className="text-slate-900 dark:text-white font-medium">
            {formatCurrency(getSubtotal())}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-slate-500 dark:text-slate-400">IVA Estimado</Text>
          <Text className="text-slate-900 dark:text-white font-medium">
            {formatCurrency(getTaxTotal())}
          </Text>
        </View>
        <View className="h-[1px] bg-slate-200 dark:bg-slate-800 my-2" />
        <View className="flex-row justify-between mb-6">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Total</Text>
          <Text className="text-xl font-bold text-primary">
            {formatCurrency(getTotal())}
          </Text>
        </View>

        <Button
          title="Finalizar Venda"
          variant="gradient"
          gradientColors={['#4f46e5', '#818cf8']}
          onPress={onCheckout}
          icon={<ShoppingBag size={20} color="white" />}
        />
      </View>
    </View>
  )
}
