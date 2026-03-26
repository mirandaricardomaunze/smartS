import { useState, useCallback } from 'react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { User } from '@/types'

export function useAuth() {
  const { user, isLoading: isStoreLoading } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, pass: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.login(email, pass)
    } catch (e: any) {
      setError(e.message || 'Erro ao efetuar login')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      await authService.logout()
    } catch (e: any) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return
    try {
      setIsLoading(true)
      const { usersService } = require('@/features/users/services/usersService')
      await usersService.update(user.id, data)
      useAuthStore.getState().setUser({ ...user, ...data })
    } catch (e: any) {
      setError(e.message || 'Erro ao atualizar perfil')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.forgotPassword(email)
    } catch (e: any) {
      setError(e.message || 'Erro ao solicitar recuperação')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.updatePassword(password)
    } catch (e: any) {
      setError(e.message || 'Erro ao atualizar palavra-passe')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateEmail = useCallback(async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.updateEmail(email)
    } catch (e: any) {
      setError(e.message || 'Erro ao atualizar e-mail')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { user, isStoreLoading, isLoading, error, login, logout, updateProfile, forgotPassword, resetPassword, updateEmail }
}
