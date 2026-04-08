import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import { useConfirmStore } from '@/store/useConfirmStore'
import { router } from 'expo-router'

import { useExpiry } from '@/features/expiry/hooks/useExpiry'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useCompanyStore } from '@/store/companyStore'
import { formatShortDate } from '@/utils/formatters'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import BottomSheet from '@/components/ui/BottomSheet'
import FormField from '@/components/forms/FormField'
import DatePicker from '@/components/ui/DatePicker'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { CalendarClock, Plus, Trash2, Package, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native'

import ProductPickerModal from '@/features/products/components/ProductPickerModal'

export default function ExpiryListScreen() {


  const { lots, isLoading: expiryLoading, createLot, deleteLot } = useExpiry()
  const { products, isLoading: productsLoading } = useProducts()
  const { activeCompanyId } = useCompanyStore()

  const [filterType, setFilterType] = useState<'all' | 'warning' | 'expired'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
     product_id: '',
     product_name: '',
     lot_number: '',
     expiry_date: '',
     quantity: ''
  })

  const isLoading = expiryLoading || productsLoading

  const lotsWithStatus = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    return lots.map(lot => {
      const expDate = new Date(lot.expiry_date)
      let status: 'ok' | 'warning' | 'expired' = 'ok'
      if (expDate < now) status = 'expired'
      else if (expDate <= thirtyDaysFromNow) status = 'warning'
      return { ...lot, status }
    }).sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
  }, [lots])

  const stats = useMemo(() => {
    const expired = lotsWithStatus.filter(l => l.status === 'expired').length
    const warning = lotsWithStatus.filter(l => l.status === 'warning').length
    const ok = lotsWithStatus.filter(l => l.status === 'ok').length
    return { expired, warning, ok }
  }, [lotsWithStatus])

  const filteredLots = useMemo(() => {
    if (filterType === 'all') return lotsWithStatus
    return lotsWithStatus.filter(l => l.status === filterType)
  }, [lotsWithStatus, filterType])

  const handleSave = async () => {
    if (!formData.product_id || !formData.lot_number || !formData.expiry_date || !formData.quantity) {
       useToastStore.getState().show('Preencha todos os campos.', 'warning')
       return
    }
    
    // basic date validation YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.expiry_date)) {
       useToastStore.getState().show('Data inválida (AAAA-MM-DD)', 'warning')
       return
    }

    try {
       setIsSubmitting(true)
       await createLot({
           company_id: activeCompanyId!,
           product_id: formData.product_id,
           lot_number: formData.lot_number,
           expiry_date: formData.expiry_date,
           quantity: parseInt(formData.quantity) || 0
       })
       setIsModalOpen(false)
       setFormData({ product_id: '', product_name: '', lot_number: '', expiry_date: '', quantity: '' })
    } catch (e: any) {
       useConfirmStore.getState().show({
         title: 'Erro',
         message: e.message,
         confirmLabel: 'OK',
         showCancel: false,
         onConfirm: () => {}
       })
    } finally {
       setIsSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
      useConfirmStore.getState().show({
          title: 'Confirmar',
          message: 'Deseja remover este registo de lote?',
          confirmLabel: 'Remover',
          isDestructive: true,
          onConfirm: () => deleteLot(id)
      })
  }

  const renderItem = ({ item }: { item: any }) => {
    const product = products.find(p => p.id === item.product_id)
    const productName = product?.name || 'Produto Removido'
    
    let variant: 'success' | 'warning' | 'danger' = 'success'
    let statusText = 'Em Dia'
    let icon = <CheckCircle2 size={16} color="#10b981" />
    
    if (item.status === 'warning') { 
      variant = 'warning'
      statusText = 'Próx. Vencimento'
      icon = <Info size={16} color="#f59e0b" />
    }
    if (item.status === 'expired') { 
      variant = 'danger'
      statusText = 'Vencido'
      icon = <AlertTriangle size={16} color="#ef4444" />
    }

    return (
      <Card className="mb-4 rounded-2xl p-4 bg-white dark:bg-slate-800 border-none shadow-sm">
        <View className="flex-row justify-between items-start mb-3">
           <View className="flex-1 pr-2">
              <Text className="text-base font-bold text-slate-800 dark:text-white" numberOfLines={1}>
                {productName}
              </Text>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Lote: {item.lot_number}
              </Text>
           </View>
           <Badge label={statusText} variant={variant} className="px-3" />
        </View>
        
        <View className="flex-row justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-700/50">
           <View className="flex-row items-center">
              {icon}
              <Text className={`text-sm font-bold ml-2 ${item.status === 'expired' ? 'text-red-500' : item.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                {formatShortDate(item.expiry_date)}
              </Text>
           </View>
           <View className="flex-row items-center">
               <Text className="text-sm font-black text-slate-700 dark:text-slate-300 mr-4">
                  {item.quantity} {product?.unit || 'un'}
               </Text>
               <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <Trash2 size={16} color="#94a3b8" />
               </TouchableOpacity>
           </View>
        </View>
      </Card>
    )
  }

  const FilterPill = ({ label, value, count }: { label: string, value: any, count: number }) => {
     const isActive = filterType === value
     return (
       <TouchableOpacity 
         onPress={() => setFilterType(value)}
         className={`px-4 py-2 rounded-full mr-2 border flex-row items-center ${isActive ? 'bg-slate-800 border-slate-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
       >
         <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            {label}
         </Text>
         <View className={`ml-2 px-1.5 rounded-md ${isActive ? 'bg-slate-700' : 'bg-slate-100 dark:bg-slate-700'}`}>
            <Text className={`text-[10px] font-black ${isActive ? 'text-white' : 'text-slate-500'}`}>%{count}</Text>
         </View>
       </TouchableOpacity>
     )
  }

  return (
    <Screen padHorizontal={false} withHeader>
      <Header 
        title="Lotes e Validades" 
        rightElement={
          <TouchableOpacity 
            onPress={() => setIsModalOpen(true)}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 active:bg-white/20"
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        }
      />
      
      {/* Expiry Health Summary */}
      <View className="px-6 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
         <View className="flex-row justify-between mb-6">
            <View className="items-center flex-1">
               <Text className="text-2xl font-black text-red-500">{stats.expired}</Text>
               <Text className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Vencidos</Text>
            </View>
            <View className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800 self-center" />
            <View className="items-center flex-1">
               <Text className="text-2xl font-black text-amber-500">{stats.warning}</Text>
               <Text className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Próximos</Text>
            </View>
            <View className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800 self-center" />
            <View className="items-center flex-1">
               <Text className="text-2xl font-black text-emerald-500">{stats.ok}</Text>
               <Text className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Em Dia</Text>
            </View>
         </View>

         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <FilterPill label="Todos" value="all" count={lots.length} />
            <FilterPill label="Vencidos" value="expired" count={stats.expired} />
            <FilterPill label="Próximos" value="warning" count={stats.warning} />
         </ScrollView>
      </View>

      {isLoading ? (
         <Loading fullScreen message="A verificar validades..." />
      ) : (
        <FlatList
          data={filteredLots}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="px-6 pt-6 pb-20"
          ListEmptyComponent={
            <EmptyState 
              title="Sem lotes"
              description="Nenhum registo de validade encontrado para este filtro."
            />
          }
        />
      )}

      {/* Premium BottomSheet for creating a lot */}
      <BottomSheet 
        visible={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        height={0.8}
      >
         <View className="flex-1 bg-white dark:bg-slate-950 px-6 pt-4 pb-8">
            <View className="flex-row justify-between items-center mb-8">
               <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">Novo Lote</Text>
               <TouchableOpacity 
                 onPress={() => setIsModalOpen(false)}
                 className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center"
               >
                  <X size={20} color="#94a3b8" />
               </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <TouchableOpacity 
                onPress={() => setIsPickerOpen(true)}
                className="mb-6"
              >
                <Card variant="glass" glassIntensity={5} className="p-5 border-slate-100 dark:border-slate-800">
                  <Text className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Produto Selecionado</Text>
                  <Text className={`text-lg font-black ${formData.product_name ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                    {formData.product_name || 'Tocar para selecionar...'}
                  </Text>
                </Card>
              </TouchableOpacity>

              <View className="space-y-5">
                <FormField
                   label="Número do Lote"
                   placeholder="Ex: L2024-001"
                   value={formData.lot_number}
                   onChangeText={(v) => setFormData(prev => ({...prev, lot_number: v}))}
                />
                <DatePicker
                   label="Data de Validade"
                   value={formData.expiry_date}
                   onChange={(v) => setFormData(prev => ({...prev, expiry_date: v}))}
                />
                <FormField
                   label="Quantidade Inicial"
                   placeholder="0"
                   keyboardType="numeric"
                   value={formData.quantity}
                   onChangeText={(v) => setFormData(prev => ({...prev, quantity: v}))}
                />
              </View>
              
              <View className="mt-10 mb-10">
                 <Button 
                   title="Registar Lote" 
                   onPress={handleSave} 
                   isLoading={isSubmitting} 
                   variant="gradient" 
                   className="h-14 rounded-2xl shadow-lg shadow-primary/20"
                 />
              </View>
            </ScrollView>
         </View>

         <ProductPickerModal 
           visible={isPickerOpen}
           onClose={() => setIsPickerOpen(false)}
           onSelect={(p) => {
             setFormData(prev => ({ ...prev, product_id: p.id, product_name: p.name }))
             setIsPickerOpen(false)
           }}
         />
      </BottomSheet>
    </Screen>
  )
}
