import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useToastStore } from '@/store/useToastStore'
import { googleDriveService, googleTokenStore } from '@/services/googleDriveService'

const DB_NAME = 'stockapp.db'
const DB_PATH = `${(FileSystem as any).documentDirectory}SQLite/${DB_NAME}`
const BACKUP_DIR = `${(FileSystem as any).documentDirectory}SmartS_backups/`
const LAST_BACKUP_KEY = '@smarts_last_backup'
const MAX_LOCAL_BACKUPS = 5

export const backupService = {
  /**
   * Manual export — opens share sheet for the user to save/send the file.
   */
  async exportDatabase(): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(DB_PATH)
      if (!fileInfo.exists) throw new Error('Base de dados não encontrada para exportação')

      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) throw new Error('A partilha de ficheiros não está disponível neste dispositivo')

      await Sharing.shareAsync(DB_PATH, {
        UTI: 'public.database',
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Exportar Backup SmartS',
      })
    } catch (error: any) {
      console.error('Backup Error:', error)
      useToastStore.getState().show(error.message || 'Falha ao exportar os dados', 'error')
      throw error
    }
  },

  /**
   * Silent automatic backup — copies DB to local backup folder, no UI interaction.
   * Returns the backup file path on success.
   */
  async silentBackup(): Promise<string> {
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH)
    if (!fileInfo.exists) throw new Error('Database file not found')

    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true }).catch(() => {})

    // Destination filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const destPath = `${BACKUP_DIR}smarts_backup_${timestamp}.db`

    await FileSystem.copyAsync({ from: DB_PATH, to: destPath })

    // Persist last backup time
    await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())

    // Rotate: keep only the latest MAX_LOCAL_BACKUPS files
    await backupService.pruneOldBackups()

    return destPath
  },

  /**
   * Delete old backups, keeping only the most recent MAX_LOCAL_BACKUPS.
   */
  async pruneOldBackups(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR)
      if (!dirInfo.exists) return

      const files = await FileSystem.readDirectoryAsync(BACKUP_DIR)
      const backupFiles = files
        .filter(f => f.startsWith('smarts_backup_') && f.endsWith('.db'))
        .sort() // ISO timestamp names sort chronologically

      const toDelete = backupFiles.slice(0, Math.max(0, backupFiles.length - MAX_LOCAL_BACKUPS))
      for (const f of toDelete) {
        await FileSystem.deleteAsync(BACKUP_DIR + f, { idempotent: true })
      }
    } catch {
      // Non-critical — ignore prune errors
    }
  },

  async getLastBackupTime(): Promise<Date | null> {
    const raw = await AsyncStorage.getItem(LAST_BACKUP_KEY)
    if (!raw) return null
    const d = new Date(raw)
    return isNaN(d.getTime()) ? null : d
  },

  async listLocalBackups(): Promise<{ name: string; uri: string }[]> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR)
      if (!dirInfo.exists) return []

      const files = await FileSystem.readDirectoryAsync(BACKUP_DIR)
      return files
        .filter(f => f.startsWith('smarts_backup_') && f.endsWith('.db'))
        .sort()
        .reverse()
        .map(f => ({ name: f, uri: BACKUP_DIR + f }))
    } catch {
      return []
    }
  },

  /**
   * Upload the latest local backup to Google Drive.
   * Silently does nothing if Drive is not connected.
   */
  async syncToDrive(): Promise<void> {
    const connected = await googleTokenStore.isConnected()
    if (!connected) return

    // Use the most recent local backup, or create one first
    let backups = await backupService.listLocalBackups()
    if (backups.length === 0) {
      await backupService.silentBackup()
      backups = await backupService.listLocalBackups()
    }
    if (backups.length === 0) throw new Error('No local backup to sync')

    const latest = backups[0]
    await googleDriveService.uploadFile(latest.uri, latest.name)
  },

  /**
   * Download the most recent backup from Google Drive and restore it.
   */
  async restoreFromDrive(): Promise<void> {
    const files = await googleDriveService.listBackups()
    if (files.length === 0) throw new Error('No backups found on Google Drive')

    const latest = files[0]
    const destPath = `${(FileSystem as any).documentDirectory}SQLite/stockapp.db`
    await googleDriveService.downloadFile(latest.id, destPath)
    await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
  },

  async importDatabase(): Promise<void> {
    useToastStore.getState().show(
      'Para restaurar um backup, por favor contacte o suporte técnico ou utilize a sincronização na nuvem.',
      'info'
    )
  },
}
