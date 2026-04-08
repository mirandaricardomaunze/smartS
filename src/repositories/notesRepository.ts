import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { Note, NoteItem, MovementType } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { movementsRepository } from './movementsRepository'

// NoteType ('entry' | 'exit' | 'transfer') is a subset of MovementType — safe to use directly
const NOTE_TYPE_TO_MOVEMENT: Record<Note['type'], MovementType> = {
  entry: 'entry',
  exit: 'exit',
  transfer: 'transfer',
}

export const notesRepository = {
  getNextNumber(companyId: string): string {
    const result = db.getFirstSync<{ maxNum: number | null }>(
      "SELECT MAX(CAST(REPLACE(number, 'NT-', '') AS INTEGER)) as maxNum FROM notes WHERE company_id = ?",
      [companyId]
    )
    const next = (result?.maxNum || 0) + 1
    return `NT-${String(next).padStart(4, '0')}`
  },

  getAll(companyId: string): Note[] {
    return db.getAllSync<Note>(
      'SELECT * FROM notes WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    )
  },

  getById(companyId: string, id: string): Note | null {
    return db.getFirstSync<Note>(
      'SELECT * FROM notes WHERE id = ? AND company_id = ?',
      [id, companyId]
    ) ?? null
  },

  create(data: Omit<Note, 'id' | 'created_at' | 'synced'>): Note {
    const note: Note = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      synced: 0,
    }

    const itemsJson = typeof note.items === 'string' ? note.items : JSON.stringify(note.items)
    const items: NoteItem[] = typeof note.items === 'string' ? JSON.parse(note.items) : note.items
    const movementType = NOTE_TYPE_TO_MOVEMENT[note.type]
    const typeLabel = note.type === 'entry' ? 'Entrada' : 'Saída'

    db.runSync('BEGIN TRANSACTION')
    try {
      db.runSync(
        `INSERT INTO notes (id, company_id, number, type, user_id, items, created_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [note.id, note.company_id, note.number, note.type, note.user_id, itemsJson, note.created_at, note.synced]
      )

      for (const item of items) {
        movementsRepository.create({
          company_id: note.company_id,
          product_id: item.product_id,
          type: movementType,
          quantity: item.quantity,
          user_id: note.user_id,
          reason: `${typeLabel} - Nota #${note.number}`,
        })
      }

      // Sync queue inside transaction — rolls back with the rest if anything fails
      addToSyncQueue('notes', 'INSERT', { ...note, items: itemsJson })

      db.runSync('COMMIT')
    } catch (e) {
      db.runSync('ROLLBACK')
      throw e
    }

    return note
  },
}
