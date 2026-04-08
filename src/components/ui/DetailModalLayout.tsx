import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, ViewStyle } from 'react-native'
import BottomSheet from './BottomSheet'
import Card from './Card'
import Badge from './Badge'
import { X, LucideIcon } from 'lucide-react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'

export interface DetailStat {
  label: string
  value: string | number
  icon: LucideIcon
  variant: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  color?: string
}

export interface DetailSectionItem {
  icon: LucideIcon
  label: string
  value: string | null | undefined
  action?: () => void
  actionIcon?: LucideIcon
  color?: string
}

interface DetailModalLayoutProps {
  visible: boolean
  onClose: () => void
  title: string
  height?: number
  headerIcon?: React.ReactNode
  headerBadge?: { label: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' }
  secondaryBadge?: { label: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' }
  stats?: DetailStat[]
  sections?: DetailSectionItem[]
  children?: React.ReactNode
  footerActions?: React.ReactNode
  isLoading?: boolean
}

export default function DetailModalLayout({
  visible,
  onClose,
  title,
  height = 0.85,
  headerIcon,
  headerBadge,
  secondaryBadge,
  stats,
  sections,
  children,
  footerActions,
  isLoading
}: DetailModalLayoutProps) {
  
  if (!visible) return null

  const InfoItem = ({ item, isLast }: { item: DetailSectionItem, isLast: boolean }) => {
    const { icon: Icon, label, value, action, actionIcon: ActionIcon, color } = item
    return (
      <View className={`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}>
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 items-center justify-center mr-3">
            <Icon size={20} color={color || "#64748b"} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</Text>
            <Text 
              style={{ fontFamily: 'Inter-Bold' }} 
              className="text-slate-900 dark:text-white font-bold" 
              numberOfLines={1}
            >
              {value || 'Não registado'}
            </Text>
          </View>
        </View>
        {action && value && (
          <TouchableOpacity 
            onPress={action}
            className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center ml-2"
          >
            {ActionIcon ? <ActionIcon size={18} color="#6366f1" /> : <X size={18} color="#6366f1" />}
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} height={height}>
      <View className="flex-1 bg-white dark:bg-slate-950 px-6 pt-4 pb-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center flex-1">
            {headerIcon && (
              <View className="mr-4">
                {headerIcon}
              </View>
            )}
            <View className="flex-1">
              <Text 
                style={{ fontFamily: 'Inter-Black' }} 
                className="text-xl font-black text-slate-900 dark:text-white" 
                numberOfLines={2}
              >
                {title}
              </Text>
              {(headerBadge || secondaryBadge) && (
                <View className="flex-row items-center mt-1">
                  {headerBadge && <Badge label={headerBadge.label} variant={headerBadge.variant} className="mr-2" />}
                  {secondaryBadge && <Badge label={secondaryBadge.label} variant={secondaryBadge.variant} />}
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity 
            onPress={onClose}
            className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center ml-2"
          >
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Stats Grid */}
          {stats && stats.length > 0 && (
            <Animated.View entering={FadeInUp.delay(100)} className="flex-row justify-between mb-6">
              {stats.map((stat, index) => {
                const isFirst = index === 0
                const isLast = index === stats.length - 1
                const marginClass = isFirst ? 'mr-1.5' : isLast ? 'ml-1.5' : 'mx-1'
                const StatIcon = stat.icon
                
                return (
                  <Card key={index} variant="premium" className={`flex-1 ${marginClass} p-3 items-center rounded-2xl`}>
                    <View className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${
                      stat.variant === 'danger' ? 'bg-rose-50 dark:bg-rose-500/10' :
                      stat.variant === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10' :
                      stat.variant === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10' :
                      stat.variant === 'info' ? 'bg-indigo-50 dark:bg-indigo-500/10' :
                      'bg-slate-50 dark:bg-slate-800'
                    }`}>
                      <StatIcon size={16} color={
                        stat.variant === 'danger' ? '#f43f5e' :
                        stat.variant === 'success' ? '#10b981' :
                        stat.variant === 'warning' ? '#f59e0b' :
                        stat.variant === 'info' ? '#6366f1' :
                        '#64748b'
                      } />
                    </View>
                    <Text 
                      style={{ fontFamily: 'Inter-Black' }} 
                      className={`text-[12px] font-black text-center ${
                        stat.variant === 'danger' ? 'text-rose-600' : 
                        stat.variant === 'success' ? 'text-emerald-600' :
                        stat.variant === 'warning' ? 'text-amber-600' :
                        'text-slate-900 dark:text-white'
                      }`}
                      numberOfLines={1}
                    >
                      {stat.value}
                    </Text>
                    <Text className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5" numberOfLines={1}>
                      {stat.label}
                    </Text>
                  </Card>
                )
              })}
            </Animated.View>
          )}

          {/* Sections / Info List */}
          {sections && sections.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
              <Card variant="default" className="p-0 border-transparent bg-transparent overflow-hidden">
                {sections.map((item, index) => (
                  <InfoItem key={index} item={item} isLast={index === sections.length - 1} />
                ))}
              </Card>
            </Animated.View>
          )}

          {/* Custom Content */}
          {children}

          {/* Spacer */}
          <View className="h-10" />
        </ScrollView>

        {/* Footer Actions */}
        {footerActions && (
          <Animated.View 
            entering={FadeInUp.delay(300)} 
            className="flex-row items-center w-full pt-4 mt-auto border-t border-slate-50 dark:border-slate-900/50"
          >
            {footerActions}
          </Animated.View>
        )}
      </View>
    </BottomSheet>
  )
}
