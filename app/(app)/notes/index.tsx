import React, { useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useNotes } from '@/features/notes/hooks/useNotes'
import { formatShortDate } from '@/utils/formatters'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { Plus, FileText, ChevronRight, FileCheck, FileSignature, FileInput } from 'lucide-react-native'
import Badge from '@/components/ui/Badge'
import NoteFormModal from '@/features/notes/components/NoteFormModal'
import { useState } from 'react'
import { feedback } from '@/utils/haptics'

export default function NotesListScreen() {
  const router = useRouter()
  const [modalVisible, setModalVisible] = useState(false)
  const { notes, isLoading, createNote } = useNotes()

  const renderItem = ({ item }: { item: any }) => {
    let typeLabel = 'Transferência'
    let variant: 'success' | 'warning' | 'danger' | 'info' = 'info'
    let Icon = FileSignature

    if (item.type === 'entry') { 
      typeLabel = 'Nota de Entrada'
      variant = 'success'
      Icon = FileCheck
    }
    if (item.type === 'exit') { 
      typeLabel = 'Nota de Saída'
      variant = 'danger'
      Icon = FileInput
    }

    return (
      <TouchableOpacity onPress={() => {}} className="mb-4">
        <Card variant="premium" className="p-5 flex-row items-center">
          <View className={`w-16 h-16 rounded-2xl items-center justify-center mr-4 ${item.type === 'entry' ? 'bg-emerald-500/10 border border-emerald-500/20' : item.type === 'exit' ? 'bg-red-500/10 border border-red-500/20' : 'bg-primary/10 border border-primary/20'}`}>
             <Icon size={28} color={item.type === 'entry' ? "#10b981" : item.type === 'exit' ? "#ef4444" : "#4f46e5"} />
          </View>
          
          <View className="flex-1">
            <View className="flex-row justify-between items-start mb-2">
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white">
                #{item.number}
              </Text>
              <Badge label={typeLabel} variant={variant} className="px-2" />
            </View>
            <View className="flex-row items-center">
               <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[1px]">
                  {formatShortDate(item.created_at)}
               </Text>
               <View className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10 mx-3" />
               <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[1px]">
                  {item.items_count || 0} Itens
               </Text>
            </View>
          </View>
          
          <View className="w-8 h-8 rounded-full items-center justify-center bg-slate-50 dark:bg-white/5 ml-2">
            <ChevronRight size={16} color="#94a3b8" />
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900" withHeader>
      <Header 
        title="Notas e Guias" 
        rightElement={
          <TouchableOpacity 
            onPress={() => {
              feedback.light()
              setModalVisible(true)
            }}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 active:bg-white/20"
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
         <Loading fullScreen message="A carregar documentos..." />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="px-6 pt-6 pb-20"
          ListEmptyComponent={
            <EmptyState 
              title="Sem Notas"
              description="Não foram criadas notas de entrada ou de saída ainda."
              actionLabel="Criar Nota"
              onAction={() => {
                feedback.light()
                setModalVisible(true)
              }}
            />
          }
        />
      )}

      <NoteFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data) => {
          await createNote(data)
        }}
      />
    </Screen>
  )
}
