import React, { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useToastStore } from '@/store/useToastStore'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import FormField from '@/components/forms/FormField'
import { UserRole } from '@/types'

export default function CreateUserScreen() {
  const router = useRouter()
  const { createUser } = useUsers()
  const { user } = useAuthStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
     name: '',
     email: '',
     password: '',
     role: 'operator' as UserRole
  })

  const handleSave = async () => {
     if (!formData.name || !formData.email || !formData.password || !formData.role) {
         useToastStore.getState().show('Preencha todos os campos.', 'warning')
         return
     }

     try {
         setIsSubmitting(true)
         await createUser({
             name: formData.name,
             email: formData.email,
             role: formData.role,
             company_id: user?.company_id || '',
             logo_url: null,
             is_active: 1
         }, formData.password)
         useToastStore.getState().show('Membro da equipa adicionado com sucesso', 'success')
         router.back()
     } catch (e: any) {
         useToastStore.getState().show(e.message, 'error')
     } finally {
         setIsSubmitting(false)
     }
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900">
      <Header title="Adicionar Membro" showBack />
      
      <Screen scrollable>
        <View className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
           <FormField 
               label="Nome *" 
               value={formData.name} 
               onChangeText={v => setFormData(prev => ({...prev, name: v}))} 
           />
           <FormField 
               label="E-mail *" 
               value={formData.email} 
               onChangeText={v => setFormData(prev => ({...prev, email: v}))}
               autoCapitalize="none"
               keyboardType="email-address"
           />
           <FormField 
               label="Palavra-passe provisória *" 
               value={formData.password} 
               onChangeText={v => setFormData(prev => ({...prev, password: v}))} 
               secureTextEntry
           />
           <FormField 
               label="Função (admin | manager | operator | viewer) *" 
               value={formData.role} 
               onChangeText={v => setFormData(prev => ({...prev, role: v as UserRole}))}
               autoCapitalize="none" 
           />

           <Button title="Gravar Utilizador" onPress={handleSave} isLoading={isSubmitting} className="mt-4" />
        </View>
      </Screen>
    </Screen>
  )
}
