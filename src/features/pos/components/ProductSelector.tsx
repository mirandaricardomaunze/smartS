import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native'
import { Search, Filter, Barcode, PackagePlus, X } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useCategories } from '@/features/products/hooks/useCategories'
import { usePOSStore } from '../store/posStore'
import { Product } from '@/types'
import { useFormatter } from '@/hooks/useFormatter'
import { feedback } from '@/utils/haptics'
import GenericItemModal from './GenericItemModal'

export default function ProductSelector() {
  const { products } = useProducts()
  const { categories, fetchCategories } = useCategories()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showGenericModal, setShowGenericModal] = useState(false)
  
  const addToCart = usePOSStore((state) => state.addToCart)
  const { formatCurrency } = useFormatter()

  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery) ||
        (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    
    // Auto-add on exact Barcode or SKU match
    if (text.length >= 4) {
      const match = products.find(p => p.barcode === text || p.sku === text)
      if (match) {
        feedback.success()
        addToCart(match)
        setSearchQuery('')
      }
    }
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => addToCart(item)}
      className="w-[48%] mb-4"
    >
      <Card className="p-0 border-0 shadow-premium-sm bg-white dark:bg-slate-900">
        <View className="h-32 bg-slate-100 dark:bg-slate-800 items-center justify-center">
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Barcode size={32} color="#64748b" />
          )}
        </View>
        <View className="p-3">
          <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1" numberOfLines={1}>
            {item.name}
          </Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-[10px] text-slate-500 dark:text-slate-400 mr-2">
              SKU: {item.sku}
            </Text>
            {item.reference && (
              <View className="bg-primary/10 px-1 rounded">
                <Text className="text-[8px] font-bold text-primary">REF: {item.reference}</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-primary font-bold">
              {formatCurrency(item.sale_price || 0)}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${
              item.current_stock <= 0 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : item.current_stock <= item.minimum_stock 
                  ? 'bg-amber-100 dark:bg-amber-900/30' 
                  : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <Text className={`text-[10px] font-bold ${
                item.current_stock <= 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : item.current_stock <= item.minimum_stock 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-green-600 dark:text-green-400'
              }`}>
                {item.current_stock}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )

  return (
    <View className="flex-1 px-4 pt-6">
      <View className="flex-row items-start mb-4">
        <View className="flex-1">
          <Input
            placeholder="Procurar produto ou código..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            icon={<Search size={20} color="#64748b" />}
            className="mb-0"
          />
        </View>
        <TouchableOpacity 
          onPress={() => setShowGenericModal(true)}
          className="ml-2 h-14 w-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl items-center justify-center border border-indigo-100 dark:border-indigo-900/30"
        >
          <PackagePlus size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Scroll */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <TouchableOpacity 
            onPress={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full mr-2 border ${!selectedCategory ? 'bg-primary border-primary' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
          >
            <Text className={`text-xs font-bold ${!selectedCategory ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>Todos</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full mr-2 border ${selectedCategory === cat.id ? 'bg-primary border-primary' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
            >
              <Text className={`text-xs font-bold ${selectedCategory === cat.id ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <Text className="text-slate-500 dark:text-slate-400">Nenhum produto encontrado</Text>
          </View>
        }
      />

      <GenericItemModal 
        isVisible={showGenericModal} 
        onClose={() => setShowGenericModal(false)} 
      />
    </View>
  )
}
