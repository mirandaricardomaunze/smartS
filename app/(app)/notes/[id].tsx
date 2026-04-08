import React, { useMemo } from 'react'
import { View, Text, ScrollView, useColorScheme, Share, TouchableOpacity } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useNoteDetails } from '@/features/notes/hooks/useNoteDetails'
import { useFormatter } from '@/hooks/useFormatter'
import { formatDate } from '@/utils/formatters'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Package, 
  Calendar,
  Layers,
  ClipboardList,
  Printer,
  Share2,
  User as UserIcon,
  Tag
} from 'lucide-react-native'
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated'
import { feedback } from '@/utils/haptics'
import { usersRepository } from '@/repositories/usersRepository'

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { note, items, isLoading } = useNoteDetails(id)
  
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const userName = useMemo(() => {
    if (!note) return '---'
    if (note.user_id === 'offline-user') return 'Administrador'
    const user = usersRepository.getById(note.company_id, note.user_id)
    return user?.name || note.user_id
  }, [note])

  const handleShare = async () => {
    if (!note) return
    feedback.light()
    const content = `Guia #${note.number}\nTipo: ${note.type === 'entry' ? 'Entrada' : 'Saída'}\nData: ${formatDate(note.created_at)}\nItens: ${items.length}\nGerado via SmartS`
    await Share.share({ message: content, title: `Guia #${note.number}` })
  }

  if (isLoading) return <Screen withHeader><Header title="Carregando..." showBack /><Loading fullScreen /></Screen>
  if (!note) return <Screen withHeader><Header title="Guia" showBack /><EmptyState title="Guia não encontrada" /></Screen>

  const getNoteTypeConfig = (type: string) => {
    switch (type) {
      case 'entry': return { label: 'Entrada de Stock', variant: 'success' as const, icon: <ArrowDownLeft size={24} color="white" />, bg: 'bg-emerald-500', color: '#10b981' }
      case 'exit': return { label: 'Saída de Stock', variant: 'danger' as const, icon: <ArrowUpRight size={24} color="white" />, bg: 'bg-rose-500', color: '#ef4444' }
      case 'transfer': return { label: 'Transferência', variant: 'info' as const, icon: <ArrowUpRight size={24} color="white" />, bg: 'bg-indigo-500', color: '#6366f1' }
      default: return { label: type, variant: 'neutral' as const, icon: null, bg: 'bg-slate-500', color: '#64748b' }
    }
  }

  const typeConfig = getNoteTypeConfig(note.type)

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title={`Guia #${note.number}`} showBack />
      
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-24" showsVerticalScrollIndicator={false}>
        {/* Document Header */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Card variant="premium" className="p-6 mb-6 mt-4">
            <View className="flex-row items-center mb-6">
                <View className={`w-14 h-14 rounded-2xl ${typeConfig.bg} items-center justify-center mr-4 shadow-lg shadow-${typeConfig.variant}`}>
                   {typeConfig.icon}
                </View>
                <View className="flex-1">
                   <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
                     #{note.number}
                   </Text>
                   <View className="flex-row items-center mt-1">
                      <Calendar size={12} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs font-medium ml-1">{formatDate(note.created_at)}</Text>
                   </View>
                </View>
                <Badge label={typeConfig.label} variant={typeConfig.variant} className="px-3 py-1.5" />
            </View>

            <View className="flex-row items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/20">
               <View className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-sm">
                  <UserIcon size={20} color="#6366f1" />
               </View>
               <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Responsável</Text>
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold">{userName}</Text>
               </View>
            </View>
          </Card>
        </Animated.View>

        {/* Note Items */}
        <Text style={{ fontFamily: 'Inter-Black' }} className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-3 ml-1">
          Artigos Movimentados
        </Text>
        
        <Animated.View entering={FadeInUp.delay(300)}>
          <Card variant="default" className="p-0 overflow-hidden mb-6 border-transparent bg-white dark:bg-[#0f172a] shadow-sm">
            {items.map((item: any, index: number) => (
              <View 
                key={`${item.product_id}-${index}`} 
                className={`p-4 flex-row items-center ${index !== items.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}
              >
                <View className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
                   <Package size={18} color="#94a3b8" />
                </View>
                <View className="flex-1">
                   <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-sm" numberOfLines={1}>
                     {item.name || 'Produto sem nome'}
                   </Text>
                   <View className="flex-row items-center mt-0.5">
                      <Tag size={10} color="#94a3b8" />
                      <Text className="text-slate-400 text-[10px] font-bold uppercase ml-1">Ref: {item.sku || '---'}</Text>
                   </View>
                </View>
                <View className="items-end bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                   <Text style={{ fontFamily: 'Inter-Black' }} className={`text-base font-black ${note.type === 'entry' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {note.type === 'entry' ? '+' : '-'}{item.quantity}
                   </Text>
                   <Text className="text-slate-400 text-[8px] font-bold uppercase tracking-tighter">Unid</Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Summary Statistics */}
        <Animated.View entering={FadeInUp.delay(400)} className="flex-row mb-10">
           <Card variant="glass" className="flex-1 flex-row items-center p-5 mr-4 border-indigo-100/10 h-20">
              <Layers size={22} color="#6366f1" />
              <View className="ml-3">
                 <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-3">Total Artigos</Text>
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-lg font-black text-slate-800 dark:text-white">
                    {items.length} Tipos
                 </Text>
              </View>
           </Card>
           
           <Card variant="glass" className="flex-1 flex-row items-center p-5 border-emerald-100/10 h-20">
              <FileText size={22} color={typeConfig.color} />
              <View className="ml-3">
                 <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-3">Total Unids</Text>
                 <Text style={{ fontFamily: 'Inter-Black' }} className="text-lg font-black text-slate-800 dark:text-white">
                    {items.reduce((acc, curr) => acc + curr.quantity, 0)} Unid
                 </Text>
              </View>
           </Card>
        </Animated.View>

        {/* Action Button */}
        <Animated.View entering={FadeInUp.delay(500)}>
           <Button 
            title="Exportar Documento"
            variant="secondary"
            onPress={handleShare}
            icon={<Printer size={20} color="white" />}
            className="h-14 rounded-2xl"
            textStyle={{ letterSpacing: 1, textTransform: 'uppercase' }}
           />
        </Animated.View>

      </ScrollView>
    </Screen>
  )
}
