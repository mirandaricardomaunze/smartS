import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { Note } from '@/types'
import { generateUUID } from '@/utils/uuid'

export const notesRepository = {
  getAll(): Note[] {
    return db.getAllSync<Note>(
      'SELECT * FROM notes ORDER BY created_at DESC'
    )
  },
  getById(id: string): Note | null {
    return db.getFirstSync<Note>(
      'SELECT * FROM notes WHERE id = ?', [id]
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
      `INSERT INTO notes (id, number, type, user_id, items, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [note.id, note.number, note.type, note.user_id, typeof note.items === 'string' ? note.items : JSON.stringify(note.items), note.created_at, note.synced]
    )
    
    // Convert back array structure for the object sent to sync stack if needed, basically handle mapping back and forth
    addToSyncQueue('notes', 'INSERT', {
        ...note, 
        items: typeof note.items === 'string' ? note.items : JSON.stringify(note.items)
    })
    
    return note
  },
}
