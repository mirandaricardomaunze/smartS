import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useFinance } from '@/features/finance/hooks/useFinance'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, Filter, Search } from 'lucide-react-native'
import { formatDate } from '@/utils/formatters'
import Input from '@/components/ui/Input'
import { FilterBar } from '@/components/ui'
import { useFormatter } from '@/hooks/useFormatter'
import Animated, { FadeInUp } from 'react-native-reanimated'
import PlanGate from '@/components/ui/PlanGate'

function TransactionItem({ item }: { item: any }) {
  const { formatCurrency } = useFormatter()
  const isIncome = item.type === 'income'
  return (
    <Card className="mb-3 p-4 flex-row items-center justify-between border-slate-100 dark:border-slate-800">
      <View className="flex-row items-center flex-1">
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isIncome ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {isIncome ? <TrendingUp size={18} color="#10b981" /> : <TrendingDown size={18} color="#ef4444" />}
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-slate-800 dark:text-white font-semibold">{item.description}</Text>
          <Text className="text-[10px] text-slate-500 mt-0.5">{item.category} • {formatDate(item.date)}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </Card>
  )
}

export default function FinanceScreen() {
  const { transactions, stats, isLoading, fetchFinance } = useFinance()
  const { formatCurrency } = useFormatter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = (tx.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                        (tx.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || tx.type === filterType
    return matchesSearch && matchesType
  })

  useEffect(() => {
    fetchFinance()
  }, [])

  return (
    <PlanGate feature="hasFinance" requiredPlan="BASIC">
      <Screen withHeader padHorizontal={false}>
        <Header title="Financeiro" />
      
      <ScrollView className="flex-1 px-6 pb-20">
        {/* Sumário Executivo */}
        <Animated.View entering={FadeInUp.delay(200)} className="mt-4 mb-8">
           <Card className="bg-slate-900 dark:bg-[#0f172a] border-none p-6 shadow-xl">
              <View className="flex-row items-center justify-between mb-4">
                 <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Saldo Mensal</Text>
                 <Wallet size={20} color="#6366f1" />
              </View>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-white mb-6">
                {formatCurrency(stats.profit)}
              </Text>
              <View className="flex-row justify-between">
                 <View>
                    <View className="flex-row items-center mb-1">
                       <ArrowUpRight size={14} color="#10b981" />
                       <Text className="text-emerald-400 text-[10px] font-bold ml-1">RECEITAS</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-white">{formatCurrency(stats.income)}</Text>
                 </View>
                 <View className="items-end">
                    <View className="flex-row items-center mb-1">
                       <ArrowDownLeft size={14} color="#ef4444" />
                       <Text className="text-red-400 text-[10px] font-bold ml-1">DESPESAS</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-bold text-white">{formatCurrency(stats.expense)}</Text>
                 </View>
              </View>
           </Card>
        </Animated.View>

        <View className="mt-4 mb-2">
           <Input 
             placeholder="Pesquisar transações..."
             value={searchQuery}
             onChangeText={setSearchQuery}
             icon={<Search size={20} color="#94a3b8" />}
             className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mb-0"
           />
           <FilterBar
             options={[
               { label: 'Tudo', value: 'all' },
               { label: 'Receitas', value: 'income' },
               { label: 'Despesas', value: 'expense' },
             ]}
             selectedValue={filterType}
             onSelect={setFilterType}
             className="py-2"
           />
        </View>

        {/* Lista de Transações */}
        <View className="mb-4">
           <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">Histórico de Movimentos</Text>
        </View>

        {isLoading ? (
          <Loading />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState title="Cofre vazio" description="As tuas vendas e despesas aparecerão aqui." icon={<Wallet size={48} color="#cbd5e1" />} />
        ) : (
          filteredTransactions.map((tx, idx) => (
            <Animated.View key={tx.id} entering={FadeInUp.delay(300 + (idx * 50))}>
              <TransactionItem item={tx} />
            </Animated.View>
          ))
        )}
      </ScrollView>
      </Screen>
    </PlanGate>
  )
}
