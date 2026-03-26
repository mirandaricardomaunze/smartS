import { View, Text, TouchableOpacity, FlatList, TextInput, Image } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
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
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { Employee } from '@/features/hr/types'
import { feedback } from '@/utils/haptics'
import EmployeeFormModal from '@/features/hr/components/EmployeeFormModal'

export default function EmployeesScreen() {
  const router = useRouter()
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
                {item.position || 'Sem Cargo'} • {item.employment_type}
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
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Funcionários" />

      {/* Search Bar */}
      <View className="px-6 py-4 flex-row space-x-2">
        <View className="flex-1 bg-white dark:bg-white/5 rounded-2xl flex-row items-center px-4 border border-slate-100 dark:border-white/10 h-14">
          <Search size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
            placeholder="Pesquisar por nome ou cargo..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl items-center justify-center border border-slate-100 dark:border-white/10">
          <Filter size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployee}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pb-32"
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

      {/* FAB */}
      <TouchableOpacity 
        className="absolute bottom-8 right-6 w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-premium-lg"
        onPress={handleAdd}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      <EmployeeFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialData={selectedEmployee}
      />
    </Screen>
  )
}
