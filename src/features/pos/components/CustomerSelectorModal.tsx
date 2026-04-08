import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import { usePOSStore } from '../store/posStore'
import { Search, UserPlus, Check, ChevronRight, User } from 'lucide-react-native'
import { feedback } from '@/utils/haptics'
import { useCompanyStore } from '@/store/companyStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface CustomerSelectorModalProps {
  isVisible: boolean
  onClose: () => void
}

export default function CustomerSelectorModal({ isVisible, onClose }: CustomerSelectorModalProps) {
  const { customers, createCustomer } = useCustomers()
  const { selectedCustomer, setCustomer } = usePOSStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  
  // New Customer State
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.nif?.includes(searchQuery)
    )
  }, [customers, searchQuery])

  const handleSelect = (customer: any) => {
    feedback.light()
    setCustomer(customer)
    onClose()
  }

  const handleQuickCreate = async () => {
    if (!newName) return
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return

    try {
      const customer = await createCustomer({
        name: newName,
        phone: newPhone || null,
        email: null,
        address: null,
        nif: null,
        company_id: activeCompanyId
      } as any)
      
      feedback.success()
      setCustomer(customer)
      setIsAddingNew(false)
      setNewName('')
      setNewPhone('')
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <BottomSheet visible={isVisible} onClose={onClose} height={0.85}>
      <View className="flex-1 px-6">
        {!isAddingNew ? (
          <>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-black text-slate-900 dark:text-white">Selecionar Cliente</Text>
              <TouchableOpacity 
                onPress={() => setIsAddingNew(true)}
                className="flex-row items-center bg-primary/10 px-3 py-2 rounded-xl"
              >
                <UserPlus size={18} color="#4f46e5" />
                <Text className="ml-2 text-primary font-bold text-xs">Novo</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <View className="flex-row items-center bg-slate-100 dark:bg-slate-900 rounded-2xl px-4 h-14 border border-slate-200 dark:border-white/5">
                <Search size={20} color="#94a3b8" />
                <TextInput
                  placeholder="Nome, Telefone ou NIF..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedCustomer?.id === item.id
                return (
                  <TouchableOpacity 
                    onPress={() => handleSelect(item)}
                    className={`flex-row items-center p-4 rounded-2xl mb-2 border ${isSelected ? 'bg-primary/5 border-primary' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5'}`}
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isSelected ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`}>
                       <User size={20} color={isSelected ? 'white' : '#64748b'} />
                    </View>
                    <View className="flex-1">
                       <Text className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{item.name}</Text>
                       <Text className="text-xs text-slate-500">{item.phone || 'Sem telefone'} • {item.nif || 'Sem NIF'}</Text>
                    </View>
                    {isSelected ? <Check size={20} color="#4f46e5" /> : <ChevronRight size={20} color="#cbd5e1" />}
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={
                <View className="items-center py-10">
                  <Text className="text-slate-500">Nenhum cliente encontrado</Text>
                </View>
              }
            />

            <TouchableOpacity 
               onPress={() => handleSelect(null)}
               className="py-4 mt-2 items-center"
            >
               <Text className="text-rose-500 font-bold">Remover Cliente (Consumidor Final)</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View>
            <View className="flex-row items-center mb-6">
               <TouchableOpacity onPress={() => setIsAddingNew(false)} className="mr-3">
                  <ChevronRight size={24} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
               </TouchableOpacity>
               <Text className="text-xl font-black text-slate-900 dark:text-white">Cadastro Rápido</Text>
            </View>

            <View className="space-y-4">
              <Input
                label="Nome do Cliente"
                placeholder="Ex: Manuel Antunes"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <Input
                label="Telefone (Opcional)"
                placeholder="Ex: 923 000 000"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
              
              <View className="mt-8">
                <Button 
                  title="Criar e Selecionar" 
                  onPress={handleQuickCreate}
                  disabled={!newName}
                />
                <TouchableOpacity 
                   onPress={() => setIsAddingNew(false)}
                   className="py-4 items-center"
                >
                   <Text className="text-slate-500 font-bold">Voltar para a Lista</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </BottomSheet>
  )
}
