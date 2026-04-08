import React from 'react'
import { View, Text } from 'react-native'
import { Info, Plus } from 'lucide-react-native'
import Button from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: React.ReactNode
  onAction?: () => void
}

export default function EmptyState({ 
  icon = <Info size={48} color="#94a3b8" />, 
  title, 
  description, 
  actionLabel, 
  actionIcon,
  onAction 
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6 text-center">
      <View className="mb-4">
        {icon}
      </View>
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-base text-slate-500 dark:text-slate-400 text-center mb-6">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button 
          title={actionLabel} 
          onPress={onAction} 
          fullWidth={false}
          icon={actionIcon || <Plus size={20} color="white" />}
          className="px-8"
        />
      )}
    </View>
  )
}
