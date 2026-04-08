import React, { useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import ProductSelector from '@/features/pos/components/ProductSelector'

import CartSummary from '@/features/pos/components/CartSummary'
import PaymentModal from '@/features/pos/components/PaymentModal'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { feedback } from '@/utils/haptics'
import { usePOSStore } from '@/features/pos/store/posStore'
import ParkedCartsModal from '@/features/pos/components/ParkedCartsModal'
import IconButton from '@/components/ui/IconButton'
import { Scan, Clock } from 'lucide-react-native'
import { Text } from 'react-native'
import POSScannerModal from '@/features/pos/components/POSScannerModal'

export default function POSScreen() {
  const [showPayment, setShowPayment] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showParked, setShowParked] = useState(false)
  const { parkedCarts } = usePOSStore()

  return (
    <Screen padHorizontal={false} withHeader>
      <Header 
        title="Ponto de Venda" 
        rightElement={
          <View className="flex-row items-center">
            <View>
              <IconButton 
                icon={Clock} 
                onPress={() => setShowParked(true)} 
                iconSize={18}
                className="mr-2"
              />
              {parkedCarts.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-amber-500 w-4 h-4 rounded-full items-center justify-center border border-indigo-600">
                  <Text className="text-white text-[8px] font-black">{parkedCarts.length}</Text>
                </View>
              )}
            </View>

            <IconButton 
              icon={Scan} 
              onPress={() => setShowScanner(true)}
              iconSize={18}
            />
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

      <POSScannerModal
        isVisible={showScanner}
        onClose={() => setShowScanner(false)}
      />
    </Screen>
  )
}
