import React, { useState, useRef, useEffect } from 'react'
import { View, Text } from 'react-native'
import Button from './Button'
import BottomSheet from './BottomSheet'
import { useConfirmStore } from '@/store/useConfirmStore'

export default function ConfirmDialog() {
  const { visible, options, hide } = useConfirmStore()
  const [loading, setLoading] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  if (!options) return null

  const {
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    isDestructive = false,
    showCancel = true,
    onConfirm,
    onCancel
  } = options

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
      if (isMounted.current) {
        hide()
      }
    } catch (error) {
      console.error('Confirm dialog action failed:', error)
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    hide()
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={handleCancel}
      height={0.5}
    >
      <View className="px-6 pb-6">
        <Text className="text-xl font-black text-slate-900 dark:text-white mb-2">
          {title}
        </Text>
        <Text className="text-base text-slate-600 dark:text-slate-300 mb-8 leading-6">
          {message}
        </Text>
        
        <View>
          <Button
            title={confirmLabel}
            variant={isDestructive ? 'danger' : 'primary'}
            onPress={handleConfirm}
            isLoading={loading}
            className="w-full h-14 rounded-2xl mb-3"
          />
          {showCancel && (
            <Button
              title={cancelLabel}
              variant="ghost"
              onPress={handleCancel}
              disabled={loading}
              className="w-full h-14"
              accessibilityLabel="Cancelar"
            />
          )}
        </View>
      </View>
    </BottomSheet>
  )
}
