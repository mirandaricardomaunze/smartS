import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { X, User, Mail, Save } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { User as UserType } from '@/types'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import BottomSheet from '@/components/ui/BottomSheet'

interface ProfileFormModalProps {
  visible: boolean
  onClose: () => void
  onSave: (data: Partial<UserType>) => Promise<void>
  initialData: UserType | null
}

export default function ProfileFormModal({ 
  visible, 
  onClose, 
  onSave,
  initialData
}: ProfileFormModalProps) {
  const showToast = useToastStore((state) => state.show)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (visible && initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
      })
    }
  }, [visible, initialData])

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      showToast('Preencha os campos obrigatórios', 'warning')
      return
    }

    try {
      setIsSubmitting(true)
      feedback.medium()
      await onSave({
        name: formData.name,
        email: formData.email,
      })
      feedback.success()
      showToast('Perfil atualizado com sucesso', 'success')
      onClose()
    } catch (error: any) {
      feedback.error()
      showToast(error.message || 'Erro ao atualizar perfil', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={0.5}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="bg-white dark:bg-slate-950 flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-5">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
              Editar Perfil
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
            >
              <X size={20} color="#4f46e5" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
            <View className="mb-6">
              <Input
                label="Nome Completo *"
                placeholder="Ex: João Silva"
                value={formData.name}
                onChangeText={(v) => setFormData(prev => ({ ...prev, name: v }))}
                icon={<User size={18} color="#94a3b8" />}
              />
            </View>

            <View className="mb-6">
              <Input
                label="E-mail *"
                placeholder="joao@exemplo.com"
                value={formData.email}
                onChangeText={(v) => setFormData(prev => ({ ...prev, email: v }))}
                autoCapitalize="none"
                keyboardType="email-address"
                icon={<Mail size={18} color="#94a3b8" />}
              />
            </View>

            <View className="h-10" />
          </ScrollView>

          {/* Footer */}
          <View className="px-6 pt-6 pb-12 bg-white dark:bg-slate-950">
            <Button 
              variant="gradient"
              gradientColors={['#4f46e5', '#4338ca']}
              title="Guardar Alterações" 
              onPress={handleSave}
              isLoading={isSubmitting}
              icon={<Save size={20} color="white" />}
              className="h-14 rounded-2xl shadow-lg shadow-primary/30"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
}
