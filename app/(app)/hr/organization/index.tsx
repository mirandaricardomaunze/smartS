import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native'
import React, { useState } from 'react'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  Building2, 
  Briefcase, 
  Plus, 
  Trash2
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { useDepartments } from '@/features/hr/hooks/useDepartments'
import { usePositions } from '@/features/hr/hooks/usePositions'
import { Department, Position } from '@/features/hr/types'
import { feedback } from '@/utils/haptics'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

export default function OrganizationScreen() {
  const [activeTab, setActiveTab] = useState<'depts' | 'positions'>('depts')
  
  const { departments, isLoading: loadingDepts, createDepartment, deleteDepartment } = useDepartments()
  const { positions, isLoading: loadingPositions, createPosition, deletePosition } = usePositions()

  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'dept' | 'position'>('dept')
  
  const [deptForm, setDeptForm] = useState({ name: '', description: '' })
  const [posForm, setPosForm] = useState({ title: '', department_id: '', base_salary: '' })

  const handleCreate = async () => {
    try {
      if (modalType === 'dept') {
        if (!deptForm.name) throw new Error('Nome é obrigatório')
        await createDepartment({ 
          name: deptForm.name, 
          description: deptForm.description,
          is_active: 1 
        })
        setDeptForm({ name: '', description: '' })
      } else {
        if (!posForm.title || !posForm.department_id) throw new Error('Título e Departamento são obrigatórios')
        await createPosition({ 
          title: posForm.title,
          department_id: posForm.department_id,
          base_salary: parseFloat(posForm.base_salary) || 0,
          is_active: 1 
        })
        setPosForm({ title: '', department_id: '', base_salary: '' })
      }
      setModalVisible(false)
      feedback.success()
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    }
  }

  const renderDepartment = ({ item }: { item: Department }) => (
    <Card variant="premium" className="p-4 mb-3 flex-row items-center justify-between border-slate-100 dark:border-white/5">
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center mr-3">
          <Building2 size={20} color="#10b981" />
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
            {item.name}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[10px]" numberOfLines={1}>
            {item.description || 'Sem descrição'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => {
        feedback.warning()
        Alert.alert('Eliminar', `Deseja eliminar o departamento ${item.name}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => deleteDepartment(item.id) }
        ])
      }}>
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
    </Card>
  )

  const renderPosition = ({ item }: { item: Position }) => (
    <Card variant="premium" className="p-4 mb-3 flex-row items-center justify-between border-slate-100 dark:border-white/5">
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-3">
          <Briefcase size={20} color="#4f46e5" />
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
            {item.title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Building2 size={10} color="#64748b" className="mr-1" />
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-tighter">
              {item.department || 'Sem Dep.'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => {
        feedback.warning()
        Alert.alert('Eliminar', `Deseja eliminar o cargo ${item.title}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => deletePosition(item.id) }
        ])
      }}>
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
    </Card>
  )

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Estrutura Org." />

      {/* Tabs */}
      <View className="px-6 py-4 flex-row space-x-2">
        <TouchableOpacity 
          onPress={() => { feedback.light(); setActiveTab('depts'); }}
          className={`flex-1 py-3 items-center rounded-2xl border ${activeTab === 'depts' ? 'bg-emerald-500 border-emerald-600' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10'}`}
        >
          <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-xs font-black ${activeTab === 'depts' ? 'text-white' : 'text-slate-500'}`}>
            Departamentos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => { feedback.light(); setActiveTab('positions'); }}
          className={`flex-1 py-3 items-center rounded-2xl border ${activeTab === 'positions' ? 'bg-indigo-500 border-indigo-600' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10'}`}
        >
          <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-xs font-black ${activeTab === 'positions' ? 'text-white' : 'text-slate-500'}`}>
            Cargos
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'depts' ? (departments as any) : (positions as any)}
        renderItem={activeTab === 'depts' ? renderDepartment as any : renderPosition as any}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pb-32"
        ListEmptyComponent={
          (activeTab === 'depts' ? loadingDepts : loadingPositions) ? (
            <Loading message="A carregar..." />
          ) : (
            <EmptyState 
              title={activeTab === 'depts' ? "Sem Departamentos" : "Sem Cargos"}
              description={activeTab === 'depts' ? "Adicione os departamentos da empresa." : "Defina os cargos para os funcionários."}
            />
          )
        }
      />

      {/* FAB */}
      <TouchableOpacity 
        className={`absolute bottom-8 right-6 w-14 h-14 ${activeTab === 'depts' ? 'bg-emerald-500' : 'bg-indigo-500'} rounded-2xl items-center justify-center shadow-premium-lg`}
        onPress={() => {
          feedback.medium()
          setModalType(activeTab === 'depts' ? 'dept' : 'position')
          setModalVisible(true)
        }}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      {/* Forms Modal */}
      <BottomSheet visible={modalVisible} onClose={() => setModalVisible(false)} height={0.55}>
        <View className="px-6 flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-black text-slate-900 dark:text-white mb-6">
            {modalType === 'dept' ? 'Novo Departamento' : 'Novo Cargo'}
          </Text>

          {modalType === 'dept' ? (
            <View>
              <Input
                label="Nome do Departamento"
                placeholder="Ex: Recursos Humanos"
                value={deptForm.name}
                onChangeText={t => setDeptForm(p => ({ ...p, name: t }))}
              />
              <Input
                label="Descrição (Opcional)"
                placeholder="Finalidade do dep."
                value={deptForm.description}
                onChangeText={t => setDeptForm(p => ({ ...p, description: t }))}
              />
            </View>
          ) : (
            <View>
              <Input
                label="Título do Cargo"
                placeholder="Ex: Especialista de RH"
                value={posForm.title}
                onChangeText={t => setPosForm(p => ({ ...p, title: t }))}
              />
              
              <Select
                label="Departamento"
                placeholder="Seleccionar Departamento"
                value={posForm.department_id}
                onValueChange={v => setPosForm(p => ({ ...p, department_id: v }))}
                options={departments.map(d => ({ label: d.name, value: d.id }))}
              />

              <Input
                label="Salário Base (MZN)"
                placeholder="0.00"
                value={posForm.base_salary}
                onChangeText={t => setPosForm(p => ({ ...p, base_salary: t }))}
                keyboardType="numeric"
                icon={<Text className="text-slate-400 font-bold mr-2">MZN</Text>}
              />
            </View>
          )}

          <View className="mt-4">
            <Button
              title="Salvar"
              variant="primary"
              onPress={handleCreate}
            />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  )
}
