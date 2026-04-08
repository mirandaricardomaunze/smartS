import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { X, ShoppingCart, Trash2, Clock, ChevronRight } from 'lucide-react-native'
import { usePOSStore } from '../store/posStore'
import { feedback } from '@/utils/haptics'
import { useFormatter } from '@/hooks/useFormatter'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import BottomSheet from '@/components/ui/BottomSheet'

interface ParkedCartsModalProps {
  isVisible: boolean
  onClose: () => void
}

export default function ParkedCartsModal({ isVisible, onClose }: ParkedCartsModalProps) {
  const { formatCurrency } = useFormatter()
  const { parkedCarts, resumeCart, removeParkedCart, parkCurrentCart, cart } = usePOSStore()

  const handleResume = (id: string) => {
    feedback.light()
    resumeCart(id)
    onClose()
  }

  const handlePark = () => {
    feedback.light()
    parkCurrentCart()
  }

  const handleRemove = (id: string) => {
    feedback.medium()
    removeParkedCart(id)
  }

  return (
    <BottomSheet visible={isVisible} onClose={onClose} height={0.85}>
      <View className="bg-white dark:bg-slate-950 flex-1">
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-5">
          <View>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">Carrinhos Suspensos</Text>
            <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">Gestão de múltiplos atendimentos</Text>
          </View>
          <TouchableOpacity 
            onPress={onClose}
            className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
          >
            <X size={20} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {/* Action Button for Current Cart */}
        {cart.length > 0 && (
          <View className="px-6 pb-2 border-b border-slate-100 dark:border-slate-800/50 mb-2">
            <Button 
                title="Suspender Carrinho Atual"
                onPress={handlePark}
                className="h-14 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20"
                icon={<Clock size={20} color="white" />}
            />
          </View>
        )}

        <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {parkedCarts.length > 0 ? (
            parkedCarts.map((item) => {
              const total = item.cart.reduce((acc, i) => acc + (i.total || 0), 0)
              const itemsCount = item.cart.reduce((acc, i) => acc + i.quantity, 0)
              
              return (
                <Card key={item.id} className="mb-4 p-5 bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 rounded-[24px]">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base" numberOfLines={1}>
                        {item.customer?.name || 'Cliente Ocasional'}
                      </Text>
                      <View className="flex-row items-center mt-1">
                         <Clock size={12} color="#94a3b8" />
                         <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-400 text-[10px] font-bold ml-1 uppercase">
                           {new Date(item.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                         </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleRemove(item.id)}
                      className="w-8 h-8 bg-rose-500/10 rounded-full items-center justify-center"
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Valor do Carrinho</Text>
                      <Text style={{ fontFamily: 'Inter-Black' }} className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{formatCurrency(total)}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleResume(item.id)}
                      className="flex-row items-center bg-indigo-500 px-4 py-2.5 rounded-xl"
                    >
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white font-bold text-xs mr-1">Retomar</Text>
                      <ChevronRight size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5">
                      <Text style={{ fontFamily: 'Inter-Medium' }} className="text-slate-400 text-[10px] font-medium italic">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} no carrinho
                      </Text>
                  </View>
                </Card>
              )
            })
          ) : (
              <View className="items-center justify-center py-10 mt-10">
                  <View className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full items-center justify-center mb-4">
                      <ShoppingCart size={32} color="#94a3b8" />
                  </View>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-500 dark:text-slate-400 font-bold text-center">Nenhum carrinho suspenso</Text>
                  <Text style={{ fontFamily: 'Inter-Medium' }} className="text-slate-400 dark:text-slate-500 text-xs text-center mt-1">Suspenda atendimentos para retomar mais tarde</Text>
              </View>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  )
}
