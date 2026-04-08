import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import { FilterBar } from '@/components/ui'
import { useHistory } from '@/features/history/hooks/useHistory'
import { HistoryEntry, User } from '@/types'
import { useFormatter } from '@/hooks/useFormatter'
import { usersRepository } from '@/repositories/usersRepository'
import { useCompanyStore } from '@/store/companyStore'
import RoleGuard from '@/components/layout/RoleGuard'
import { 
  History as HistoryIcon, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  User as UserIcon,
  Tag,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function HistoryListScreen() {
  const { history: logs, isLoading, loadMore, hasMore, reload } = useHistory()
  const { activeCompanyId } = useCompanyStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [usersMap, setUsersMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (activeCompanyId) {
      const users = usersRepository.getAll(activeCompanyId)
      const map: Record<string, string> = {}
      users.forEach(u => { map[u.id] = u.name })
      setUsersMap(map)
    }
  }, [activeCompanyId])

  const filteredLogs = useMemo(() => {
    let base = logs
    if (filter !== 'ALL') {
      base = base.filter(log => log.action.toUpperCase() === filter)
    }
    
    if (!search) return base
    const s = search.toLowerCase()
    return base.filter(log => 
      log.action.toLowerCase().includes(s) || 
      log.table_name.toLowerCase().includes(s) ||
      log.record_id.toLowerCase().includes(s)
    )
  }, [logs, search, filter])

  const { formatCurrency } = useFormatter()

  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return <Plus size={16} color="#10b981" />
      case 'UPDATE': return <Edit2 size={16} color="#3b82f6" />
      case 'DELETE': return <Trash2 size={16} color="#ef4444" />
      default: return <FileText size={16} color="#64748b" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      case 'UPDATE': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'DELETE': return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
      default: return 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400'
    }
  }

  const getFriendlyTableName = (table: string) => {
    switch (table) {
      case 'products': return 'Produtos'
      case 'movements': return 'Movimentações'
      case 'orders': return 'Encomendas'
      case 'notes': return 'Notas'
      case 'users': return 'Utilizadores'
      case 'customers': return 'Clientes'
      case 'suppliers': return 'Fornecedores'
      case 'categories': return 'Categorias'
      case 'expiry_lots': return 'Lotes/Validades'
      default: return table
    }
  }

  const renderItem = ({ item }: { item: HistoryEntry }) => {
    const isExpanded = expandedId === item.id
    const date = parseISO(item.created_at)
    
    let dateLabel = format(date, "HH:mm")
    if (!isToday(date)) {
        dateLabel = format(date, "dd/MM HH:mm")
    }

    return (
      <Card className="mb-3 overflow-hidden p-0" variant="glass">
        <TouchableOpacity 
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
          className="p-4"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${getActionColor(item.action)}`}>
                {getActionIcon(item.action)}
              </View>
              
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white font-bold text-base">
                  {item.action === 'CREATE' ? 'Criação' : item.action === 'UPDATE' ? 'Atualização' : 'Eliminação'} de {getFriendlyTableName(item.table_name)}
                </Text>
                <View className="flex-row items-center mt-1">
                  <UserIcon size={12} color="#94a3b8" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1 mr-3">
                    {usersMap[item.user_id] || `ID: ${item.user_id.substring(0, 8)}`}
                  </Text>
                  <Calendar size={12} color="#94a3b8" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">{dateLabel}</Text>
                </View>
              </View>
              
              {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
            </View>
          </View>

          {isExpanded && (
            <View className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <Text className="text-slate-400 dark:text-slate-500 text-xs mb-2 font-bold uppercase tracking-widest">Detalhes do Registo</Text>
              <View className="bg-slate-900/50 dark:bg-slate-900/90 p-4 rounded-2xl border border-white/5">
                {Object.entries(JSON.parse(item.data)).map(([key, value], idx) => (
                  <View key={idx} className="flex-row justify-between mb-1">
                    <Text className="text-slate-500 text-[10px] uppercase font-bold">{key}:</Text>
                    <Text className="text-slate-300 text-xs font-mono ml-2 flex-1 text-right" numberOfLines={1}>
                      {typeof value === 'object' ? '...' : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="mt-3 flex-row items-center">
                <Tag size={12} color="#94a3b8" />
                <Text className="text-slate-500 text-xs ml-1">Record ID: {item.record_id}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Card>
    )
  }

  return (
    <RoleGuard permission="view_history">
      <Screen padHorizontal={false} withHeader>
        <Header 
          title="Auditoria" 
          showBack 
        />
        
        <View className="px-4 mt-4">
          <Input
            placeholder="Pesquisar por ação ou tabela..."
            value={search}
            onChangeText={setSearch}
            icon={<Search size={20} color="#94a3b8" />}
            className="bg-white/50 dark:bg-slate-900/50 mb-0"
          />
          
          <FilterBar
            options={[
              { label: 'TUDO', value: 'ALL' },
              { label: 'CRIAR', value: 'CREATE' },
              { label: 'EDITAR', value: 'UPDATE' },
              { label: 'APAGAR', value: 'DELETE' },
            ]}
            selectedValue={filter}
            onSelect={setFilter}
            className="py-2"
          />
        </View>

        <FlatList
          data={filteredLogs}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && logs.length > 0 ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#4f46e5" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            isLoading ? <Loading /> : <EmptyState title="Nenhuma atividade registada" icon={<HistoryIcon size={48} color="#94a3b8" />} />
          }
          onRefresh={reload}
          refreshing={isLoading}
        />
      </Screen>
    </RoleGuard>
  )
}
