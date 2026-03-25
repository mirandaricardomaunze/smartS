import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Camera, CameraView } from 'expo-camera'
import { useRouter } from 'expo-router'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useScanner } from '@/features/scanner/hooks/useScanner'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { PackageSearch, XCircle, Plus, Minus } from 'lucide-react-native'
import { useAuthStore } from '@/features/auth/store/authStore'
import { movementsRepository } from '@/repositories/movementsRepository'
import { useToastStore } from '@/store/useToastStore'
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing
} from 'react-native-reanimated'
import { feedback } from '@/utils/haptics'

export default function ScannerScreen() {
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const { isScanning, scannedData, handleBarCodeScanned, resetScanner } = useScanner()
  const { products, reload } = useProducts()
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.show)

  const beamY = useSharedValue(0)

  useEffect(() => {
    if (isScanning) {
      beamY.value = withRepeat(
        withTiming(280, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    } else {
      beamY.value = 0
    }
  }, [isScanning])

  const beamStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: beamY.value }]
  }))

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const foundProduct = scannedData ? products.find(p => p.barcode === scannedData) : null

  const handleQuickMovement = async (type: 'entry' | 'exit') => {
    if (!foundProduct || !user) return
    
    try {
      feedback.light()
      await movementsRepository.create({
        company_id: user.company_id!,
        product_id: foundProduct.id,
        type,
        quantity: 1,
        user_id: user.id,
        reason: `Ação Rápida via Scanner (${type === 'entry' ? 'Entrada' : 'Saída'})`
      })
      
      showToast(type === 'entry' ? 'Entrada registada (+1)' : 'Saída registada (-1)', 'success')
      reload() // Update local product list
    } catch (e: any) {
      showToast(e.message || 'Erro ao registar movimento', 'error')
    }
  }

  if (hasPermission === null) {
    return (
      <Screen className="justify-center items-center">
        <Text className="text-slate-500 dark:text-slate-400 font-medium">A pedir permissão da câmara...</Text>
      </Screen>
    )
  }
  if (hasPermission === false) {
    return (
      <Screen className="justify-center items-center">
        <Text className="text-rose-500 font-bold">Acesso à câmara negado.</Text>
        <Button 
          title="Tentar Novamente" 
          variant="ghost" 
          onPress={() => Camera.requestCameraPermissionsAsync().then(({status}) => setHasPermission(status === 'granted'))}
          className="mt-4"
        />
      </Screen>
    )
  }

  return (
    <Screen padHorizontal={false} className="bg-white dark:bg-slate-950 flex-1" withHeader>
      <Header title="Scanner de Código de Barras" showBack />
      
      <View className="flex-1 relative bg-slate-50 dark:bg-slate-950">
        {isScanning ? (
          <View className="flex-1 overflow-hidden">
            <CameraView 
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                 barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
              }}
            />
            
            {/* Premium Scanner Overlay */}
            <View style={StyleSheet.absoluteFill} className="items-center justify-center">
              <View className="w-72 h-72 border-2 border-primary/50 rounded-[40px] items-center justify-center overflow-hidden">
                {/* Scanning Beam (Animated) */}
                <Animated.View 
                  className="w-full h-[2px] bg-indigo-500 absolute top-0 shadow-lg shadow-indigo-500"
                  style={[beamStyle, { opacity: 0.8 }]}
                />
                
                {/* Corner Accents */}
                <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
                <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
                <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
                <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-3xl" />
              </View>

              <View className="mt-12 bg-black/60 px-6 py-3 rounded-full border border-white/20">
                <Text className="text-white font-bold text-sm tracking-wide">
                  Posicione o código no centro
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center px-6">
             <Animated.View entering={FadeInUp} className="w-full">
               <Card variant="premium" className="p-8 rounded-[40px] shadow-premium-lg">
                  {foundProduct ? (
                    <View className="items-center">
                       <View className="w-20 h-20 bg-emerald-500/20 rounded-3xl items-center justify-center mb-6">
                         <PackageSearch size={40} color="#10b981" />
                       </View>
                       
                       <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white text-center mb-1">
                         {foundProduct.name}
                       </Text>
                       <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">
                         EAN: {scannedData}
                       </Text>
                       
                       <View className="w-full h-[1px] bg-slate-100 dark:bg-white/5 mb-6" />
                       <View className="flex-row justify-between w-full mb-3">
                         <TouchableOpacity 
                           onPress={() => handleQuickMovement('entry')}
                           className="flex-1 mr-2 flex-row items-center justify-center bg-emerald-500/10 border border-emerald-500/20 py-4 rounded-2xl"
                         >
                           <Plus size={20} color="#10b981" />
                           <Text className="text-emerald-600 font-bold ml-2">Entrada</Text>
                         </TouchableOpacity>

                         <TouchableOpacity 
                           onPress={() => handleQuickMovement('exit')}
                           className="flex-1 ml-2 flex-row items-center justify-center bg-rose-500/10 border border-rose-500/20 py-4 rounded-2xl"
                         >
                           <Minus size={20} color="#ef4444" />
                           <Text className="text-rose-600 font-bold ml-2">Saída</Text>
                         </TouchableOpacity>
                       </View>

                       <Button 
                         title="Registar Outra Qtd" 
                         variant="ghost"
                         className="w-full mb-3"
                         onPress={() => {
                            feedback.light()
                            resetScanner()
                            router.push({ pathname: '/(app)/movements/create', params: { productId: foundProduct.id }})
                         }}
                       />
                       <Button 
                         title="Ver Ficha do Produto" 
                         variant="secondary"
                         className="w-full h-14 rounded-2xl mb-4 border-slate-200 dark:border-white/10"
                         onPress={() => {
                            feedback.light()
                            resetScanner()
                            router.push(`/(app)/products/${foundProduct.id}`)
                         }}
                       />
                    </View>
                  ) : scannedData ? (
                    <View className="items-center">
                       <View className="w-20 h-20 bg-rose-500/20 rounded-3xl items-center justify-center mb-6">
                         <XCircle size={40} color="#ef4444" />
                       </View>
                       
                       <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white text-center mb-1">
                         Não Encontrado
                       </Text>
                       <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">
                         Código: {scannedData}
                       </Text>

                       <View className="w-full h-[1px] bg-slate-100 dark:bg-white/5 mb-6" />
                       <Button 
                         title="Criar Novo Produto" 
                         className="w-full h-14 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20"
                         onPress={() => {
                            feedback.light()
                            resetScanner()
                            router.push({ pathname: '/(app)/products/create', params: { barcode: scannedData }})
                         }}
                       />
                    </View>
                  ) : (
                    <View className="items-center py-10">
                       <ActivityIndicator size="large" color="#6366f1" />
                       <Text className="text-slate-500 mt-4">A processar...</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    onPress={() => { feedback.light(); resetScanner() }}
                    className="flex-row items-center justify-center py-2"
                  >
                    <Text className="text-indigo-500 font-black text-[10px] uppercase tracking-widest">Tentar Novamente</Text>
                  </TouchableOpacity>
               </Card>
             </Animated.View>
          </View>
        )}
      </View>
    </Screen>
  )
}
