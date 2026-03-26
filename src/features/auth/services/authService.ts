import { supabase } from '@/services/supabase'
import { usersRepository } from '@/repositories/usersRepository'
import { useAuthStore } from '../store/authStore'
import { User } from '@/types'

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
       throw new Error('Credenciais inválidas')
    }

    if (!data.user) {
        throw new Error('Erro ao obter utilizador')
    }

    const { user } = data
    
    // Once authenticated via Supabase, get the rich user from SQLite
    let localUser = usersRepository.getGlobalByEmail(user.email!)
    
    if (!localUser) {
        // If it's the first user in the system, make them an admin
        const isFirstUser = usersRepository.getGlobalCount() === 0
        const metadata = user.user_metadata
        
        localUser = usersRepository.create({
            id: user.id,
            email: user.email!,
            name: metadata?.name || 'Novo Utilizador',
            role: metadata?.role || (isFirstUser ? 'admin' : 'operator'),
            company_id: null,
            logo_url: null,
            is_active: 1
        })
    }

    useAuthStore.getState().setUser(localUser)
    
    return localUser
  },
  
  async logout(): Promise<void> {
    await supabase.auth.signOut()
    useAuthStore.getState().logout()
  },
  
  async initializeSession(): Promise<void> {
     const state = useAuthStore.getState()
     state.setLoading(true)
     
     const { data } = await supabase.auth.getSession()
     if (data.session) {
         const { user } = data.session
         const localUser = usersRepository.getGlobalByEmail(user.email!)
         if (localUser) {
             const userCount = usersRepository.getGlobalCount()
             // Self-repair: If this is the only user and not an admin, promote them
             if (userCount === 1 && localUser.role !== 'admin') {
                 localUser.role = 'admin'
                 usersRepository.update(localUser.company_id || 'DEFAULT', localUser.id, { role: 'admin' })
             }
             state.setUser(localUser)
         } else {
             state.setUser(null)
         }
     } else {
         state.setUser(null)
     }
     
     state.setLoading(false)
  },

  subscribeToAuthChanges(onRecovery: () => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const localUser = usersRepository.getGlobalByEmail(session.user.email!)
        if (localUser) {
          useAuthStore.getState().setUser(localUser)
        }
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
  }
}
