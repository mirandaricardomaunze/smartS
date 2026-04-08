import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import DetailModalLayout, { DetailStat, DetailSectionItem } from '@/components/ui/DetailModalLayout'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  User, 
  Calendar,
  Package,
  FileText,
  ChevronRight
} from 'lucide-react-native'
import { formatDate } from '@/utils/formatters'
import { useMovementDetails } from '../hooks/useMovementDetails'
import { usersRepository } from '@/repositories/usersRepository'
import { router } from 'expo-router'
import { feedback } from '@/utils/haptics'

interface MovementDetailModalProps {
  visible: boolean
  onClose: () => void
  movementId: string | null
}

export default function MovementDetailModal({ visible, onClose, movementId }: MovementDetailModalProps) {
  const { movement, isLoading } = useMovementDetails(movementId)

  const userName = useMemo(() => {
    if (!movement) return '---'
    if (movement.user_id === 'offline-user') return 'Administrador'
    const user = usersRepository.getById(movement.company_id, movement.user_id)
    return user?.name || movement.user_id
  }, [movement])

  const typeConfig = useMemo(() => {
    if (!movement) return null
    switch (movement.type) {
      case 'entry': return { label: 'Entrada de Stock', variant: 'success' as const, icon: ArrowDownLeft, bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' }
      case 'exit': return { label: 'Saída de Stock', variant: 'danger' as const, icon: ArrowUpRight, bg: 'bg-rose-500', shadow: 'shadow-rose-500/20' }
      case 'adjustment': return { label: 'Ajuste Manual', variant: 'warning' as const, icon: RefreshCcw, bg: 'bg-amber-500', shadow: 'shadow-amber-500/20' }
      case 'transfer': return { label: 'Transferência', variant: 'info' as const, icon: RefreshCcw, bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' }
      default: return { label: movement.type, variant: 'neutral' as const, icon: FileText, bg: 'bg-slate-500', shadow: 'shadow-black/5' }
    }
  }, [movement])

  const stats = useMemo(() => {
    if (!movement || !typeConfig) return []
    return [
      { 
        label: 'Unidades', 
        value: `${movement.type === 'exit' ? '-' : '+'}${movement.quantity}`, 
        icon: typeConfig.icon, 
        variant: typeConfig.variant 
      }
    ] as DetailStat[]
  }, [movement, typeConfig])

  const sections = useMemo(() => {
    if (!movement) return []
    return [
      { 
        icon: Package, 
        label: 'Produto Relacionado', 
        value: movement.product_name, 
        action: () => {
          feedback.light()
          onClose()
          router.push(`/(app)/products/${movement.product_id}`)
        },
        actionIcon: ChevronRight,
        color: '#6366f1'
      },
      { 
        icon: Calendar, 
        label: 'Data do Registo', 
        value: formatDate(movement.created_at) 
      },
      { 
        icon: User, 
        label: 'Responsável', 
        value: userName 
      },
      { 
        icon: FileText, 
        label: 'Motivo', 
        value: movement.reason || 'Movimentação manual de stock' 
      }
    ] as DetailSectionItem[]
  }, [movement, userName, onClose])

  if (!visible) return null

  if (isLoading || !movement) {
    return (
      <DetailModalLayout visible={visible} onClose={onClose} title="Audit de Stock" height={0.5}>
        <Loading fullScreen />
      </DetailModalLayout>
    )
  }

  const IconComp = typeConfig!.icon

  return (
    <DetailModalLayout
      visible={visible}
      onClose={onClose}
      title="Audit de Stock"
      height={0.7}
      headerIcon={
        <View className={`w-14 h-14 rounded-3xl ${typeConfig!.bg} items-center justify-center shadow-lg ${typeConfig!.shadow}`}>
          <IconComp size={20} color="white" />
        </View>
      }
      headerBadge={{ label: typeConfig!.label, variant: typeConfig!.variant }}
      stats={stats}
      sections={sections}
      footerActions={
        <Button 
          title="Ver Produto"
          variant="secondary"
          fullWidth={true}
          onPress={() => {
            feedback.light()
            onClose()
            router.push(`/(app)/products/${movement.product_id}`)
          }}
          icon={<Package size={18} color="white" />}
          className="flex-1 h-14 rounded-2xl border-transparent bg-indigo-50 dark:bg-indigo-900/20"
          textStyle={{ color: '#6366f1', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}
        />
      }
    />
  )
}
