import React, { useState, useEffect, useMemo } from 'react'
import { Modal, View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { X, ScanLine, ChevronDown, Tag, Truck } from 'lucide-react-native'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PickerModal from '@/components/ui/PickerModal'
import DatePicker from '@/components/ui/DatePicker'
import { Product } from '@/types'
import { feedback } from '@/utils/haptics'
import { useToastStore } from '@/store/useToastStore'
import { Camera, CameraView, useCameraPermissions } from 'expo-camera'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { getCurrencySymbol } from '@/utils/formatters'
import BottomSheet from '@/components/ui/BottomSheet'
import { useCategories } from '../hooks/useCategories'
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers'
import CategoryFormModal from './CategoryFormModal'
import SupplierFormModal from '@/features/suppliers/components/SupplierFormModal'

interface ProductFormModalProps {
  visible: boolean
  onClose: () => void
  onSave: (data: Partial<Product>) => Promise<void>
  initialData?: Product | null
  title?: string
}

export default function ProductFormModal({ 
  visible, 
  onClose, 
  onSave, 
  initialData = null,
  title
}: ProductFormModalProps) {
  const { settings } = useSettings()
  const currencySymbol = getCurrencySymbol(settings.currency)
  const { categories, fetchCategories, createCategory } = useCategories()
  const { suppliers, fetchSuppliers, createSupplier } = useSuppliers()

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    category_name: '',
    supplier_id: '',
    supplier_name: '',
    unit: 'un',
    minimum_stock: '0',
    current_stock: '0',
    purchase_price: '0',
    sale_price: '0',
    tax_rate: '17',
    expiry_date: '',
  })

  const [permission, requestPermission] = useCameraPermissions()
  const [isScanning, setIsScanning] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showSupplierPicker, setShowSupplierPicker] = useState(false)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (visible) {
      fetchCategories()
      fetchSuppliers()
    }
  }, [visible])

  useEffect(() => {
    if (visible && initialData) {
      setFormData({
        name: initialData.name,
        sku: initialData.sku,
        barcode: initialData.barcode || '',
        category_id: initialData.category_id || '',
        category_name: initialData.category || '',
        supplier_id: initialData.supplier_id || '',
        supplier_name: initialData.supplier || '',
        unit: initialData.unit,
        minimum_stock: initialData.minimum_stock.toString(),
        current_stock: initialData.current_stock?.toString() || '0',
        purchase_price: initialData.purchase_price?.toString() || '0',
        sale_price: initialData.sale_price?.toString() || '0',
        tax_rate: initialData.tax_rate?.toString() || '17',
        expiry_date: initialData.expiry_date || '',
      })
      setErrors({})
    } else if (visible && !initialData) {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category_id: '',
        category_name: '',
        supplier_id: '',
        supplier_name: '',
        unit: 'un',
        minimum_stock: '0',
        current_stock: '0',
        purchase_price: '0',
        sale_price: '0',
        tax_rate: '17',
        expiry_date: '',
      })
      setErrors({})
    }
  }, [visible, initialData])

  const categoryOptions = useMemo(() => 
    categories.map(c => ({ label: c.name, value: c.id })),
  [categories])

  const supplierOptions = useMemo(() => 
    suppliers.map(s => ({ label: s.name, value: s.id })),
  [suppliers])

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
    handleChange('barcode', data)
    feedback.success()
    showToast('Código lido: ' + data, 'success')
  }

  const handleCreateCategory = async (data: any) => {
    try {
      const newCat = await createCategory(data)
      setFormData(prev => ({ 
        ...prev, 
        category_id: newCat.id, 
        category_name: newCat.name 
      }))
      showToast('Categoria criada com sucesso', 'success')
      fetchCategories()
    } catch (error) {
       showToast('Erro ao criar categoria', 'error')
    }
  }

  const handleCreateSupplier = async (data: any) => {
    try {
      const newSup = await createSupplier(data)
      setFormData(prev => ({ 
        ...prev, 
        supplier_id: newSup.id, 
        supplier_name: newSup.name 
      }))
      showToast('Fornecedor criado com sucesso', 'success')
      fetchSuppliers()
    } catch (error) {
       showToast('Erro ao criar fornecedor', 'error')
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório'
    if (!formData.sku.trim()) newErrors.sku = 'O SKU é obrigatório'
    if (!formData.category_id) newErrors.category_id = 'A categoria é obrigatória'
    if (!formData.unit.trim()) newErrors.unit = 'A unidade é obrigatória'
    
    if (isNaN(Number(formData.minimum_stock))) newErrors.minimum_stock = 'Deve ser um número'
    if (isNaN(Number(formData.current_stock))) newErrors.current_stock = 'Deve ser um número'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const showToast = useToastStore((state) => state.show)

  const handleSave = async () => {
    if (!validate()) {
      feedback.warning()
      showToast('Por favor, corrija os erros', 'warning')
      return
    }

    try {
      feedback.medium()
      setIsSubmitting(true)
      await onSave({
        ...formData,
        barcode: formData.barcode || null,
        minimum_stock: parseInt(formData.minimum_stock) || 0,
        current_stock: parseInt(formData.current_stock) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        expiry_date: formData.expiry_date || null,
        is_active: initialData ? initialData.is_active : 1
      } as Partial<Product>)
      feedback.success()
      showToast(initialData ? 'Produto atualizado' : 'Produto criado', 'success')
      onClose()
    } catch (error) {
      feedback.error()
      showToast('Erro ao guardar produto', 'error')
      console.error('Failed to save product:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const FieldTrigger = ({ label, value, placeholder, icon, onPress, onAdd, error }: any) => (
    <View className="w-full mb-6">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Text>
        {onAdd && (
          <TouchableOpacity 
            onPress={onAdd}
            className="bg-primary/10 px-2 py-1 rounded-lg border border-primary/20"
          >
            <Text className="text-primary text-[10px] font-bold">+ ADICIONAR</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center border rounded-2xl bg-white dark:bg-slate-900 ${
          error ? 'border-red-500' : 'border-slate-100 dark:border-white/5 shadow-premium-sm'
        } px-4 h-14`}
      >
        <View className="mr-3">{icon}</View>
        <Text className={`flex-1 text-base font-medium ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color="#94a3b8" />
      </TouchableOpacity>
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  )

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={onClose}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="bg-white dark:bg-slate-950 flex-1 overflow-hidden">
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-5">
                <Text style={{ fontFamily: 'Inter-Black' }} className="text-2xl font-black text-slate-900 dark:text-white">
                  {title || (initialData ? 'Editar Produto' : 'Novo Produto')}
                </Text>
                <TouchableOpacity 
                  onPress={onClose}
                  className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center border border-primary/20 dark:border-primary/30"
                >
                  <X size={20} color="#4f46e5" />
                </TouchableOpacity>
            </View>

            <ScrollView 
              className="flex-1 px-6 pt-2" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <View className="mb-6">
                <Input
                  label="Nome do Produto *"
                  placeholder="Ex: iPhone 15 Pro Max"
                  value={formData.name}
                  onChangeText={(v) => handleChange('name', v)}
                  error={errors.name}
                />
              </View>

              <View className="flex-row mb-6">
                <View className="flex-1 pr-2">
                  <Input
                    label="SKU / Código *"
                    placeholder="Ex: APP-IPH-15"
                    value={formData.sku}
                    onChangeText={(v) => handleChange('sku', v)}
                    error={errors.sku}
                  />
                </View>
                <View className="flex-1 pl-2">
                  <Input
                    label="Código de Barras"
                    placeholder="Digitalizar ou digitar"
                    value={formData.barcode}
                    onChangeText={(v) => handleChange('barcode', v)}
                    icon={
                      <TouchableOpacity onPress={requestCameraPermission}>
                        <ScanLine size={20} color="#4f46e5" />
                      </TouchableOpacity>
                    }
                  />
                </View>
              </View>

              <View className="flex-row">
                <View className="flex-1 pr-2">
                  <FieldTrigger
                    label="Categoria *"
                    placeholder="Selecionar categoria"
                    value={formData.category_name}
                    icon={<Tag size={20} color={formData.category_id ? "#4f46e5" : "#94a3b8"} />}
                    onPress={() => setShowCategoryPicker(true)}
                    onAdd={() => setShowNewCategoryModal(true)}
                    error={errors.category_id}
                  />
                </View>
                <View className="flex-1 pl-2">
                  <FieldTrigger
                    label="Fornecedor"
                    placeholder="Selecionar fornecedor"
                    value={formData.supplier_name}
                    icon={<Truck size={20} color={formData.supplier_id ? "#4f46e5" : "#94a3b8"} />}
                    onPress={() => setShowSupplierPicker(true)}
                    onAdd={() => setShowNewSupplierModal(true)}
                  />
                </View>
              </View>

              <View className="flex-row mb-6">
                <View className="flex-1 pr-2">
                  <Input
                    label="Unidade *"
                    placeholder="Ex: un, kg, cx"
                    value={formData.unit}
                    onChangeText={(v) => handleChange('unit', v)}
                    error={errors.unit}
                  />
                </View>
                <View className="flex-1 pl-2">
                   <DatePicker
                    label="Data de Validade"
                    value={formData.expiry_date}
                    onChange={(v) => handleChange('expiry_date', v)}
                  />
                </View>
              </View>

              <View className="flex-row mb-6">
                <View className="flex-1 pr-2">
                  <Input
                    label="Preço de Compra *"
                    placeholder="0.00"
                    value={formData.purchase_price}
                    onChangeText={(v) => handleChange('purchase_price', v)}
                    keyboardType="numeric"
                    icon={<Text className="text-slate-400 font-bold">{currencySymbol}</Text>}
                  />
                </View>
                <View className="flex-1 pl-2">
                  <Input
                    label="Preço de Venda *"
                    placeholder="0.00"
                    value={formData.sale_price}
                    onChangeText={(v) => handleChange('sale_price', v)}
                    keyboardType="numeric"
                    icon={<Text className="text-slate-400 font-bold">{currencySymbol}</Text>}
                  />
                </View>
              </View>

              <View className="flex-row mb-6">
                <View className="flex-1 pr-2">
                   <Input
                    label="Taxa IVA (%)"
                    placeholder="17"
                    value={formData.tax_rate}
                    onChangeText={(v) => handleChange('tax_rate', v)}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1 pl-2">
                  {/* Additional field space if needed */}
                </View>
              </View>

              <View className="flex-row mb-8">
                <View className="flex-1 pr-2">
                  <Input
                    label="Stock Atual"
                    placeholder="0"
                    value={formData.current_stock}
                    onChangeText={(v) => handleChange('current_stock', v)}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1 pl-2">
                  <Input
                    label="Stock Mínimo"
                    placeholder="0"
                    value={formData.minimum_stock}
                    onChangeText={(v) => handleChange('minimum_stock', v)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View className="h-20" />
            </ScrollView>

            <View className="px-6 pt-6 pb-12 bg-white dark:bg-slate-950">
              <Button 
                variant="gradient"
                gradientColors={['#4f46e5', '#4338ca']}
                title={initialData ? "Guardar Alterações" : "Criar Produto"} 
                onPress={handleSave}
                isLoading={isSubmitting}
                className="h-14 rounded-2xl shadow-lg shadow-primary/30"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* Barcode Scanner Overlay */}
      <Modal visible={isScanning} animationType="fade" transparent={false}>
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
               <X size={24} color="white" />
             </TouchableOpacity>
             <Text className="text-white font-bold text-lg">Digitalizar Código</Text>
             <View className="w-12" />
          </View>
          
          <View className="absolute bottom-20 left-10 right-10 items-center">
             <View className="w-64 h-64 border-2 border-primary rounded-3xl items-center justify-center">
                <View className="w-full h-0.5 bg-primary/50 shadow-sm shadow-primary" />
             </View>
             <Text className="text-slate-400 mt-8 text-center px-4">
                Posicione o código de barras dentro da moldura para digitalizar automaticamente.
             </Text>
          </View>
        </View>
      </Modal>

      <PickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Selecionar Categoria"
        options={categoryOptions}
        selectedValue={formData.category_id}
        onSelect={(val) => {
          const category = categories.find(c => c.id === val)
          setFormData(prev => ({ ...prev, category_id: val, category_name: category?.name || '' }))
          if (errors.category_id) {
            setErrors(prev => {
              const newErrors = { ...prev }
              delete newErrors.category_id
              return newErrors
            })
          }
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
    </>
  )
}
