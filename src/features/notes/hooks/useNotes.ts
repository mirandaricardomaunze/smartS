import { useState, useEffect, useCallback } from 'react'
import { notesService } from '../services/notesService'
import { Note } from '@/types'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      const data = notesService.getAll()
      setNotes(data)
    } catch (e) {
      setError('Erro ao carregar notas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createNote = useCallback(async (data: Parameters<typeof notesService.create>[0]) => {
    try {
      const note = notesService.create(data)
      setNotes(prev => [note, ...prev])
      return note
    } catch (e: any) {
      const message = e.message || 'Erro ao criar nota'
      setError(message)
      throw e
    }
  }, [])

  return { notes, isLoading, error, createNote, reload: load }
}
