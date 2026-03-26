import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { Note } from '@/types'
import { generateUUID } from '@/utils/uuid'

export const notesRepository = {
  getAll(companyId: string): Note[] {
    return db.getAllSync<Note>(
      'SELECT * FROM notes WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    )
  },
  getById(companyId: string, id: string): Note | null {
    return db.getFirstSync<Note>(
      'SELECT * FROM notes WHERE id = ? AND company_id = ?', [id, companyId]
    ) ?? null
  },
  create(data: Omit<Note, 'id' | 'created_at' | 'synced'>): Note {
    const note: Note = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      synced: 0,
    }
    db.runSync(
      `INSERT INTO notes (id, company_id, number, type, user_id, items, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [note.id, note.company_id, note.number, note.type, note.user_id, typeof note.items === 'string' ? note.items : JSON.stringify(note.items), note.created_at, note.synced]
    )
    
    // Convert back array structure for the object sent to sync stack if needed, basically handle mapping back and forth
    addToSyncQueue('notes', 'INSERT', {
        ...note, 
        items: typeof note.items === 'string' ? note.items : JSON.stringify(note.items)
    })
    
    return note
  },
}
