import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Alert } from 'react-native'
import { useToastStore } from '@/store/useToastStore'

export const backupService = {
  /**
   * Exports the SQLite database file
   */
  async exportDatabase(): Promise<void> {
    const dbName = 'stockapp.db'
    const dbPath = `${(FileSystem as any).documentDirectory}SQLite/${dbName}`

    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(dbPath)
      if (!fileInfo.exists) {
        throw new Error('Base de dados não encontrada para exportação')
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        throw new Error('A partilha de ficheiros não está disponível neste dispositivo')
      }

      // Propose to share/save the file
      await Sharing.shareAsync(dbPath, {
        UTI: 'public.database',
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Exportar Backup SmartS'
      })
    } catch (error: any) {
      console.error('Backup Error:', error)
      useToastStore.getState().show(error.message || 'Falha ao exportar os dados', 'error')
      throw error
    }
  },

  /**
   * Placeholder for restore logic 
   * (In a real app, this would involve picking a file and replacing the DB)
   */
  async importDatabase(): Promise<void> {
    useToastStore.getState().show(
      'Para restaurar um backup, por favor contacte o suporte técnico ou utilize a sincronização na nuvem.',
      'info'
    )
  }
}
