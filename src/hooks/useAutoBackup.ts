import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { backupService } from '@/services/backupService'
import { useToastStore } from '@/store/useToastStore'
import { AutoBackupInterval } from '@/types'
import { googleTokenStore } from '@/services/googleDriveService'

const INTERVAL_MS: Record<AutoBackupInterval, number> = {
  disabled: Infinity,
  '1h':     1 * 60 * 60 * 1000,
  '6h':     6 * 60 * 60 * 1000,
  '24h':   24 * 60 * 60 * 1000,
  weekly:   7 * 24 * 60 * 60 * 1000,
}

async function runBackup(lastBackupRef: React.MutableRefObject<number>) {
  try {
    await backupService.silentBackup()
    lastBackupRef.current = Date.now()

    const driveConnected = await googleTokenStore.isConnected()
    if (driveConnected) {
      await backupService.syncToDrive().catch((e) =>
        console.warn('Auto Drive sync failed:', e?.message)
      )
      useToastStore.getState().show('Backup automático → Google Drive ✓', 'success')
    } else {
      useToastStore.getState().show('Backup automático concluído', 'success')
    }
  } catch (e: any) {
    console.warn('Auto-backup failed:', e?.message)
  }
}

export function useAutoBackup() {
  const { auto_backup_enabled, auto_backup_interval } = useSettingsStore(
    (s) => s.settings
  )
  const appState = useRef<AppStateStatus>(AppState.currentState)
  // In-memory cache — avoids AsyncStorage read on every foreground event
  const lastBackupMs = useRef<number>(0)
  const initialised = useRef(false)

  useEffect(() => {
    if (!auto_backup_enabled) return

    const intervalMs = INTERVAL_MS[auto_backup_interval] ?? INTERVAL_MS['24h']

    function check() {
      // Fast in-memory guard first — skip AsyncStorage if interval clearly hasn't passed
      if (lastBackupMs.current > 0 && Date.now() - lastBackupMs.current < intervalMs) return

      if (!initialised.current) {
        // First check: read persisted time from AsyncStorage
        initialised.current = true
        backupService.getLastBackupTime().then((last) => {
          if (last) lastBackupMs.current = last.getTime()
          if (Date.now() - lastBackupMs.current >= intervalMs) runBackup(lastBackupMs)
        })
      } else {
        runBackup(lastBackupMs)
      }
    }

    check()

    const subscription = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') check()
      appState.current = next
    })

    return () => subscription.remove()
  }, [auto_backup_enabled, auto_backup_interval])
}
