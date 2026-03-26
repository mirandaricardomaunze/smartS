import { useState, useCallback } from 'react'
import { categoryRepository } from '@/repositories/categoryRepository'
import { Category } from '@/types'
import { useCompanyStore } from '@/store/companyStore'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const activeCompanyId = useCompanyStore(state => state.activeCompanyId)

  const fetchCategories = useCallback(() => {
    if (!activeCompanyId) return
    setIsLoading(true)
    try {
      const data = categoryRepository.getAll(activeCompanyId)
      setCategories(data)
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId])

  const createCategory = async (data: Omit<Category, 'id' | 'created_at' | 'synced'>) => {
    const newCategory = categoryRepository.create(data)
    fetchCategories()
    return newCategory
  }

  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (activeCompanyId) {
      categoryRepository.update(activeCompanyId, id, data)
      fetchCategories()
    }
  }

  const deleteCategory = async (id: string) => {
    if (activeCompanyId) {
      categoryRepository.delete(activeCompanyId, id)
      fetchCategories()
    }
  }

  return {
    categories,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
}
