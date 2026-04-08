import React, { useCallback } from 'react'
import { Text, ActivityIndicator, TouchableOpacityProps, View, Pressable, StyleProp, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { cssInterop } from 'nativewind'

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  gradientColors?: string[]
  isLoading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  className?: string
  textClassName?: string
  textStyle?: any
}

// Map className to style for LinearGradient
cssInterop(LinearGradient, { className: 'style' })

export default function Button({ 
  title, 
  variant = 'primary', 
  size = 'lg',
  gradientColors,
  isLoading = false, 
  fullWidth = true, 
  icon,
  className,
  textClassName,
  textStyle,
  disabled,
  style,
  ...props 
}: ButtonProps) {
  
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96)
  }, [])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1)
  }, [])

  const baseClasses = 'flex-row items-center justify-center rounded-2xl px-6 overflow-hidden border border-transparent active:opacity-90'
  const widthClasses = fullWidth ? 'w-full' : ''
  const disabledClasses = disabled ? 'opacity-50' : ''
  
  let variantClasses = ''
  let textClasses = size === 'sm' ? 'font-bold text-center text-xs' : 'font-bold text-center text-base'
  
  switch(variant) {
    case 'primary':
      variantClasses = 'bg-primary shadow-lg shadow-indigo-500/30'
      textClasses += ' text-white'
      break
    case 'secondary':
      variantClasses = 'bg-slate-900 dark:bg-slate-800 shadow-lg shadow-slate-900/30'
      textClasses += ' text-white'
      break
    case 'danger':
      variantClasses = 'bg-red-500 shadow-lg shadow-red-500/30'
      textClasses += ' text-white'
      break
    case 'ghost':
      variantClasses = 'bg-transparent border-slate-200 dark:border-white/10'
      textClasses += ' text-slate-600 dark:text-slate-400'
      break
    case 'gradient':
      variantClasses = 'shadow-xl shadow-indigo-500/30'
      textClasses += ' text-white'
      break
    case 'outline':
      variantClasses = 'bg-transparent border-slate-200 dark:border-white/10'
      textClasses += ' text-slate-600 dark:text-slate-400'
      break
  }

  // Extract layout classes from className to apply them to the Animated.View container
  // This ensures flex-1, margins, etc. work as expected without affecting internal alignment
  const layoutClasses = className?.match(/\b(flex(?:-\d+)?|m[xytrb]?-\d+|w-\d+|h-\d+|w-full|h-full|w-screen|h-screen|absolute|relative|top-\d+|bottom-\d+|left-\d+|right-\d+|z-\d+)\b/g)?.join(' ') || ''
  const otherClasses = className?.split(' ').filter(c => !layoutClasses.includes(c)).join(' ') || ''

  const finalHeight = size === 'sm' ? 'h-10' : size === 'md' ? 'h-12' : 'h-14'
  const finalLayoutClasses = `${widthClasses} ${layoutClasses} ${!layoutClasses.includes('h-') ? finalHeight : ''}`
  
  const renderContent = () => (
    <View className="flex-row items-center justify-center w-full h-full z-10 pointer-events-none">
      {isLoading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#64748b' : 'white'} />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text 
            style={[{ fontFamily: 'Inter-Bold' }, textStyle]} 
            className={`${textClasses} ${textClassName || ''}`}
          >
            {title}
          </Text>
        </View>
      )}
    </View>
  )

  return (
    <View className={finalLayoutClasses} style={style as any}>
      <Animated.View style={[animatedStyle, { width: '100%', height: '100%' }]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isLoading}
          accessibilityRole="button"
          accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
          accessibilityLabel={title}
          className={`${baseClasses} ${widthClasses} ${variantClasses} ${disabledClasses} h-full ${otherClasses}`}
          {...props}
        >
          {variant === 'gradient' && gradientColors ? (
            <LinearGradient
              colors={gradientColors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="absolute top-0 left-0 right-0 bottom-0"
            />
          ) : null}
          {renderContent()}
        </Pressable>
      </Animated.View>
    </View>
  )
}
