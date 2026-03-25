import React, { useMemo, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import { historyService } from '@/features/history/services/historyService'
import { HistoryEntry } from '@/types'
import { useFormatter } from '@/hooks/useFormatter'
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
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // In a real app, this would be a hook with query/loading state
  const logs = useMemo(() => {
    try {
      return historyService.getAll()
    } catch (e) {
      console.error(e)
      return []
    }
  }, [])

  const filteredLogs = useMemo(() => {
    if (!search) return logs
    const s = search.toLowerCase()
    return logs.filter(log => 
      log.action.toLowerCase().includes(s) || 
      log.table_name.toLowerCase().includes(s) ||
      log.record_id.toLowerCase().includes(s)
    )
  }, [logs, search])

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
                  <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1 mr-3">ID: {item.user_id.substring(0, 8)}</Text>
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
              <View className="bg-slate-900 p-3 rounded-xl">
                <Text className="text-emerald-400 font-mono text-xs">
                  {JSON.stringify(JSON.parse(item.data), null, 2)}
                </Text>
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
    <Screen padHorizontal={false} withHeader>
      <Header 
        title="Auditoria" 
        showBack 
      />
      
      <View className="px-4 mt-4 mb-2">
        <Input
          placeholder="Pesquisar por ação ou tabela..."
          value={search}
          onChangeText={setSearch}
          icon={<Search size={20} color="#94a3b8" />}
          className="bg-white/50 dark:bg-slate-900/50"
        />
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="Nenhuma atividade registada" icon={<HistoryIcon size={48} color="#94a3b8" />} />}
      />
    </Screen>
  )
}
