import { useState, useEffect, useCallback } from 'react'
import { notesService } from '../services/notesService'
import { Note, CreateNoteData } from '@/types'
import { logger } from '@/utils/logger'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      setNotes(notesService.getAll())
    } catch (e) {
      logger.error('[useNotes] load:', e)
      setError(e instanceof Error ? e.message : 'Erro ao carregar notas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // load has stable identity (empty deps) so this only runs once on mount
  useEffect(() => { load() }, [load])

  const createNote = useCallback(async (data: CreateNoteData & { number: string }) => {
    try {
      const note = notesService.create(data)
      setNotes(prev => [note, ...prev])
      return note
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao criar nota'
      logger.error('[useNotes] createNote:', e)
      setError(message)
      throw e
    }
  }, [])

  return { notes, isLoading, error, createNote, reload: load }
}
