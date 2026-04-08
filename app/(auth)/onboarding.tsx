import * as React from 'react'
const { useState, useRef, useCallback, useEffect } = React
import { View, Text, TouchableOpacity, Dimensions, FlatList, Animated, useColorScheme, ViewToken, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import * as NavigationBar from 'expo-navigation-bar'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { feedback } from '@/utils/haptics'
import { PackageSearch, Wallet, Brain, WifiOff, ChevronRight, Rocket } from 'lucide-react-native'
const { width, height } = Dimensions.get('screen')
interface OnboardingSlide { id: string; title: string; subtitle: string; description: string; icon: React.ReactNode; gradientColors: readonly [string, string, string]; accentColor: string }
const slides: OnboardingSlide[] = [
  { id: 'welcome', title: 'SmartS', subtitle: 'Bem-vindo ao Futuro', description: 'A solução definitiva para o seu negócio. Gestão inteligente, vendas rápidas e relatórios poderosos na palma da sua mão.', icon: <Rocket size={56} color="white" />, gradientColors: ['#4f46e5', '#6366f1', '#8b5cf6'], accentColor: '#c7d2fe' },
  { id: '1', title: 'Controlo Total', subtitle: 'Gestão de Stock', description: 'Acompanhe cada produto em tempo real. Receba alertas automáticos quando o stock atinge níveis mínimos.', icon: <PackageSearch size={48} color="white" />, gradientColors: ['#4f46e5', '#3b82f6', '#0ea5e9'], accentColor: '#bae6fd' },
  { id: '2', title: 'Vendas Ágeis', subtitle: 'PDV Profissional', description: 'Registe vendas em segundos com leitor de código de barras. Crie faturas e notas automaticamente.', icon: <Wallet size={48} color="white" />, gradientColors: ['#4f46e5', '#10b981', '#059669'], accentColor: '#a7f3d0' },
  { id: '3', title: 'Decisões Inteligentes', subtitle: 'Inteligência de Negócio', description: 'Análise ABC, previsão de ruptura e relatórios PDF profissionais. Saiba exatamente o que dá mais lucro.', icon: <Brain size={48} color="white" />, gradientColors: ['#4f46e5', '#a855f7', '#d946ef'], accentColor: '#f5d0fe' },
  { id: '4', title: 'Sempre Disponível', subtitle: 'Funciona Offline', description: 'Trabalhe sem internet. Todos os dados são guardados localmente e sincronizados automaticamente.', icon: <WifiOff size={48} color="white" />, gradientColors: ['#4f46e5', '#64748b', '#475569'], accentColor: '#e2e8f0' }
]
export default function OnboardingScreen() {
  const router = useRouter(); const setSettings = useSettingsStore((s) => s.setSettings); const colorScheme = useColorScheme(); const isDark = colorScheme === 'dark'
  const [activeIndex, setActiveIndex] = useState(0); const flatListRef = useRef<FlatList>(null); const scrollX = useRef(new Animated.Value(0)).current
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => { if (viewableItems.length > 0 && viewableItems[0].index !== null) setActiveIndex(viewableItems[0].index) }, [])
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current
  useEffect(() => { if (Platform.OS === 'android') { NavigationBar.setBackgroundColorAsync('transparent'); NavigationBar.setButtonStyleAsync('light'); NavigationBar.setPositionAsync('absolute') } }, [])
  const handleNext = () => { feedback.light(); if (activeIndex < slides.length - 1) flatListRef.current?.scrollToIndex({ index: activeIndex + 1 }); else handleComplete() }
  const handleSkip = () => { feedback.light(); handleComplete() }
  const handleComplete = async () => {
    feedback.success(); setSettings({ onboarding_completed: 1 })
    const { useAuthStore } = require('@/features/auth/store/authStore'); const user = useAuthStore.getState().user
    if (user?.company_id) { const { subscriptionService } = require('@/services/subscriptionService'); await subscriptionService.updateOnboarding(user.company_id, true); router.replace('/(app)') }
    else router.replace('/(auth)/login')
  }
  const slideHeight = height * 0.62
  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width]
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' })
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' })
    const translateY = scrollX.interpolate({ inputRange, outputRange: [30, 0, 30], extrapolate: 'clamp' })
    const textOpacity = scrollX.interpolate({ inputRange: [(index - 0.5) * width, index * width, (index + 0.5) * width], outputRange: [0, 1, 0], extrapolate: 'clamp' })
    return (
      <View style={{ width, height: slideHeight, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <Animated.View style={{ width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 40, transform: [{ scale }], opacity }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' }}>{item.icon}</View>
        </Animated.View>
        <Animated.View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginBottom: 20, opacity: textOpacity, transform: [{ translateY: Animated.multiply(translateY, 0.8) }] }}>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 2 }}>{item.subtitle}</Text>
        </Animated.View>
        <Animated.Text style={{ fontFamily: 'Inter-Black', fontSize: 36, color: '#ffffff', textAlign: 'center', marginBottom: 16, opacity: textOpacity, transform: [{ translateY }] }}>{item.title}</Animated.Text>
        <Animated.Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 16, opacity: textOpacity, transform: [{ translateY: Animated.multiply(translateY, 1.2) }] }}>{item.description}</Animated.Text>
      </View>
    )
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar translucent backgroundColor="transparent" style="light" />
      {slides.map((slide, i) => {
        const opacity = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [0, 1, 0], extrapolate: 'clamp' })
        return ( <Animated.View key={`bg-${slide.id}`} pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { opacity }]}><LinearGradient colors={slide.gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} /></Animated.View> )
      })}
      {activeIndex < slides.length - 1 && (
        <TouchableOpacity onPress={handleSkip} className="absolute top-16 right-6 z-10 px-5 py-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} accessibilityLabel="Saltar onboarding" accessibilityRole="button">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-xs font-bold uppercase tracking-widest">Saltar</Text>
        </TouchableOpacity>
      )}
      <Animated.FlatList ref={flatListRef} data={slides} renderItem={renderSlide} keyExtractor={(item) => item.id} horizontal pagingEnabled showsHorizontalScrollIndicator={false} bounces={false} onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} scrollEventThrottle={16} style={{ flex: 1 }} />
      <View className="px-8 pb-14 pt-6">
        <View className="flex-row justify-center items-center mb-8">
          {slides.map((_, i) => {
            const dotWidth = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [8, 32, 8], extrapolate: 'clamp' })
            const dotOpacity = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' })
            return ( <Animated.View key={i} style={{ width: dotWidth, opacity: dotOpacity, height: 8, borderRadius: 4, backgroundColor: '#ffffff', marginHorizontal: 4 }} /> )
          })}
        </View>
        <TouchableOpacity onPress={handleNext} className="w-full h-16 rounded-[20px] flex-row items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} accessibilityLabel={activeIndex === slides.length - 1 ? 'Começar a usar SmartS' : 'Próximo slide'} accessibilityRole="button">
          {activeIndex === slides.length - 1 ? ( <View style={{ flexDirection: 'row', alignItems: 'center' }}><Rocket size={22} color="white" /><Text style={{ fontFamily: 'Inter-Black' }} className="text-white text-base font-black ml-3 uppercase tracking-wider">Começar Agora</Text></View> ) : ( <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-base font-bold mr-2">Próximo</Text><ChevronRight size={22} color="white" /></View> )}
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-white/40 text-center mt-4 text-xs tracking-widest">{activeIndex + 1} / {slides.length}</Text>
      </View>
    </View>
  )
}