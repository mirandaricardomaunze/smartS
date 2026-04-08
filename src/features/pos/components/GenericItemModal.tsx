import React, { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { usePOSStore } from '../store/posStore'
import { Hash, DollarSign, PackagePlus, X, ShoppingCart } from 'lucide-react-native'
import { feedback } from '@/utils/haptics'

interface GenericItemModalProps {
  isVisible: boolean
  onClose: () => void
}

export default function GenericItemModal({ isVisible, onClose }: GenericItemModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const addGenericItem = usePOSStore((state) => state.addGenericItem)

  const handleClose = () => {
    setName('')
    setPrice('')
    onClose()
  }

  const handleAdd = () => {
    if (!name || !price) return
    
    const numericPrice = parseFloat(price.replace(',', '.'))
    if (isNaN(numericPrice)) return

    feedback.medium()
    addGenericItem(name, numericPrice)
    
    handleClose()
  }

  return (
    <BottomSheet visible={isVisible} onClose={handleClose} height={0.85}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 px-6 pt-2"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl items-center justify-center mr-3">
              <PackagePlus size={22} color="#6366f1" />
            </View>
            <View>
              <Text className="text-xl font-black text-slate-900 dark:text-white">Item Avulso</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">Adicionar item não catalogado</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={handleClose}
            className="w-10 h-10 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full"
          >
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View className="space-y-4">
          <Input
            label="Nome do Item"
            placeholder="Ex: Serviço de Entrega, Embalagem Especial..."
            value={name}
            onChangeText={setName}
            icon={<Hash size={20} color="#94a3b8" />}
            autoFocus
          />

          <Input
            label="Preço Unitário"
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            icon={<DollarSign size={20} color="#94a3b8" />}
          />
        </View>

        <View className="mt-8 mb-2">
          <Button 
            title="Adicionar ao Carrinho" 
            onPress={handleAdd}
            disabled={!name || !price}
            variant="primary"
            icon={<ShoppingCart size={20} color="white" />}
          />
        </View>

        <TouchableOpacity 
          onPress={handleClose}
          className="py-4 items-center"
        >
          <Text className="text-slate-500 dark:text-slate-400 font-bold">Cancelar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
}
