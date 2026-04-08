import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import IconButton from '@/components/ui/IconButton';
import { 
  ChevronLeft, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Users, 
  PieChart as PieIcon, 
  Settings, 
  History, 
  Briefcase,
  Tag,
  Truck,
  QrCode,
  LayoutGrid,
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react-native';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/utils/permissions';

const MODULE_GROUPS: { title: string, description: string, items: Array<{ id: string, label: string, icon: any, route: string, bg: string, permission?: Permission }> }[] = [
  {
    title: 'Operacional & Vendas',
    description: 'Ferramentas do dia-a-dia para o balcão',
    items: [
      { id: 'pos', label: 'Venda PDV', icon: <ShoppingCart size={24} color="#10b981" />, route: '/(app)/pos', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
      { id: 'customers', label: 'Clientes', icon: <Users size={24} color="#0ea5e9" />, route: '/(app)/customers', bg: 'bg-sky-50 dark:bg-sky-500/10' },
      { id: 'scanner', label: 'Scanner', icon: <QrCode size={24} color="#6366f1" />, route: '/(app)/scanner', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    ]
  },
  {
    title: 'Stock & Logística',
    description: 'Gestão de produtos e movimentações',
    items: [
      { id: 'inventory', label: 'Inventário', icon: <Package size={24} color="#6366f1" />, route: '/(app)/products', bg: 'bg-indigo-50 dark:bg-indigo-500/10', permission: 'create_products' },
      { id: 'categories', label: 'Categorias', icon: <Tag size={24} color="#ec4899" />, route: '/(app)/categories', bg: 'bg-pink-50 dark:bg-pink-500/10', permission: 'create_products' },
      { id: 'suppliers', label: 'Fornecedores', icon: <Truck size={24} color="#8b5cf6" />, route: '/(app)/suppliers', bg: 'bg-purple-50 dark:bg-purple-500/10', permission: 'create_products' },
      { id: 'movements', label: 'Movimentos', icon: <History size={24} color="#64748b" />, route: '/(app)/movements', bg: 'bg-slate-50 dark:bg-slate-500/10', permission: 'manage_movements' },
    ]
  },
  {
    title: 'Gestão & Equipa',
    description: 'Controlo administrativo e relatórios',
    items: [
      { id: 'finance', label: 'Finanças', icon: <Wallet size={24} color="#f59e0b" />, route: '/(app)/finance', bg: 'bg-amber-50 dark:bg-amber-500/10', permission: 'view_reports' },
      { id: 'hr', label: 'Equipa / RH', icon: <Briefcase size={24} color="#f97316" />, route: '/(app)/hr', bg: 'bg-orange-50 dark:bg-orange-500/10', permission: 'view_reports' },
      { id: 'reports', label: 'Relatórios', icon: <PieIcon size={24} color="#a855f7" />, route: '/(app)/reports', bg: 'bg-purple-50 dark:bg-purple-500/10', permission: 'view_reports' },
    ]
  },
  {
    title: 'Configurações',
    description: 'Personalização do sistema',
    items: [
      { id: 'settings', label: 'Definições', icon: <Settings size={24} color="#64748b" />, route: '/(app)/settings', bg: 'bg-slate-50 dark:bg-slate-500/10' },
      { id: 'audit', label: 'Auditoria', icon: <ShieldCheck size={24} color="#64748b" />, route: '/(app)/history', bg: 'bg-slate-50 dark:bg-slate-500/10', permission: 'view_history' },
      { id: 'users', label: 'Utilizadores', icon: <Users size={24} color="#ef4444" />, route: '/(app)/users', bg: 'bg-rose-50 dark:bg-rose-500/10', permission: 'manage_users' },
    ]
  }
];

export default function ModulesScreen() {


  const { can } = usePermissions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
      <Header 
        title="Módulos" 
        rightElement={
          <IconButton 
            icon={LayoutGrid} 
            onPress={() => {}} // Simple visual element for now as per previous design
          />
        }
      />

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {MODULE_GROUPS.map((group, groupIdx) => {
          const visibleItems = group.items.filter(item => !item.permission || can(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <View key={groupIdx} className="mt-8 px-6">
              <View className="mb-4">
                <Text style={{ fontFamily: "Inter-Bold" }} className="text-lg text-slate-800 dark:text-white">{group.title}</Text>
                <Text className="text-slate-400 text-xs">{group.description}</Text>
              </View>

              <View className="flex-row flex-wrap -mx-2">
                {visibleItems.map((item) => (
                  <View key={item.id} className="w-1/2 p-2">
                    <TouchableOpacity 
                      onPress={() => router.push(item.route as any)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-premium-sm items-center justify-center h-36"
                    >
                      <View className={`w-14 h-14 rounded-2xl ${item.bg} items-center justify-center mb-3`}>
                        {item.icon}
                      </View>
                      <Text className="text-[13px] font-bold text-slate-800 dark:text-slate-200 text-center px-1" numberOfLines={2}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Promo Banner */}
        <View className="mx-6 mt-12 p-8 bg-indigo-600 rounded-[40px] shadow-premium-lg overflow-hidden relative">
            <View className="flex-1 pr-12">
                <Text style={{ fontFamily: "Inter-Black" }} className="text-white text-2xl mb-2">SmartS Pro</Text>
                <Text className="text-indigo-100 text-sm leading-5">Liberte todo o potencial do seu negócio com ferramentas avançadas de gestão e inteligência.</Text>
                <Button 
                    title="Saber Mais"
                    variant="ghost"
                    fullWidth={false}
                    onPress={() => router.push('/choose-plan')}
                    className="bg-white mt-6 px-8 rounded-full h-14"
                    textStyle={{ color: '#4f46e5', fontSize: 12, fontWeight: 'bold' }}
                />
            </View>
            <View pointerEvents="none" className="absolute -right-10 -bottom-10 opacity-20">
                <ShieldCheck size={180} color="white" />
            </View>
        </View>
      </ScrollView>
    </View>
  );
}
