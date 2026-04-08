import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useSync } from '@/features/sync/hooks/useSync'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CloudOff, Cloud, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react-native'
import PlanGate from '@/components/ui/PlanGate'

export default function SyncScreen() {
  const { pendingItems, errorItems, isLoading, lastSync, triggerSync } = useSync()

  const pendingCount = pendingItems.length
  const errorCount = errorItems.length

  return (
    <PlanGate feature="hasRealtime" requiredPlan="PRO">
      <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900">
        <Header title="Sincronização" />
      
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 120 }}>
         <View className="items-center justify-center py-6 mb-4">
             {pendingCount > 0 ? (
                 <View className="items-center">
                    <CloudOff size={64} color="#f59e0b" className="mb-4" />
                    <Text className="text-xl font-bold text-slate-800 dark:text-white">Dados Pendentes</Text>
                    <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center">
                       Existem registos por sincronizar com o servidor.
                    </Text>
                 </View>
             ) : (
                 <View className="items-center">
                    <CheckCircle2 size={64} color="#10b981" className="mb-4" />
                    <Text className="text-xl font-bold text-slate-800 dark:text-white">Tudo Sincronizado</Text>
                    <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center">
                       Os seus dados estão atualizados na cloud.
                    </Text>
                 </View>
             )}
         </View>

         <Card className="mb-6">
             <View className="flex-row justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                <Text className="text-slate-600 dark:text-slate-300">Pendentes</Text>
                <Text className="font-bold text-slate-900 dark:text-white">{pendingCount}</Text>
             </View>
             <View className="flex-row justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                <Text className="text-slate-600 dark:text-slate-300">Erros de Sincronização</Text>
                <Text className="font-bold text-red-500">{errorCount}</Text>
             </View>
             <View className="flex-row justify-between py-3">
                <Text className="text-slate-600 dark:text-slate-300">Última tentativa</Text>
                <Text className="font-medium text-slate-900 dark:text-white">
                   {lastSync ? lastSync.toLocaleTimeString('pt-PT') : 'Desconhecido'}
                </Text>
             </View>
         </Card>

         <Button 
            title={isLoading ? "A Sincronizar..." : "Sincronizar Agora"} 
            onPress={triggerSync}
            isLoading={isLoading}
            icon={!isLoading && <RefreshCw size={20} color="white" className="mr-2" />}
         />

         {errorCount > 0 && (
             <View className="mt-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-5 rounded-3xl">
                 <View className="flex-row items-center mb-4">
                    <AlertTriangle size={24} color="#ef4444" className="mr-3" />
                    <Text className="font-black text-red-800 dark:text-red-400 text-lg">Falhas Detetadas</Text>
                 </View>
                 
                 <Text className="text-sm text-red-600 dark:text-red-300 mb-4 font-medium">
                    {errorCount} registo(s) falharam após múltiplas tentativas. 
                 </Text>

                 <ScrollView 
                   style={{ maxHeight: 400 }} 
                   nestedScrollEnabled 
                   showsVerticalScrollIndicator
                 >
                   {errorItems.map((item, idx) => (
                      <View key={item.id} className={`py-3 ${idx !== 0 ? 'border-t border-red-100 dark:border-red-900/20' : ''}`}>
                          <View className="flex-row justify-between mb-1">
                              <Text className="text-[10px] font-black text-red-700 dark:text-red-500 uppercase tracking-widest">
                                  {item.table_name} • {item.action}
                              </Text>
                              <Text className="text-[10px] text-red-400 font-bold">Tentativas: {item.retry_count}</Text>
                          </View>
                          <Text className="text-xs text-red-600/80 dark:text-red-400/80 font-bold leading-5">
                              {item.last_error || 'Erro desconhecido'}
                          </Text>
                      </View>
                   ))}
                 </ScrollView>
             </View>
         )}
      </ScrollView>
      </Screen>
    </PlanGate>
  )
}
