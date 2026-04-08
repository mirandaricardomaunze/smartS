import React, { useEffect } from 'react'
import { View, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native'
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolate,
  Extrapolation
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
  const { width: windowWidth } = useWindowDimensions()
  const translateX = useSharedValue(-1)

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    // Determine the actual numeric width for interpolation
    const interpolatedWidth = typeof width === 'string' && width.endsWith('%')
      ? (parseFloat(width) / 100) * windowWidth
      : (width as number);

    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-1, 1],
            [-interpolatedWidth, interpolatedWidth],
            Extrapolation.CLAMP
          )
        }
      ]
    }
  }, [width, windowWidth])

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
