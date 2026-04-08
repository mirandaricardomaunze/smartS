import { useState, useEffect } from 'react'
import { notesService } from '@/features/notes/services/notesService'
import { Note, NoteItem, Product } from '@/types'
import { useSyncStore } from '@/features/sync/store/syncStore'
import { productsRepository } from '@/repositories/productsRepository'

export function useNoteDetails(noteId: string | string[] | undefined) {
  const [note, setNote] = useState<Note | null>(null)
  const [items, setItems] = useState<NoteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const lastUpdate = useSyncStore(state => state.lastUpdate)

  const loadData = () => {
    if (!noteId || typeof noteId !== 'string') {
        setIsLoading(false)
        return
    }
    
    setIsLoading(true)
    try {
        const noteData = notesService.getById(noteId)
      if (noteData) {
        setNote(noteData)
        // Note items are stored as JSON string in SQLite
        const parsedItems: NoteItem[] = typeof noteData.items === 'string' 
          ? JSON.parse(noteData.items) 
          : noteData.items
        
        // Fetch product names/SKUs
        const productIds = parsedItems.map(i => i.product_id)
        const products = productsRepository.getByIds(noteData.company_id, productIds)
        
        const itemsWithDetails = parsedItems.map(item => {
          const product = products.find((p: Product) => p.id === item.product_id)
          return {
            ...item,
            name: product?.name || 'Produto Independente',
            sku: product?.sku || '---'
          }
        })

        setItems(itemsWithDetails as any)
      }
    } catch (e) {
      console.error('Error loading note details:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [noteId])

  useEffect(() => {
    if (lastUpdate > 0) {
        loadData()
    }
  }, [lastUpdate])

  return { note, items, isLoading, refresh: loadData }
}
