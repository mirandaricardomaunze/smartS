import React, { useCallback } from 'react'
import { Text, ActivityIndicator, TouchableOpacityProps, View, Pressable } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient'
  gradientColors?: string[]
  isLoading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  className?: string
  textStyle?: any
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function Button({ 
  title, 
  variant = 'primary', 
  gradientColors,
  isLoading = false, 
  fullWidth = true, 
  icon,
  className,
  textStyle,
  disabled,
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

  const baseClasses = 'flex-row items-center justify-center rounded-2xl px-6 py-4 overflow-hidden border border-transparent active:opacity-90'
  const widthClasses = fullWidth ? 'w-full' : ''
  const disabledClasses = disabled ? 'opacity-50' : ''
  
  let variantClasses = ''
  let textClasses = 'font-bold text-center text-base'
  
  switch(variant) {
    case 'primary':
      variantClasses = 'bg-primary shadow-premium-md shadow-primary/20'
      textClasses += ' text-white'
      break
    case 'secondary':
      variantClasses = 'bg-slate-900 dark:bg-slate-800 shadow-premium-md'
      textClasses += ' text-white'
      break
    case 'danger':
      variantClasses = 'bg-red-500 shadow-premium-md shadow-red-500/20'
      textClasses += ' text-white'
      break
    case 'ghost':
      variantClasses = 'bg-transparent border-slate-200 dark:border-white/10'
      textClasses += ' text-slate-600 dark:text-slate-400'
      break
    case 'gradient':
      variantClasses = 'shadow-premium-lg'
      textClasses += ' text-white'
      break
  }

  const renderContent = () => (
    <View className="flex-row items-center justify-center">
      {isLoading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#64748b' : 'white'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text style={[{ fontFamily: 'Inter-Bold' }, textStyle]} className={textClasses}>{title}</Text>
        </>
      )}
    </View>
  )

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={`${baseClasses} ${widthClasses} ${variantClasses} ${disabledClasses} ${className || ''}`}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      accessibilityLabel={title}
      style={animatedStyle}
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
    </AnimatedPressable>
  )
}
