import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Vibration, useColorScheme } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
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
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const { isScanning, scannedData, handleBarCodeScanned, resetScanner } = useScanner()
  const { products, reload } = useProducts()
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.show)
  const [showResult, setShowResult] = useState(false)
  const [processing, setProcessing] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const beamY = useSharedValue(0)

  useEffect(() => {
    if (isScanning) {
      beamY.value = withRepeat(
        withTiming(280, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    } else {
      beamY.value = 0
    }
  }, [isScanning])

  useEffect(() => {
    if (scannedData) {
      feedback.success()
      Vibration.vibrate(100)
      setShowResult(true)
      
      // Auto-hide result after 5 seconds of inactivity
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setShowResult(false)
      }, 5000)
    }
  }, [scannedData])

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
      setProcessing(true)
      feedback.medium()
      await movementsRepository.create({
        company_id: user.company_id!,
        product_id: foundProduct.id,
        type,
        quantity: 1,
        user_id: user.id,
        reason: `Ação Rápida via Scanner (${type === 'entry' ? 'Entrada' : 'Saída'})`
      })
      
      Vibration.vibrate(50)
      showToast(type === 'entry' ? 'Entrada registada (+1)' : 'Saída registada (-1)', 'success')
      reload() 
    } catch (e: any) {
      showToast(e.message || 'Erro ao registar movimento', 'error')
    } finally {
      setProcessing(false)
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
      
      <View className="flex-1 relative bg-slate-950">
        <View className="flex-1 overflow-hidden">
          <CameraView 
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
          />
          
          {/* Main Scanning Frame */}
          <View style={StyleSheet.absoluteFill} className="items-center justify-center">
            <View className="w-72 h-72 border-2 border-white/20 rounded-[40px] items-center justify-center overflow-hidden">
              <Animated.View 
                className="w-full h-[3px] bg-indigo-500 absolute top-0 shadow-lg shadow-indigo-500"
                style={[beamStyle, { opacity: 0.9 }]}
              />
              <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-3xl opacity-80" />
              <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-3xl opacity-80" />
              <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-3xl opacity-80" />
              <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-3xl opacity-80" />
            </View>

            <View className="mt-8 bg-black/40 px-6 py-2 rounded-full border border-white/10">
              <Text className="text-white/80 font-bold text-xs">A aguardar leitura...</Text>
            </View>
          </View>

          {/* Floating Result Card (Non-blocking) */}
          {showResult && (
            <Animated.View 
              entering={FadeInDown.springify()} 
              className="absolute bottom-10 left-6 right-6"
            >
              <Card variant="premium" className="p-5 rounded-[32px] shadow-premium-lg border-white/10">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    {foundProduct ? (
                      <>
                        <View className="flex-row items-center mb-1">
                          <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                          <Text style={{ fontFamily: 'Inter-Black' }} className="text-lg font-black text-slate-900 dark:text-white" numberOfLines={1}>
                            {foundProduct.name}
                          </Text>
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                          Stock: {foundProduct.current_stock} • REF: {foundProduct.reference || '---'} • EAN: {scannedData}
                        </Text>
                      </>
                    ) : (
                      <>
                        <View className="flex-row items-center mb-1">
                          <View className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                          <Text style={{ fontFamily: 'Inter-Black' }} className="text-lg font-black text-slate-900 dark:text-white">
                            Desconhecido
                          </Text>
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                          CÓDIGO: {scannedData}
                        </Text>
                      </>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    onPress={() => setShowResult(false)}
                    className="w-8 h-8 bg-slate-100 dark:bg-white/10 rounded-full items-center justify-center"
                  >
                    <XCircle size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <View className="w-full h-[1px] bg-slate-100 dark:bg-white/5 my-4" />

                <View className="flex-row space-x-3">
                  {foundProduct ? (
                    <>
                      <TouchableOpacity 
                        disabled={processing}
                        onPress={() => handleQuickMovement('entry')}
                        className="flex-1 flex-row items-center justify-center bg-indigo-500 py-3.5 rounded-2xl shadow-sm"
                      >
                        <Plus size={18} color="white" />
                        <Text className="text-white font-bold ml-2">Entrada</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        disabled={processing}
                        onPress={() => handleQuickMovement('exit')}
                        className="flex-1 flex-row items-center justify-center bg-slate-100 dark:bg-white/10 py-3.5 rounded-2xl"
                      >
                        <Minus size={18} color={isDark ? "white" : "#475569"} />
                        <Text className="font-bold ml-2 text-slate-700 dark:text-white">Saída</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => {
                          feedback.light()
                          router.push(`/(app)/products/${foundProduct.id}`)
                        }}
                        className="w-14 items-center justify-center bg-slate-100 dark:bg-white/10 rounded-2xl ml-3"
                      >
                        <PackageSearch size={22} color={isDark ? "white" : "#6366f1"} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => {
                        feedback.light()
                        router.push({ pathname: '/(app)/products/create', params: { barcode: scannedData }})
                      }}
                      className="flex-1 flex-row items-center justify-center bg-indigo-500 py-4 rounded-2xl"
                    >
                      <Plus size={20} color="white" />
                      <Text className="text-white font-bold ml-2 text-base">Registar Novo Produto</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            </Animated.View>
          )}
        </View>
      </View>
    </Screen>
  )
}
