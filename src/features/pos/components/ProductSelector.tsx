import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native'
import { Search, Filter, Barcode } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useProducts } from '@/features/products/hooks/useProducts'
import { usePOSStore } from '../store/posStore'
import { Product } from '@/types'
import { useFormatter } from '@/hooks/useFormatter'

export default function ProductSelector() {
  const { products } = useProducts()
  const [searchQuery, setSearchQuery] = useState('')
  const addToCart = usePOSStore((state) => state.addToCart)
  const { formatCurrency } = useFormatter()

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

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
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            SKU: {item.sku}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-primary font-bold">
              {formatCurrency(item.sale_price || 0)}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${item.current_stock > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <Text className={`text-[10px] font-bold ${item.current_stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
      <View className="flex-row items-center mb-4">
        <View className="flex-1">
          <Input
            placeholder="Procurar produto..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Search size={20} color="#64748b" />}
            className="mb-0"
          />
        </View>
        <TouchableOpacity className="ml-2 h-14 w-14 bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center">
          <Filter size={24} color="#64748b" />
        </TouchableOpacity>
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
    </View>
  )
}
