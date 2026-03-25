import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { X, Building2, Upload, Camera } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import BottomSheet from '@/components/ui/BottomSheet'
import { Company } from '@/types'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import * as ImagePicker from 'expo-image-picker'
import { storageService } from '@/services/storageService'

interface CompanyFormModalProps {
  visible: boolean
  onClose: () => void
  onSave: (data: Omit<Company, 'id' | 'created_at' | 'synced'>) => Promise<void>
  initialData?: Company | null
}

export default function CompanyFormModal({ visible, onClose, onSave, initialData }: CompanyFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    address: '',
    phone: '',
    email: '',
    logo_url: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showToast = useToastStore((state) => state.show)

  useEffect(() => {
    if (visible && initialData) {
      setFormData({
        name: initialData.name,
        nif: initialData.nif || '',
        address: initialData.address || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        logo_url: initialData.logo_url || '',
      })
    } else if (visible) {
      setFormData({
        name: '',
        nif: '',
        address: '',
        phone: '',
        email: '',
        logo_url: '',
      })
    }
  }, [visible, initialData])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    })

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, logo_url: result.assets[0].uri }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      feedback.warning()
      return
    }

    try {
      setIsSubmitting(true)
      feedback.medium()
      
      let finalLogoUrl = formData.logo_url
      
      // If logo is a local URI, upload it (simplified check)
      if (formData.logo_url && formData.logo_url.startsWith('file://')) {
        const fileName = `${Date.now()}-logo.jpg`
        finalLogoUrl = await storageService.uploadImage('company-logos', fileName, formData.logo_url)
      }

      await onSave({
        ...formData,
        logo_url: finalLogoUrl || null
      })
      
      showToast('Empresa guardada com sucesso!', 'success')
      onClose()
    } catch (error) {
      console.error(error)
      showToast('Erro ao guardar empresa', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.85}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <View className="flex-1 bg-white dark:bg-slate-950 px-6 pt-4 pb-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
              {initialData ? 'Editar Empresa' : 'Nova Empresa'}
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
            >
              <X size={20} color="#4f46e5" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <View className="items-center mb-8">
              <TouchableOpacity 
                onPress={pickImage}
                className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 items-center justify-center overflow-hidden"
              >
                {formData.logo_url ? (
                  <Image source={{ uri: formData.logo_url }} className="w-full h-full" />
                ) : (
                  <View className="items-center">
                    <Camera size={24} color="#94a3b8" />
                    <Text className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Logo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Clique para alterar</Text>
            </View>

            <View className="space-y-4">
              <Input
                label="Nome da Empresa *"
                placeholder="Ex: Minha Loja Lda"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                error={errors.name}
              />

              <Input
                label="NIF / NUIT / Contribuinte"
                placeholder="Ex: 500123456"
                value={formData.nif}
                onChangeText={text => setFormData({ ...formData, nif: text })}
                keyboardType="numeric"
              />

              <Input
                label="Endereço Completo"
                placeholder="Rua, Número, Cidade"
                value={formData.address}
                onChangeText={text => setFormData({ ...formData, address: text })}
                multiline
              />

              <Input
                label="Telefone"
                placeholder="+244 ..."
                value={formData.phone}
                onChangeText={text => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <Input
                label="E-mail"
                placeholder="empresa@exemplo.com"
                value={formData.email}
                onChangeText={text => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="h-20" />
          </ScrollView>

          <View className="pt-6 pb-12 bg-white dark:bg-slate-950">
            <Button
              variant="gradient"
              gradientColors={['#4f46e5', '#4338ca']}
              title={initialData ? 'Atualizar Empresa' : 'Criar Empresa'}
              onPress={handleSave}
              isLoading={isSubmitting}
              className="h-14 rounded-2xl shadow-lg shadow-primary/30"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
}
