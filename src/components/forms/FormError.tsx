import React from 'react'
import { Text } from 'react-native'

interface FormErrorProps {
  error?: string | null
}

export default function FormError({ error }: FormErrorProps) {
  if (!error) return null

  return (
    <Text className="text-red-500 mb-4 text-sm font-medium p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      {error}
    </Text>
  )
}
