import { useState, useEffect, useCallback } from 'react'
import { historyService } from '../services/historyService'
import { HistoryEntry } from '@/types'

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 50

  const load = useCallback((isInitial = true) => {
    try {
      setIsLoading(true)
      setError(null)
      const currentOffset = isInitial ? 0 : page * PAGE_SIZE
      const data = historyService.getAll(PAGE_SIZE, currentOffset)
      
      if (isInitial) {
        setHistory(data)
        setPage(1)
      } else {
        setHistory(prev => [...prev, ...data])
        setPage(prev => prev + 1)
      }
      
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      setError('Erro ao carregar histórico')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      load(false)
    }
  }, [isLoading, hasMore, load])

  useEffect(() => { load() }, [load])

  return { history, isLoading, error, reload: load, loadMore, hasMore }
}
