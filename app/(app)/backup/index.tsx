import React, { useState, useEffect, useCallback } from 'react'
import PlanGate from '@/components/ui/PlanGate'
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native'
import { useToastStore } from '@/store/useToastStore'
import { useConfirmStore } from '@/store/useConfirmStore'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PickerModal from '@/components/ui/PickerModal'
import {
  Cloud, CloudUpload, CloudDownload, ShieldCheck, Clock,
  RefreshCw, Timer, CheckCircle, HardDrive, LogOut,
  AlertCircle, Download
} from 'lucide-react-native'
import { backupService } from '@/services/backupService'
import { googleDriveService } from '@/services/googleDriveService'
import { useGoogleDriveAuth } from '@/hooks/useGoogleDriveAuth'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { feedback } from '@/utils/haptics'
import { AutoBackupInterval } from '@/types'

const INTERVAL_LABELS: Record<AutoBackupInterval, string> = {
  disabled: 'Desactivado',
  '1h':     'A cada 1 hora',
  '6h':     'A cada 6 horas',
  '24h':    'Diário (24h)',
  weekly:   'Semanal',
}

function formatLastBackup(date: Date | null): string {
  if (!date) return 'Nunca realizado'
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)
  if (diffMin < 2) return 'Agora mesmo'
  if (diffMin < 60) return `Há ${diffMin} minutos`
  if (diffH < 24) return `Há ${diffH} hora${diffH > 1 ? 's' : ''}`
  return `Há ${diffD} dia${diffD > 1 ? 's' : ''} (${date.toLocaleDateString()})`
}

function formatBackupName(raw: string): string {
  return raw.replace('smarts_backup_', '').replace('.db', '').replace(/-/g, ' ')
}

export default function BackupScreen() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDriveSyncing, setIsDriveSyncing] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [lastBackup, setLastBackup] = useState<Date | null>(null)
  const [localBackups, setLocalBackups] = useState<{ name: string; uri: string }[]>([])
  const [driveBackups, setDriveBackups] = useState<{ id: string; name: string; modifiedTime: string }[]>([])
  const [intervalModalVisible, setIntervalModalVisible] = useState(false)
  const { show: showToast } = useToastStore()
  const { settings, updateSettings } = useSettings()
  const { authState, userEmail, error: authError, isConnected: driveConnected, signIn, signOut } = useGoogleDriveAuth()

  const loadBackupInfo = useCallback(async () => {
    const [last, files] = await Promise.all([
      backupService.getLastBackupTime(),
      backupService.listLocalBackups(),
    ])
    setLastBackup(last)
    setLocalBackups(files)
  }, [])

  const loadDriveBackups = useCallback(async () => {
    if (!driveConnected) return
    try {
      const files = await googleDriveService.listBackups()
      setDriveBackups(files)
    } catch {
      // silent
    }
  }, [driveConnected])

  useEffect(() => {
    Promise.all([loadBackupInfo(), loadDriveBackups()])
  }, [loadBackupInfo, loadDriveBackups])

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleManualBackup = async () => {
    feedback.medium()
    setIsSyncing(true)
    try {
      await backupService.silentBackup()
      showToast('Backup local realizado!', 'success')
      await loadBackupInfo()
    } catch {
      showToast('Falha ao realizar o backup', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncDrive = async () => {
    feedback.medium()
    setIsDriveSyncing(true)
    try {
      await backupService.syncToDrive()
      showToast('Sincronizado com Google Drive!', 'success')
      await loadDriveBackups()
    } catch (e: any) {
      showToast(e?.message ?? 'Falha ao sincronizar', 'error')
    } finally {
      setIsDriveSyncing(false)
    }
  }

  const handleRestoreFromDrive = () => {
    useConfirmStore.getState().show({
      title: 'Restaurar do Drive',
      message: 'Isto irá substituir os dados locais pelo backup mais recente do Google Drive. Tem a certeza?',
      confirmLabel: 'Restaurar',
      isDestructive: true,
      onConfirm: async () => {
        setIsRestoring(true)
        try {
          await backupService.restoreFromDrive()
          showToast('Dados restaurados do Google Drive!', 'success')
          await loadBackupInfo()
        } catch (e: any) {
          showToast(e?.message ?? 'Falha ao restaurar', 'error')
        } finally {
          setIsRestoring(false)
        }
      },
    })
  }

  const handleExport = async () => {
    feedback.medium()
    try {
      await backupService.exportDatabase()
    } catch {
      // error shown inside service
    }
  }

  const handleSignOut = () => {
    useConfirmStore.getState().show({
      title: 'Desligar Drive',
      message: 'Tem a certeza que deseja desligar o Google Drive? Os backups locais mantêm-se.',
      confirmLabel: 'Desligar',
      isDestructive: true,
      onConfirm: signOut,
    })
  }

  const isAutoEnabled = settings.auto_backup_enabled === 1

  return (
    <PlanGate feature="hasBackup" requiredPlan="BASIC">
      <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900" withHeader>
      <Header title="Backup e Segurança" />

      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-24">

        {/* ── Status Card ── */}
        <Card className="rounded-3xl p-8 bg-slate-900 dark:bg-slate-800 border-none shadow-xl mb-6 items-center">
          <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${lastBackup ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
            {driveConnected
              ? <HardDrive size={40} color="#4f46e5" />
              : lastBackup
                ? <Cloud size={40} color="#10b981" />
                : <Clock size={40} color="#f59e0b" />
            }
          </View>
          <Text className="text-white text-xl font-black mb-1">
            {driveConnected ? 'Drive Conectado' : lastBackup ? 'Dados Protegidos' : 'Sem Backup'}
          </Text>
          {driveConnected && userEmail && (
            <Text className="text-indigo-300 text-xs font-bold mb-1">{userEmail}</Text>
          )}
          <View className="flex-row items-center">
            <Clock size={12} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-bold ml-1 uppercase tracking-widest">
              {formatLastBackup(lastBackup)}
            </Text>
          </View>
          <View className="flex-row mt-3 gap-2">
            {localBackups.length > 0 && (
              <View className="bg-white/10 px-3 py-1 rounded-full">
                <Text className="text-slate-300 text-[10px] font-bold">{localBackups.length} locais</Text>
              </View>
            )}
            {driveConnected && driveBackups.length > 0 && (
              <View className="bg-indigo-500/20 px-3 py-1 rounded-full">
                <Text className="text-indigo-300 text-[10px] font-bold">{driveBackups.length} no Drive</Text>
              </View>
            )}
          </View>
        </Card>

        {/* ── Google Drive Section ── */}
        <Text className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">
          Google Drive
        </Text>

        <Card className="rounded-3xl p-5 bg-white dark:bg-slate-800 border-none shadow-sm mb-6">
          {!driveConnected ? (
            <>
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-2xl bg-indigo-500/10 items-center justify-center mr-3">
                  <HardDrive size={20} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-800 dark:text-white font-bold text-sm">Ligar Google Drive</Text>
                  <Text className="text-slate-400 text-[10px] mt-0.5">Sincronização automática na nuvem</Text>
                </View>
              </View>

              {authError && (
                <View className="flex-row items-center bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl mb-3">
                  <AlertCircle size={14} color="#ef4444" />
                  <Text className="text-red-600 dark:text-red-400 text-xs ml-2 flex-1">{authError}</Text>
                </View>
              )}

              <Button
                title={authState === 'loading' ? 'A autenticar...' : 'Entrar com Google'}
                onPress={() => { feedback.medium(); signIn() }}
                isLoading={authState === 'loading'}
                variant="primary"
              />
            </>
          ) : (
            <>
              {/* Connected state */}
              <View className="flex-row items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
                <View className="w-10 h-10 rounded-2xl bg-emerald-500/10 items-center justify-center mr-3">
                  <CheckCircle size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-800 dark:text-white font-bold text-sm">Drive Conectado</Text>
                  <Text className="text-slate-400 text-[10px] mt-0.5" numberOfLines={1}>{userEmail ?? '—'}</Text>
                </View>
                <TouchableOpacity onPress={handleSignOut} className="p-2">
                  <LogOut size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {/* Drive backups list */}
              {driveBackups.length > 0 && (
                <View className="mb-4">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Backups no Drive
                  </Text>
                  {driveBackups.slice(0, 3).map((f, i) => (
                    <View key={f.id} className={`flex-row items-center py-2 ${i < Math.min(driveBackups.length, 3) - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                      <HardDrive size={12} color="#4f46e5" />
                      <Text className="text-slate-600 dark:text-slate-300 text-xs ml-2 flex-1" numberOfLines={1}>
                        {formatBackupName(f.name)}
                      </Text>
                      <Text className="text-slate-400 text-[10px]">
                        {new Date(f.modifiedTime).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Drive actions */}
              <View className="gap-2">
                <Button
                  title={isDriveSyncing ? 'A sincronizar...' : 'Sincronizar para Drive'}
                  icon={<CloudUpload size={16} color="white" />}
                  onPress={handleSyncDrive}
                  isLoading={isDriveSyncing}
                  variant="primary"
                />
                <Button
                  title={isRestoring ? 'A restaurar...' : 'Restaurar do Drive'}
                  icon={<Download size={16} color="#4f46e5" />}
                  onPress={handleRestoreFromDrive}
                  isLoading={isRestoring}
                  variant="ghost"
                />
              </View>
            </>
          )}
        </Card>

        {/* ── Auto Backup Config ── */}
        <Text className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">
          Backup Automático
        </Text>

        <Card className="rounded-3xl p-5 bg-white dark:bg-slate-800 border-none shadow-sm mb-4">
          <TouchableOpacity
            onPress={() => { feedback.light(); updateSettings({ auto_backup_enabled: isAutoEnabled ? 0 : 1 }) }}
            className="flex-row items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center mr-3">
                <Timer size={20} color="#4f46e5" />
              </View>
              <View>
                <Text className="text-slate-800 dark:text-white font-bold text-sm">Backup Automático</Text>
                <Text className="text-slate-400 text-[10px] mt-0.5">
                  {driveConnected ? 'Local + Drive em segundo plano' : 'Cópia local em segundo plano'}
                </Text>
              </View>
            </View>
            <Switch
              value={isAutoEnabled}
              onValueChange={(val) => updateSettings({ auto_backup_enabled: val ? 1 : 0 })}
              trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { feedback.light(); setIntervalModalVisible(true) }}
            disabled={!isAutoEnabled}
            className={`flex-row items-center justify-between ${!isAutoEnabled ? 'opacity-40' : ''}`}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-2xl bg-emerald-500/10 items-center justify-center mr-3">
                <RefreshCw size={20} color="#10b981" />
              </View>
              <View>
                <Text className="text-slate-800 dark:text-white font-bold text-sm">Frequência</Text>
                <Text className="text-slate-400 text-[10px] mt-0.5">
                  {INTERVAL_LABELS[settings.auto_backup_interval] ?? 'Diário (24h)'}
                </Text>
              </View>
            </View>
            <Text className="text-primary text-xs font-bold">Alterar</Text>
          </TouchableOpacity>
        </Card>

        {/* ── Local Backups ── */}
        {localBackups.length > 0 && (
          <>
            <Text className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1 mt-2">
              Backups Locais ({localBackups.length})
            </Text>
            <Card className="rounded-3xl bg-white dark:bg-slate-800 border-none shadow-sm mb-6 overflow-hidden">
              {localBackups.map((b, i) => (
                <View
                  key={b.uri}
                  className={`flex-row items-center px-5 py-3 ${i < localBackups.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                >
                  <CheckCircle size={14} color="#10b981" />
                  <Text className="text-slate-600 dark:text-slate-300 text-xs ml-3 flex-1" numberOfLines={1}>
                    {formatBackupName(b.name)}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* ── Manual Actions ── */}
        <Text className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">
          Ações Manuais
        </Text>

        <TouchableOpacity onPress={handleManualBackup} disabled={isSyncing} className="mb-4">
          <Card className="rounded-3xl p-6 bg-white dark:bg-slate-800 border-none shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 items-center justify-center mr-4">
                <CloudUpload size={24} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-black text-slate-800 dark:text-white">Backup Agora</Text>
                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">
                  Guardar cópia local imediatamente
                </Text>
              </View>
            </View>
            <Button title={isSyncing ? 'A processar...' : 'Executar'} onPress={handleManualBackup} isLoading={isSyncing} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleExport} className="mb-4">
          <Card className="rounded-3xl p-6 bg-white dark:bg-slate-800 border-none shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center mr-4">
                <CloudUpload size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-black text-slate-800 dark:text-white">Exportar Ficheiro</Text>
                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">
                  Partilhar base de dados via email/drive
                </Text>
              </View>
            </View>
            <Button title="Exportar" onPress={handleExport} variant="ghost" />
          </Card>
        </TouchableOpacity>

        {/* Security note */}
        <View className="mt-2 flex-row items-center p-4 bg-white dark:bg-slate-800 rounded-2xl">
          <ShieldCheck size={20} color="#10b981" className="mr-3" />
          <Text className="flex-1 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase leading-tight tracking-wider">
            Os dados são guardados localmente e sincronizados de forma segura com o Google Drive.
          </Text>
        </View>
      </ScrollView>

      <PickerModal
        visible={intervalModalVisible}
        onClose={() => setIntervalModalVisible(false)}
        title="Frequência do Backup"
        selectedValue={settings.auto_backup_interval}
        onSelect={(value) => updateSettings({ auto_backup_interval: value as AutoBackupInterval })}
        options={Object.entries(INTERVAL_LABELS).map(([value, label]) => ({ label, value }))}
      />
      </Screen>
    </PlanGate>
  )
}
