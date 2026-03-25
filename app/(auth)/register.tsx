import React, { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useUsers } from '@/features/users/hooks/useUsers'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Screen from '@/components/layout/Screen'
import { User as UserIcon, Lock, Mail, Building, ChevronLeft } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Card from '@/components/ui/Card'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import { StatusBar } from 'expo-status-bar'

export default function RegisterScreen() {
  const router = useRouter()
  const { createUser, isLoading } = useUsers()
  const showToast = useToastStore((state) => state.show)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleRegister = async () => {
    feedback.medium()
    setLocalError(null)
    if (!name || !email || !password) {
      setLocalError('Por favor, preencha os campos obrigatórios.')
      showToast('Dados incompletos', 'warning')
      return
    }
    
    if (password.length < 6) {
      setLocalError('A palavra-passe deve ter pelo menos 6 caracteres.')
      showToast('Senha muito curta', 'warning')
      return
    }

    try {
      await createUser({
        name,
        email,
        role: 'admin',
        company_id: null,
        logo_url: null,
        is_active: 1
      }, password)
      
      feedback.success()
      showToast('Conta criada com sucesso!', 'success')
      router.replace('/(auth)/login')
    } catch (e: any) {
       feedback.error()
       showToast('Erro ao criar conta', 'error')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar translucent backgroundColor='transparent' style='light' />
      <LinearGradient
        colors={['#4f46e5', '#6366f1', '#a855f7']}
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
            <View className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <View className="absolute bottom-40 right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

            <Card variant="glass" glassIntensity={15} className="w-full max-w-sm self-center p-8 border-white/20 shadow-premium-lg">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/10 rounded-2xl items-center justify-center mb-8 border border-white/20 active:bg-white/20"
              >
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>

              <View className="mb-8">
                <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-white mb-2">
                  Criar Conta
                </Text>
                <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-white/60 text-sm leading-5">
                  Junte-se ao SmartS e transforme a gestão do seu inventário.
                </Text>
              </View>

              <View className="space-y-4">
                <Input
                  label="Nome Completo"
                  placeholder="Introduza o seu nome"
                  value={name}
                  onChangeText={setName}
                  icon={<UserIcon size={18} color="rgba(255,255,255,0.6)" />}
                  labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  textStyle={{ color: '#ffffff' }}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  containerStyle={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
                />

                <Input
                  label="E-mail"
                  placeholder="seu@email.com"
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
                  label="Empresa (Opcional)"
                  placeholder="Nome da sua empresa"
                  value={company}
                  onChangeText={setCompany}
                  icon={<Building size={18} color="rgba(255,255,255,0.6)" />}
                  labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  textStyle={{ color: '#ffffff' }}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  containerStyle={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
                />

                <Input
                   label="Palavra-passe"
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

                {localError && (
                  <Text style={{ fontFamily: 'Inter-Medium' }} className="text-red-400 text-center mb-4 text-sm bg-red-400/10 py-2 rounded-lg">
                    {localError}
                  </Text>
                )}

                <Button 
                  variant="primary"
                  title="Registar agora" 
                  onPress={handleRegister}
                  isLoading={isLoading}
                  className="shadow-xl h-14 mt-4"
                />
              </View>

              <View className="flex-row justify-center mt-10">
                <Text style={{ fontFamily: 'Inter-Medium' }} className="text-white/60 text-sm">Já tem conta? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="font-bold text-white text-sm underline ml-1">
                    Iniciar Sessão
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
            
            <View className="mt-10 items-center">
              <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-white/40 text-xs text-center">
                © 2026 SmartS Inventory Solution
              </Text>
            </View>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </View>
  )
}
