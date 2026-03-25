import React, { useMemo, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasPermission } from '@/utils/permissions'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { Plus, User, Shield, Mail, ChevronRight, UserCheck, UserX } from 'lucide-react-native'
import Badge from '@/components/ui/Badge'
import UserFormModal from '@/features/users/components/UserFormModal'
import { feedback } from '@/utils/haptics'
import Avatar from '@/components/ui/Avatar'

import { useUsers } from '@/features/users/hooks/useUsers'

export default function UsersListScreen() {
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const [modalVisible, setModalVisible] = useState(false)
  const { users, isLoading, createUser } = useUsers()

  const canManage = currentUser && hasPermission(currentUser.role, 'manage_users')

  const roleStats = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [users])

  const renderItem = ({ item }: { item: any }) => {
    let roleLabel = 'Visualizador'
    let variant: 'success' | 'warning' | 'danger' | 'info' = 'info'
    
    if (item.role === 'admin') { roleLabel = 'Administrador'; variant = 'danger' }
    if (item.role === 'manager') { roleLabel = 'Gestor'; variant = 'warning' }
    if (item.role === 'operator') { roleLabel = 'Operador'; variant = 'success' }

    return (
      <TouchableOpacity onPress={() => {}} className="mb-4">
        <Card className="rounded-3xl p-5 bg-white dark:bg-slate-800 border-none shadow-sm flex-row items-center">
          <Avatar name={item.name} size="md" className="mr-4" />
          
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-800 dark:text-white mb-1">
              {item.name}
            </Text>
            <View className="flex-row items-center">
               <Badge label={roleLabel} variant={variant} className="mr-2 self-start" />
               <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 lowercase">
                  {item.email}
               </Text>
            </View>
          </View>
          
          <ChevronRight size={20} color="#cbd5e1" />
        </Card>
      </TouchableOpacity>
    )
  }

  const StatBox = ({ label, count, color }: any) => (
    <View className="items-center flex-1">
       <Text className={`text-2xl font-black ${color}`}>{count}</Text>
       <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{label}</Text>
    </View>
  )

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900" withHeader>
      <Header 
        title="Equipa SmartS" 
        rightElement={canManage ? (
          <TouchableOpacity 
            onPress={() => {
              feedback.light()
              setModalVisible(true)
            }}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 active:bg-white/20"
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        ) : null}
      />

      <View className="px-6 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center">
          <View className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl items-center justify-center mr-4">
             <User size={24} color="#4f46e5" />
          </View>
          <View className="flex-1 flex-row">
             <StatBox label="Admins" count={roleStats.admin || 0} color="text-red-500" />
             <View className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800 self-center" />
             <StatBox label="Gestores" count={roleStats.manager || 0} color="text-amber-500" />
             <View className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800 self-center" />
             <StatBox label="Equipa" count={(roleStats.operator || 0) + (roleStats.viewer || 0)} color="text-emerald-500" />
          </View>
      </View>

      {isLoading && users.length === 0 ? (
        <Loading fullScreen message="A carregar utilizadores..." />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="px-6 pt-6 pb-20"
          ListEmptyComponent={
            <EmptyState 
              title="Sem Utilizadores"
              description="Não foram encontrados membros da equipa."
              actionLabel="Adicionar Utilizador"
              onAction={() => {
                feedback.light()
                setModalVisible(true)
              }}
            />
          }
        />
      )}

      <UserFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data, password) => {
          await createUser(data, password || '')
        }}
      />
    </Screen>
  )
}
