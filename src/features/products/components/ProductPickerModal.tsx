import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import { useProducts } from '@/features/products/hooks/useProducts'
import { Search, Package, Plus, X } from 'lucide-react-native'
import { useFormatter } from '@/hooks/useFormatter'
import { feedback } from '@/utils/haptics'
import { Product } from '@/types'

interface ProductPickerModalProps {
  visible: boolean
  onClose: () => void
  onSelect: (product: Product) => void
}

export default function ProductPickerModal({ visible, onClose, onSelect }: ProductPickerModalProps) {
  const { products, isLoading } = useProducts()
  const { formatCurrency } = useFormatter()
  const [search, setSearch] = useState('')

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      onPress={() => {
        feedback.success()
        onSelect(item)
      }}
    >
      <Card className="mb-3 p-3 flex-row items-center border-slate-100 dark:border-slate-800">
        <View className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl items-center justify-center mr-3 overflow-hidden">
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} className="w-full h-full" />
          ) : (
            <Package size={24} color="#94a3b8" />
          )}
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-sm font-bold text-slate-800 dark:text-white" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-[10px] text-slate-500 uppercase tracking-tighter">SKU: {item.sku}</Text>
          <View className="flex-row items-center mt-1">
             <Text style={{ fontFamily: 'Inter-Bold' }} className="text-primary dark:text-primary-dark font-bold text-xs mr-2">
               {formatCurrency(item.sale_price || 0)}
             </Text>
             {item.current_stock !== undefined && (
               <Badge 
                 label={`Qtd: ${item.current_stock}`} 
                 variant={item.current_stock <= (item.minimum_stock || 0) ? 'danger' : 'success'} 
               />
             )}
          </View>
        </View>
        <View className="ml-2 w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center">
          <Plus size={18} color="#4f46e5" />
        </View>
      </Card>
    </TouchableOpacity>
  )

  return (
    <BottomSheet visible={visible} onClose={onClose} height={0.9}>
      <View className="flex-1 bg-white dark:bg-slate-950 px-6 pt-2 pb-8">
        <View className="flex-row justify-between items-center mb-6">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xl font-bold text-slate-800 dark:text-white">
            Selecionar Produto
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Input
          placeholder="Nome, código ou SKU..."
          value={search}
          onChangeText={setSearch}
          icon={<Search size={20} color="#94a3b8" />}
          className="mb-4"
        />

        {isLoading ? (
          <Loading />
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-10"
            ListEmptyComponent={
              <View className="items-center py-20">
                <Package size={48} color="#cbd5e1" className="mb-4" />
                <Text className="text-slate-400 text-center">Nenhum produto encontrado.</Text>
              </View>
            }
          />
        )}
      </View>
    </BottomSheet>
  )
}
