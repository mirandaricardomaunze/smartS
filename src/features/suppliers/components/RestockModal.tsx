import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native'
import { X, PackageOpen, MessageSquare, AlertCircle, FileDown } from 'lucide-react-native'
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

  const { getActiveCompany } = useCompanyStore()
  if (!supplier) return null
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
        company || { name: 'SmartS Business' } as any,
        supplier,
        restockItems as any
      )
      useToastStore.getState().show('Ordem de Compra PDF gerada!', 'success')
    } catch (error) {
      useToastStore.getState().show('Erro ao gerar PDF', 'error')
    }
  }

  return (
    <BottomSheet visible={isVisible} onClose={onClose} height={0.85}>
      <View className="bg-white dark:bg-slate-950 flex-1">
        
        {/* Header Fixo */}
        <View className="flex-row justify-between items-center px-6 py-5">
          <View>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">Pedido de Reposição</Text>
            <Text style={{ fontFamily: 'Inter-Medium' }} className="text-slate-500 dark:text-slate-400 text-xs mt-1">{supplier.name}</Text>
          </View>
          <TouchableOpacity 
            onPress={onClose}
            className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
          >
            <X size={20} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {restockItems.length > 0 ? (
            <>
              <View className="mb-6">
                <Text style={{ fontFamily: 'Inter-Black' }} className="text-sm font-black text-slate-800 dark:text-white mb-3 uppercase tracking-widest">
                  Itens com Stock Baixo ({restockItems.length})
                </Text>

                {restockItems.map((item, index) => (
                  <Card key={index} className="mb-3 p-4 bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 shadow-premium-sm rounded-2xl">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1 pr-3">
                        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-sm" numberOfLines={1}>{item.name}</Text>
                        <View className="flex-row items-center mt-1">
                          <AlertCircle size={10} color="#ef4444" />
                          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-rose-500 text-[10px] font-bold ml-1 uppercase">Stock atual: {item.current_stock}</Text>
                        </View>
                      </View>
                      <View className="bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 items-center justify-center">
                        <Text style={{ fontFamily: 'Inter-Black' }} className="text-indigo-600 dark:text-indigo-400 font-black text-xs">+{item.suggested_quantity}</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>

              <View className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 mb-8 mt-2">
                <Text style={{ fontFamily: 'Inter-Medium' }} className="text-amber-700 dark:text-amber-400 text-xs leading-5">
                  Gere uma mensagem profissional formatada para enviar ao seu fornecedor via WhatsApp ou Email com um único clique.
                </Text>
              </View>
            </>
          ) : (
            <View className="items-center justify-center py-20 mt-10">
              <View className="w-20 h-20 bg-emerald-500/10 rounded-full items-center justify-center mb-6 border border-emerald-500/20">
                <PackageOpen size={40} color="#10b981" />
              </View>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white font-black text-2xl text-center">Tudo em dia!</Text>
              <Text style={{ fontFamily: 'Inter-Medium' }} className="text-slate-500 dark:text-slate-400 text-sm text-center mt-3 px-10 leading-6">
                Não existem produtos deste fornecedor abaixo do stock mínimo no momento.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer actions pinned to the relative bottom */}
        {restockItems.length > 0 ? (
          <View className="px-6 pt-4 pb-12 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50 flex-row space-x-3">
            <View className="flex-1 mr-3">
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
        ) : (
          <View className="px-6 pt-4 pb-12 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
             <Button 
                 title="Voltar" 
                 variant="secondary" 
                 className="h-14 rounded-2xl"
                 onPress={onClose}
             />
          </View>
        )}
      </View>
    </BottomSheet>
  )
}
