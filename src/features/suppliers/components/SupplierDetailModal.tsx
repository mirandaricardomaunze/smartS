import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native'
import DetailModalLayout, { DetailStat, DetailSectionItem } from '@/components/ui/DetailModalLayout'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import { 
  Building2, 
  User,
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Package, 
  AlertTriangle,
  PhoneCall,
  Edit2,
  ShoppingCart,
  TrendingUp
} from 'lucide-react-native'
import { feedback } from '@/utils/haptics'
import { useSupplierDetails } from '../hooks/useSupplierDetails'

interface SupplierDetailModalProps {
  visible: boolean
  onClose: () => void
  supplierId: string | null
  onEdit?: () => void
}

export default function SupplierDetailModal({ visible, onClose, supplierId, onEdit }: SupplierDetailModalProps) {
  const { supplier, productsCount, lowStockProducts, isLoading } = useSupplierDetails(supplierId)

  const handleCall = () => {
    if (supplier?.phone) {
      feedback.light()
      Linking.openURL(`tel:${supplier.phone}`)
    }
  }

  const stats = useMemo(() => {
    if (!supplier) return []
    return [
      { 
        label: 'Produtos', 
        value: productsCount, 
        icon: Package, 
        variant: 'info' 
      },
      { 
        label: 'Compras', 
        value: '0.00 Mt', 
        icon: TrendingUp, 
        variant: 'success' 
      },
      { 
        label: 'Stock Baixo', 
        value: lowStockProducts.length, 
        icon: AlertTriangle, 
        variant: lowStockProducts.length > 0 ? 'danger' : 'neutral'
      }
    ] as DetailStat[]
  }, [supplier, productsCount, lowStockProducts.length])

  const sections = useMemo(() => {
    if (!supplier) return []
    return [
      { icon: User, label: 'Contacto Principal', value: supplier.contact_name },
      { 
        icon: Phone, 
        label: 'Telemóvel', 
        value: supplier.phone, 
        action: handleCall,
        actionIcon: PhoneCall 
      },
      { 
        icon: Mail, 
        label: 'Email', 
        value: supplier.email, 
        action: supplier.email ? () => Linking.openURL(`mailto:${supplier.email}`) : undefined,
        actionIcon: Mail 
      },
      { icon: CreditCard, label: 'NIF / Tax ID', value: supplier.nif },
      { icon: MapPin, label: 'Endereço', value: supplier.address }
    ] as DetailSectionItem[]
  }, [supplier])

  if (!visible) return null

  if (isLoading && !supplier) {
    return (
      <DetailModalLayout visible={visible} onClose={onClose} title="A carregar..." height={0.5}>
        <Loading message="A carregar fornecedor..." />
      </DetailModalLayout>
    )
  }

  if (!supplier && !isLoading) {
    return (
      <DetailModalLayout visible={visible} onClose={onClose} title="Erro" height={0.4}>
        <View className="items-center justify-center p-10">
          <AlertTriangle size={48} color="#f43f5e" />
          <Text className="text-slate-400 mt-4 text-center">Fornecedor não encontrado ou removido.</Text>
        </View>
      </DetailModalLayout>
    )
  }

  const currentSupplier = supplier!

  return (
    <DetailModalLayout
      visible={visible}
      onClose={onClose}
      title={currentSupplier.name}
      height={0.85}
      headerIcon={
        <View className="w-14 h-14 rounded-3xl bg-amber-500 items-center justify-center shadow-lg shadow-amber-500/30">
          <Building2 size={28} color="white" />
        </View>
      }
      headerBadge={{ label: 'Fornecedor Activo', variant: 'info' }}
      secondaryBadge={productsCount > 10 ? { label: 'Principal', variant: 'success' } : undefined}
      stats={stats}
      sections={sections}
      footerActions={
        <View className="flex-row w-full items-center">
          <View className="flex-1 mr-3">
            <Button 
              title="Ligar"
              variant="secondary"
              fullWidth={true}
              icon={<PhoneCall size={16} color="white" />}
              onPress={handleCall}
              className="bg-amber-500 border-transparent rounded-2xl h-14"
              textStyle={{ fontSize: 11, textTransform: 'uppercase' }}
              disabled={!currentSupplier.phone}
            />
          </View>
          <View className="flex-[1.5]">
            <Button 
              title="Editar Cadastro"
              variant="primary"
              fullWidth={true}
              icon={<Edit2 size={16} color="white" />}
              onPress={() => { onClose(); onEdit?.() }}
              className="rounded-2xl h-14"
              textStyle={{ fontSize: 11, textTransform: 'uppercase' }}
            />
          </View>
        </View>
      }
    >
      {/* Low Stock Alerts List */}
      {lowStockProducts.length > 0 && (
        <View className="mb-8">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-3 ml-1">
            Reposição Urgente
          </Text>
          {lowStockProducts.map((product) => (
            <View key={product.id} className="bg-rose-50 dark:bg-rose-500/5 p-4 rounded-3xl mb-2 flex-row items-center border border-rose-100 dark:border-rose-500/10">
               <View className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-sm">
                  <Package size={18} color="#f43f5e" />
               </View>
               <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-bold text-sm" numberOfLines={1}>{product.name}</Text>
                  <Text className="text-rose-500 text-[10px] font-bold">Stock: {product.current_stock} / Min: {product.minimum_stock}</Text>
               </View>
               <TouchableOpacity className="w-8 h-8 rounded-full bg-rose-500 items-center justify-center">
                  <ShoppingCart size={14} color="white" />
               </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </DetailModalLayout>
  )
}
