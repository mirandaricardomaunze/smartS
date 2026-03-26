import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasPermission } from '@/utils/permissions'
import { formatShortDate } from '@/utils/formatters'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, SettingsIcon, Calendar } from 'lucide-react-native'
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated'
import MovementFormModal from '@/features/movements/components/MovementFormModal'
import { feedback } from '@/utils/haptics'

export default function MovementsListScreen() {
  const router = useRouter()
  const { movements, isLoading: movementsLoading, createMovement, loadMore, hasMore } = useMovements()
  const { products, isLoading: productsLoading } = useProducts()
  const { user } = useAuthStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  const canCreate = user && hasPermission(user.role, 'manage_movements')
  const isLoading = movementsLoading || productsLoading

  // Group movements by date
  const groupedMovements = useMemo(() => {
    const filtered = filterType === 'all' 
      ? movements 
      : movements.filter(m => m.type === filterType)
    
    // Sort by date descending
    const sorted = [...filtered].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const groups: { date: string, data: any[] }[] = []
    
    sorted.forEach(mov => {
      const date = new Date(mov.created_at).toLocaleDateString('pt-PT', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      })
      
      const group = groups.find(g => g.date === date)
      if (group) {
        group.data.push(mov)
      } else {
        groups.push({ date: date.charAt(0).toUpperCase() + date.slice(1), data: [mov] })
      }
    })
    
    return groups
  }, [movements, filterType])

  const renderItem = ({ item }: { item: any }) => {
    const product = products.find(p => p.id === item.product_id)
    const productName = product?.name || 'Produto Removido'
    
    let icon = <ArrowRightLeft size={20} color="#94a3b8" />
    let colorClass = 'text-slate-500'
    let bgClass = 'bg-slate-50 dark:bg-slate-800'
    let typeLabel = 'Transferência'

    switch (item.type) {
      case 'entry':
        icon = <ArrowDownLeft size={20} color="#10b981" />
        colorClass = 'text-emerald-500'
        bgClass = 'bg-emerald-50 dark:bg-emerald-900/20'
        typeLabel = 'Entrada'
        break
      case 'exit':
        icon = <ArrowUpRight size={20} color="#ef4444" />
        colorClass = 'text-red-500'
        bgClass = 'bg-red-50 dark:bg-red-900/20'
        typeLabel = 'Saída'
        break
      case 'adjustment':
        icon = <SettingsIcon size={20} color="#f59e0b" />
        colorClass = 'text-amber-500'
        bgClass = 'bg-amber-50 dark:bg-amber-900/20'
        typeLabel = 'Ajuste'
        break
    }

    return (
      <View className="mb-4 flex-row items-center">
        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${bgClass} shadow-sm shadow-black/5`}>
           {icon}
        </View>
        <View className="flex-1 border-b border-slate-50 dark:border-slate-800/50 pb-4">
          <View className="flex-row justify-between items-start mb-1">
            <View className="flex-1 mr-2">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-base font-bold text-slate-800 dark:text-white" numberOfLines={1}>
                {productName}
              </Text>
              {product?.reference && (
                <Text style={{ fontFamily: 'Inter-Medium' }} className="text-[10px] font-semibold text-primary uppercase">REF: {product.reference}</Text>
              )}
            </View>
            <Text style={{ fontFamily: 'Inter-Black' }} className={`text-base font-black ${colorClass}`}>
               {item.type === 'exit' ? '-' : '+'}{item.quantity}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
             <Text style={{ fontFamily: 'Inter-Medium' }} className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                {new Date(item.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} • {item.reason || typeLabel}
             </Text>
             <Badge label={product?.unit || 'un'} variant="info" className="py-0 px-2" />
          </View>
        </View>
      </View>
    )
  }

  const FilterPill = ({ label, value }: { label: string, value: string }) => {
     const isActive = filterType === value
     return (
       <TouchableOpacity 
         onPress={() => setFilterType(value)}
         className={`px-5 py-2.5 rounded-full mr-2 border shadow-sm ${isActive ? 'bg-primary border-primary shadow-primary/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-black/5'}`}
       >
         <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            {label}
         </Text>
       </TouchableOpacity>
     )
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900" withHeader>
      <Header 
        title="Histórico de Stock" 
        rightElement={canCreate ? (
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
      
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
         <FlatList 
           horizontal
           showsHorizontalScrollIndicator={false}
           data={[
             { label: 'Todos', value: 'all' },
             { label: 'Entradas', value: 'entry' },
             { label: 'Saídas', value: 'exit' },
             { label: 'Ajustes', value: 'adjustment' },
             { label: 'Transferências', value: 'transfer' },
           ]}
           keyExtractor={i => i.value}
           renderItem={({ item }) => <FilterPill label={item.label} value={item.value} />}
         />
      </View>

      {isLoading ? (
         <Loading fullScreen message="A carregar movimentos..." />
      ) : (
        <FlatList
          data={groupedMovements}
          keyExtractor={(item) => item.date}
          contentContainerClassName="px-6 pt-6 pb-20"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && movements.length > 0 ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#4f46e5" />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 100)} className="mb-6">
              <View className="flex-row items-center mb-4">
                 <Calendar size={14} color="#4f46e5" className="mr-2" />
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                   {item.date}
                 </Text>
              </View>
              <Card variant="default" className="p-4 bg-white dark:bg-slate-800/50 border-white/5 shadow-sm">
                {item.data.map((mov: any) => (
                  <View key={mov.id}>
                    {renderItem({ item: mov })}
                  </View>
                ))}
              </Card>
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState 
              title="Sem registos"
              description="Nenhum movimento de stock foi encontrado."
              actionLabel={canCreate ? "Registar Agora" : undefined}
              onAction={canCreate ? () => {
                feedback.light()
                setModalVisible(true)
              } : undefined}
            />
          }
        />
      )}

      <MovementFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data) => {
          await createMovement(data)
        }}
      />
    </Screen>
  )
}
