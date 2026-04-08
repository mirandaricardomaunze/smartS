import { View, Text, TouchableOpacity, FlatList, TextInput, Image } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router'

import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  User as UserIcon, 
  Search, 
  Plus, 
  Filter,
  Briefcase,
  Building2,
  Edit2
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import IconButton from '@/components/ui/IconButton'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { Employee } from '@/features/hr/types'
import { feedback } from '@/utils/haptics'
import EmployeeFormModal from '@/features/hr/components/EmployeeFormModal'

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Efectivo',
  'fixed-term': 'A Prazo',
  probation: 'Período de Experiência',
}

export default function EmployeesScreen() {


  const [search, setSearch] = useState('')
  const { employees, isLoading, createEmployee, updateEmployee } = useEmployees()
  
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.position?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp)
    setModalVisible(true)
  }

  const handleAdd = () => {
    setSelectedEmployee(null)
    setModalVisible(true)
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, data)
      } else {
        await createEmployee(data)
      }
      setModalVisible(false)
      feedback.success()
    } catch (error: any) {
      console.error(error)
    }
  }

  const renderEmployee = ({ item }: { item: Employee }) => (
    <Card variant="premium" className="mb-3 border-slate-100 dark:border-white/5 overflow-hidden">
      <TouchableOpacity 
        onPress={() => {
          feedback.light()
          router.push(`/(app)/hr/employees/${item.id}`)
        }}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4 border border-primary/20">
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} className="w-full h-full rounded-2xl" />
            ) : (
              <UserIcon size={24} color="#4f46e5" />
            )}
          </View>
          
          <View className="flex-1">
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
              {item.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight">
                {item.position || 'Sem Cargo'} • {EMPLOYMENT_TYPE_LABELS[item.employment_type] ?? item.employment_type}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => handleOpenEdit(item)}
          className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl"
        >
          <Edit2 size={16} color="#64748b" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Card>
  )

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Funcionários" />

      {/* Search & Filter Bar */}
      <View className="px-6 mt-4 flex-row items-center space-x-2">
        <View className="flex-1">
          <Input
            placeholder="Pesquisar por nome ou cargo..."
            value={search}
            onChangeText={setSearch}
            icon={<Search size={20} color="#94a3b8" />}
            className="mb-0 bg-white dark:bg-slate-900/50"
          />
        </View>
        <IconButton 
          icon={Filter} 
          variant="outline" 
          size="lg" 
          className="rounded-2xl border-slate-100 dark:border-white/10"
          onPress={() => feedback.light()}
        />
      </View>

      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployee}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pt-4 pb-32"
        ListEmptyComponent={
          isLoading ? (
            <Loading message="A carregar funcionários..." />
          ) : (
            <EmptyState 
              title="Sem funcionários"
              description="Nenhum funcionário encontrado."
            />
          )
        }
      />

      {/* Standardized FAB */}
      <View className="absolute bottom-10 right-6 shadow-premium-lg">
        <IconButton 
          icon={Plus} 
          variant="primary" 
          size="lg" 
          onPress={handleAdd}
          iconSize={28}
          className="rounded-2xl"
        />
      </View>

      <EmployeeFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialData={selectedEmployee}
      />
    </Screen>
  )
}
