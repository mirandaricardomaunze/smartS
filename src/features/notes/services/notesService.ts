import { notesRepository } from '@/repositories/notesRepository'
import { historyRepository } from '@/repositories/historyRepository'
import { hasPermission } from '@/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Note, NoteItem } from '@/types'
import { useCompanyStore } from '@/store/companyStore'

export const notesService = {
  getAll(): Note[] {
    const { user } = useAuthStore.getState()
    if (!user || (!hasPermission(user.role, 'view_history') && !hasPermission(user.role, 'create_notes'))) {
        throw new Error('Sem permissão para ver guias')
    }
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return []
    return notesRepository.getAll(activeCompanyId)
  },
  getById(id: string): Note | null {
    const { activeCompanyId } = useCompanyStore.getState()
    if (!activeCompanyId) return null
    return notesRepository.getById(activeCompanyId, id)
  },
  create(data: { type: string, number: string, items: NoteItem[] }): Note {
    const { user } = useAuthStore.getState()
    if (!user || !hasPermission(user.role, 'create_notes') || !user.company_id) {
      throw new Error('Sem permissão para criar notas')
    }
    
    // Notes type as per types.ts is 'entry' | 'exit' | 'transfer'
    const note = notesRepository.create({
        ...data,
        company_id: user.company_id,
        type: data.type as 'entry' | 'exit' | 'transfer',
        user_id: user.id,
        items: JSON.stringify(data.items) as any
    })
    historyRepository.log(user.company_id, 'CREATE', 'notes', note.id, user.id, note)
    return note
  },
}
