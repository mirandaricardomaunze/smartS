import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, useColorScheme } from 'react-native'
import React, { useState, useMemo, useEffect } from 'react'
import { useBiometrics } from '@/hooks/useBiometrics'
import BiometricLock from '@/components/ui/BiometricLock'
import { router } from 'expo-router'

import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  Search, 
  Users, 
  Building2, 
  TrendingUp, 
  History, 
  ArrowLeftRight, 
  ScanLine, 
  RefreshCw, 
  Database,
  ChevronRight,
  Shield,
  FileBarChart,
  FileText,
  Download,
  Upload,
  BarChart3,
  CalendarClock,
  History as HistoryIcon,
  Tag,
  Package,
  ClipboardList,
  ShoppingCart,
  Settings
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { feedback } from '@/utils/haptics'

type ModuleItem = {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  route: string
  category: string
  color: string // Tailwind color class like 'emerald', 'sky', etc.
}

export default function ControlCenterScreen() {


  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [searchQuery, setSearchQuery] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const { authenticateAsync, isSupported, isEnrolled } = useBiometrics()

  useEffect(() => {
    if (isSupported && isEnrolled && !isUnlocked) {
       handleUnlock()
    } else if (!isSupported || !isEnrolled) {
       setIsUnlocked(true)
    }
  }, [isSupported, isEnrolled])

  const handleUnlock = async () => {
     const success = await authenticateAsync('Autenticação Biométrica Necessária')
     if (success) {
       setIsUnlocked(true)
     }
  }

  const modules: ModuleItem[] = useMemo(() => [
    {
      id: 'customers',
      title: 'Base de Clientes',
      subtitle: 'Gerir CRM e contactos',
      icon: <Users size={22} color="#10b981" />,
      route: '/(app)/customers',
      category: 'Parceiros e CRM',
      color: 'emerald'
    },
    {
      id: 'suppliers',
      title: 'Fornecedores',
      subtitle: 'Gestão de compras e SRM',
      icon: <Building2 size={22} color="#10b981" />,
      route: '/(app)/suppliers',
      category: 'Parceiros e CRM',
      color: 'emerald'
    },
    {
      id: 'scanner',
      title: 'Scanner de Barcode',
      subtitle: 'Entrada rápida via câmara',
      icon: <ScanLine size={22} color="#4f46e5" />,
      route: '/(app)/scanner',
      category: 'Operações de Stock',
      color: 'primary'
    },
    {
      id: 'movements',
      title: 'Movimentos de Stock',
      subtitle: 'Registo de entradas e saídas',
      icon: <ArrowLeftRight size={22} color="#4f46e5" />,
      route: '/(app)/movements',
      category: 'Operações de Stock',
      color: 'primary'
    },
    {
      id: 'categories',
      title: 'Categorias',
      subtitle: 'Gerir famílias de produtos',
      icon: <Tag size={22} color="#4f46e5" />,
      route: '/(app)/categories',
      category: 'Operações de Stock',
      color: 'primary'
    },
    {
      id: 'expiry',
      title: 'Alertas de Validade',
      subtitle: 'Vencimentos e lotes',
      icon: <CalendarClock size={22} color="#4f46e5" />,
      route: '/(app)/expiry',
      category: 'Operações de Stock',
      color: 'primary'
    },
    {
      id: 'stock',
      title: 'Gestão de Inventário',
      subtitle: 'Lista de produtos e catálogo',
      icon: <Package size={22} color="#4f46e5" />,
      route: '/(app)/products',
      category: 'Operações de Stock',
      color: 'primary'
    },
    {
      id: 'audit',
      title: 'Inventário Físico',
      subtitle: 'Auditoria e ajuste de stock',
      icon: <ClipboardList size={22} color="#4f46e5" />,
      route: '/(app)/inventory/audit',
      category: 'Operações de Stock',
      color: 'primary'
    },
    {
      id: 'finance',
      title: 'Fluxo de Caixa',
      subtitle: 'Resumo financeiro e caixa',
      icon: <TrendingUp size={22} color="#8b5cf6" />,
      route: '/(app)/finance',
      category: 'Gestão Financeira',
      color: 'violet'
    },
    {
      id: 'reports',
      title: 'Relatórios PDF',
      subtitle: 'Exportar listas e KPI',
      icon: <BarChart3 size={22} color="#0ea5e9" />,
      route: '/(app)/reports',
      category: 'Dados e Análises',
      color: 'sky'
    },
    {
      id: 'users',
      title: 'Gestão de Equipa',
      subtitle: 'Permissões e acessos',
      icon: <Shield size={22} color="#f43f5e" />,
      route: '/(app)/users',
      category: 'Sistema e Segurança',
      color: 'red'
    },
    {
      id: 'hr',
      title: 'Recursos Humanos',
      subtitle: 'Funcionários, salários e ponto',
      icon: <Users size={22} color="#059669" />,
      route: '/(app)/hr',
      category: 'Capital Humano',
      color: 'emerald'
    },
    {
      id: 'history',
      title: 'Histórico de Auditoria',
      subtitle: 'Log completo de ações',
      icon: <HistoryIcon size={22} color="#f43f5e" />,
      route: '/(app)/history',
      category: 'Sistema e Segurança',
      color: 'red'
    },
    {
      id: 'backup',
      title: 'Backup e Nuvem',
      subtitle: 'Cópias e sincronização',
      icon: <Download size={22} color="#f43f5e" />,
      route: '/(app)/backup',
      category: 'Sistema e Segurança',
      color: 'red'
    },
    {
      id: 'orders',
      title: 'Pedidos',
      subtitle: 'Gestão de encomendas',
      icon: <ShoppingCart size={22} color="#0ea5e9" />,
      route: '/(app)/orders',
      category: 'Operações de Stock',
      color: 'sky'
    },
    {
      id: 'settings',
      title: 'Definições',
      subtitle: 'Configurações do sistema',
      icon: <Settings size={22} color="#64748b" />,
      route: '/(app)/settings',
      category: 'Sistema e Segurança',
      color: 'slate'
    }
  ], [])

  const handleAction = (item: ModuleItem) => {
      feedback.light()
      router.push(item.route as any)
  }

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules
    return modules.filter(m =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, modules])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(filteredModules.map(m => m.category)))
    return cats
  }, [filteredModules])

  const ControlGridItem = ({ item }: { item: ModuleItem }) => {
    const bgColorMap: Record<string, string> = {
        emerald: 'bg-emerald-500/10 border-emerald-500/20',
        primary: 'bg-indigo-500/10 border-indigo-500/20',
        violet: 'bg-violet-500/10 border-violet-500/20',
        amber: 'bg-amber-500/10 border-amber-500/20',
        red: 'bg-rose-500/10 border-rose-500/20',
        sky: 'bg-sky-500/10 border-sky-500/20'
    }
    const bgColorClass = bgColorMap[item.color] || 'bg-slate-500/10 border-slate-500/20'

    const iconBgMap: Record<string, string> = {
        emerald: 'bg-emerald-500/20',
        primary: 'bg-indigo-500/20',
        violet: 'bg-violet-500/20',
        amber: 'bg-amber-500/20',
        red: 'bg-rose-500/20',
        sky: 'bg-sky-500/20'
    }
    const iconBgClass = iconBgMap[item.color] || 'bg-slate-500/20'

    return (
        <TouchableOpacity 
          onPress={() => handleAction(item)}
          className="w-[48%] mb-4"
        >
          <Card variant="premium" className={`p-4 items-center justify-center min-h-[160px] ${bgColorClass}`}>
            <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 ${iconBgClass} shadow-premium-sm`}>
              {item.icon}
            </View>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm text-center">
              {item.title}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 text-center" numberOfLines={2}>
              {item.subtitle}
            </Text>
          </Card>
        </TouchableOpacity>
    )
  }

  if (!isUnlocked) {
     return <BiometricLock onRetry={handleUnlock} title="Painel de Controlo" />
  }

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Módulos de Gestão" />
      
      <View className="px-6 py-4">
        <View className="flex-row items-center bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Pesquisar ferramentas..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-20">
        {categories.map((category) => (
          <View key={category} className="mb-6">
            <View className="flex-row items-center mb-4 mt-2">
                 <View className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 items-center justify-center mr-3 shadow-sm">
                     {category.includes('Sistema') ? <Shield size={18} color="#f43f5e" /> : 
                      category.includes('Finance') ? <TrendingUp size={18} color="#8b5cf6" /> :
                      category.includes('Parceiros') ? <Users size={18} color="#10b981" /> :
                      category.includes('Dados') ? <Database size={18} color="#0ea5e9" /> :
                      <Package size={18} color="#4f46e5" />}
                 </View>
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {category}
                </Text>
            </View>
            
            <View className="flex-row flex-wrap justify-between">
              {filteredModules
                  .filter(m => m.category === category)
                  .map((item) => (
                      <ControlGridItem key={item.id} item={item} />
                  ))
              }
            </View>
          </View>
        ))}

        {filteredModules.length === 0 && (
          <View className="py-20 items-center">
            <Text className="text-slate-400 font-medium">Nenhum módulo encontrado.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}
