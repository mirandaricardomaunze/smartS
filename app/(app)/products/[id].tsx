import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'

import { useProducts } from '@/features/products/hooks/useProducts'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasPermission } from '@/utils/permissions'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useConfirmStore } from '@/store/useConfirmStore'
import FormField from '@/components/forms/FormField'
import DatePicker from '@/components/ui/DatePicker'
import BottomSheet from '@/components/ui/BottomSheet'
import { useCompanyStore } from '@/store/companyStore'
import { useExpiry } from '@/features/expiry/hooks/useExpiry'
import { PackageOpen, ArrowRightLeft, Edit2, Trash2, Calendar, Hash, Tag, Layers, CalendarClock, PlusCircle, X } from 'lucide-react-native'
import { useFormatter } from '@/hooks/useFormatter'
import ProductFormModal from '@/features/products/components/ProductFormModal'
import { Product } from '@/types'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()


  const { products, isLoading: productsLoading, deleteProduct } = useProducts()
  const { lots, isLoading: expiryLoading, createLot } = useExpiry(id)
  const { user } = useAuthStore()
  const { activeCompanyId } = useCompanyStore()
  
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const product = useMemo(() => products.find(p => p.id === id), [products, id])
  const [isDeleting, setIsDeleting] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const { updateProduct } = useProducts()
  const { settings } = useSettings()
  const { formatCurrency } = useFormatter()

  const [lotModalVisible, setLotModalVisible] = useState(false)
  const [isSubmittingLot, setIsSubmittingLot] = useState(false)
  const [lotData, setLotData] = useState({ lot_number: '', expiry_date: '', quantity: '' })
  
  const isLoading = productsLoading || expiryLoading

  if (isLoading) return <Screen withHeader><Header title="Carregando..." showBack /><Loading fullScreen /></Screen>
  
  if (!product) {
     return (
       <Screen padHorizontal={false} withHeader>
         <Header title="Produto" showBack />
         <EmptyState title="Produto não encontrado" />
       </Screen>
     )
  }

  const handleAddLot = async () => {
    if (!lotData.lot_number || !lotData.expiry_date || !lotData.quantity) {
      useToastStore.getState().show('Preencha todos os campos do lote.', 'warning')
      return
    }
    try {
      setIsSubmittingLot(true)
      await createLot({
        company_id: activeCompanyId!,
        product_id: product.id,
        lot_number: lotData.lot_number,
        expiry_date: lotData.expiry_date,
        quantity: parseInt(lotData.quantity)
      })
      feedback.success()
      setLotModalVisible(false)
      setLotData({ lot_number: '', expiry_date: '', quantity: '' })
    } catch (e: any) {
      useToastStore.getState().show(e.message, 'error')
    } finally {
      setIsSubmittingLot(false)
    }
  }

  const canEdit = user && hasPermission(user.role, 'edit_products')
  const canDelete = user && hasPermission(user.role, 'delete_products')

  const showToast = useToastStore((state) => state.show)

  const handleDelete = () => {
    feedback.warning()
    useConfirmStore.getState().show({
      title: 'Confirmar Eliminação',
      message: 'Deseja apagar este produto permanentemente? Esta ação não pode ser desfeita.',
      confirmLabel: 'Apagar',
      isDestructive: true,
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          await deleteProduct(product.id)
          feedback.success()
          showToast('Produto removido', 'success')
          router.back()
        } catch (e: any) {
          feedback.error()
          showToast('Erro ao remover produto', 'error')
          useConfirmStore.getState().show({
            title: 'Erro',
            message: e.message,
            confirmLabel: 'OK',
            showCancel: false,
            onConfirm: () => {}
          })
          setIsDeleting(false)
        }
      }
    })
  }

  const InfoRow = ({ icon, label, value, last = false }: any) => (
    <View className={`flex-row items-center justify-between py-4 ${!last ? 'border-b border-white/10 dark:border-slate-700/30' : ''}`}>
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-lg bg-white/10 dark:bg-slate-700/50 items-center justify-center mr-3">
          {icon}
        </View>
        <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-slate-500 dark:text-slate-400 font-medium">{label}</Text>
      </View>
      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-base">{value || '---'}</Text>
    </View>
  )

  const isLowStock = product.current_stock <= product.minimum_stock

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Detalhes do Item" showBack />
      
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-12">
        {/* Main Hero Card */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Card variant="default" className="items-center p-8 mb-8 mt-4">
            <View className="w-24 h-24 rounded-3xl overflow-hidden mb-6 shadow-sm shadow-black/20">
              <LinearGradient
                colors={isLowStock ? (isDark ? ['#7f1d1d', '#991b1b'] : ['#fecaca', '#ef4444']) : (isDark ? ['#1e1b4b', '#3730a3'] : ['#eef2ff', '#4f46e5'])}
                className="flex-1 items-center justify-center"
              >
                <PackageOpen size={48} color="white" />
              </LinearGradient>
            </View>
            
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-slate-800 dark:text-white text-center mb-2 px-2">
              {product.name}
            </Text>
            
            <Badge 
               label={product.category || 'Sem Categoria'} 
               variant="info" 
               className="mb-6 px-5 py-2"
            />
            
            <View className="flex-row w-full justify-around pt-2 border-t border-slate-50 dark:border-slate-700/30">
               <View className="items-center">
                  <Text style={{ fontFamily: 'Inter-Black' }} className={`text-2xl font-black ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>
                    {product.current_stock}
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.unit}</Text>
               </View>
               <View className="w-[1px] bg-slate-100 dark:bg-slate-700 h-8 self-center" />
               <View className="items-center">
                  <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-300 dark:text-slate-500">
                    {product.minimum_stock}
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mínimo</Text>
               </View>
            </View>
          </Card>
        </Animated.View>

        {/* Lotes de Validade Section */}
        <View className="flex-row items-center justify-between mb-3 ml-1">
           <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Gestão de Lotes / Validade
          </Text>
          {hasPermission(user?.role || 'viewer', 'manage_movements') && (
            <TouchableOpacity onPress={() => { feedback.light(); setLotModalVisible(true) }} className="flex-row items-center">
               <PlusCircle size={14} color="#10b981" />
               <Text className="text-emerald-500 text-[10px] font-black uppercase ml-1">Novo Lote</Text>
            </TouchableOpacity>
          )}
        </View>
        <Animated.View entering={FadeInUp.delay(300)}>
          <Card variant="glass" glassIntensity={15} className="mb-8 p-4">
             {lots.length > 0 ? lots.map((lot, idx) => (
                <View key={lot.id} className={`flex-row justify-between items-center py-3 ${idx !== lots.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/50' : ''}`}>
                   <View>
                      <Text className="text-slate-900 dark:text-white font-bold text-sm">Lote: {lot.lot_number}</Text>
                      <View className="flex-row items-center mt-0.5">
                         <Calendar size={10} color="#94a3b8" />
                         <Text className="text-slate-400 text-[10px] font-medium ml-1">Vence: {new Date(lot.expiry_date).toLocaleDateString()}</Text>
                      </View>
                   </View>
                   <View className="items-end">
                      <Text className="text-slate-900 dark:text-white font-black text-sm">{lot.quantity}</Text>
                      <Text className="text-slate-400 text-[8px] font-bold uppercase tracking-tighter">Unidades</Text>
                   </View>
                </View>
             )) : (
               <View className="items-center py-4">
                  <CalendarClock size={24} color="#94a3b8" />
                  <Text className="text-slate-400 text-xs font-medium mt-2">Nenhum lote registado para este produto.</Text>
               </View>
             )}
          </Card>
        </Animated.View>

        {/* Pricing & Tax Card */}
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">
          Preços e Impostos
        </Text>
        <Animated.View entering={FadeInUp.delay(350)}>
          <Card variant="glass" glassIntensity={20} className="mb-8 p-4">
             <InfoRow 
               icon={<Tag size={18} color="#4f46e5" />} 
               label="Preço de Compra" 
               value={formatCurrency(product.purchase_price || 0)} 
             />
             <InfoRow 
               icon={<Tag size={18} color="#10b981" />} 
               label="Preço de Venda" 
               value={formatCurrency(product.sale_price || 0)} 
             />
             <InfoRow 
               icon={<Layers size={18} color="#6366f1" />} 
               label="Taxa IVA" 
               value={product.tax_rate ? `${product.tax_rate}%` : '17%'}
               last
             />
          </Card>
        </Animated.View>

        {/* Technical Details Card */}
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">
          Especificações Técnicas
        </Text>
        <Animated.View entering={FadeInUp.delay(300)}>
          <Card variant="glass" glassIntensity={20} className="mb-8 p-4">
             <InfoRow 
               icon={<Tag size={18} color="#94a3b8" />} 
               label="SKU" 
               value={product.sku} 
             />
             <InfoRow 
               icon={<Hash size={18} color="#94a3b8" />} 
               label="Referência Interna" 
               value={product.reference || '---'} 
             />
             <InfoRow 
               icon={<Tag size={18} color="#94a3b8" />} 
               label="Código de Barras" 
               value={product.barcode} 
             />
             <InfoRow 
               icon={<Layers size={18} color="#94a3b8" />} 
               label="Categoria" 
               value={product.category || 'Sem Categoria'} 
             />
             <InfoRow 
               icon={<Calendar size={18} color="#94a3b8" />} 
               label="Criado em" 
               value={new Date(product.created_at).toLocaleDateString('pt-PT')}
               last
             />
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(400)} className="flex-row justify-between mb-4">
           {canEdit && (
             <Button
               title="Editar"
               variant="primary"
               fullWidth={false}
               className="flex-1 mr-2"
               icon={<Edit2 size={20} color="white" />}
               onPress={() => setModalVisible(true)}
             />
           )}
            <Button
              title="Movimentos"
              variant="secondary"
              fullWidth={false}
              className="flex-1 ml-2"
              icon={<ArrowRightLeft size={20} color="white" />}
              onPress={() => {
                feedback.light()
                router.push({
                  pathname: '/(app)/movements',
                  params: { product_id: id }
                })
              }}
            />
        </Animated.View>

        {canDelete && (
          <Animated.View entering={FadeInUp.delay(500)}>
            <Button
              title={isDeleting ? 'A apagar...' : 'Remover do Inventário'}
              variant="danger"
              className="w-full bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
              icon={<Trash2 size={20} color="#ef4444" />}
              onPress={handleDelete}
              disabled={isDeleting}
            />
          </Animated.View>
        )}
      </ScrollView>

      <ProductFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialData={product as Product}
        onSave={async (data) => {
          await updateProduct(product.id, data)
        }}
      />

      {/* Premium BottomSheet for Fast Lot Addition */}
      <BottomSheet 
        visible={lotModalVisible} 
        onClose={() => setLotModalVisible(false)} 
        height={0.7}
      >
        <View className="flex-1 bg-white dark:bg-[#0f172a] px-6 pt-4 pb-8">
           <View className="flex-row justify-between items-center mb-8">
             <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">Registar Lote</Text>
             <TouchableOpacity 
               onPress={() => setLotModalVisible(false)}
               className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center"
             >
                <X size={20} color="#94a3b8" />
             </TouchableOpacity>
           </View>
           
           <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="space-y-5">
                <FormField 
                  label="Número do Lote"
                  value={lotData.lot_number}
                  onChangeText={(v) => setLotData(p => ({...p, lot_number: v}))}
                  placeholder="Ex: L24-01"
                />
                <DatePicker 
                  label="Validade"
                  value={lotData.expiry_date}
                  onChange={(v) => setLotData(p => ({...p, expiry_date: v}))}
                />
                <FormField 
                  label="Quantidade"
                  value={lotData.quantity}
                  onChangeText={(v) => setLotData(p => ({...p, quantity: v}))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View className="mt-10 mb-10">
                 <Button 
                   title="Gravar Lote" 
                   onPress={handleAddLot} 
                   isLoading={isSubmittingLot} 
                   variant="gradient"
                   className="h-14 rounded-2xl shadow-lg shadow-primary/20"
                 />
              </View>
           </ScrollView>
        </View>
      </BottomSheet>
    </Screen>
  )
}
