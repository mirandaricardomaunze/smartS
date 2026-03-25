import { useState, useEffect, useCallback } from 'react'
import { historyService } from '../services/historyService'
import { HistoryEntry } from '@/types'

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      const data = historyService.getAll()
      setHistory(data)
    } catch (e) {
      setError('Erro ao carregar histórico')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { history, isLoading, error, reload: load }
}
