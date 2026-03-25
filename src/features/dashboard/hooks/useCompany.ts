import { useState, useCallback } from 'react'
import { companyService } from '../services/companyService'
import { Company } from '@/types'
import { useCompanyStore } from '@/store/companyStore'

export function useCompany() {
  const [isLoading, setIsLoading] = useState(false)
  const { companies, setCompanies, activeCompanyId, setActiveCompany } = useCompanyStore()

  const createCompany = useCallback(async (data: Omit<Company, 'id' | 'created_at' | 'synced'>) => {
    try {
      setIsLoading(true)
      const newCompany = await companyService.createCompany(data)
      return newCompany
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateCompany = useCallback(async (id: string, data: Partial<Company>) => {
    try {
      setIsLoading(true)
      await companyService.updateCompany(id, data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCompanies = useCallback(() => {
    const data = companyService.getCompanies()
    setCompanies(data)
  }, [setCompanies])

  return {
    companies,
    activeCompanyId,
    setActiveCompany,
    createCompany,
    updateCompany,
    refreshCompanies,
    isLoading
  }
}
