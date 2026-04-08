import React, { useEffect, useCallback, useState } from 'react'
import { 
  View, 
  StyleSheet, 
  TouchableWithoutFeedback, 
  BackHandler,
  Platform,
  useWindowDimensions
} from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  height?: number // 0 to 1 (percentage of screen height)
}

export default function BottomSheet({ 
  visible, 
  onClose, 
  children, 
  height = 0.85 
}: BottomSheetProps) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const MAX_HEIGHT = SCREEN_HEIGHT * height
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const [isMounted, setIsMounted] = useState(visible)
  const backdropOpacity = useSharedValue(0)

  const close = useCallback(() => {
    'worklet'
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(setIsMounted)(false)
      runOnJS(onClose)()
    })
    backdropOpacity.value = withTiming(0, { duration: 300 })
  }, [onClose, SCREEN_HEIGHT])

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      translateY.value = withSpring(SCREEN_HEIGHT - MAX_HEIGHT, {
        damping: 20,
        stiffness: 90,
      })
      backdropOpacity.value = withTiming(0.5, { duration: 300 })
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
        runOnJS(setIsMounted)(false)
      })
      backdropOpacity.value = withTiming(0, { duration: 300 })
    }
  }, [visible, MAX_HEIGHT, SCREEN_HEIGHT])

  // Back button handling on Android
  useEffect(() => {
    const backAction = () => {
      if (visible) {
        close()
        return true
      }
      return false
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => backHandler.remove()
  }, [visible, close])

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = SCREEN_HEIGHT - MAX_HEIGHT + event.translationY
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        close()
      } else {
        translateY.value = withSpring(SCREEN_HEIGHT - MAX_HEIGHT, {
          damping: 20,
          stiffness: 90,
        })
      }
    })

  const rSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [SCREEN_HEIGHT - MAX_HEIGHT, SCREEN_HEIGHT],
      [32, 0],
      Extrapolation.CLAMP
    )

    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    }
  }, [MAX_HEIGHT, SCREEN_HEIGHT])

  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    }
  })

  if (!isMounted) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { backgroundColor: 'black' },
            rBackdropStyle
          ]} 
        />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View 
        style={[
          styles.sheet, 
          { height: MAX_HEIGHT, top: 0 }, 
          rSheetStyle
        ]}
        className="bg-white dark:bg-slate-950 shadow-2xl"
      >
        {/* Draggable Header/Handle Area */}
        <GestureDetector gesture={gesture}>
          <Animated.View className="items-center pt-4 pb-2 w-full bg-transparent">
            <View className="w-12 h-1.5 bg-primary/20 dark:bg-primary/30 rounded-full" />
          </Animated.View>
        </GestureDetector>
        
        <View style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 20) }}>
          {children}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 1000,
  }
})
