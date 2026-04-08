import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Modal } from 'react-native'
import { Camera, CameraView } from 'expo-camera'
import { X, Zap, ZapOff } from 'lucide-react-native'
import { useProducts } from '@/features/products/hooks/useProducts'
import { usePOSStore } from '../store/posStore'
import { feedback } from '@/utils/haptics'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

interface POSScannerModalProps {
  isVisible: boolean
  onClose: () => void
}

export default function POSScannerModal({ isVisible, onClose }: POSScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [torch, setTorch] = useState(false)
  const { products } = useProducts()
  const addToCart = usePOSStore((state) => state.addToCart)

  useEffect(() => {
    if (isVisible) {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync()
        setHasPermission(status === 'granted')
      })()
      setScanned(false)
    }
  }, [isVisible])

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)

    const product = products.find((p) => p.barcode === data || p.sku === data)
    
    if (product) {
      feedback.success()
      Vibration.vibrate(100)
      addToCart(product)
      
      // Briefly show success then allow next scan
      setTimeout(() => {
        setScanned(false)
      }, 1500)
    } else {
      feedback.error()
      Vibration.vibrate([0, 100, 50, 100])
      alert(`Produto com código ${data} não encontrado.`)
      
      setTimeout(() => {
        setScanned(false)
      }, 2000)
    }
  }

  if (hasPermission === null) return null

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View className="flex-1 bg-black">
        {hasPermission ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            enableTorch={torch}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-white text-center mb-4">Sem permissão para acessar a câmera.</Text>
            <TouchableOpacity onPress={onClose} className="bg-white/10 px-6 py-3 rounded-xl">
              <Text className="text-white font-bold">Fechar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Overlay */}
        <View style={StyleSheet.absoluteFill} className="items-center justify-center">
          <View className={`w-72 h-72 border-2 ${scanned ? 'border-emerald-500' : 'border-white/50'} rounded-[40px] items-center justify-center`}>
            <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-3xl" />
            <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-3xl" />
            <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-3xl" />
            <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-3xl" />
            
            {scanned && (
              <Animated.View entering={FadeIn} exiting={FadeOut} className="bg-emerald-500/20 px-4 py-2 rounded-full">
                <Text className="text-emerald-500 font-bold">Lido!</Text>
              </Animated.View>
            )}
          </View>
          <Text className="text-white/70 mt-8 font-medium">Aponte para o código de barras</Text>
        </View>

        {/* Controls */}
        <View className="absolute top-12 left-6 right-6 flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={onClose}
            className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/10"
          >
            <X color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setTorch(!torch)}
            className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/10"
          >
            {torch ? <ZapOff color="white" size={24} /> : <Zap color="white" size={24} />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
