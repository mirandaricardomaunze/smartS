import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native'
import { useCategories } from '@/features/products/hooks/useCategories'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Loading from '@/components/ui/Loading'
import CategoryFormModal from '@/features/products/components/CategoryFormModal'
import { Plus, Tag, Search, Trash2, Edit2, ChevronRight } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import { feedback } from '@/utils/haptics'
import { Category } from '@/types'
import { useToastStore } from '@/store/useToastStore'

export default function CategoriesScreen() {
  const { categories, isLoading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories()
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const showToast = useToastStore(state => state.show)

  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.description?.toLowerCase().includes(search.toLowerCase())
    )
  }, [categories, search])

  const handleCreate = async (data: any) => {
    try {
      await createCategory(data)
      showToast('Categoria criada com sucesso', 'success')
      feedback.success()
    } catch (e) {
      showToast('Falha ao criar categoria', 'error')
    }
  }

  const handleUpdate = async (data: any) => {
    if (!selectedCategory) return
    try {
      await updateCategory(selectedCategory.id, data)
      showToast('Categoria atualizada com sucesso', 'success')
      feedback.success()
      setSelectedCategory(null)
    } catch (e) {
      showToast('Falha ao atualizar categoria', 'error')
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar Categoria',
      'Tem a certeza que deseja eliminar esta categoria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteCategory(id)
              showToast('Categoria eliminada', 'success')
              feedback.heavy()
            } catch (e) {
              showToast('Falha ao eliminar categoria', 'error')
            }
          } 
        }
      ]
    )
  }

  const renderCategory = ({ item }: { item: Category }) => (
    <Card className="mb-3 p-4 flex-row items-center justify-between border-slate-100 dark:border-slate-800">
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 items-center justify-center rounded-2xl mr-4 border border-indigo-100 dark:border-indigo-800">
          <Tag size={24} color="#6366f1" />
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-base font-bold text-slate-800 dark:text-white">
            {item.name}
          </Text>
          <Text className="text-xs text-slate-500 font-medium" numberOfLines={1}>
            {item.description || 'Sem descrição'}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity 
           onPress={() => {
             setSelectedCategory(item)
             setModalVisible(true)
           }}
           className="p-2"
        >
          <Edit2 size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2">
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </Card>
  )

  return (
    <Screen withHeader padHorizontal={false} className="bg-slate-50 dark:bg-slate-950 flex-1">
      <Header 
        title="Categorias" 
        rightElement={
          <TouchableOpacity 
            onPress={() => {
              feedback.light()
              setSelectedCategory(null)
              setModalVisible(true)
            }}
            className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center border border-white/20 active:bg-white/20"
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <View className="px-6 mb-4 mt-4">
        <Input
          placeholder="Procurar categorias..."
          value={search}
          onChangeText={setSearch}
          icon={<Search size={20} color="#94a3b8" />}
          className="bg-white dark:bg-slate-900"
        />
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pb-20"
        ListEmptyComponent={
          isLoading ? <Loading /> : <EmptyState title="Sem categorias" description="Crie categorias para organizar os seus produtos." icon={<Tag size={48} color="#cbd5e1" />} />
        }
        onRefresh={fetchCategories}
        refreshing={isLoading}
      />

      <CategoryFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={selectedCategory ? handleUpdate : handleCreate}
        initialData={selectedCategory}
      />
    </Screen>
  )
}
