import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import React, { useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useAuth } from '@/features/auth/hooks/useAuth'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import { 
  LogOut, 
  Moon, 
  DollarSign, 
  Globe2, 
  ChevronRight, 
  User, 
  RefreshCw, 
  Database,
  History,
  Download,
  Upload,
  BarChart3,
  FileText,
  Bell,
  Activity
} from 'lucide-react-native'
import PickerModal from '@/components/ui/PickerModal'
import { getCurrencySymbol } from '@/utils/formatters'
import { feedback } from '@/utils/haptics'

type SettingModule = {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  route: string
  color: string
}

export default function SettingsScreen() {
  const router = useRouter()
  const { settings, toggleDarkMode, updateSettings } = useSettings()
  const { logout, user } = useAuth()
  const [langModalVisible, setLangModalVisible] = useState(false)
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false)

  const handleLanguage = () => setLangModalVisible(true)
  const handleCurrency = () => setCurrencyModalVisible(true)

  const adminModules: SettingModule[] = useMemo(() => [
    {
      id: 'sync',
      title: 'Sincronização Nuvem',
      subtitle: 'Estado da rede e backups online',
      icon: <RefreshCw size={20} color="#64748b" />,
      route: '/(app)/sync',
      color: 'slate'
    },
    {
      id: 'backup',
      title: 'Backup (JSON)',
      subtitle: 'Exportar/Importar base de dados',
      icon: <Database size={20} color="#10b981" />,
      route: '/(app)/backup',
      color: 'emerald'
    },
    {
      id: 'excel',
      title: 'Exportar Excel',
      subtitle: 'Tabelas dinâmicas para PC',
      icon: <BarChart3 size={20} color="#10b981" />,
      route: '/(app)/reports',
      color: 'emerald'
    },
    {
      id: 'pdf',
      title: 'Relatórios PDF',
      subtitle: 'Gerar resumos para partilha',
      icon: <FileText size={20} color="#8b5cf6" />,
      route: '/(app)/reports',
      color: 'violet'
    },
    {
      id: 'history',
      title: 'Log de Auditoria',
      subtitle: 'Rastreador completo do sistema',
      icon: <History size={20} color="#f59e0b" />,
      route: '/(app)/history',
      color: 'amber'
    },
    {
      id: 'clean',
      title: 'Limpar Histórico',
      subtitle: 'Cuidado: apaga registos locais',
      icon: <Activity size={20} color="#ef4444" />,
      route: 'ACTION_CLEAN',
      color: 'red'
    }
  ], [])

  const handleAction = (item: SettingModule) => {
    feedback.light()
    if (item.id === 'clean') {
        Alert.alert(
            'Confirmar Limpeza',
            'Tens a certeza que desejas apagar todo o histórico de movimentos locais? Esta ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Limpar TUDO', style: 'destructive', onPress: () => {
                        feedback.success()
                        router.push('/(app)/history')
                    }}
            ]
        )
        return
    }
    router.push(item.route as any)
  }

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] px-6 mb-4 mt-8">
      {title}
    </Text>
  )

  const SettingCard = ({ icon, title, value, onPress, rightElement, color = 'slate' }: any) => {
    const bgColorMap: Record<string, string> = {
        emerald: 'bg-emerald-500/5 border-emerald-500/10',
        primary: 'bg-primary/5 border-primary/10',
        violet: 'bg-violet-500/5 border-violet-500/10',
        amber: 'bg-amber-500/5 border-amber-500/10',
        slate: 'bg-slate-500/5 border-slate-500/10',
        red: 'bg-red-500/5 border-red-500/10'
    }
    const bgColorClass = bgColorMap[color] || bgColorMap.slate

    return (
        <TouchableOpacity 
          disabled={!onPress}
          onPress={() => {
              feedback.light()
              onPress()
          }}
          className={`mx-6 mb-3 p-4 rounded-3xl border flex-row items-center justify-between ${bgColorClass}`}
        >
           <View className="flex-row items-center flex-1">
              <View className="mr-4 w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center justify-center">
                {icon}
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-sm font-bold text-slate-800 dark:text-white">{title}</Text>
                {value && <Text className="text-[10px] text-slate-500 mt-0.5">{value}</Text>}
              </View>
           </View>
           {rightElement ? rightElement : <ChevronRight size={16} color="#94a3b8" />}
        </TouchableOpacity>
    )
  }

  const AdminRow = ({ item }: { item: SettingModule }) => {
    const bgColorMap: Record<string, string> = {
        emerald: 'bg-emerald-500/10 border-emerald-500/20',
        primary: 'bg-primary/10 border-primary/20',
        violet: 'bg-violet-500/10 border-violet-500/20',
        amber: 'bg-amber-500/10 border-amber-500/20',
        red: 'bg-red-500/10 border-red-500/20',
        slate: 'bg-slate-500/10 border-slate-500/20'
    }
    const arrowColorMap: Record<string, string> = {
        emerald: '#10b981',
        violet: '#8b5cf6',
        amber: '#f59e0b',
        red: '#ef4444',
        slate: '#64748b'
    }

    return (
        <TouchableOpacity 
          onPress={() => handleAction(item)}
          className={`mx-6 mb-3 p-4 rounded-3xl border flex-row items-center ${bgColorMap[item.color] || bgColorMap.slate}`}
        >
          <View className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950/50 items-center justify-center mr-4">
            {item.icon}
          </View>
          <View className="flex-1">
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-800 dark:text-white font-bold text-sm">
              {item.title}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5" numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
          <ChevronRight size={18} color={arrowColorMap[item.color] || '#64748b'} />
        </TouchableOpacity>
    )
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1" withHeader>
      <Header title="Definições do Sistema" />
      
      <ScrollView className="flex-1" contentContainerClassName="pb-24">
         {/* Perfil e Preferências */}
         <SectionTitle title="Conta e Preferências" />
         <SettingCard 
            icon={<User size={18} color="#6366f1" />} 
            title="O Meu Perfil" 
            value={user?.name || 'Gestor'}
            onPress={() => router.push('/(app)/profile')}
            color="primary"
         />
         <SettingCard 
            icon={<Moon size={18} color="#f59e0b" />} 
            title="Modo Escuro" 
            value={settings.dark_mode === 1 ? 'Ativado' : 'Desativado'}
            onPress={toggleDarkMode}
            rightElement={<Switch value={settings.dark_mode === 1} onValueChange={toggleDarkMode} trackColor={{ false: '#e2e8f0', true: '#4f46e5' }} />}
            color="amber"
         />
         <SettingCard 
            icon={<Globe2 size={18} color="#4f46e5" />} 
            title="Idioma" 
            value={settings.language === 'pt' ? 'Português' : 'Inglês'}
            onPress={handleLanguage}
            color="primary"
         />
         <SettingCard 
            icon={<DollarSign size={18} color="#10b981" />} 
            title="Moeda de Exibição" 
            value={`${settings.currency} (${getCurrencySymbol(settings.currency)})`}
            onPress={handleCurrency}
            color="emerald"
         />
         <SettingCard 
            icon={<Bell size={18} color="#8b5cf6" />} 
            title="Notificações" 
            onPress={() => router.push('/(app)/notifications')}
            color="violet"
         />
         <SettingCard 
            icon={<FileText size={18} color="#6366f1" />} 
            title="Incluir IVA nas Vendas" 
            value={settings.include_tax === 1 ? 'Ativado' : 'Desativado'}
            onPress={() => updateSettings({ include_tax: settings.include_tax === 1 ? 0 : 1 })}
            rightElement={<Switch value={settings.include_tax === 1} onValueChange={(val) => updateSettings({ include_tax: val ? 1 : 0 })} trackColor={{ false: '#e2e8f0', true: '#4f46e5' }} />}
            color="primary"
         />

         {/* Ferramentas de Dados */}
         <SectionTitle title="Backup e Ferramentas" />
         {adminModules.filter(m => ['sync', 'backup', 'excel', 'pdf'].includes(m.id)).map(item => (
            <AdminRow key={item.id} item={item} />
         ))}

         {/* Manutenção */}
         <SectionTitle title="Sistema e Auditoria" />
         {adminModules.filter(m => ['history', 'clean'].includes(m.id)).map(item => (
            <AdminRow key={item.id} item={item} />
         ))}

         <View className="px-6 mt-12">
           <TouchableOpacity
             onPress={logout}
             className="w-full h-16 bg-red-500/10 border border-red-500/20 rounded-[24px] items-center justify-center flex-row"
           >
              <LogOut size={20} color="#ef4444" className="mr-3" />
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-red-500 font-bold text-base">Terminar Sessão</Text>
           </TouchableOpacity>
           
           <Text className="text-center text-slate-500 text-[10px] mt-6 tracking-widest uppercase opacity-50">
              SmartS Versão 2.4.0 • 2026
           </Text>
         </View>
      </ScrollView>

      <PickerModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
        title="Idioma"
        selectedValue={settings.language}
        onSelect={(value) => updateSettings({ language: value as any })}
        options={[
          { label: 'Português', value: 'pt' },
          { label: 'English', value: 'en' },
        ]}
      />

      <PickerModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
        title="Moeda"
        selectedValue={settings.currency}
        onSelect={(value) => updateSettings({ currency: value })}
        options={[
          { label: 'Euro (€)', value: 'EUR' },
          { label: 'Dólar (USD$)', value: 'USD' },
          { label: 'Real (BRL R$)', value: 'BRL' },
          { label: 'Metical (Mz)', value: 'MZN' },
          { label: 'Kwanza (AOA)', value: 'AOA' },
        ]}
      />
    </Screen>
  )
}
