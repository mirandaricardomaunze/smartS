import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useConfirmStore } from '@/store/useConfirmStore'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { Mail, Shield, Calendar, User as UserIcon, LogOut, ChevronRight, Pencil } from 'lucide-react-native'
import { useAuth } from '@/features/auth/hooks/useAuth'
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import ProfileFormModal from '@/features/auth/components/ProfileFormModal'
import { hasPermission } from '@/utils/permissions'
import { feedback as hapticFeedback } from '@/utils/haptics'
import { useFormatter } from '@/hooks/useFormatter'
import { movementsRepository } from '@/repositories/movementsRepository'
import { productsRepository } from '@/repositories/productsRepository'
import { historyRepository } from '@/repositories/historyRepository'

export default function ProfileScreen() {
  const { user } = useAuthStore()
  const { logout, updateProfile } = useAuth()
  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false)
  const [stats, setStats] = React.useState({ movements: 0, products: 0, history: 0 })
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  React.useEffect(() => {
    if (user?.id && user?.company_id) {
       try {
         const movs = movementsRepository.getAll(user.company_id).filter(m => m.user_id === user.id).length
         const prods = productsRepository.getAll(user.company_id).length
         const hist = historyRepository.getAll(user.company_id).filter(h => h.user_id === user.id).length
         setStats({ movements: movs, products: prods, history: hist })
       } catch (error) {
         console.log(error)
       }
    }
  }, [user])

  const InfoRow = ({ icon, label, value, last = false }: any) => (
    <View className={`flex-row items-center py-4 ${!last ? 'border-b border-white/10 dark:border-slate-800/50' : ''}`}>
      <View className="w-10 h-10 rounded-xl bg-white/10 dark:bg-slate-700/50 items-center justify-center mr-4">
        {icon}
      </View>
      <View className="flex-1">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{label}</Text>
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-base font-bold text-slate-800 dark:text-white">{value}</Text>
      </View>
    </View>
  )

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900" withHeader>
      <Header title="O Meu Perfil" />
      
      <ScrollView className="flex-1" contentContainerClassName="pb-10">
        <Animated.View entering={FadeInDown.delay(200)}>
          <LinearGradient
            colors={isDark ? ['#1e1b4b', '#0f172a'] : ['#4f46e5', '#4338ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="items-center py-12 rounded-b-[48px] border-b border-white/10 shadow-lg shadow-black/10"
          >
            <View className="relative">
              <Avatar name={user?.name || ''} size="lg" className="mb-4 border-4 border-white/20 "  />
              <View className="absolute bottom-6 right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white items-center justify-center">
                 <Shield size={12} color="white" />
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-white mb-2">{user?.name}</Text>
            <Badge 
              label={user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gestor' : 'Operador'} 
              variant="info"
              className="px-6 py-2 bg-white/20 border-white/30"
            />
          </LinearGradient>
        </Animated.View>

        <View className="px-6 py-8">
          <Animated.View entering={FadeInUp.delay(400)}>
            <View className="flex-row justify-between mb-8">
              <Card variant="glass" glassIntensity={15} className="flex-1 mr-2 items-center p-5 border-white/20">
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-primary">{stats.movements}</Text>
                 <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Movimentos</Text>
              </Card>
              <Card variant="glass" glassIntensity={15} className="flex-1 mx-1 items-center p-5 border-white/20">
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-emerald-500">{stats.products}</Text>
                 <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Produtos App</Text>
              </Card>
              <Card variant="glass" glassIntensity={15} className="flex-1 ml-2 items-center p-5 border-white/20">
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-amber-500">{stats.history}</Text>
                 <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Meus Registos</Text>
              </Card>
            </View>
          </Animated.View>

          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Informações Pessoais</Text>
          <Animated.View entering={FadeInUp.delay(600)}>
            <Card variant="glass" className="p-0 overflow-hidden mb-8 border-white/10">
              <View className="px-4">
                <InfoRow 
                  icon={<Mail size={20} color="#4f46e5" />} 
                  label="Email de Acesso" 
                  value={user?.email} 
                />
                <InfoRow 
                  icon={<Shield size={20} color="#4f46e5" />} 
                  label="Nível de Permissão" 
                  value={user?.role?.toUpperCase()} 
                />
                <InfoRow 
                  icon={<Calendar size={20} color="#4f46e5" />} 
                  label="Membro desde" 
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }) : '--'} 
                  last
                />
              </View>
            </Card>
          </Animated.View>
          
          <Button
            variant="gradient"
            gradientColors={['#4f46e5', '#6366f1']}
            title="Editar Perfil"
            onPress={() => {
              hapticFeedback.light()
              setIsEditModalVisible(true)
            }}
            icon={<Pencil size={18} color="white" />}
            className="mb-6 h-14 rounded-2xl shadow-lg shadow-indigo-500/30"
          />
          
          <TouchableOpacity 
            onPress={() => {
              useConfirmStore.getState().show({
                title: 'Terminar Sessão',
                message: 'Tens a certeza que desejas sair da tua conta?',
                confirmLabel: 'Sair Agora',
                isDestructive: true,
                onConfirm: logout
              })
            }}
            className="flex-row items-center justify-center p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30"
          >
            <LogOut size={20} color="#ef4444" className="mr-2" />
            <Text className="text-red-500 font-bold">Terminar Sessão</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProfileFormModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={updateProfile}
        initialData={user}
      />
    </Screen>
  )
}
