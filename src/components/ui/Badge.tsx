import React from 'react'
import { View, Text } from 'react-native'

interface BadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export default function Badge({ label, variant = 'info', className = '' }: BadgeProps) {
  let bgClass = ''
  let textClass = ''

  switch (variant) {
    case 'success':
      bgClass = 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20'
      textClass = 'text-emerald-700 dark:text-emerald-400'
      break
    case 'warning':
      bgClass = 'bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20'
      textClass = 'text-amber-700 dark:text-amber-400'
      break
    case 'danger':
      bgClass = 'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20'
      textClass = 'text-rose-700 dark:text-rose-400'
      break
    case 'info':
      bgClass = 'bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20'
      textClass = 'text-primary dark:text-primary-dark font-bold'
      break

  }

  return (
    <View className={`px-3 py-1 rounded-full ${bgClass} ${className}`}>
      <Text 
        style={{ fontFamily: 'Inter-Bold' }}
        className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}
      >
        {label}
      </Text>
    </View>
  )
}
