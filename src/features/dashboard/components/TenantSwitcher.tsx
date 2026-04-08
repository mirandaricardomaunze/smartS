import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useCountryConfig } from '@/hooks/useCountryConfig'
import { useCompanyStore } from '@/store/companyStore'
import BottomSheet from '@/components/ui/BottomSheet'
import { Building2, Check, Plus, Globe, X } from 'lucide-react-native'
import { feedback } from '@/utils/haptics'
import { useCompany } from '../hooks/useCompany'
import CompanyFormModal from './CompanyFormModal'

interface TenantSwitcherProps {
  visible: boolean
  onClose: () => void
}

export default function TenantSwitcher({ visible, onClose }: TenantSwitcherProps) {
  const { companies, activeCompanyId, setActiveCompany, createCompany } = useCompany()
  const countryConfig = useCountryConfig()
  const [formVisible, setFormVisible] = React.useState(false)

  const handleSelect = (id: string) => {
    setActiveCompany(id)
    feedback.success()
    onClose()
  }

  const handleCreateCompany = async (data: any) => {
    await createCompany(data)
    setFormVisible(false)
  }

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} height={0.85}>
        <View className="flex-1 bg-white dark:bg-slate-950 px-6 pt-2 pb-8">
          <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Globe size={24} color="#4f46e5" className="mr-2" />
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xl font-bold text-slate-800 dark:text-white">
              Alternar Empresa
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full">
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
            {companies.length === 0 ? (
               <View className="p-8 items-center">
                  <Building2 size={40} color="#cbd5e1" className="mb-2" />
                  <Text className="text-slate-400 text-center">Nenhuma empresa registada.</Text>
               </View>
            ) : (
              companies.map((company) => (
                <TouchableOpacity 
                  key={company.id} 
                  onPress={() => handleSelect(company.id)}
                  className={`mb-3 p-4 rounded-2xl flex-row items-center justify-between border ${activeCompanyId === company.id ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl items-center justify-center mr-3 shadow-sm">
                      <Building2 size={20} color={activeCompanyId === company.id ? "#4f46e5" : "#94a3b8"} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'Inter-Bold' }} className={`text-base font-bold ${activeCompanyId === company.id ? 'text-primary dark:text-primary-dark' : 'text-slate-700 dark:text-slate-200'}`}>
                        {company.name}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {company.nif || `Sem ${countryConfig.tax.taxIdLabel}`}
                      </Text>
                    </View>
                  </View>
                  {activeCompanyId === company.id && <Check size={20} color="#4f46e5" />}
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity 
              onPress={() => {
                feedback.light()
                setFormVisible(true)
              }}
              className="mt-4 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex-row items-center justify-center"
            >
              <Plus size={20} color="#94a3b8" />
              <Text className="text-slate-400 font-bold ml-2">Adicionar Empresa</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BottomSheet>

      <CompanyFormModal 
        visible={formVisible} 
        onClose={() => setFormVisible(false)}
        onSave={handleCreateCompany}
      />
    </>
  )
}
