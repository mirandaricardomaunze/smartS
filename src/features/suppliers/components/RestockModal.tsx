import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native'
import { X, PackageOpen, MessageSquare, Clipboard, AlertCircle, ShoppingCart, FileDown } from 'lucide-react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import { Supplier } from '@/types'
import { procurementService } from '@/services/procurementService'
import { pdfService } from '@/services/pdfService'
import { useCompanyStore } from '@/store/companyStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'

interface RestockModalProps {
  isVisible: boolean
  onClose: () => void
  supplier: Supplier | null
}

export default function RestockModal({ isVisible, onClose, supplier }: RestockModalProps) {
  const restockItems = useMemo(() => {
    if (!supplier) return []
    return procurementService.getRestockNeeds(supplier.id)
  }, [supplier])

  if (!supplier) return null

  const { getActiveCompany } = useCompanyStore()

  const handleShare = async () => {
    feedback.light()
    const message = procurementService.generateRestockMessage(supplier.name, restockItems)
    try {
      await Share.share({
        message,
        title: 'Pedido de Reposição SmartS'
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleGeneratePDF = async () => {
    feedback.medium()
    const company = getActiveCompany()
    try {
      await pdfService.generatePurchaseOrder(
        company || { name: 'SmartS Business' },
        supplier,
        restockItems
      )
      useToastStore.getState().show('Ordem de Compra PDF gerada!', 'success')
    } catch (error) {
      useToastStore.getState().show('Erro ao gerar PDF', 'error')
    }
  }

  return (
    <BottomSheet visible={isVisible} onClose={onClose}>
      <ScrollView className="px-6 pb-10" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-black text-slate-900 dark:text-white">Pedido de Reposição</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">{supplier.name}</Text>
          </View>
        </View>

        {restockItems.length > 0 ? (
          <>
            <View className="mb-6">
              <Text className="text-sm font-bold text-slate-800 dark:text-white mb-3">Itens com Stock Baixo ({restockItems.length})</Text>
              {restockItems.map((item, index) => (
                <Card key={index} className="mb-3 p-4 bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 rounded-2xl">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white font-bold text-sm" numberOfLines={1}>{item.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <AlertCircle size={10} color="#ef4444" />
                        <Text className="text-rose-500 text-[10px] font-bold ml-1">Stock atual: {item.current_stock}</Text>
                      </View>
                    </View>
                    <View className="bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                      <Text className="text-indigo-600 dark:text-indigo-400 font-black text-xs">+{item.suggested_quantity}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            <View className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 mb-8">
              <Text className="text-amber-700 dark:text-amber-400 text-xs leading-5 font-medium">
                Gere uma mensagem profissional formatada para enviar ao seu fornecedor via WhatsApp ou Email.
              </Text>
            </View>

            <View className="flex-row items-center space-x-3 gap-x-3">
              <View className="flex-1">
                <Button
                  title="WhatsApp"
                  variant="primary"
                  className="h-14 rounded-2xl shadow-lg shadow-indigo-500/20"
                  icon={<MessageSquare size={20} color="white" />}
                  onPress={handleShare}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Gerar PDF"
                  variant="secondary"
                  className="h-14 rounded-2xl border-indigo-200 dark:border-indigo-900"
                  icon={<FileDown size={20} color="#4f46e5" />}
                  onPress={handleGeneratePDF}
                />
              </View>
            </View>
          </>
        ) : (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-emerald-500/10 rounded-full items-center justify-center mb-4">
              <PackageOpen size={40} color="#10b981" />
            </View>
            <Text className="text-slate-900 dark:text-white font-black text-lg text-center">Tudo em conformidade!</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2 px-10">
              Não existem produtos deste fornecedor abaixo do stock mínimo no momento.
            </Text>
            <Button 
                title="Fechar" 
                variant="ghost" 
                className="mt-8 px-10"
                onPress={onClose}
            />
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  )
}
