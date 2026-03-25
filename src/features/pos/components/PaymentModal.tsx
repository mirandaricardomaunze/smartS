import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, Share, TextInput } from 'react-native'
import { CreditCard, Banknote, Smartphone, CheckCircle2, ChevronRight, UserPlus, Printer } from 'lucide-react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import { usePOSStore } from '../store/posStore'
import { useFormatter } from '@/hooks/useFormatter'
import { orderService } from '@/services/orderService'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useRouter } from 'expo-router'
import { printService } from '@/services/printService'
import { companyRepository } from '@/repositories/companyRepository'
import { useToastStore } from '@/store/useToastStore'
import { Order } from '@/types'

interface PaymentModalProps {
  isVisible: boolean
  onClose: () => void
}

export default function PaymentModal({ isVisible, onClose }: PaymentModalProps) {
  const { cart, selectedCustomer, getTotal, clearCart } = usePOSStore()
  const { user } = useAuthStore()
  const { formatCurrency } = useFormatter()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [shouldPrint, setShouldPrint] = useState(true)
  const [isSplit, setIsSplit] = useState(false)
  const [payments, setPayments] = useState<{method: string, amount: number}[]>([])
  const [currentAmount, setCurrentAmount] = useState('')

  const handleFinalize = async () => {
    if (!user || !user.company_id) {
       useToastStore.getState().show('Utilizador não autenticado ou sem empresa associada', 'error')
       return
    }

    setIsProcessing(true)
    try {
      const orderData = {
        company_id: user.company_id,
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || 'Consumidor Final',
        user_id: user.id,
        number: `PDV-${Date.now().toString().slice(-6)}`,
        status: 'completed' as const,
        total_amount: getTotal(),
        discount: 0,
        tax_amount: 0,
        notes: isSplit 
          ? `Venda via PDV - Pago dividido: ${payments.map(p => `${formatCurrency(p.amount)} (${p.method})`).join(', ')}`
          : `Venda via PDV - Pago por ${paymentMethod}`,
      }

      const items = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.sale_price || 0,
        tax_rate: item.tax_rate || 0,
        total: item.total,
      }))

      await orderService.processPosSale(orderData, items)
      
      if (shouldPrint) {
        const company = companyRepository.getById(user.company_id)
        if (company) {
          const receiptText = printService.formatThermalReceipt(orderData as any, items as any, company)
          await Share.share({
            message: receiptText,
            title: `Recibo #${orderData.number}`
          })
        }
      }
      
      useToastStore.getState().show(`Venda realizada com sucesso!${shouldPrint ? '\nImprimindo talão...' : ''}`, 'success')
      clearCart()
      onClose()
      router.push('/(app)/orders')
    } catch (error: any) {
      useToastStore.getState().show(error.message || 'Falha ao processar venda', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const paymentMethods = [
    { id: 'cash', name: 'Dinheiro', icon: Banknote, color: '#10b981' },
    { id: 'card', name: 'Cartão/TPA', icon: CreditCard, color: '#3b82f6' },
    { id: 'transfer', name: 'Transferência', icon: Smartphone, color: '#f59e0b' },
  ]

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0)
  const remaining = getTotal() - totalPaid
  const canFinalize = isSplit ? remaining === 0 : true

  const handleAddPayment = () => {
    const amt = parseFloat(currentAmount) || 0
    if (amt <= 0) return
    if (amt > remaining) {
      useToastStore.getState().show('O valor excede o restante a pagar.', 'warning')
      return
    }
    setPayments([...payments, { method: paymentMethod, amount: amt }])
    setCurrentAmount('')
  }

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  return (
    <BottomSheet
      visible={isVisible}
      onClose={onClose}
    >
      <ScrollView className="px-6 pb-10">
        <View className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[32px] items-center mb-8">
          <Text className="text-slate-500 dark:text-slate-400 mb-1">Total a Pagar</Text>
          <Text className="text-4xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(getTotal())}
          </Text>
        </View>

        <Text className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Método de Pagamento
        </Text>

        <View className="flex-row justify-between mb-6">
          {paymentMethods.map((method: any) => {
            const isSelected = paymentMethod === method.id
            const Icon = method.icon
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => setPaymentMethod(method.id)}
                className={`w-[31%] p-4 rounded-3xl items-center border-2 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900'
                }`}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mb-2" style={{ backgroundColor: `${method.color}20` }}>
                  <Icon size={20} color={method.color} />
                </View>
                <Text className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                  {method.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Multi-Payment Toggle */}
        <TouchableOpacity 
          onPress={() => {
            setIsSplit(!isSplit)
            setPayments([])
            setCurrentAmount('')
          }}
          className="flex-row items-center justify-between mb-6 px-2"
        >
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">
            Dividir Pagamento?
          </Text>
          <View className={`w-10 h-5 rounded-full px-1 justify-center ${isSplit ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <View className={`w-3 h-3 rounded-full bg-white ${isSplit ? 'ml-auto' : 'mr-auto'}`} />
          </View>
        </TouchableOpacity>

        {isSplit && (
          <View className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-[24px] p-5 mb-8">
            <View className="flex-row justify-between mb-4">
              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase">Restante</Text>
                <Text className={`text-xl font-black ${remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-black text-slate-400 uppercase">Total Pago</Text>
                <Text className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
            </View>

            {remaining > 0 && (
              <View className="flex-row space-x-2 mb-4">
                <TextInput
                  className="flex-1 bg-slate-50 dark:bg-slate-900 h-12 rounded-xl px-4 text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-white/5"
                  placeholder="Valor"
                  keyboardType="numeric"
                  value={currentAmount}
                  onChangeText={setCurrentAmount}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity 
                   onPress={handleAddPayment}
                   className="bg-indigo-600 px-6 rounded-xl items-center justify-center"
                >
                  <Text className="text-white font-bold">Add</Text>
                </TouchableOpacity>
              </View>
            )}

            {payments.map((p, i) => (
              <View key={i} className="flex-row items-center justify-between py-2 border-t border-slate-50 dark:border-white/5">
                <Text className="text-slate-600 dark:text-slate-400 font-bold">{p.method.toUpperCase()}</Text>
                <View className="flex-row items-center">
                  <Text className="text-slate-900 dark:text-white font-black mr-3">{formatCurrency(p.amount)}</Text>
                  <TouchableOpacity onPress={() => handleRemovePayment(i)}>
                    <Text className="text-rose-500 font-bold">X</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Cliente
        </Text>
        
        <TouchableOpacity className="flex-row items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-8">
          <View className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full items-center justify-center mr-3">
             <UserPlus size={20} color="#64748b" />
          </View>
          <View className="flex-1">
             <Text className="text-slate-900 dark:text-white font-bold">
               {selectedCustomer ? selectedCustomer.name : 'Consumidor Final (Default)'}
             </Text>
             <Text className="text-xs text-slate-500">Toque para selecionar outro</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </TouchableOpacity>

        {/* Print Receipt Toggle */}
        <TouchableOpacity 
            onPress={() => setShouldPrint(!shouldPrint)}
            className="flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-8 border border-transparent"
        >
            <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${shouldPrint ? 'bg-indigo-500/10' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <Printer size={20} color={shouldPrint ? '#4f46e5' : '#64748b'} />
                </View>
                <View>
                    <Text className="text-slate-900 dark:text-white font-bold">Imprimir Talão</Text>
                    <Text className="text-[10px] text-slate-500">Recibo automático após venda</Text>
                </View>
            </View>
            <View className={`w-12 h-6 rounded-full px-1 justify-center ${shouldPrint ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <View className={`w-4 h-4 rounded-full bg-white ${shouldPrint ? 'ml-auto' : 'mr-auto'}`} />
            </View>
        </TouchableOpacity>

        <Button
          title={isSplit ? (remaining === 0 ? "Finalizar Venda Dividida" : `Falta ${formatCurrency(remaining)}`) : "Confirmar Recebimento"}
          variant="gradient"
          gradientColors={canFinalize ? ['#4f46e5', '#818cf8'] : ['#94a3b8', '#cbd5e1']}
          isLoading={isProcessing}
          onPress={handleFinalize}
          disabled={!canFinalize}
        />
      </ScrollView>
    </BottomSheet>
  )
}
