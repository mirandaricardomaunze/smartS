import { supabase } from '@/services/supabase'
import { usersRepository } from '@/repositories/usersRepository'
import { syncData } from '@/utils/syncData'
import { useAuthStore } from '../store/authStore'
import { User } from '@/types'
import { logger } from '@/utils/logger'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'

WebBrowser.maybeCompleteAuthSession()

/**
 * Resolves the role for a new local user.
 * Role is NEVER taken from JWT metadata — it is always assigned
 * server-side or defaulted here. This prevents privilege escalation
 * via manipulated user_metadata.
 */
function resolveNewUserRole(email: string, isFirstUser: boolean): User['role'] {
  if (email.toLowerCase() === 'mirandaricardomaunze@gmail.com') return 'super_admin'
  return isFirstUser ? 'admin' : 'operator'
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) throw new Error('Credenciais inválidas')
    if (!data.user) throw new Error('Erro ao obter utilizador')

    const { user } = data

    let localUser = usersRepository.getGlobalByEmail(user.email!)

    if (!localUser) {
      const isFirstUser = usersRepository.getGlobalCount() === 0
      const metadata = user.user_metadata

      localUser = usersRepository.create({
        id: user.id,
        email: user.email!,
        name: metadata?.name || 'Novo Utilizador',
        role: resolveNewUserRole(user.email!, isFirstUser),
        company_id: metadata?.company_id || null,
        logo_url: null,
        is_active: 1,
      })
    }

    useAuthStore.getState().setUser(localUser)
    return localUser
  },

  async loginWithGoogle(): Promise<User | null> {
    const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'smarts' })

    logger.debug('🔗 [SUPABASE] Redirect URI:', redirectUrl)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    })

    if (error) throw error

    const res = await WebBrowser.openAuthSessionAsync(data.url!, redirectUrl)

    if (res.type === 'success') {
      await this.handleDeepLink(res.url)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      let localUser = usersRepository.getGlobalByEmail(user.email!)
      if (!localUser) {
        const isFirstUser = usersRepository.getGlobalCount() === 0
        const metadata = user.user_metadata

        localUser = usersRepository.create({
          id: user.id,
          email: user.email!,
          name: metadata?.full_name || metadata?.name || 'Novo Utilizador',
          role: resolveNewUserRole(user.email!, isFirstUser),
          company_id: metadata?.company_id || null,
          logo_url: metadata?.avatar_url || null,
          is_active: 1,
        })
      }

      useAuthStore.getState().setUser(localUser)
      return localUser
    }

    return null
  },

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      logger.warn('[auth] Erro ao sincronizar logout com Supabase (sessão local será limpa):', e)
    } finally {
      // Always clear local store, trigger redirect from AppNavigationGuard
      useAuthStore.getState().logout()
    }
  },

  async initializeSession(): Promise<void> {
    const state = useAuthStore.getState()
    state.setLoading(true)

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        logger.error('[auth] Erro ao obter sessão:', error.message)
        state.setUser(null)
        return
      }

      if (data.session) {
        const { user } = data.session
        const localUser = usersRepository.getGlobalByEmail(user.email!)

        if (localUser) {
          const metadata = user.user_metadata

          // Sync company_id from metadata only if missing locally
          if (!localUser.company_id && metadata?.company_id) {
            localUser.company_id = metadata.company_id
            usersRepository.update(metadata.company_id as string, localUser.id, {
              company_id: metadata.company_id,
            })
          }

          // Self-repair: promote to admin only when the company has no admin at all
          if (
            localUser.is_active === 1 &&
            localUser.role !== 'admin' &&
            localUser.role !== 'super_admin' &&
            localUser.company_id &&
            usersRepository.getAll(localUser.company_id).every(u => u.role !== 'admin')
          ) {
            logger.warn(`[auth] Self-repair: promoting user ${localUser.id} to admin (no admin found in company)`)
            localUser.role = 'admin'
            usersRepository.update(localUser.company_id, localUser.id, { role: 'admin' })
          }

          if (localUser.email.toLowerCase() === 'mirandaricardomaunze@gmail.com' && localUser.role !== 'super_admin') {
            logger.info(`[auth] Promoting owner to super_admin: ${localUser.id}`)
            localUser.role = 'super_admin'
            usersRepository.updateGlobal(localUser.id, { role: 'super_admin' })
            syncData().catch(e => logger.error('[auth] Global promo sync failed:', e))
          }

          state.setUser(localUser)
        } else {
          state.setUser(null)
        }
      } else {
        state.setUser(null)
      }
    } catch (e) {
      logger.error('[auth] Falha crítica ao inicializar sessão:', e)
      state.setUser(null)
    } finally {
      state.setLoading(false)
    }
  },

  subscribeToAuthChanges(onRecovery: () => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const localUser = usersRepository.getGlobalByEmail(session.user.email!)
        if (localUser) useAuthStore.getState().setUser(localUser)
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().logout()
      } else if (event === 'PASSWORD_RECOVERY') {
        onRecovery()
      }
    })
    return () => subscription.unsubscribe()
  },

  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'smarts://reset-password',
    })
    if (error) throw error
  },

  async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },

  async updateEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw error
  },

  async handleDeepLink(url: string): Promise<void> {
    if (!url) return

    // Supabase auth tokens are in the URL fragment (#)
    const hash = url.split('#')[1]
    if (!hash) return

    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      if (error) logger.error('[auth] Falha ao definir sessão via deep link:', error.message)
    }
  },
}
