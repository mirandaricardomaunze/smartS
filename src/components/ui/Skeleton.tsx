import React, { useEffect } from 'react'
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native'
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolate,
  Extrapolate
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  className?: string
  style?: ViewStyle
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

export default function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  className = '',
  style
}: SkeletonProps) {
  const translateX = useSharedValue(-1)

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    )
  }, [])

  // Determine the actual numeric width for interpolation if width is a percentage
  const actualWidth = typeof width === 'string' && width.endsWith('%')
    ? (parseFloat(width) / 100) * Dimensions.get('window').width // This is a simplification; ideally, it should be parent's width
    : (width as number); // Cast to number if it's not a percentage string

  const animatedStyle = useAnimatedStyle(() => {
    // If width is a string like '100%', we need a numeric value for interpolation.
    // For simplicity, we'll use the screen width as a fallback for percentage widths.
    // In a real app, you might want to measure the parent container's width.
    const interpolatedWidth = typeof width === 'string' && width.endsWith('%')
      ? Dimensions.get('window').width // Fallback for percentage width
      : (width as number);

    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-1, 1],
            [-interpolatedWidth, interpolatedWidth], // Use numeric values for interpolation
            Extrapolate.CLAMP
          )
        }
      ]
    }
  })

  return (
    <View 
      style={[{ width: width as any, height: height as any, borderRadius, overflow: 'hidden' }, style]} 
      className={`bg-slate-200 dark:bg-slate-800 ${className}`}
    >
      <AnimatedLinearGradient
        colors={[
          'transparent',
          'rgba(255, 255, 255, 0.05)',
          'rgba(255, 255, 255, 0.2)',
          'rgba(255, 255, 255, 0.05)',
          'transparent'
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, animatedStyle]}
      />
    </View>
  )
}
