import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useCountryConfig } from '@/hooks/useCountryConfig'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  Calendar, 
  CreditCard,
  Building2,
  Camera,
  Heart,
  Globe,
  Settings,
  Edit2
} from 'lucide-react-native'
import { useDepartments } from '../hooks/useDepartments'
import { usePositions } from '../hooks/usePositions'
import { Employee, EmploymentType } from '../types'
import Select from '@/components/ui/Select'
import * as ImagePicker from 'expo-image-picker'
import { feedback } from '@/utils/haptics'
import { useConfirmStore } from '@/store/useConfirmStore'

interface EmployeeFormModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialData?: Employee | null
}

export default function EmployeeFormModal({ visible, onClose, onSubmit, initialData }: EmployeeFormModalProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  const { departments } = useDepartments()
  const { positions } = usePositions()
  const countryConfig = useCountryConfig()

  const [form, setForm] = useState({
    name: '',
    bi_number: '',
    nit: '',
    address: '',
    phone: '',
    email: '',
    position_id: '',
    department_id: '',
    employment_type: 'permanent' as EmploymentType,
    nacionality: '',
    civil_status: 'Solteiro(a)',
    emergency_contact: '',
    bank_name: '',
    bank_account: '',
    nib: '',
    photo_url: ''
  })

  useEffect(() => {
    if (initialData) {
      const contacts = initialData.contacts ? JSON.parse(initialData.contacts) : {}
      setForm({
        name: initialData.name,
        bi_number: initialData.bi_number || '',
        nit: initialData.nit || '',
        address: initialData.address || '',
        phone: contacts.phone || '',
        email: contacts.email || '',
        position_id: initialData.position_id || '',
        department_id: '', // Would need to find based on position
        employment_type: initialData.employment_type || 'permanent',
        nacionality: initialData.nacionality || '',
        civil_status: initialData.civil_status || 'Solteiro(a)',
        emergency_contact: initialData.emergency_contact || '',
        bank_name: initialData.bank_name || '',
        bank_account: initialData.bank_account || '',
        nib: initialData.nib || '',
        photo_url: initialData.photo_url || ''
      })
    } else {
      setForm({
        name: '',
        bi_number: '',
        nit: '',
        address: '',
        phone: '',
        email: '',
        position_id: '',
        department_id: '',
        employment_type: 'permanent',
        nacionality: '',
        civil_status: 'Solteiro(a)',
        emergency_contact: '',
        bank_name: '',
        bank_account: '',
        nib: '',
        photo_url: ''
      })
    }
  }, [initialData, visible])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    })

    if (!result.canceled) {
      setForm(prev => ({ ...prev, photo_url: result.assets[0].uri }))
      feedback.success()
    }
  }

  const handleSubmit = () => {
    if (!form.name || !form.position_id) {
      useConfirmStore.getState().show({
        title: 'Erro',
        message: 'Nome e Cargo são obrigatórios',
        confirmLabel: 'OK',
        showCancel: false,
        onConfirm: () => {}
      })
      return
    }
    const contacts = JSON.stringify({ phone: form.phone, email: form.email })
    onSubmit({
      ...form,
      contacts,
      is_active: 1
    })
  }

  const filteredPositions = positions.filter(p => !form.department_id || p.department_id === form.department_id)

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.9}>
      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white">
            {initialData ? 'Editar Funcionário' : 'Novo Funcionário'}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
          {/* Photo Header */}
          <View className="items-center mb-8">
            <TouchableOpacity 
              onPress={pickImage}
              className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/10 overflow-hidden"
            >
              {form.photo_url ? (
                <View className="w-full h-full">
                  <Text className="absolute z-10 top-1/2 left-1/2 -ml-4 -mt-4 text-white opacity-0">Edit</Text>
                  {/* Image would be rendered here in real app */}
                  <View className="w-full h-full bg-primary/20 items-center justify-center">
                    <Camera size={24} color="#4f46e5" />
                  </View>
                </View>
              ) : (
                <>
                  <Camera size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                  <Text className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Foto</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Secção: Identificação */}
          <Text className="text-xs font-black text-primary dark:text-primary-dark uppercase tracking-[2px] mb-4">
            Identificação e Pessoal
          </Text>
          
          <Input
            label="Nome Completo"
            placeholder="Ex: João Silva"
            value={form.name}
            onChangeText={t => setForm(f => ({ ...f, name: t }))}
            icon={<User size={18} color="#94a3b8" />}
          />

          <View className="flex-row space-x-3">
             <View className="flex-1">
                <Select
                  label="Nacionalidade"
                  value={form.nacionality}
                  onValueChange={v => setForm(f => ({ ...f, nacionality: v }))}
                  options={[
                    { label: 'Nacional', value: 'Nacional' },
                    { label: 'Estrangeira', value: 'Estrangeira' }
                  ]}
                />
             </View>
             <View className="flex-1">
                <Select
                  label="Estado Civil"
                  value={form.civil_status}
                  onValueChange={v => setForm(f => ({ ...f, civil_status: v }))}
                  options={[
                    { label: 'Solteiro(a)', value: 'Solteiro(a)' },
                    { label: 'Casado(a)', value: 'Casado(a)' },
                    { label: 'Divorciado(a)', value: 'Divorciado(a)' },
                    { label: 'Viúvo(a)', value: 'Viúvo(a)' }
                  ]}
                />
             </View>
          </View>

          <View className="flex-row space-x-3 mt-4">
            <View className="flex-1">
              <Input
                label="Nº do BI / Documento"
                placeholder="000000000"
                value={form.bi_number}
                onChangeText={t => setForm(f => ({ ...f, bi_number: t }))}
              />
            </View>
            <View className="flex-1">
              <Input
                label={countryConfig.tax.taxIdLabel}
                placeholder="123456789"
                value={form.nit}
                onChangeText={t => setForm(f => ({ ...f, nit: t }))}
              />
            </View>
          </View>

          {/* Secção: Contactos */}
          <Text className="text-xs font-black text-primary dark:text-primary-dark uppercase tracking-[2px] mb-4 mt-8">
            Contactos & Endereço
          </Text>

          <Input
            label="Telefone Principal"
            placeholder="+000 000 000 000"
            value={form.phone}
            onChangeText={t => setForm(f => ({ ...f, phone: t }))}
            keyboardType="phone-pad"
            icon={<Phone size={18} color="#94a3b8" />}
          />

          <Input
            label="Contacto de Emergência"
            placeholder="Nome / Telefone"
            value={form.emergency_contact}
            onChangeText={t => setForm(f => ({ ...f, emergency_contact: t }))}
            icon={<Heart size={18} color="#f43f5e" />}
          />

          <Input
            label="Email Profissional"
            placeholder="exemplo@empresa.com"
            value={form.email}
            onChangeText={t => setForm(f => ({ ...f, email: t }))}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={18} color="#94a3b8" />}
          />

          {/* Secção: Contrato */}
          <Text className="text-xs font-black text-primary dark:text-primary-dark uppercase tracking-[2px] mb-4 mt-8">
            Dados Profissionais
          </Text>

          <Select
            label="Departamento"
            placeholder="Seleccionar..."
            value={form.department_id}
            onValueChange={v => setForm(f => ({ ...f, department_id: v }))}
            options={departments.map(d => ({ label: d.name, value: d.id }))}
          />

          <Select
            label="Cargo"
            placeholder="Seleccionar..."
            value={form.position_id}
            onValueChange={v => setForm(f => ({ ...f, position_id: v }))}
            options={filteredPositions.map(p => ({ label: p.title, value: p.id }))}
          />

          <Select
            label="Tipo de Contrato"
            value={form.employment_type}
            onValueChange={v => setForm(f => ({ ...f, employment_type: v as any }))}
            options={[
              { label: 'Efectivo', value: 'permanent' },
              { label: 'Prazo Certo', value: 'fixed-term' },
              { label: 'Experiência', value: 'probation' }
            ]}
          />

          {/* Secção: Bancários */}
          <Text className="text-xs font-black text-primary dark:text-primary-dark uppercase tracking-[2px] mb-4 mt-8">
            Dados Bancários
          </Text>

          <Input
            label="Banco"
            placeholder="Ex: Banco Comercial"
            value={form.bank_name}
            onChangeText={t => setForm(f => ({ ...f, bank_name: t }))}
            icon={<Building2 size={18} color="#94a3b8" />}
          />

          <View className="flex-row space-x-3">
             <View className="flex-[0.4]">
                <Input
                  label="Conta"
                  placeholder="000000000"
                  value={form.bank_account}
                  onChangeText={t => setForm(f => ({ ...f, bank_account: t }))}
                  keyboardType="numeric"
                />
             </View>
             <View className="flex-[0.6]">
                <Input
                  label="NIB"
                  placeholder="0000 0000 0000 0000"
                  value={form.nib}
                  onChangeText={t => setForm(f => ({ ...f, nib: t }))}
                  keyboardType="numeric"
                />
             </View>
          </View>

          <View className="mt-8 mb-10">
            <Button
              title={initialData ? "Actualizar Funcionário" : "Registar Funcionário"}
              variant="gradient"
              gradientColors={['#4f46e5', '#4338ca']}
              onPress={handleSubmit}
              icon={initialData ? <Edit2 size={18} color="white" /> : <User size={18} color="white" />}
              className="shadow-lg shadow-primary/30"
            />
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  )
}
