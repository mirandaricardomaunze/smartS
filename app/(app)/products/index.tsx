import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasPermission } from '@/utils/permissions'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Loading from '@/components/ui/Loading'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { Search, Plus, PackageOpen, AlertTriangle, PackagePlus } from 'lucide-react-native'
import ProductFormModal from '@/features/products/components/ProductFormModal'
import { Product } from '@/types'
import Animated, { FadeInUp, Layout } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { feedback } from '@/utils/haptics'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useFormatter } from '@/hooks/useFormatter'

export default function ProductsListScreen() {
  const router = useRouter()
  const { products, isLoading, createProduct } = useProducts()
  const { user } = useAuthStore()
  const { settings, updateSettings } = useSettings()
  const { formatCurrency } = useFormatter()
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)

  const canCreate = user && hasPermission(user.role, 'create_products')

  const stats = useMemo(() => {
    const total = products.length
    const lowStock = products.filter(p => p.current_stock <= p.minimum_stock).length
    return { total, lowStock }
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
    )
  }, [products, search])

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isLowStock = item.current_stock <= item.minimum_stock

    return (
      <Animated.View entering={FadeInUp.delay(index * 100)}>
        <TouchableOpacity 
          onPress={() => router.push(`/(app)/products/${item.id}`)}
          className="mb-4"
        >
          <Card variant="premium" className="flex-row items-center p-4">
            <View className="w-20 h-20 rounded-2xl overflow-hidden mr-4 shadow-premium-sm">
              <LinearGradient
                colors={isLowStock ? ['#fee2e2', '#fecaca'] : ['#eef2ff', '#e0e7ff']}
                className="flex-1 items-center justify-center border border-white/20"
              >
                <PackageOpen size={32} color={isLowStock ? "#ef4444" : "#4f46e5"} />
              </LinearGradient>
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-slate-900 dark:text-white mb-1" numberOfLines={1}>
                {item.name}
              </Text>
              <View className="flex-row items-center mb-2">
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-[9px] font-black text-slate-400 dark:text-slate-500 mr-2 uppercase tracking-widest">SKU: {item.sku}</Text>
                 <Badge label={item.category} variant="info" className="py-0.5 px-2" />
              </View>
              <View className="flex-row items-center justify-between">
                 <Badge 
                   label={`${item.current_stock} ${item.unit}`} 
                   variant={isLowStock ? 'danger' : 'success'} 
                 />
                 <View className="items-end">
                    <Text style={{ fontFamily: 'Inter-Black' }} className="text-base font-black text-primary dark:text-primary-dark">
                      {formatCurrency(item.sale_price || 0)}
                    </Text>
                    {isLowStock && (
                      <View className="flex-row items-center bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg mt-1">
                        <AlertTriangle size={10} color="#ef4444" className="mr-1" />
                        <Text style={{ fontFamily: 'Inter-Black' }} className="text-[8px] text-red-500 font-black uppercase">Stock Baixo</Text>
                      </View>
                    )}
                 </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900" withHeader>
      <Header 
        title="Inventário" 
        rightElement={canCreate ? (
          <TouchableOpacity 
            onPress={() => {
              feedback.light()
              setModalVisible(true)
            }}
            className="w-10 h-10 bg-white/10 rounded-2xl items-center justify-center border border-white/20 active:bg-white/20"
            activeOpacity={0.7}
          >
            <Plus size={22} color="white" />
          </TouchableOpacity>
        ) : undefined}
      />
      
      {/* Stats Header Section */}
      <View className="flex-row justify-between px-6 py-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 shadow-premium-sm">
         <View className="items-center">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mt-1">Produtos</Text>
         </View>
         <View className="w-[1px] h-10 bg-slate-100 dark:bg-white/10 self-center" />
         <View className="items-center">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-red-500">{stats.lowStock}</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mt-1">Stock Baixo</Text>
         </View>
         <View className="w-[1px] h-10 bg-slate-100 dark:bg-white/10 self-center" />
         <View className="items-center">
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-primary">{filteredProducts.length}</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mt-1">Filtrados</Text>
         </View>
      </View>

      <View className="px-6 py-4">
         <Input 
           placeholder="Pesquisar por nome, SKU ou código..."
           value={search}
           onChangeText={setSearch}
           icon={<Search size={20} color="#94a3b8" />}
           className="mb-0 bg-white dark:bg-slate-800 rounded-2xl" 
         />
      </View>

      {isLoading ? (
        <View className="px-6 py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="mb-4 flex-row items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Skeleton width={64} height={64} borderRadius={16} className="mr-4" />
              <View className="flex-1">
                <Skeleton width="60%" height={18} className="mb-2" />
                <Skeleton width="40%" height={12} className="mb-2" />
                <Skeleton width="30%" height={24} borderRadius={8} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="px-6 pb-32"
          ListEmptyComponent={
            <EmptyState 
              title="Nada encontrado"
              description={search ? "Tente outros termos de pesquisa." : "O seu inventário está vazio."}
              actionLabel={canCreate && !search ? "Adicionar Produto" : undefined}
              onAction={canCreate ? () => {
                feedback.light()
                setModalVisible(true)
              } : undefined}
            />
          }
        />
      )}


      <ProductFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data) => {
          await createProduct(data as Product)
        }}
      />
    </Screen>
  )
}
