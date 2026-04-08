import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, useColorScheme, ActivityIndicator, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BackButton from '@/components/ui/BackButton'
import IconButton from '@/components/ui/IconButton'

import { useProducts } from '@/features/products/hooks/useProducts'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasPermission } from '@/utils/permissions'
import Screen from '@/components/layout/Screen'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Loading from '@/components/ui/Loading'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { Search, Plus, PackageOpen, AlertTriangle, PackagePlus, ArrowRight, Boxes, FileText } from 'lucide-react-native'
import ProductFormModal from '@/features/products/components/ProductFormModal'
import { reportService } from '@/features/reports/services/reportService'
import { Product } from '@/types'
import Animated, { FadeInUp, Layout, FadeIn } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { feedback } from '@/utils/haptics'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useFormatter } from '@/hooks/useFormatter'

export default function ProductsListScreen() {


  const [search, setSearch] = useState('')
  const { products, isLoading, createProduct, loadMore, hasMore } = useProducts(search)
  const { user } = useAuthStore()
  const { settings, updateSettings } = useSettings()
  const { formatCurrency } = useFormatter()
  const [modalVisible, setModalVisible] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const canCreate = user && hasPermission(user.role, 'create_products')
  
  const handleExportReport = async () => {
    try {
      setIsGeneratingReport(true)
      feedback.light()
      await reportService.generateInventoryReport()
      feedback.success()
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const stats = useMemo(() => {
    const total = products.length
    const lowStock = products.filter(p => p.current_stock <= p.minimum_stock).length
    return { total, lowStock }
  }, [products])

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isLowStock = item.current_stock <= item.minimum_stock

    return (
      <Animated.View entering={FadeInUp.delay(index * 50)}>
        <TouchableOpacity 
          onPress={() => router.push(`/(app)/products/${item.id}`)}
          className="mb-4"
        >
          <Card variant="premium" className="p-4 rounded-[32px] overflow-hidden">
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 rounded-2xl overflow-hidden mr-4 shadow-sm">
                <LinearGradient
                  colors={isLowStock ? (isDark ? ['#450a0a', '#7f1d1d'] : ['#fee2e2', '#fecaca']) : (isDark ? ['#1e1b4b', '#312e81'] : ['#eef2ff', '#e0e7ff'])}
                  className="flex-1 items-center justify-center border border-white/20"
                >
                  <PackageOpen size={28} color={isLowStock ? "#ef4444" : "#4f46e5"} />
                </LinearGradient>
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-base font-bold text-slate-800 dark:text-white mb-1" numberOfLines={1}>
                  {item.name}
                </Text>
                <View className="flex-row items-center">
                  <Badge label={item.category || 'Sem Categoria'} variant="info" className="py-0.5 px-2" />
                  {isLowStock && (
                    <View className="flex-row items-center bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full ml-2">
                      <AlertTriangle size={10} color="#ef4444" className="mr-1" />
                      <Text style={{ fontFamily: 'Inter-Black' }} className="text-[8px] text-red-500 font-black uppercase">Crítico</Text>
                    </View>
                  )}
                </View>
              </View>
              <View className="items-end">
                <Text style={{ fontFamily: 'Inter-Black' }} className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(item.sale_price || 0)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <View className="flex-row items-center flex-1">
                <View className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SKU: {item.sku}</Text>
                </View>
              </View>
              
              <View className="flex-row items-center">
                <Text className="text-xs text-slate-400 dark:text-slate-500 mr-2">Stock Atual:</Text>
                <Badge 
                  label={`${item.current_stock} ${item.unit}`} 
                  variant={isLowStock ? 'danger' : 'success'} 
                  className="px-3"
                />
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Premium Clean Header */}
      <View style={{ paddingTop: Math.max(insets.top, 16) }} className="px-6 pb-6 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <View className="flex-row items-center">
          <View className="mr-4">
            <BackButton variant="glass" />
          </View>
          <View className="flex-1">
             <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Controlo de Stock</Text>
             <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white text-xl font-black">Inventário</Text>
          </View>
          <View className="flex-row items-center">
            <IconButton 
              icon={FileText} 
              onPress={handleExportReport} 
              isLoading={isGeneratingReport}
              className="mr-3"
            />
            {canCreate && (
               <IconButton 
                 icon={Plus} 
                 onPress={() => setModalVisible(true)} 
               />
            )}
          </View>
        </View>
      </View>
      
      {/* Stats Header Cards */}
      <Animated.View entering={FadeIn.delay(300)} className="px-6 mt-6">
        <View className="flex-row justify-between mb-4">
          <Card variant="glass" className="flex-1 mr-4 p-5 rounded-[32px] items-center">
            <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center mb-2">
               <Boxes size={20} color="#6366f1" />
            </View>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</Text>
            <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Produtos</Text>
          </Card>

          <Card variant="glass" className="flex-1 p-5 rounded-[32px] items-center">
            <View className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-500/10 items-center justify-center mb-2">
               <AlertTriangle size={20} color="#ef4444" />
            </View>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-red-500">{stats.lowStock}</Text>
            <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Stock Crítico</Text>
          </Card>
        </View>
      </Animated.View>

      <View className="px-6 py-2">
         <Input 
           placeholder="Pesquisar por nome, SKU..."
           value={search}
           onChangeText={setSearch}
           icon={<Search size={20} color="#94a3b8" />}
           className="mb-0 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/10" 
         />
      </View>

      {isLoading ? (
        <View className="px-6 py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="mb-4 flex-row items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800">
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
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="px-6 pb-32"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && products.length > 0 ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#4f46e5" />
              </View>
            ) : null
          }
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
    </View>
  )
}
