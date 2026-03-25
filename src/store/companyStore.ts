import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Company } from '@/types'

interface CompanyState {
  companies: Company[]
  activeCompanyId: string | null
  isLoading: boolean
  
  setCompanies: (companies: Company[]) => void
  addCompany: (company: Company) => void
  setActiveCompany: (id: string) => void
  getActiveCompany: () => Company | null
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: [],
      activeCompanyId: null,
      isLoading: false,

      setCompanies: (companies) => set({ companies }),
      
      addCompany: (company) => set((state) => ({ 
        companies: [...state.companies, company] 
      })),
      
      setActiveCompany: (id) => set({ activeCompanyId: id }),
      
      getActiveCompany: () => {
        const { companies, activeCompanyId } = get()
        return companies.find(c => c.id === activeCompanyId) || null
      }
    }),
    {
      name: 'company-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
