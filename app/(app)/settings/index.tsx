import { View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native'
import { useConfirmStore } from '@/store/useConfirmStore'
import React, { useState, useMemo } from 'react'
import { router } from 'expo-router'

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
  BarChart3,
  FileText,
  Bell,
  Activity,
  Fingerprint,
  Shield,
  Scale,
  Lock,
  CreditCard
} from 'lucide-react-native'
import { useBiometrics } from '@/hooks/useBiometrics'
import PickerModal from '@/components/ui/PickerModal'
import { getCurrencySymbol } from '@/utils/formatters'
import { feedback } from '@/utils/haptics'
import { COUNTRIES } from '@/config/countries'
import { usePermissions } from '@/hooks/usePermissions'
import CompanySwitcherModal from '@/features/admin/components/CompanySwitcherModal'
import { Building2 } from 'lucide-react-native'

type SettingModule = {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  route: string
  color: string
}

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] px-6 mb-4 mt-8">
    {title}
  </Text>
)

function SettingCard({ icon, title, value, onPress, rightElement, color = 'slate' }: any) {
  const bgColorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/5 border-emerald-500/10',
    primary: 'bg-primary/5 border-primary/10',
    violet: 'bg-violet-500/5 border-violet-500/10',
    amber: 'bg-amber-500/5 border-amber-500/10',
    slate: 'bg-slate-500/5 border-slate-500/10',
    red: 'bg-red-500/5 border-red-500/10',
  }
  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={() => { feedback.light(); onPress() }}
      className={`mx-6 mb-3 p-4 rounded-3xl border flex-row items-center justify-between ${bgColorMap[color] || bgColorMap.slate}`}
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

function AdminRow({ item, onPress }: { item: SettingModule; onPress: () => void }) {
  const bgColorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    primary: 'bg-primary/10 border-primary/20',
    violet: 'bg-violet-500/10 border-violet-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    slate: 'bg-slate-500/10 border-slate-500/20',
  }
  const arrowColorMap: Record<string, string> = {
    emerald: '#10b981', violet: '#8b5cf6', amber: '#f59e0b', red: '#ef4444', slate: '#64748b',
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mx-6 mb-3 p-4 rounded-3xl border flex-row items-center ${bgColorMap[item.color] || bgColorMap.slate}`}
    >
      <View className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950/50 items-center justify-center mr-4">
        {item.icon}
      </View>
      <View className="flex-1">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-800 dark:text-white font-bold text-sm">{item.title}</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5" numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <ChevronRight size={18} color={arrowColorMap[item.color] || '#64748b'} />
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {


  const { settings, toggleDarkMode, updateSettings } = useSettings()
  const { logout, user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const { isSupported, isEnrolled } = useBiometrics()
  const [langModalVisible, setLangModalVisible] = useState(false)
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false)
  const [countryModalVisible, setCountryModalVisible] = useState(false)
  const [switcherVisible, setSwitcherVisible] = useState(false)

  const handleLanguage = () => setLangModalVisible(true)
  const handleCurrency = () => setCurrencyModalVisible(true)
  const handleCountry = () => setCountryModalVisible(true)

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
        useConfirmStore.getState().show({
            title: 'Confirmar Limpeza',
            message: 'Tens a certeza que desejas apagar todo o histórico de movimentos locais? Esta ação não pode ser desfeita.',
            confirmLabel: 'Limpar TUDO',
            isDestructive: true,
            onConfirm: () => {
                feedback.success()
                router.push('/(app)/history')
            }
        })
        return
    }
    router.push(item.route as any)
  }

  return (
    <Screen padHorizontal={false} withHeader>
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
            icon={<Globe2 size={18} color="#6366f1" />}
            title="País / Tax System"
            value={COUNTRIES[settings.country_code ?? 'MZ']?.name ?? settings.country_code}
            onPress={handleCountry}
            color="primary"
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
         
         {/* Segurança */}
         {isSupported && (
           <>
             <SectionTitle title="Segurança Avançada" />
             <SettingCard 
                icon={<Fingerprint size={18} color="#10b981" />} 
                title="Autenticação Biométrica" 
                value={!isEnrolled ? 'Não configurado no dispositivo' : (settings.biometrics_enabled === 1 ? 'Ativado' : 'Desativado')}
                onPress={isEnrolled ? () => updateSettings({ biometrics_enabled: settings.biometrics_enabled === 1 ? 0 : 1 }) : undefined}
                rightElement={
                  isEnrolled ? (
                    <Switch 
                      value={settings.biometrics_enabled === 1} 
                      onValueChange={(val) => updateSettings({ biometrics_enabled: val ? 1 : 0 })} 
                      trackColor={{ false: '#e2e8f0', true: '#10b981' }} 
                    />
                  ) : <Shield size={16} color="#94a3b8" />
                }
                color="emerald"
             />
           </>
         )}

         {/* Ferramentas de Dados */}
         <SectionTitle title="Backup e Ferramentas" />
         {adminModules.filter(m => ['sync', 'backup', 'excel', 'pdf'].includes(m.id)).map(item => (
            <AdminRow key={item.id} item={item} onPress={() => handleAction(item)} />
         ))}

         {/* Manutenção */}
         <SectionTitle title="Sistema e Auditoria" />
         {adminModules.filter(m => ['history', 'clean'].includes(m.id)).map(item => (
            <AdminRow key={item.id} item={item} onPress={() => handleAction(item)} />
          ))}

         {/* Subscrição — visível para todos, gestão só para admin */}
         <SectionTitle title="Plano e Subscrição" />
         <SettingCard
           icon={<CreditCard size={18} color="#6366f1" />}
           title="Plano e Subscrição"
           value="Ver plano actual, upgrade e facturação"
           onPress={() => router.push('/(app)/choose-plan')}
           color="primary"
         />

         {isSuperAdmin && (
           <>
             <SectionTitle title="Acesso Super Admin" />
             <SettingCard
               icon={<Shield size={18} color="#f43f5e" />}
               title="Gestão de Subscrições"
               value="Ativar utilizadores e gerir planos globais"
               onPress={() => router.push('/(app)/admin/subscriptions')}
               color="red"
             />
             <SettingCard
               icon={<Building2 size={18} color="#f43f5e" />}
               title="Alternar Empresa"
               value="Mudar contexto de dados do sistema"
               onPress={() => setSwitcherVisible(true)}
               color="red"
             />
           </>
         )}

         {/* Legal */}
         <SectionTitle title="Jurídico" />
         <SettingCard 
            icon={<Lock size={18} color="#64748b" />} 
            title="Política de Privacidade" 
            onPress={() => router.push('/(app)/settings/privacy')}
            color="slate"
         />
         <SettingCard 
            icon={<Scale size={18} color="#64748b" />} 
            title="Termos e Copyright" 
            onPress={() => router.push('/(app)/settings/terms')}
            color="slate"
         />

         <View className="px-6 mt-12">
           <TouchableOpacity
             onPress={() => {
               useConfirmStore.getState().show({
                 title: 'Terminar Sessão',
                 message: 'Tens a certeza que desejas sair da aplicação?',
                 confirmLabel: 'Sair Agora',
                 isDestructive: true,
                 onConfirm: logout
               })
             }}
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
          { label: 'Metical (MZN)', value: 'MZN' },
          { label: 'Kwanza (AOA)', value: 'AOA' },
          { label: 'Rand (ZAR)', value: 'ZAR' },
        ]}
      />

      <PickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        title="País / Tax System"
        selectedValue={settings.country_code ?? 'MZ'}
        onSelect={(value) => {
          const country = COUNTRIES[value]
          updateSettings({ country_code: value, currency: country?.currency ?? settings.currency })
        }}
        options={Object.values(COUNTRIES).map(c => ({ label: `${c.flag} ${c.name}`, value: c.code }))}
      />

      <CompanySwitcherModal 
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
    </Screen>
  )
}
