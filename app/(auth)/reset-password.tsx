import React, { useState, useEffect } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Screen from '@/components/layout/Screen'
import FormError from '@/components/forms/FormError'
import { Lock, CheckCircle2 } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Card from '@/components/ui/Card'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import { StatusBar } from 'expo-status-bar'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { resetPassword, isLoading } = useAuth()
  const showToast = useToastStore((state) => state.show)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const handleUpdate = async () => {
    feedback.medium()
    setError(null)
    
    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.')
      return
    }

    try {
      await resetPassword(password)
      feedback.success()
      setSuccess(true)
      showToast('Palavra-passe atualizada!', 'success')
    } catch (e: any) {
       feedback.error()
       setError(e.message)
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
        style={{ flex: 1 }}
      >
        <Screen className="bg-transparent" noSafeTop noSafeBottom>
          <View className="flex-1 justify-center px-6">
            <Card variant="glass" glassIntensity={15} className="w-full max-w-sm self-center p-8 border-white/20 shadow-premium-lg">
              {success ? (
                <View className="items-center py-4">
                  <View className="w-20 h-20 bg-emerald-500/20 rounded-full items-center justify-center mb-6 border border-emerald-500/30">
                    <CheckCircle2 size={40} color="#10b981" />
                  </View>
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-white text-center mb-2">Sucesso!</Text>
                  <Text style={{ fontFamily: 'Inter-Medium' }} className="text-white/70 text-center mb-10 leading-6">
                    A sua palavra-passe foi alterada. Pode agora aceder à sua conta com as novas credenciais.
                  </Text>
                  <Button 
                    title="Entrar no SmartS" 
                    variant="primary" 
                    onPress={() => router.replace('/(auth)/login')}
                    className="w-full h-14"
                  />
                </View>
              ) : (
                <>
                  <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-white/10 rounded-2xl items-center justify-center mb-4 border border-white/20">
                      <Lock size={32} color="white" />
                    </View>
                    <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-white text-center">Nova Senha</Text>
                    <Text style={{ fontFamily: 'Inter-Medium' }} className="text-white/60 mt-2 text-center text-sm">
                      Defina a sua nova palavra-passe de acesso.
                    </Text>
                  </View>

                  <FormError error={error} />
                  
                  <View className="space-y-4">
                    <Input
                      label="Nova Palavra-passe"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      icon={<Lock size={18} color="rgba(255,255,255,0.6)" />}
                      labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                      textStyle={{ color: '#ffffff' }}
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      containerStyle={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
                    />

                    <Input
                      label="Confirmar Palavra-passe"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      icon={<Lock size={18} color="rgba(255,255,255,0.6)" />}
                      labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                      textStyle={{ color: '#ffffff' }}
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      containerStyle={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                  </View>

                  <Button 
                    title="Atualizar e Entrar" 
                    onPress={handleUpdate}
                    isLoading={isLoading}
                    variant="primary"
                    className="shadow-xl h-14 mt-6"
                  />
                </>
              )}
            </Card>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </View>
  )
}
