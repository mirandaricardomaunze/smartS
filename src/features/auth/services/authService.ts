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
    let localUser = usersRepository.getByEmail(user.email!)
    
    if (!localUser) {
        // If it's the first user in the system, make them an admin
        const isFirstUser = usersRepository.getAll().length === 0
        const metadata = user.user_metadata
        
        localUser = usersRepository.create({
            id: user.id,
            email: user.email!,
            name: metadata?.name || 'Novo Utilizador',
            role: metadata?.role || (isFirstUser ? 'admin' : 'operator'),
            company: null,
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
         const localUser = usersRepository.getByEmail(user.email!)
         if (localUser) {
             const allUsers = usersRepository.getAll()
             // Self-repair: If this is the only user and not an admin, promote them
             if (allUsers.length === 1 && localUser.role !== 'admin') {
                 localUser.role = 'admin'
                 usersRepository.update(localUser.id, { role: 'admin' })
             }
             state.setUser(localUser)
         } else {
             // Edge case, clear session or wait for sync
             state.setUser(null)
         }
     } else {
         state.setUser(null)
     }
     
     state.setLoading(false)
  }
}
