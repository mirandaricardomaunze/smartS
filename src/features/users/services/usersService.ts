import { usersRepository } from '@/repositories/usersRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCompanyStore } from '@/store/companyStore'
import { User } from '@/types'
import { supabase } from '@/services/supabase'

export const usersService = {
  getAll(): User[] {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'manage_users')) {
        throw new Error('Sem permissão para gerir utilizadores')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return usersRepository.getAll(activeCompanyId)
  },
  async create(data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'synced'>, password?: string): Promise<User> {
    const { user } = useAuthStore.getState()
    const { activeCompanyId } = useCompanyStore.getState()
    const allUsers = activeCompanyId ? usersRepository.getAll(activeCompanyId) : []
    const isFirstUser = allUsers.length === 0
    
    if (!isFirstUser && (!user || !hasPermission(user.role, 'manage_users'))) {
      throw new Error('Sem permissão para criar utilizadores')
    }
    
    if (activeCompanyId && usersRepository.getByEmail(activeCompanyId, data.email)) {
        throw new Error('Email já em uso')
    }

    let authId: string | undefined

    if (password) { // Used if creating a real complete auth user via Admin API (simulated here with signUp)
        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: password,
            options: {
                data: {
                    name: data.name,
                    role: data.role
                }
            }
        })
        if (error) throw new Error(error.message)
        authId = authData.user?.id
    }

    const dbUser = usersRepository.create({ ...data, id: authId })
    historyRepository.log(dbUser.company_id || '', 'CREATE', 'users', dbUser.id, user?.id || dbUser.id, dbUser)
    return dbUser
  },
  update(id: string, data: Partial<User>): void {
    const { user } = useAuthStore.getState()
    if (!user || (!hasPermission(user.role, 'manage_users') && user.id !== id)) {
      throw new Error('Sem permissão para editar utilizador')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (activeCompanyId) {
      usersRepository.update(activeCompanyId, id, data)
      historyRepository.log(activeCompanyId, 'UPDATE', 'users', id, user.id, data)
    }
  },
  delete(id: string): void {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'manage_users')) {
      throw new Error('Sem permissão para apagar utilizadores')
    }
    if (user.id === id) {
        throw new Error('Não pode apagar o seu próprio utilizador')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (activeCompanyId) {
      usersRepository.delete(activeCompanyId, id)
      historyRepository.log(activeCompanyId, 'DELETE', 'users', id, user.id, { id })
    }
  },
}
