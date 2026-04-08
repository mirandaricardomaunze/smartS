import React from 'react'
import { View, ViewProps, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useColorScheme } from 'nativewind'

interface CardProps extends ViewProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'premium'
  gradientColors?: string[]
  glassIntensity?: number
}

export default function Card({ 
  children, 
  className, 
  variant = 'default', 
  gradientColors,
  glassIntensity = 20,
  style,
  ...props 
}: CardProps) {
  const { colorScheme } = useColorScheme()
  
  const baseClasses = `rounded-3xl overflow-hidden`
  
  let conditionalClasses = ''
  // Move padding from outer container to inner content for glass/gradient variants
  const isGlass = variant === 'glass'
  const isGradient = variant === 'gradient'
  const paddingClasses = className?.match(/(p[xy]?-|p-)\d+/g) || []
  const hasPadding = paddingClasses.length > 0
  
  // Clean className by removing padding if it's glass/gradient
  const outerClassName = (isGlass || isGradient) 
    ? className?.replace(/(p[xy]?-|p-)\d+/g, '').trim() 
    : className

  let contentClasses = (isGlass || isGradient) 
    ? (hasPadding ? paddingClasses.join(' ') : 'p-4')
    : (hasPadding ? '' : 'p-4')
  
  switch(variant) {
    case 'elevated':
      conditionalClasses = 'bg-white dark:bg-slate-900 shadow-premium-lg'
      break
    case 'glass':
      // Let BlurView handle the tint to avoid "double background" look
      // Adding a very subtle background color helps the glass look more "solid" on complex backgrounds
      conditionalClasses = 'bg-white/10 dark:bg-slate-900/40 border border-white/20 dark:border-white/10'
      break
    case 'gradient':
      conditionalClasses = ''
      break
    case 'premium':
      conditionalClasses = 'bg-white dark:bg-slate-900/90 border border-slate-100 dark:border-white/10 shadow-premium-sm'
      break
    default:
      conditionalClasses = 'bg-white dark:bg-slate-900/90 border border-slate-100 dark:border-white/10 shadow-premium-sm'
  }

  const renderContent = () => (
    <View className={contentClasses}>
      {children}
    </View>
  )

  if (variant === 'gradient' && gradientColors) {
    return (
      <View className={`${baseClasses} ${className || ''}`} {...props}>
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        >
          {renderContent()}
        </LinearGradient>
      </View>
    )
  }

  if (variant === 'glass') {
    return (
      <View 
        className={`${baseClasses} ${conditionalClasses} ${outerClassName || ''}`} 
        style={style}
        {...props}
      >
        <BlurView
           tint={colorScheme === 'dark' ? 'dark' : 'light'}
           intensity={glassIntensity}
           className="w-full"
        >
          {renderContent()}
        </BlurView>
      </View>
    )
  }

  return (
    <View 
      className={`${baseClasses} ${conditionalClasses} ${className || ''}`}
      style={style}
      {...props}
    >
      {renderContent()}
    </View>
  )
}
