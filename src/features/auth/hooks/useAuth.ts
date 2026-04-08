import { useState, useCallback, useRef, useEffect } from 'react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { User } from '@/types'

export function useAuth() {
  const { user, isLoading: isStoreLoading } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const login = useCallback(async (email: string, pass: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.login(email, pass)
    } catch (e: any) {
      if (isMounted.current) setError(e.message || 'Erro ao efetuar login')
      throw e
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      await authService.logout()
    } catch (e: any) {
      console.error(e)
    } finally {
      if (isMounted.current) setIsLoading(false)
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
      if (isMounted.current) setError(e.message || 'Erro ao atualizar perfil')
      throw e
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [user])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.forgotPassword(email)
    } catch (e: any) {
      if (isMounted.current) setError(e.message || 'Erro ao solicitar recuperação')
      throw e
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.updatePassword(password)
    } catch (e: any) {
      if (isMounted.current) setError(e.message || 'Erro ao atualizar palavra-passe')
      throw e
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [])

  const updateEmail = useCallback(async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.updateEmail(email)
    } catch (e: any) {
      if (isMounted.current) setError(e.message || 'Erro ao atualizar e-mail')
      throw e
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      return await authService.loginWithGoogle()
    } catch (e: any) {
      if (isMounted.current) setError(e.message || 'Erro ao efetuar login com Google')
      throw e
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }, [])

  return { user, isStoreLoading, isLoading, error, login, loginWithGoogle, logout, updateProfile, forgotPassword, resetPassword, updateEmail }
}
