import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useCountryConfig } from '@/hooks/useCountryConfig'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Supplier } from '@/types'
import { useCompanyStore } from '@/store/companyStore'
import { X, Building2, User, Mail, Phone, MapPin, CreditCard, Save, Edit2 } from 'lucide-react-native'

interface SupplierFormModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  initialData?: Supplier | null
}

export default function SupplierFormModal({ visible, onClose, onSubmit, initialData }: SupplierFormModalProps) {
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const countryConfig = useCountryConfig()
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    nif: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync state with initialData when it changes or modal opens
  React.useEffect(() => {
    if (visible) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          contact_name: initialData.contact_name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          nif: initialData.nif || ''
        })
      } else {
        setFormData({
          name: '',
          contact_name: '',
          email: '',
          phone: '',
          address: '',
          nif: ''
        })
      }
    }
  }, [visible, initialData])

  const handleSave = async () => {
    if (!formData.name) return
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
            {initialData ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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
            label="Nome da Empresa"
            placeholder="Ex: Logística Nacional Lda"
            value={formData.name}
            onChangeText={(text) => setFormData(p => ({ ...p, name: text }))}
            icon={<Building2 size={20} color="#94a3b8" />}
          />

          <Input
            label="Pessoa de Contacto"
            placeholder="Ex: João Ferreira"
            value={formData.contact_name}
            onChangeText={(text) => setFormData(p => ({ ...p, contact_name: text }))}
            icon={<User size={20} color="#94a3b8" />}
          />

          <Input
            label="Email"
            placeholder="comercial@fornecedor.com"
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
            label={`Contribuinte (${countryConfig.tax.taxIdLabel})`}
            placeholder="Ex: 500000000"
            value={formData.nif}
            onChangeText={(text) => setFormData(p => ({ ...p, nif: text }))}
            keyboardType="numeric"
            icon={<CreditCard size={20} color="#94a3b8" />}
          />

          <Input
            label="Morada"
            placeholder="Sede ou Armazém"
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
            title={initialData ? "Atualizar" : "Criar Fornecedor"}
            onPress={handleSave}
            isLoading={isSubmitting}
            icon={initialData ? <Edit2 size={20} color="white" /> : <Building2 size={20} color="white" />}
            className="shadow-lg shadow-primary/30"
          />
        </View>
      </View>
    </BottomSheet>
  )
}
