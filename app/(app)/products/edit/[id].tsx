import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useCategories } from '@/features/products/hooks/useCategories'
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers'
import PickerModal from '@/components/ui/PickerModal'
import { useToastStore } from '@/store/useToastStore'
import { Tag, Truck, Plus, ScanLine, XCircle } from 'lucide-react-native'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import FormField from '@/components/forms/FormField'
import Loading from '@/components/ui/Loading'
import { Text, TouchableOpacity, Modal, StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { feedback } from '@/utils/haptics'
import CategoryFormModal from '@/features/products/components/CategoryFormModal'
import SupplierFormModal from '@/features/suppliers/components/SupplierFormModal'
import { ChevronDown } from 'lucide-react-native'

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { products, updateProduct, isLoading: isProductsLoading } = useProducts()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    category_name: '',
    supplier_id: '',
    supplier_name: '',
    unit: '',
    minimum_stock: '',
  })

  const { categories, fetchCategories, createCategory } = useCategories()
  const { suppliers, fetchSuppliers, createSupplier } = useSuppliers()
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showSupplierPicker, setShowSupplierPicker] = useState(false)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false)
  
  const [permission, requestPermission] = useCameraPermissions()
  const showToast = useToastStore(state => state.show)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchSuppliers()
  }, [])

  const categoryOptions = React.useMemo(() => 
    categories.map(c => ({ label: c.name, value: c.id })),
  [categories])

  const supplierOptions = React.useMemo(() => 
    suppliers.map(s => ({ label: s.name, value: s.id })),
  [suppliers])

  useEffect(() => {
    if (!isProductsLoading) {
       const product = products.find(p => p.id === id)
       if (product) {
         setFormData({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            category_id: product.category_id || '',
            category_name: product.category || '',
            supplier_id: product.supplier_id || '',
            supplier_name: product.supplier || '',
            unit: product.unit,
            minimum_stock: product.minimum_stock.toString(),
         })
       } else {
         showToast('Produto não encontrado', 'error')
         router.back()
       }
    }
  }, [id, products, isProductsLoading])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.sku || !formData.category_id) {
      showToast('Por favor, preencha todos os campos obrigatórios', 'warning')
      return
    }

    try {
      setIsSubmitting(true)
      await updateProduct(id as string, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || null,
        category_id: formData.category_id,
        supplier_id: formData.supplier_id || null,
        unit: formData.unit,
        minimum_stock: parseInt(formData.minimum_stock) || 0,
      })
      showToast('Produto atualizado com sucesso', 'success')
      router.back()
    } catch (e: any) {
      showToast('Falha ao atualizar produto', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCategory = async (data: any) => {
    try {
      const newCat = await createCategory(data)
      setFormData(prev => ({ ...prev, category_id: newCat.id, category_name: newCat.name }))
      showToast('Categoria criada com sucesso', 'success')
    } catch (e) {
      showToast('Falha ao criar categoria', 'error')
    }
  }

  const handleCreateSupplier = async (data: any) => {
    try {
      const newSup = await createSupplier(data)
      setFormData(prev => ({ ...prev, supplier_id: newSup.id, supplier_name: newSup.name }))
      showToast('Fornecedor criado com sucesso', 'success')
    } catch (e) {
      showToast('Falha ao criar fornecedor', 'error')
    }
  }

  const requestCameraPermission = async () => {
    const { granted } = await requestPermission()
    if (granted) {
      setIsScanning(true)
    } else {
      showToast('Permissão de câmara negada', 'error')
    }
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setIsScanning(false)
    setFormData(prev => ({ ...prev, barcode: data }))
    feedback.success()
  }

  if (isProductsLoading) {
    return <Screen><Header title="Editar Produto" showBack /><Loading fullScreen /></Screen>
  }

  return (
    <Screen padHorizontal={false}>
      <Header title="Editar Produto" showBack />
      
      <Screen scrollable>
        <View className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
          <FormField
            label="Nome *"
            value={formData.name}
            onChangeText={(v) => handleChange('name', v)}
          />
          
          <View className="flex-row justify-between">
            <View className="flex-1 pr-2">
              <FormField
                label="SKU *"
                value={formData.sku}
                onChangeText={(v) => handleChange('sku', v)}
                autoCapitalize="characters"
              />
            </View>
            <View className="flex-1 pl-2">
              <FormField
                label="Código de Barras"
                value={formData.barcode}
                onChangeText={(v) => handleChange('barcode', v)}
                keyboardType="numeric"
                icon={
                  <TouchableOpacity onPress={requestCameraPermission}>
                    <ScanLine size={18} color="#4f46e5" />
                  </TouchableOpacity>
                }
              />
            </View>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoria *</Text>
              <TouchableOpacity 
                onPress={() => setShowNewCategoryModal(true)}
                className="bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
              >
                <Text className="text-indigo-600 text-[10px] font-bold">+ ADICIONAR</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(true)}
              className="flex-row items-center border border-slate-100 dark:border-white/5 rounded-2xl bg-white dark:bg-slate-900 px-4 h-14 shadow-premium-sm"
            >
              <Tag size={18} color="#94a3b8" className="mr-3" />
              <Text className={`flex-1 text-base ${formData.category_name ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {formData.category_name || 'Selecionar Categoria'}
              </Text>
              <ChevronDown size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">Fornecedor</Text>
              <TouchableOpacity 
                onPress={() => setShowNewSupplierModal(true)}
                className="bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
              >
                <Text className="text-indigo-600 text-[10px] font-bold">+ ADICIONAR</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowSupplierPicker(true)}
              className="flex-row items-center border border-slate-100 dark:border-white/5 rounded-2xl bg-white dark:bg-slate-900 px-4 h-14 shadow-premium-sm"
            >
              <Truck size={18} color="#94a3b8" className="mr-3" />
              <Text className={`flex-1 text-base ${formData.supplier_name ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {formData.supplier_name || 'Selecionar Fornecedor'}
              </Text>
              <ChevronDown size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1 pr-2">
              <FormField
                label="Unidade *"
                value={formData.unit}
                onChangeText={(v) => handleChange('unit', v)}
                autoCapitalize="none"
              />
            </View>
            <View className="flex-1 pl-2">
              <FormField
                label="Stock Mínimo"
                value={formData.minimum_stock}
                onChangeText={(v) => handleChange('minimum_stock', v)}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <Button 
            title="Guardar Alterações" 
            onPress={handleSave} 
            isLoading={isSubmitting}
            className="mt-4"
          />
        </View>
      </Screen>

      <PickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Selecionar Categoria"
        options={categoryOptions}
        selectedValue={formData.category_id}
        onSelect={(val) => {
          const cat = categories.find(c => c.id === val)
          setFormData(prev => ({ ...prev, category_id: val, category_name: cat?.name || '' }))
        }}
      />

      <PickerModal
        visible={showSupplierPicker}
        onClose={() => setShowSupplierPicker(false)}
        title="Selecionar Fornecedor"
        options={supplierOptions}
        selectedValue={formData.supplier_id}
        onSelect={(val) => {
          const sup = suppliers.find(s => s.id === val)
          setFormData(prev => ({ ...prev, supplier_id: val, supplier_name: sup?.name || '' }))
        }}
      />

      <CategoryFormModal
        visible={showNewCategoryModal}
        onClose={() => setShowNewCategoryModal(false)}
        onSubmit={handleCreateCategory}
      />

      <SupplierFormModal
        visible={showNewSupplierModal}
        onClose={() => setShowNewSupplierModal(false)}
        onSubmit={handleCreateSupplier}
      />

      <Modal visible={isScanning} animationType="slide">
        <View className="flex-1 bg-black">
          <CameraView
            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="absolute top-12 left-6 right-6 flex-row justify-between items-center">
             <TouchableOpacity 
               onPress={() => setIsScanning(false)}
               className="w-12 h-12 bg-black/50 rounded-2xl items-center justify-center border border-white/20"
             >
               <XCircle size={24} color="white" />
             </TouchableOpacity>
             <Text className="text-white font-bold text-lg">Digitalizar Produto</Text>
             <View className="w-12" />
          </View>
          
          <View className="absolute bottom-20 left-10 right-10 items-center">
             <View className="w-64 h-64 border-2 border-indigo-500 rounded-3xl items-center justify-center">
                <View className="w-full h-0.5 bg-indigo-500/50 shadow-sm shadow-indigo-500" />
             </View>
          </View>
        </View>
      </Modal>
    </Screen>
  )
}
