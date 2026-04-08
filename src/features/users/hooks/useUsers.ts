import { useState, useEffect, useCallback } from 'react'
import { usersService } from '../services/usersService'
import { User } from '@/types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      const data = usersService.getAll()
      setUsers(data)
    } catch (e) {
      setError('Erro ao carregar utilizadores')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createUser = useCallback(async (data: Parameters<typeof usersService.create>[0], password?: string) => {
    try {
      setIsLoading(true)
      const user = await usersService.create(data, password)
      setUsers(prev => [...prev, user])
      return user
    } catch (e: any) {
      const message = e.message || 'Erro ao criar utilizador'
      setError(message)
      throw e
    } finally {
       setIsLoading(false)
    }
  }, [])
  
  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    try {
      usersService.update(id, data)
      load()
    } catch (e: any) {
      const message = e.message || 'Erro ao atualizar utilizador'
      setError(message)
      throw e
    }
  }, [load])
  
  const deleteUser = useCallback(async (id: string) => {
    try {
      usersService.delete(id)
      load()
    } catch (e: any) {
      const message = e.message || 'Erro ao apagar utilizador'
      setError(message)
      throw e
    }
  }, [load])

  return { users, isLoading, error, createUser, updateUser, deleteUser, reload: load }
}
