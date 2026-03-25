import React from 'react'
import { View, ActivityIndicator, Text } from 'react-native'

interface LoadingProps {
  fullScreen?: boolean
  message?: string
}

export default function Loading({ fullScreen = false, message }: LoadingProps) {
  const content = (
    <View className="items-center justify-center p-4">
      <ActivityIndicator size="large" color="#4f46e5" />
      {message && <Text className="mt-4 text-slate-600 dark:text-slate-400 font-medium">{message}</Text>}
    </View>
  )

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
        {content}
      </View>
    )
  }

  return content
}
