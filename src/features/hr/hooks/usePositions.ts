import { positionsService } from '../services/positionsService'
import { Position } from '../types'
import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'

export function usePositions() {
  const { user } = useAuthStore()
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPositions = useCallback(async () => {
    if (!user?.company_id) return
    try {
      setIsLoading(true)
      const data = positionsService.getAll(user.company_id)
      setPositions(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id])

  useEffect(() => {
    loadPositions()
  }, [loadPositions])

  const createPosition = async (data: Omit<Position, 'id' | 'created_at' | 'updated_at' | 'synced' | 'company_id' | 'department'>) => {
    if (!user?.company_id) return
    try {
      const newPos = positionsService.create(user.company_id, data)
      setPositions(prev => [newPos, ...prev])
      return newPos
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const updatePosition = async (id: string, data: Partial<Position>) => {
    if (!user?.company_id) return
    try {
      positionsService.update(user.company_id, id, data)
      setPositions(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  const deletePosition = async (id: string) => {
    if (!user?.company_id) return
    try {
      positionsService.delete(user.company_id, id)
      setPositions(prev => prev.filter(p => p.id !== id))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }

  return { positions, isLoading, error, loadPositions, createPosition, updatePosition, deletePosition }
}
