import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Customer } from '@/types'
import { useCompanyStore } from '@/store/companyStore'
import { X, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react-native'

interface CustomerFormModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  initialData?: Customer | null
}

export default function CustomerFormModal({ visible, onClose, onSubmit, initialData }: CustomerFormModalProps) {
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    nif: initialData?.nif || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!formData.name) {
      useToastStore.getState().show('Por favor, indique o nome do cliente.', 'warning')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        company_id: activeCompanyId!
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.85}>
      <View className="flex-1 bg-white dark:bg-slate-950">
        <View className="flex-row justify-between items-center px-6 py-5">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
            {initialData ? 'Editar Cliente' : 'Novo Cliente'}
          </Text>
          <TouchableOpacity 
            onPress={onClose}
            className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
          >
            <X size={20} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6">
          <Input
            label="Nome Completo"
            placeholder="Ex: Manuel Silva"
            value={formData.name}
            onChangeText={(text) => setFormData(p => ({ ...p, name: text }))}
            icon={<User size={20} color="#94a3b8" />}
          />

          <Input
            label="Email"
            placeholder="Ex: manuel@email.com"
            value={formData.email}
            onChangeText={(text) => setFormData(p => ({ ...p, email: text }))}
            keyboardType="email-address"
            icon={<Mail size={20} color="#94a3b8" />}
          />
          <Input
            label="Telemóvel"
            placeholder="Ex: 923 000 000"
            value={formData.phone}
            onChangeText={(text) => setFormData(p => ({ ...p, phone: text }))}
            keyboardType="phone-pad"
            icon={<Phone size={20} color="#94a3b8" />}
          />

          <Input
            label="Contribuinte (NIF / NUIT)"
            placeholder="Ex: 500000000"
            value={formData.nif}
            onChangeText={(text) => setFormData(p => ({ ...p, nif: text }))}
            keyboardType="numeric"
            icon={<CreditCard size={20} color="#94a3b8" />}
          />

          <Input
            label="Morada"
            placeholder="Rua, Cidade, Província"
            value={formData.address}
            onChangeText={(text) => setFormData(p => ({ ...p, address: text }))}
            multiline
            numberOfLines={3}
            icon={<MapPin size={20} color="#94a3b8" />}
          />

        </ScrollView>

        <View className="px-6 pt-6 pb-12 bg-white dark:bg-slate-950">
          <Button
            variant="gradient"
            gradientColors={['#4f46e5', '#4338ca']}
            title={initialData ? "Atualizar" : "Criar Cliente"}
            onPress={handleSave}
            isLoading={isSubmitting}
            className="h-14 rounded-2xl shadow-lg shadow-primary/30"
          />
        </View>
      </View>
    </BottomSheet>
  )
}
