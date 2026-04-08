import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { X, UserPlus, Shield, User, Mail, Lock, ShieldCheck, ShieldAlert, Edit2 } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { UserRole } from '@/types'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import BottomSheet from '@/components/ui/BottomSheet'

interface UserFormModalProps {
  visible: boolean
  onClose: () => void
  onSave: (data: any, password?: string) => Promise<void>
  initialData?: any
}

export default function UserFormModal({ 
  visible, 
  onClose, 
  onSave,
  initialData
}: UserFormModalProps) {
  const showToast = useToastStore((state) => state.show)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator' as UserRole,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          password: '', // Password stays empty unless changing
          role: initialData.role || 'operator',
        })
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'operator',
        })
      }
    }
  }, [visible, initialData])

  const handleSave = async () => {
    if (!formData.name || !formData.email || (!initialData && !formData.password)) {
      showToast('Preencha os campos obrigatórios', 'warning')
      return
    }

    try {
      setIsSubmitting(true)
      feedback.medium()
      await onSave({
        ...initialData,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }, formData.password || undefined)
      feedback.success()
      showToast(initialData ? 'Utilizador atualizado' : 'Utilizador criado com sucesso', 'success')
      onClose()
    } catch (error: any) {
      feedback.error()
      showToast(error.message || (initialData ? 'Erro ao atualizar' : 'Erro ao criar utilizador'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const RoleOption = ({ role, label, icon: Icon, color }: { role: UserRole, label: string, icon: any, color: string }) => {
    const isActive = formData.role === role
    return (
      <TouchableOpacity 
        onPress={() => setFormData(prev => ({ ...prev, role }))}
        className={`flex-row items-center p-4 rounded-2xl border-2 mb-3 ${
          isActive 
            ? `bg-white dark:bg-slate-800 border-${color}-500 shadow-sm` 
            : 'bg-slate-50 dark:bg-slate-800/50 border-white/5'
        }`}
      >
        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${isActive ? `bg-${color}-50 dark:bg-${color}-900/20` : 'bg-slate-100 dark:bg-slate-800'}`}>
          <Icon size={20} color={isActive ? (color === 'primary' ? '#4f46e5' : color === 'amber' ? '#f59e0b' : color === 'red' ? '#ef4444' : '#64748b') : '#94a3b8'} />
        </View>
        <Text className={`text-sm font-bold flex-1 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
          {label}
        </Text>
        {isActive && <View className={`w-2 h-2 rounded-full bg-${color}-500`} />}
      </TouchableOpacity>
    )
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={0.85}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="bg-white dark:bg-slate-950 flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-5">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
              {initialData ? 'Editar Utilizador' : 'Novo Utilizador'}
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

            <View className="mb-6">
              <Input
                label="Palavra-passe *"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChangeText={(v) => setFormData(prev => ({ ...prev, password: v }))}
                secureTextEntry
                icon={<Lock size={18} color="#94a3b8" />}
              />
            </View>

            <Text style={{ fontFamily: 'Inter-Black' }} className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Função e Acessos
            </Text>
            
            <RoleOption role="admin" label="Administrador" icon={ShieldCheck} color="red" />
            <RoleOption role="manager" label="Gestor" icon={Shield} color="amber" />
            <RoleOption role="operator" label="Operador" icon={User} color="primary" />
            <RoleOption role="viewer" label="Visualizador" icon={User} color="slate" />
            
            <View className="h-20" />
          </ScrollView>

          <View className="px-6 pt-6 pb-12 bg-white dark:bg-slate-950">
            <Button 
              variant="gradient"
              gradientColors={['#4f46e5', '#4338ca']}
              title={initialData ? 'Atualizar Utilizador' : 'Criar Utilizador'}
              onPress={handleSave}
              isLoading={isSubmitting}
              icon={initialData ? <Edit2 size={20} color="white" /> : <UserPlus size={20} color="white" />}
              className="h-14 rounded-2xl shadow-lg shadow-primary/30"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
}
