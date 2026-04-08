import React, { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, useColorScheme } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Screen from '@/components/layout/Screen'
import FormError from '@/components/forms/FormError'
import { Lock, Mail, LogIn } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Card from '@/components/ui/Card'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import { StatusBar } from 'expo-status-bar'

export default function LoginScreen() {
  const { login, loginWithGoogle, isLoading, error: authError } = useAuth()
  const showToast = useToastStore((state) => state.show)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const handleLogin = async () => {
    feedback.medium()
    setLocalError(null)
    if (!email || !password) {
      setLocalError('Por favor, preencha todos os campos.')
      showToast('Campos em falta', 'warning')
      return
    }
    try {
      await login(email, password)
      feedback.success()
      showToast('Bem-vindo de volta!', 'success')
    } catch (e: any) {
      feedback.error()
      showToast('Falha no login', 'error')
    }
  }

  const handleGoogleLogin = async () => {
    feedback.medium()
    try {
      await loginWithGoogle()
      feedback.success()
      showToast('Bem-vindo!', 'success')
    } catch (e: any) {
      feedback.error()
      if (e.message !== 'User cancelled') {
        showToast('Falha no login Google', 'error')
      }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar translucent backgroundColor='transparent' style='light' />
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e1b4b'] : ['#4f46e5', '#6366f1', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <KeyboardAvoidingView 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
        <Screen 
          scrollable 
          padHorizontal={false} 
          className="bg-transparent" 
          withHeader={false}
          noSafeTop={true}
          noSafeBottom={true}
        >
          <View className="flex-1 justify-center px-6 py-10">
            <View className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <View className="absolute bottom-20 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />

            <Card variant="glass" glassIntensity={15} className="w-full max-w-[440px] self-center p-6 border-white/20 shadow-premium-lg">
              {/* Unified Logo area inside the form card */}
              <View className="items-center mb-10">
                <View className="w-20 h-20 bg-white/10 rounded-[28px] items-center justify-center mb-4 border border-white/20 shadow-xl">
                   <Text style={{ fontFamily: 'Inter-Black' }} className="text-white text-3xl font-bold">SM</Text>
                </View>
                <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-white text-center">SmartS</Text>
                <Text style={{ fontFamily: 'Inter-Medium' }} className="text-white/60 mt-1 text-center text-sm">
                  Gestão de Inventário Inteligente
                </Text>
              </View>

              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xl font-bold text-white mb-6 text-center">Bem-vindo(a)</Text>
              
              <FormError error={localError || authError} />

              <View className="space-y-4">
                <Input
                  label="E-mail"
                  placeholder="Introduza o seu e-mail"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  icon={<Mail size={18} color="rgba(255,255,255,0.6)" />}
                  labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  textStyle={{ color: '#ffffff' }}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  containerStyle={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
                />

                <Input
                   label="Palavra-passe"
                   placeholder="Introduza a sua"
                   value={password}
                   onChangeText={setPassword}
                   secureTextEntry
                   icon={<Lock size={18} color="rgba(255,255,255,0.6)" />}
                   labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                   textStyle={{ color: '#ffffff' }}
                   placeholderTextColor="rgba(255,255,255,0.4)"
                   containerStyle={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
                />

                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity className="items-end -mt-2">
                    <Text style={{ fontFamily: 'Inter-Medium' }} className="text-white/70 text-xs font-semibold underline">Esqueceu a senha?</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <Button 
                title="Entrar agora" 
                onPress={handleLogin}
                isLoading={isLoading}
                variant="primary"
                icon={<LogIn size={20} color="white" />}
                className="shadow-xl h-14 mt-4"
              />

              <View className="flex-row items-center my-6">
                <View className="flex-1 h-[1px] bg-white/20" />
                <Text className="mx-4 text-white/40 text-xs font-bold uppercase tracking-widest">Ou</Text>
                <View className="flex-1 h-[1px] bg-white/20" />
              </View>

              <Button 
                title="Continuar com Google" 
                onPress={handleGoogleLogin}
                isLoading={isLoading}
                variant="ghost"
                className="bg-white/10 border-white/10 h-14"
                textStyle={{ color: '#ffffff' }}
                icon={
                  <View className="w-5 h-5 bg-white rounded-full items-center justify-center mr-2">
                    <Text className="text-blue-600 font-black text-[10px]">G</Text>
                  </View>
                }
              />
              
              <View className="flex-row justify-center mt-10">
                <Text style={{ fontFamily: 'Inter-Medium' }} className="text-white/60">Não tem conta? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white font-bold underline ml-1">Criar conta</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Card>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </View>
  )
}
