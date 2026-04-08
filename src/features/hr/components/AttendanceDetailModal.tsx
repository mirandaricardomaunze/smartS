import React, { useMemo } from 'react'
import { View } from 'react-native'
import DetailModalLayout, { DetailSectionItem } from '@/components/ui/DetailModalLayout'
import { Attendance } from '../types'
import { Clock, Calendar, FileText, AlertCircle, CheckCircle2, XCircle, Timer } from 'lucide-react-native'
import { formatDate } from '@/utils/formatters'

interface Props {
  visible: boolean
  onClose: () => void
  attendance: Attendance | null
}

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

interface StatusConfig {
  label: string
  variant: BadgeVariant
  icon: React.ReactNode
}

function getStatusConfig(status: Attendance['status']): StatusConfig {
  switch (status) {
    case 'present':
      return { label: 'Presente', variant: 'success', icon: <CheckCircle2 size={20} color="#10b981" /> }
    case 'absent':
      return { label: 'Faltou', variant: 'danger', icon: <XCircle size={20} color="#f43f5e" /> }
    case 'late':
      return { label: 'Atrasado', variant: 'warning', icon: <AlertCircle size={20} color="#f59e0b" /> }
    case 'justified':
      return { label: 'Justificado', variant: 'info', icon: <FileText size={20} color="#6366f1" /> }
    default:
      return { label: status, variant: 'neutral', icon: null }
  }
}

export default function AttendanceDetailModal({ visible, onClose, attendance }: Props) {
  const statusConfig = useMemo<StatusConfig | null>(() => {
    if (!attendance) return null
    return getStatusConfig(attendance.status)
  }, [attendance])

  const totalHours = useMemo(() => {
    if (!attendance) return '0.0'
    return ((attendance.total_minutes ?? 0) / 60).toFixed(1)
  }, [attendance])

  const sections = useMemo<DetailSectionItem[]>(() => {
    if (!attendance) return []

    const items: DetailSectionItem[] = [
      { icon: Calendar, label: 'Data do Registo', value: formatDate(attendance.date) },
      { icon: Clock, label: 'Entrada', value: attendance.clock_in ?? '---', color: '#10b981' },
      { icon: Clock, label: 'Saída', value: attendance.clock_out ?? '---', color: '#f43f5e' },
      { icon: Timer, label: 'Total de Horas', value: `${totalHours} h` },
    ]

    if (attendance.justification) {
      items.push({ icon: FileText, label: 'Justificação', value: attendance.justification })
    }

    return items
  }, [attendance, totalHours])

  if (!visible || !attendance || !statusConfig) return null

  return (
    <DetailModalLayout
      visible={visible}
      onClose={onClose}
      title="Detalhes do Registo"
      height={0.65}
      headerIcon={
        <View className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-900/50 items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
          {statusConfig.icon}
        </View>
      }
      headerBadge={{ label: statusConfig.label, variant: statusConfig.variant }}
      secondaryBadge={{ label: attendance.employee_name ?? 'Funcionário', variant: 'neutral' }}
      sections={sections}
    />
  )
}
