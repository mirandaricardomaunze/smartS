import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Category } from '@/types'
import { useCompanyStore } from '@/store/companyStore'
import { X, Tag, AlignLeft, Plus, Save, Edit2 } from 'lucide-react-native'

interface CategoryFormModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  initialData?: Category | null
}

export default function CategoryFormModal({ visible, onClose, onSubmit, initialData }: CategoryFormModalProps) {
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync state with initialData when it changes or modal opens
  React.useEffect(() => {
    if (visible) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || ''
        })
      } else {
        setFormData({
          name: '',
          description: ''
        })
      }
    }
  }, [visible, initialData])

  const handleSave = async () => {
    if (!formData.name) return
    
    if (!activeCompanyId) {
      console.warn('Attempted to save category without activeCompanyId')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        company_id: activeCompanyId
      })
      
      if (!initialData) {
        setFormData({ name: '', description: '' })
      }
      onClose()
    } catch (error) {
       console.error('Error saving category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.85}>
      <View className="flex-1 bg-white dark:bg-slate-950">
        <View className="flex-row justify-between items-center px-6 py-5">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
            {initialData ? 'Editar Categoria' : 'Nova Categoria'}
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
            label="Nome da Categoria"
            placeholder="Ex: Alimentos, Bebidas, etc."
            value={formData.name}
            onChangeText={(text) => setFormData(p => ({ ...p, name: text }))}
            icon={<Tag size={20} color="#94a3b8" />}
          />

          <Input
            label="Descrição (Opcional)"
            placeholder="Pequena descrição da categoria..."
            value={formData.description || ''}
            onChangeText={(text) => setFormData(p => ({ ...p, description: text }))}
            multiline
            numberOfLines={3}
            icon={<AlignLeft size={20} color="#94a3b8" />}
          />
        </ScrollView>

        <View className="px-6 pt-6 pb-12 bg-white dark:bg-slate-950">
          <Button
            variant="gradient"
            gradientColors={['#4f46e5', '#4338ca']}
            title={initialData ? "Atualizar" : "Criar Categoria"}
            onPress={handleSave}
            isLoading={isSubmitting}
            icon={initialData ? <Edit2 size={20} color="white" /> : <Plus size={20} color="white" />}
            className="h-14 rounded-2xl shadow-lg shadow-primary/30"
          />
        </View>
      </View>
    </BottomSheet>
  )
}
