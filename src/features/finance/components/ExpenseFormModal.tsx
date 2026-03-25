import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { X, DollarSign, Calendar, Tag, FileText, CheckCircle2, Clock, ChevronDown } from 'lucide-react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import DatePicker from '@/components/ui/DatePicker'
import PickerModal from '@/components/ui/PickerModal'
import Button from '@/components/ui/Button'
import { FinancialTransaction } from '@/types'
import { useCompanyStore } from '@/store/companyStore'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'

interface ExpenseFormModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

const EXPENSE_CATEGORIES = [
  { id: 'Manutenção', label: 'Manutenção', color: 'slate' },
  { id: 'Renda', label: 'Renda / Aluguer', color: 'amber' },
  { id: 'Salários', label: 'Salários', color: 'indigo' },
  { id: 'Stock', label: 'Compra de Stock', color: 'emerald' },
  { id: 'Marketing', label: 'Marketing', color: 'pink' },
  { id: 'Outros', label: 'Outros', color: 'slate' },
]

export default function ExpenseFormModal({ visible, onClose, onSubmit }: ExpenseFormModalProps) {
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)
  const showToast = useToastStore(state => state.show)
  
  const [formData, setFormData] = useState({
    category: 'Manutenção',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'paid' as 'paid' | 'pending'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false)

  const handleSave = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('Por favor, introduza um valor válido', 'warning')
      return
    }

    setIsSubmitting(true)
    feedback.medium()
    
    try {
      await onSubmit({
        company_id: activeCompanyId!,
        type: 'expense',
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        status: formData.status,
        related_type: 'other',
        related_id: null
      })
      
      feedback.success()
      showToast('Despesa registada com sucesso', 'success')
      onClose()
      
      // Reset form
      setFormData({
        category: 'Manutenção',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid'
      })
    } catch (error) {
      feedback.error()
      showToast('Erro ao registar despesa', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.8}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <View className="flex-1 bg-white dark:bg-slate-950">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-5">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
              Nova Despesa
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
            >
              <X size={20} color="#4f46e5" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-2">
            <View className="mb-6">
              <Input
                label="Valor da Despesa"
                placeholder="0.00"
                value={formData.amount}
                onChangeText={(text) => setFormData(p => ({ ...p, amount: text.replace(',', '.') }))}
                keyboardType="numeric"
                icon={<DollarSign size={20} color="#94a3b8" />}
              />
            </View>

            <View className="mb-6">
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Categoria
              </Text>
              <TouchableOpacity
                onPress={() => setIsCategoryPickerVisible(true)}
                className="flex-row items-center border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-slate-900 px-4 h-14 shadow-premium-sm"
              >
                <Tag size={20} color="#94a3b8" className="mr-3" />
                <Text className="flex-1 text-base text-slate-900 dark:text-white font-medium">
                  {formData.category}
                </Text>
                <ChevronDown size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <PickerModal
              visible={isCategoryPickerVisible}
              onClose={() => setIsCategoryPickerVisible(false)}
              title="Selecionar Categoria"
              selectedValue={formData.category}
              onSelect={(value) => setFormData(p => ({ ...p, category: value }))}
              options={EXPENSE_CATEGORIES.map(c => ({ label: c.label, value: c.id }))}
            />

            <View className="mb-6">
              <DatePicker
                label="Data da Despesa"
                value={formData.date}
                onChange={(date) => setFormData(p => ({ ...p, date }))}
              />
            </View>

            <View className="mb-6">
              <Input
                label="Descrição (Opcional)"
                placeholder="Ex: Pagamento da luz mensal"
                value={formData.description}
                onChangeText={(text) => setFormData(p => ({ ...p, description: text }))}
                multiline
                numberOfLines={2}
                icon={<FileText size={20} color="#94a3b8" />}
              />
            </View>

            <View className="mb-10">
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                Estado do Pagamento
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setFormData(p => ({ ...p, status: 'paid' }))}
                  className={`flex-1 flex-row items-center justify-center p-4 rounded-2xl border-2 ${
                    formData.status === 'paid'
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-900 border-transparent'
                  }`}
                >
                  <CheckCircle2 size={18} color={formData.status === 'paid' ? '#10b981' : '#94a3b8'} className="mr-2" />
                  <Text className={`text-xs font-bold ${formData.status === 'paid' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                    Pago
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setFormData(p => ({ ...p, status: 'pending' }))}
                  className={`flex-1 flex-row items-center justify-center p-4 rounded-2xl border-2 ${
                    formData.status === 'pending'
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500'
                      : 'bg-slate-50 dark:bg-slate-900 border-transparent'
                  }`}
                >
                  <Clock size={18} color={formData.status === 'pending' ? '#f59e0b' : '#94a3b8'} className="mr-2" />
                  <Text className={`text-xs font-bold ${formData.status === 'pending' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}`}>
                    Pendente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View className="px-6 pt-6 pb-12 bg-white dark:bg-slate-950">
            <Button
              variant="gradient"
              gradientColors={['#4f46e5', '#4338ca']}
              title="Registar Despesa"
              onPress={handleSave}
              isLoading={isSubmitting}
              className="h-14 rounded-2xl shadow-lg shadow-primary/30 mb-8"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
}
