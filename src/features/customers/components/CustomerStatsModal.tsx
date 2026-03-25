import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { X, TrendingUp, ShoppingBag, CreditCard, Calendar, Star, Trophy } from 'lucide-react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import { Customer } from '@/types'
import { crmService } from '../services/crmService'
import { useFormatter } from '@/hooks/useFormatter'
import Card from '@/components/ui/Card'
import { LinearGradient } from 'expo-linear-gradient'

interface CustomerStatsModalProps {
  isVisible: boolean
  onClose: () => void
  customer: Customer | null
}

export default function CustomerStatsModal({ isVisible, onClose, customer }: CustomerStatsModalProps) {
  const { formatCurrency } = useFormatter()
  
  const stats = useMemo(() => {
    if (!customer) return null
    return crmService.getCustomerStats(customer.id)
  }, [customer])

  if (!customer || !stats) return null

  const lastPurchaseDate = stats.last_purchase 
    ? new Date(stats.last_purchase).toLocaleDateString('pt-PT') 
    : 'Nunca'

  return (
    <BottomSheet visible={isVisible} onClose={onClose}>
      <ScrollView className="px-6 pb-10" showsVerticalScrollIndicator={false}>
        {/* Header with Avatar/Initial */}
        <View className="items-center mb-8">
            <LinearGradient
                colors={['#4f46e5', '#818cf8']}
                className="w-20 h-20 rounded-full items-center justify-center mb-4 shadow-xl shadow-indigo-500/20"
            >
                <Text className="text-white text-3xl font-black">{customer.name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <Text className="text-2xl font-black text-slate-900 dark:text-white text-center">{customer.name}</Text>
            <Text className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Perfil do Cliente</Text>
        </View>

        {/* Level Badge */}
        <View className="mb-8 items-center">
            <View className={`px-4 py-2 rounded-full flex-row items-center ${stats.lifetime_value > 5000 ? 'bg-amber-100 border border-amber-200' : 'bg-slate-100 border border-slate-200'}`}>
                <Trophy size={14} color={stats.lifetime_value > 5000 ? '#b45309' : '#64748b'} />
                <Text className={`font-black text-[10px] ml-2 uppercase tracking-tighter ${stats.lifetime_value > 5000 ? 'text-amber-700' : 'text-slate-600'}`}>
                    {stats.lifetime_value > 5000 ? 'Cliente VIP / Diamante' : 'Cliente Fiel'}
                </Text>
            </View>
        </View>

        {/* Main Stats Grid */}
        <View className="flex-row justify-between mb-6">
            <Card variant="premium" className="w-[48%] p-5 rounded-[24px]">
                <View className="w-10 h-10 bg-emerald-500/10 rounded-xl items-center justify-center mb-4">
                    <TrendingUp size={20} color="#10b981" />
                </View>
                <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Comprado</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white leading-5">
                    {formatCurrency(stats.lifetime_value)}
                </Text>
            </Card>

            <Card variant="premium" className="w-[48%] p-5 rounded-[24px]">
                <View className="w-10 h-10 bg-indigo-500/10 rounded-xl items-center justify-center mb-4">
                    <ShoppingBag size={20} color="#4f46e5" />
                </View>
                <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pedidos</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white leading-5">
                    {stats.orders_count}
                </Text>
            </Card>
        </View>

        <View className="flex-row justify-between mb-10">
            <Card variant="premium" className="w-[48%] p-5 rounded-[24px]">
                <View className="w-10 h-10 bg-blue-500/10 rounded-xl items-center justify-center mb-4">
                    <CreditCard size={20} color="#3b82f6" />
                </View>
                <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ticket Médio</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white leading-5">
                    {formatCurrency(stats.avg_ticket)}
                </Text>
            </Card>

            <Card variant="premium" className="w-[48%] p-5 rounded-[24px]">
                <View className="w-10 h-10 bg-amber-500/10 rounded-xl items-center justify-center mb-4">
                    <Calendar size={20} color="#f59e0b" />
                </View>
                <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Última Compra</Text>
                <Text className="text-sm font-black text-slate-900 dark:text-white leading-5 mt-1">
                    {lastPurchaseDate}
                </Text>
            </Card>
        </View>

        {/* Favorite Products */}
        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Produtos Favoritos</Text>
        <Card className="bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 p-4 rounded-[24px] mb-10">
            {stats.top_products.length > 0 ? stats.top_products.map((p, index) => (
                <View key={index} className={`flex-row items-center justify-between py-3 ${index !== stats.top_products.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-amber-500/10 rounded-full items-center justify-center mr-3">
                            <Star size={14} color="#f59e0b" />
                        </View>
                        <Text className="text-slate-900 dark:text-white font-bold text-sm">{p.name}</Text>
                    </View>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">{p.quantity} unid.</Text>
                </View>
            )) : (
                <Text className="text-slate-400 text-sm py-2 text-center">Nenhum histórico disponível</Text>
            )}
        </Card>

        {/* Info Box */}
        <View className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-[24px] border border-indigo-100 dark:border-indigo-900/40 mb-10">
            <Text className="text-indigo-600 dark:text-indigo-300 text-xs leading-5 font-medium">
                Este cliente tem uma frequência de compra estável. Recomende a ele os seus produtos favoritos para aumentar o ticket médio.
            </Text>
        </View>
      </ScrollView>
    </BottomSheet>
  )
}
