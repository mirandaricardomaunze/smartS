import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import { companyRepository } from '@/repositories/companyRepository'
import { usersRepository } from '@/repositories/usersRepository'
import { Company } from '@/types'
import { useAuthStore } from '@/features/auth/store/authStore'
import { pullFromSupabase, syncData } from '@/utils/syncData'
import { Check, Building2, Search, ArrowRight } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import { feedback } from '@/utils/haptics'
import { logger } from '@/utils/logger'

interface Props {
  visible: boolean
  onClose: () => void
}

export default function CompanySwitcherModal({ visible, onClose }: Props) {
  const { user, setUser } = useAuthStore()
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    if (visible) {
      loadCompanies()
    }
  }, [visible])

  const loadCompanies = async () => {
    try {
      setIsLoading(true)
      // First ensure we have latest companies from Supabase
      await pullFromSupabase()
      const data = companyRepository.getAll()
      setCompanies(data)
    } catch (e) {
      logger.error('[CompanySwitcher] Failed to load companies:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitch = async (company: Company) => {
    if (!user || company.id === user.company_id) return
    
    setIsSwitching(true)
    feedback.medium()
    
    try {
      // 1. Update local DB user company_id
      usersRepository.updateGlobal(user.id, { company_id: company.id })
      
      // 2. Update global store
      setUser({ ...user, company_id: company.id })
      
      logger.info(`[CompanySwitcher] Switched to company: ${company.name} (${company.id})`)
      
      // 3. Trigger immediate pull for the new company data
      // This will pull all tables filtered by the NEW company_id
      await pullFromSupabase()
      
      feedback.success()
      onClose()
    } catch (e) {
      logger.error('[CompanySwitcher] Switch failed:', e)
      feedback.error()
    } finally {
      setIsSwitching(false)
    }
  }

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.nif?.includes(search)
  )

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.8}>
      <View className="px-6 flex-1">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xl text-slate-900 dark:text-white mb-1">
          Alternar Empresa
        </Text>
        <Text className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wider">
          Super Admin: Controlo Global
        </Text>

        <Input
          placeholder="Procurar por nome ou NIF..."
          value={search}
          onChangeText={setSearch}
          icon={<Search size={18} color="#94a3b8" />}
          className="mb-4"
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-slate-500 mt-4 text-sm font-medium">A sincronizar empresas...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {filteredCompanies.map((item) => {
              const isActive = item.id === user?.company_id
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSwitch(item)}
                  disabled={isSwitching}
                  className={`p-4 mb-3 rounded-2xl border flex-row items-center justify-between ${
                    isActive 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                      isActive ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                    }`}>
                      <Building2 size={24} color={isActive ? 'white' : '#64748b'} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Inter-SemiBold' }} className={`text-sm font-bold ${
                        isActive ? 'text-primary' : 'text-slate-800 dark:text-white'
                      }`}>
                        {item.name}
                      </Text>
                      {item.nif && <Text className="text-[10px] text-slate-500 mt-0.5">NIF: {item.nif}</Text>}
                    </View>
                  </View>
                  
                  {isActive ? (
                    <Check size={20} color="#4f46e5" />
                  ) : (
                    <ArrowRight size={18} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              )
            })}

            {filteredCompanies.length === 0 && (
              <View className="items-center justify-center mt-12">
                <Building2 size={48} color="#e2e8f0" />
                <Text className="text-slate-400 mt-4 font-medium">Nenhuma empresa encontrada</Text>
              </View>
            )}
            
            <View className="h-10" />
          </ScrollView>
        )}
      </View>

      {isSwitching && (
        <View className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 items-center justify-center z-50">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-slate-900 dark:text-white mt-4 font-bold text-base">A mudar contexto...</Text>
          <Text className="text-slate-500 mt-1 text-sm">A carregar dados da empresa</Text>
        </View>
      )}
    </BottomSheet>
  )
}
