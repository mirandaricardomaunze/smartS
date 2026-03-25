import React from 'react'
import { View, Text } from 'react-native'
import Button from './Button'
import BottomSheet from './BottomSheet'

interface ConfirmDialogProps {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      height={0.4}
    >
      <View className="px-6 pb-12">
        <Text className="text-xl font-black text-slate-900 dark:text-white mb-2">
          {title}
        </Text>
        <Text className="text-base text-slate-600 dark:text-slate-300 mb-8 leading-6">
          {message}
        </Text>
        
        <View className="space-y-3">
          <Button
            title={confirmLabel}
            variant={isDestructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            isLoading={isLoading}
            className="w-full h-14 rounded-2xl"
          />
          <Button
            title={cancelLabel}
            variant="ghost"
            onPress={onCancel}
            disabled={isLoading}
            className="w-full h-14 -mt-2"
          />
        </View>
      </View>
    </BottomSheet>
  )
}
