import React, { useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Linking, Share, ActivityIndicator } from 'react-native'
import DetailModalLayout, { DetailStat, DetailSectionItem } from '@/components/ui/DetailModalLayout'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Customer } from '@/types'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  History,
  MessageSquare,
  PhoneCall,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Edit2,
  FileText
} from 'lucide-react-native'
import { useFormatter } from '@/hooks/useFormatter'
import { formatDate } from '@/utils/formatters'
import { feedback } from '@/utils/haptics'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useCustomerDetails } from '../hooks/useCustomerDetails'
import Loading from '@/components/ui/Loading'
import { crmService } from '../services/crmService'
import { useToastStore } from '@/store/useToastStore'
import { reportService } from '@/features/reports/services/reportService'

interface CustomerDetailModalProps {
  visible: boolean
  onClose: () => void
  customerId: string | null
  onEdit?: () => void
}

export default function CustomerDetailModal({ visible, onClose, customerId, onEdit }: CustomerDetailModalProps) {
  const { formatCurrency } = useFormatter()
  const { customer, recentOrders, isLoading, refresh } = useCustomerDetails(customerId)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const stats = useMemo(() => {
    if (!customerId || !visible || !customer) return []
    const customerStats = crmService.getCustomerStats(customerId)
    return [
      { 
        label: 'Pedidos', 
        value: customerStats?.orders_count || 0, 
        icon: ShoppingBag, 
        variant: 'info' 
      },
      { 
        label: 'Total', 
        value: formatCurrency(customerStats?.lifetime_value || 0), 
        icon: TrendingUp, 
        variant: 'success' 
      },
      { 
        label: 'Dívida', 
        value: formatCurrency(customerStats?.total_debt || 0), 
        icon: CreditCard, 
        variant: (customerStats?.total_debt || 0) > 0 ? 'danger' : 'neutral'
      }
    ] as DetailStat[]
  }, [customerId, visible, customer, formatCurrency])

  const sections = useMemo(() => {
    if (!customer) return []
    return [
      { 
        icon: Phone, 
        label: 'Telemóvel', 
        value: customer.phone, 
        action: () => Linking.openURL(`tel:${customer.phone}`),
        actionIcon: PhoneCall 
      },
      { 
        icon: Mail, 
        label: 'Email', 
        value: customer.email, 
        action: customer.email ? () => Linking.openURL(`mailto:${customer.email}`) : undefined,
        actionIcon: Mail 
      },
      { icon: CreditCard, label: 'NIF / NUIT', value: customer.nif },
      { icon: MapPin, label: 'Endereço', value: customer.address }
    ] as DetailSectionItem[]
  }, [customer])

  if (!visible) return null
  
  if (isLoading && !customer) {
    return (
      <DetailModalLayout visible={visible} onClose={onClose} title="Carregando..." height={0.5}>
        <View className="p-10"><Loading message="Carregando detalhes..." /></View>
      </DetailModalLayout>
    )
  }
  
  if (!customer && !isLoading) {
    return (
      <DetailModalLayout visible={visible} onClose={onClose} title="Erro" height={0.4}>
        <View className="items-center justify-center p-10">
          <AlertCircle size={48} color="#f43f5e" />
          <Text className="text-slate-400 mt-4 text-center">Cliente não encontrado ou removido.</Text>
        </View>
      </DetailModalLayout>
    )
  }

  const currentCustomer = customer!

  const handleWhatsApp = () => {
     if (currentCustomer.phone) {
        feedback.light()
        Linking.openURL(`whatsapp://send?phone=${currentCustomer.phone.replace(/\s/g, '')}`)
     }
  }

  const handleSendReminder = async () => {
    feedback.light()
    const customerStats = crmService.getCustomerStats(customerId!)
    const message = `Olá ${currentCustomer.name}, esperamos que esteja bem! Gostaríamos de lembrar que possui um saldo pendente de ${formatCurrency(customerStats?.total_debt || 0)} referente a compras anteriores. Poderia confirmar para quando prevê regularizar? Obrigado!`
    try {
      await Share.share({ message })
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkAsPaid = async (orderId: string) => {
    feedback.medium()
    try {
      crmService.markOrderAsPaid(orderId)
      useToastStore.getState().show('Pedido marcado como pago', 'success')
      refresh()
    } catch (e) {
      useToastStore.getState().show('Erro ao atualizar pedido', 'error')
    }
  }

  const handleGenerateStatement = async () => {
    if (!customerId) return
    feedback.light()
    setIsGeneratingPdf(true)
    try {
      await reportService.generateCustomerStatement(customerId)
    } catch (e) {
      useToastStore.getState().show('Erro ao gerar extrato', 'error')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const customerStats = crmService.getCustomerStats(customerId!)

  return (
    <DetailModalLayout
      visible={visible}
      onClose={onClose}
      title={currentCustomer.name}
      height={0.92}
      headerIcon={
        <View className="w-14 h-14 rounded-3xl bg-indigo-600 items-center justify-center shadow-lg shadow-indigo-500/30">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl text-white font-black">
            {currentCustomer.name?.substring(0, 1).toUpperCase()}
          </Text>
        </View>
      }
      headerBadge={{ label: 'Activo', variant: 'success' }}
      secondaryBadge={customerStats && customerStats.lifetime_value > 5000 ? { label: 'VIP', variant: 'info' } : undefined}
      stats={stats}
      sections={sections}
      footerActions={
        <View className="flex-row w-full items-center">
          <View className="flex-1 mr-3">
            <Button 
              title="WhatsApp"
              variant="secondary"
              fullWidth={true}
              icon={<MessageSquare size={18} color="white" />}
              onPress={handleWhatsApp}
              className="bg-emerald-500 border-transparent rounded-2xl h-14"
              textStyle={{ fontSize: 11, textTransform: 'uppercase' }}
              disabled={!currentCustomer.phone}
            />
          </View>
          <View className="flex-[1.5]">
            <Button 
              title="Editar Cadastro"
              variant="primary"
              fullWidth={true}
              icon={<Edit2 size={16} color="white" />}
              onPress={() => { onClose(); onEdit?.() }}
              className="rounded-2xl h-14"
              textStyle={{ fontSize: 11, textTransform: 'uppercase' }}
            />
          </View>
        </View>
      }
    >
      {/* Debt Action Block */}
      {(customerStats?.total_debt || 0) > 0 && (
        <Animated.View entering={FadeInUp.delay(150)} className="mb-6">
          <TouchableOpacity 
            onPress={handleSendReminder}
            className="bg-rose-500 p-4 rounded-3xl flex-row items-center justify-between shadow-lg shadow-rose-500/20"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                <AlertCircle size={20} color="white" />
              </View>
              <View>
                <Text className="text-white font-bold text-sm">Enviar Lembrete de Cobrança</Text>
                <Text className="text-rose-100 text-[10px]">WhatsApp Share disponível</Text>
              </View>
            </View>
            <MessageSquare size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Recent Orders List */}
      <View className="flex-row items-center justify-between mb-3 mx-1 mt-2">
        <Text style={{ fontFamily: 'Inter-Black' }} className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">
           Histórico
        </Text>
        <TouchableOpacity 
          onPress={handleGenerateStatement}
          disabled={isGeneratingPdf}
          className="flex-row items-center bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20"
        >
          {isGeneratingPdf ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <>
              <FileText size={12} color="#6366f1" strokeWidth={2.5} />
              <Text className="ml-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase">Extrato PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <View className="mb-6">
         {recentOrders.length > 0 ? (
            recentOrders.map((order) => {
              const isPaid = order.status === 'completed' || order.status === 'paid'
              return (
                <View key={order.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl mb-3 border border-slate-100 dark:border-slate-800">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 items-center justify-center mr-3">
                         <History size={16} color="#6366f1" />
                      </View>
                      <View>
                        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-sm font-bold">
                          Pedido #{order.number}
                        </Text>
                        <Text className="text-slate-400 text-[10px]">
                          {formatDate(order.created_at)}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white text-base font-bold">
                      {formatCurrency(order.total_amount)}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                    <Badge 
                      label={isPaid ? 'Pago' : 'Pendente'} 
                      variant={isPaid ? 'success' : 'warning'}
                    />
                    {!isPaid && (
                       <TouchableOpacity 
                         onPress={() => handleMarkAsPaid(order.id)}
                         className="flex-row items-center bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"
                       >
                         <CheckCircle2 size={14} color="#10b981" />
                         <Text className="ml-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">Pagar</Text>
                       </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            })
         ) : (
            <View className="bg-slate-50 dark:bg-slate-900 p-10 rounded-3xl items-center border border-dashed border-slate-200 dark:border-slate-800">
               <ShoppingBag size={24} color="#94a3b8" />
               <Text className="text-slate-400 text-xs mt-2">Nenhum pedido registado</Text>
            </View>
         )}
      </View>
    </DetailModalLayout>
  )
}
