import { companyRepository } from '@/repositories/companyRepository'
import { Company } from '@/types'
import { addToSyncQueue } from '@/utils/syncData'
import { useCompanyStore } from '@/store/companyStore'

export const companyService = {
  async createCompany(company: Omit<Company, 'id' | 'created_at' | 'synced'>): Promise<Company> {
    const newCompany = companyRepository.create(company)
    
    // Add to sync queue for Supabase
    addToSyncQueue('companies', 'INSERT', newCompany)
    
    // Update local store
    useCompanyStore.getState().addCompany(newCompany)
    
    return newCompany
  },

  updateCompany(id: string, data: Partial<Omit<Company, 'id' | 'created_at'>>): void {
    companyRepository.update(id, data)
    addToSyncQueue('companies', 'UPDATE', { id, ...data })
    
    // Refresh local store
    const companies = companyRepository.getAll()
    useCompanyStore.getState().setCompanies(companies)
  },

  getCompanies(): Company[] {
    return companyRepository.getAll()
  },

  deleteCompany(id: string): void {
    companyRepository.delete(id)
    addToSyncQueue('companies', 'DELETE', { id })
    
    const companies = companyRepository.getAll()
    useCompanyStore.getState().setCompanies(companies)
  }
}
