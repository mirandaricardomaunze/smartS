import React, { useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Scan } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import ProductSelector from '@/features/pos/components/ProductSelector'
import CartSummary from '@/features/pos/components/CartSummary'
import PaymentModal from '@/features/pos/components/PaymentModal'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { feedback } from '@/utils/haptics'
import { usePOSStore } from '@/features/pos/store/posStore'
import ParkedCartsModal from '@/features/pos/components/ParkedCartsModal'
import { Clock } from 'lucide-react-native'
import { Text } from 'react-native'

export default function POSScreen() {
  const router = useRouter()
  const [showPayment, setShowPayment] = useState(false)
  const [showParked, setShowParked] = useState(false)
  const { parkedCarts } = usePOSStore()

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950" withHeader>
      <Header 
        title="Ponto de Venda" 
        rightElement={
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => {
                feedback.light()
                setShowParked(true)
              }}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 active:bg-white/20 mr-2"
            >
              <Clock size={18} color="white" />
              {parkedCarts.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-amber-500 w-4 h-4 rounded-full items-center justify-center border border-indigo-600">
                  <Text className="text-white text-[8px] font-black">{parkedCarts.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                feedback.light()
                router.push('/(app)/scanner')
              }}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 active:bg-white/20"
            >
              <Scan size={18} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
      
      <View className="flex-1">
        {/* Product selector grid */}
        <View className="flex-[0.6]">
           <ProductSelector />
        </View>

        {/* Cart section */}
        <View className="flex-[0.4]">
           <CartSummary onCheckout={() => setShowPayment(true)} />
        </View>
      </View>

      <PaymentModal 
        isVisible={showPayment} 
        onClose={() => setShowPayment(false)} 
      />

      <ParkedCartsModal
        isVisible={showParked}
        onClose={() => setShowParked(false)}
      />
    </Screen>
  )
}
