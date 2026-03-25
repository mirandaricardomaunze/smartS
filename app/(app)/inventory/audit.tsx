import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import { Plus, Search, Box, ArrowRight, Save, Trash2, AlertTriangle, Scan } from 'lucide-react-native'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProducts } from '@/features/products/hooks/useProducts'
import { inventoryService } from '@/features/inventory/services/inventoryService'
import { useAuthStore } from '@/features/auth/store/authStore'
import { feedback } from '@/utils/haptics'
import ProductPickerModal from '@/features/products/components/ProductPickerModal'
import { Product } from '@/types'
import { useRouter } from 'expo-router'

interface AuditItem {
  product: Product
  countedQty: number
}

export default function AuditScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { products, reload } = useProducts()
  const [auditList, setAuditList] = useState<AuditItem[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    reload()
  }, [])

  const handleAddProduct = (product: Product) => {
    if (auditList.some(item => item.product.id === product.id)) {
      useToastStore.getState().show('Produto já está na lista de auditoria.', 'warning')
      return
    }
    setAuditList([...auditList, { product, countedQty: 0 }])
    setShowPicker(false)
  }

  const handleRemoveItem = (productId: string) => {
    setAuditList(auditList.filter(item => item.product.id !== productId))
  }

  const handleUpdateQty = (productId: string, qty: string) => {
    const numQty = parseFloat(qty) || 0
    setAuditList(auditList.map(item => 
      item.product.id === productId ? { ...item, countedQty: numQty } : item
    ))
  }

  const handleApplyAudit = async () => {
    if (auditList.length === 0) return
    if (!user || !user.company_id) return

    Alert.alert(
      'Confirmar Auditoria',
      `Desejas aplicar os ajustes para ${auditList.length} itens? Esta ação criará movimentos de ajuste no histórico.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            setIsSaving(true)
            try {
              for (const item of auditList) {
                await inventoryService.reconcileStock(
                  item.product.id,
                  item.countedQty,
                  user.id,
                  user.company_id!
                )
              }
              feedback.success()
              useToastStore.getState().show('Inventário atualizado com sucesso!', 'success')
              setAuditList([])
              router.back()
            } catch (error: any) {
              useToastStore.getState().show(error.message || 'Falha ao processar auditoria', 'error')
            } finally {
              setIsSaving(false)
            }
          }
        }
      ]
    )
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950" withHeader>
      <Header title="Inventário Físico" showBack />

      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-32">
        <View className="mb-8">
            <Text className="text-2xl font-black text-slate-900 dark:text-white">Auditoria de Stock</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                Compara o stock físico com o registado no sistema.
            </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mb-8 space-x-3">
            <TouchableOpacity 
                onPress={() => setShowPicker(true)}
                className="flex-1 bg-white dark:bg-slate-900 h-14 rounded-2xl border border-slate-200 dark:border-white/10 flex-row items-center justify-center shadow-sm"
            >
                <Plus size={20} color="#4f46e5" />
                <Text className="ml-2 font-bold text-indigo-600 dark:text-indigo-400">Adicionar Prod.</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => router.push('/(app)/scanner')}
                className="w-14 h-14 bg-indigo-500 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/20"
            >
                <Scan size={24} color="white" />
            </TouchableOpacity>
        </View>

        {/* Audit List */}
        {auditList.length > 0 ? (
          auditList.map((item, index) => {
            const discrepancy = item.countedQty - item.product.current_stock
            
            return (
              <Card key={item.product.id} className="mb-4 p-5 rounded-[24px] bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-bold text-base" numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                      Stock Sistema: {item.product.current_stock}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleRemoveItem(item.product.id)}
                    className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-full items-center justify-center"
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="text-[10px] font-black text-slate-500 uppercase mb-2">Contagem Física</Text>
                    <TextInput
                      className="bg-slate-50 dark:bg-slate-950 h-12 rounded-xl px-4 text-slate-900 dark:text-white font-black text-lg border border-slate-200 dark:border-white/10"
                      keyboardType="numeric"
                      value={String(item.countedQty)}
                      onChangeText={(val) => handleUpdateQty(item.product.id, val)}
                      placeholder="0"
                    />
                  </View>

                  <View className="items-end">
                    <Text className="text-[10px] font-black text-slate-500 uppercase mb-2">Diferença</Text>
                    <View className={`px-3 py-2 rounded-xl flex-row items-center ${discrepancy === 0 ? 'bg-slate-100' : discrepancy > 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        {discrepancy !== 0 && (
                            <Text className={`font-black text-sm ${discrepancy > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {discrepancy > 0 ? '+' : ''}{discrepancy}
                            </Text>
                        )}
                        {discrepancy === 0 && <Text className="text-slate-500 font-bold text-sm">0</Text>}
                    </View>
                  </View>
                </View>
              </Card>
            )
          })
        ) : (
          <View className="items-center justify-center py-20">
             <View className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full items-center justify-center mb-6">
                <Box size={40} color="#94a3b8" />
             </View>
             <Text className="text-slate-900 dark:text-white font-black text-lg">Inicia a Auditoria</Text>
             <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2 px-10">
                Adiciona produtos ou usa o scanner para começar a conferir o stock físico.
             </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Button */}
      {auditList.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-white/5">
             <Button 
                title="Aplicar Ajustes de Inventário"
                variant="gradient"
                gradientColors={['#4f46e5', '#818cf8']}
                isLoading={isSaving}
                onPress={handleApplyAudit}
                className="h-16 rounded-[24px] shadow-xl shadow-indigo-500/20"
                icon={<Save size={20} color="white" />}
             />
        </View>
      )}

      <ProductPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddProduct}
      />
    </Screen>
  )
}
