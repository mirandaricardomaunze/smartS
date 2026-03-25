import React from 'react'
import { View, Text, Image } from 'react-native'

interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Avatar({ name, imageUrl, size = 'md', className = '' }: AvatarProps) {
  let sizeClasses = 'w-10 h-10'
  let textClasses = 'text-sm'
  
  if (size === 'sm') {
    sizeClasses = 'w-8 h-8'
    textClasses = 'text-xs'
  } else if (size === 'lg') {
    sizeClasses = 'w-16 h-16'
    textClasses = 'text-xl'
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <View className={`${sizeClasses} rounded-full overflow-hidden bg-primary/10 dark:bg-primary/20 items-center justify-center ${className}`}>
      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <Text className={`${textClasses} font-bold text-primary dark:text-primary-dark`}>
          {initials}
        </Text>
      )}
    </View>
  )
}
