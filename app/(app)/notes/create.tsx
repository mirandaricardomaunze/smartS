import React, { useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import { useRouter } from 'expo-router'
import { useNotes } from '@/features/notes/hooks/useNotes'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import FormField from '@/components/forms/FormField'
import Card from '@/components/ui/Card'
import { NoteItem } from '@/types'
import { useProducts } from '@/features/products/hooks/useProducts'

export default function CreateNoteScreen() {
  const router = useRouter()
  const { createNote } = useNotes()
  const { products } = useProducts()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    number: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'exit'
  })
  
  // Real implementation would have a UI to add items one by one. Let's make it quick.
  const [items, setItems] = useState<NoteItem[]>([])

  const addItemPlaceholder = () => {
      // Just adds the first available product with qty 1 for demonstration if simple
      if (products.length > 0) {
          setItems(prev => [...prev, { product_id: products[0].id, quantity: 1 }])
      } else {
          useToastStore.getState().show('Precisa de produtos registados.', 'warning')
      }
  }

  const handleCreate = async () => {
    if (items.length === 0) {
        useToastStore.getState().show('A nota tem de ter pelo menos um item.', 'warning')
        return
    }

    try {
      setIsSubmitting(true)
      await createNote({
        number: formData.number,
        type: formData.type as any,
        items
      })
      useToastStore.getState().show('Nota criada com sucesso!', 'success')
      router.back()
    } catch (e: any) {
      useToastStore.getState().show(e.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900">
      <Header title="Criar Nota" showBack />
      
      <Screen scrollable>
        <Card className="mb-4">
           <FormField label="Número da Nota" value={formData.number} editable={false} />
           <FormField 
              label="Tipo (entry | exit | transfer)" 
              value={formData.type} 
              onChangeText={v => setFormData(prev => ({...prev, type: v}))}
           />
        </Card>

        <View className="flex-row justify-between items-center mb-4">
           <Text className="text-lg font-bold text-slate-800 dark:text-white">Itens</Text>
           <Button title="Adicionar" variant="ghost" onPress={addItemPlaceholder} />
        </View>

        {items.map((item, idx) => (
            <Card key={idx} className="mb-2 bg-slate-100 dark:bg-slate-800 border-0 p-3 flex-row justify-between">
                <Text className="text-slate-800 dark:text-white font-medium">Produto Exemplo</Text>
                <Text className="text-slate-500 font-bold">Qtd: {item.quantity}</Text>
            </Card>
        ))}

        <Button title="Gerar Documento e Guardar" onPress={handleCreate} isLoading={isSubmitting} className="mt-6" />
      </Screen>
    </Screen>
  )
}
