import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { X, ShoppingCart, Trash2, Clock, ChevronRight } from 'lucide-react-native'
import { usePOSStore } from '../store/posStore'
import { feedback } from '@/utils/haptics'
import { useFormatter } from '@/hooks/useFormatter'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ParkedCartsModalProps {
  isVisible: boolean
  onClose: () => void
}

export default function ParkedCartsModal({ isVisible, onClose }: ParkedCartsModalProps) {
  const insets = useSafeAreaInsets()
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
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View 
          className="bg-white dark:bg-slate-950 rounded-t-[40px] px-6 pb-10"
          style={{ paddingTop: 30, height: '70%' }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white">Carrinhos Suspensos</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">Gestão de múltiplos atendimentos</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-full items-center justify-center"
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Action Button */}
          {cart.length > 0 && (
            <Button 
                title="Suspender Carrinho Atual"
                onPress={handlePark}
                className="mb-6 h-14 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20"
                icon={<Clock size={20} color="white" />}
            />
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {parkedCarts.length > 0 ? (
              parkedCarts.map((item) => {
                const total = item.cart.reduce((acc, i) => acc + (i.total || 0), 0)
                const itemsCount = item.cart.reduce((acc, i) => acc + i.quantity, 0)
                
                return (
                  <Card key={item.id} className="mb-4 p-5 bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 rounded-[24px]">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-bold text-base" numberOfLines={1}>
                          {item.customer?.name || 'Cliente Ocasional'}
                        </Text>
                        <View className="flex-row items-center mt-1">
                           <Clock size={12} color="#94a3b8" />
                           <Text className="text-slate-400 text-[10px] font-bold ml-1 uppercase">
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
                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Valor do Carrinho</Text>
                        <Text className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{formatCurrency(total)}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleResume(item.id)}
                        className="flex-row items-center bg-indigo-500 px-4 py-2.5 rounded-xl"
                      >
                        <Text className="text-white font-bold text-xs mr-1">Retomar</Text>
                        <ChevronRight size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                    
                    <View className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5">
                        <Text className="text-slate-400 text-[10px] font-medium italic">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} no carrinho
                        </Text>
                    </View>
                  </Card>
                )
              })
            ) : (
                <View className="items-center justify-center py-10">
                    <View className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full items-center justify-center mb-4">
                        <ShoppingCart size={32} color="#94a3b8" />
                    </View>
                    <Text className="text-slate-500 dark:text-slate-400 font-bold text-center">Nenhum carrinho suspenso</Text>
                    <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-1">Suspenda atendimentos para retomar mais tarde</Text>
                </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
