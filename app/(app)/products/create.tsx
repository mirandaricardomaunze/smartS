import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useCompanyStore } from '@/store/companyStore'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { productsRepository } from '@/repositories/productsRepository'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import FormField from '@/components/forms/FormField'
import Card from '@/components/ui/Card'
import { Plus, Trash2, Calendar, Hash, DollarSign, Percent, Tag, Truck, ScanLine, XCircle, ChevronDown } from 'lucide-react-native'
import { feedback } from '@/utils/haptics'
import { useFormatter } from '@/hooks/useFormatter'
import PickerModal from '@/components/ui/PickerModal'
import DatePicker from '@/components/ui/DatePicker'
import { useToastStore } from '@/store/useToastStore'
import { useCategories } from '@/features/products/hooks/useCategories'
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Modal, StyleSheet } from 'react-native'
import CategoryFormModal from '@/features/products/components/CategoryFormModal'
import SupplierFormModal from '@/features/suppliers/components/SupplierFormModal'

interface ExpiryBatch {
  lot_number: string
  expiry_date: string
  quantity: string
}

export default function CreateProductScreen() {
  const router = useRouter()
  const { createProduct } = useProducts()
  const { activeCompanyId } = useCompanyStore()
  const { canAdd, limitMessage } = usePlanLimits()
  const { barcode } = useLocalSearchParams<{ barcode: string }>()
  const { formatCurrency } = useFormatter()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: barcode || '',
    category_id: '',
    category_name: '',
    supplier_id: '',
    supplier_name: '',
    unit: 'un',
    minimum_stock: '0',
    purchase_price: '0',
    sale_price: '0',
    tax_rate: '0',
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

  React.useEffect(() => {
    fetchCategories()
    fetchSuppliers()
  }, [])

  const categoryOptions = useMemo(() => 
    categories.map(c => ({ label: c.name, value: c.id })),
  [categories])

  const supplierOptions = useMemo(() => 
    suppliers.map(s => ({ label: s.name, value: s.id })),
  [suppliers])

  const [batches, setBatches] = useState<ExpiryBatch[]>([])

  const totalBatchStock = useMemo(() => {
    return batches.reduce((sum, batch) => sum + (parseInt(batch.quantity) || 0), 0)
  }, [batches])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addBatch = () => {
    feedback.light()
    setBatches(prev => [...prev, { lot_number: '', expiry_date: '', quantity: '' }])
  }

  const removeBatch = (index: number) => {
    feedback.medium()
    setBatches(prev => prev.filter((_, i) => i !== index))
  }

  const updateBatch = (index: number, field: keyof ExpiryBatch, value: string) => {
    setBatches(prev => {
      const newBatches = [...prev]
      newBatches[index] = { ...newBatches[index], [field]: value }
      return newBatches
    })
  }

  const requestCameraPermission = async () => {
    const { granted } = await requestPermission()
    if (granted) {
      setIsScanning(true)
    } else {
      showToast('Nenhuma câmara detetada', 'error')
    }
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setIsScanning(false)
    handleChange('barcode', data)
    feedback.success()
  }

  const handleSave = async () => {
    if (!activeCompanyId) {
      showToast('Nenhuma empresa activa. Reinicie a aplicação.', 'error')
      return
    }

    // Verificar limite de produtos do plano
    const currentProductCount = productsRepository.getAll(activeCompanyId, 99999, 0).length
    if (!canAdd('maxProducts', currentProductCount)) {
      showToast(limitMessage('maxProducts'), 'warning')
      router.push('/(app)/settings/subscription')
      return
    }

    if (!formData.name || !formData.sku || !formData.category_id) {
      showToast('Por favor, preencha todos os campos obrigatórios (Nome, SKU, Categoria).', 'warning')
      return
    }

    // Validate batches
    for (const batch of batches) {
      if (!batch.lot_number || !batch.expiry_date || !batch.quantity) {
        showToast('Preencha todos os campos nos lotes de validade.', 'warning')
        return
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(batch.expiry_date)) {
        showToast('As datas de validade devem estar no formato AAAA-MM-DD.', 'warning')
        return
      }
    }

    try {
      setIsSubmitting(true)
      await createProduct({
        company_id: activeCompanyId,
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || null,
        reference: null,
        category_id: formData.category_id,
        category: formData.category_name,
        brand: null,
        unit: formData.unit,
        units_per_box: null,
        boxes_per_pallet: null,
        minimum_stock: parseInt(formData.minimum_stock) || 0,
        current_stock: totalBatchStock,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        supplier_id: formData.supplier_id || null,
        description: null,
        image_url: null,
        is_active: 1,
      }, batches)
      
      showToast('Produto criado com sucesso', 'success')
      router.back()
    } catch (e: any) {
      showToast(e.message || 'Falha ao criar produto', 'error')
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

  return (
    <Screen padHorizontal={false} className="bg-slate-50 dark:bg-slate-900">
      <Header title="Novo Produto" showBack />
      
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-20">
        <View className="space-y-6">
          {/* Informações Básicas */}
          <View>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Informações Básicas</Text>
            <Card variant="default" className="p-5 border-none shadow-sm">
              <FormField
                label="Nome do Produto *"
                placeholder="Ex: Arroz Agulha 1kg"
                value={formData.name}
                onChangeText={(v) => handleChange('name', v)}
              />
              
              <View className="flex-row justify-between">
                <View className="flex-1 pr-2">
                  <FormField
                    label="SKU *"
                    placeholder="Cód. Interno"
                    value={formData.sku}
                    onChangeText={(v) => handleChange('sku', v)}
                    autoCapitalize="characters"
                  />
                </View>
                <View className="flex-1 pl-2">
                  <FormField
                    label="Código de Barras"
                    placeholder="Ex: 560..."
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
                    placeholder="un, kg, L"
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
            </Card>
          </View>

          {/* Preços e Impostos */}
          <View>
            <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Preços e Impostos</Text>
            <Card variant="default" className="p-5 border-none shadow-sm">
              <View className="flex-row justify-between">
                <View className="flex-1 pr-2">
                  <FormField
                    label="Preço Custo"
                    placeholder="0.00"
                    value={formData.purchase_price}
                    onChangeText={(v) => handleChange('purchase_price', v)}
                    keyboardType="numeric"
                    icon={<DollarSign size={16} color="#94a3b8" />}
                  />
                </View>
                <View className="flex-1 pl-2">
                  <FormField
                    label="Preço Venda"
                    placeholder="0.00"
                    value={formData.sale_price}
                    onChangeText={(v) => handleChange('sale_price', v)}
                    keyboardType="numeric"
                    icon={<DollarSign size={16} color="#4f46e5" />}
                  />
                </View>
              </View>

              <FormField
                label="Taxa de IVA (%)"
                placeholder="Ex: 23"
                value={formData.tax_rate}
                onChangeText={(v) => handleChange('tax_rate', v)}
                keyboardType="numeric"
                icon={<Percent size={16} color="#94a3b8" />}
              />
            </Card>
          </View>

          {/* Tabela de Validades (Lotes) */}
          <View>
            <View className="flex-row justify-between items-center mb-4 px-1">
              <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-slate-400 uppercase tracking-widest">Tabela de Validades</Text>
              <TouchableOpacity 
                onPress={addBatch}
                className="flex-row items-center bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20"
              >
                <Plus size={14} color="#6366f1" className="mr-1" />
                <Text className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">Adicionar Lote</Text>
              </TouchableOpacity>
            </View>

            {batches.length > 0 ? (
              <View className="space-y-3">
                {batches.map((batch, index) => (
                  <Card key={index} variant="default" className="p-4 border-none shadow-sm">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-bold text-slate-500 uppercase">Lote #{index + 1}</Text>
                      <TouchableOpacity onPress={() => removeBatch(index)}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <View className="flex-row justify-between">
                       <View className="flex-1 pr-2">
                          <FormField
                            label="Nº Lote"
                            placeholder="Ex: L001"
                            value={batch.lot_number}
                            onChangeText={(v) => updateBatch(index, 'lot_number', v)}
                            icon={<Hash size={14} color="#94a3b8" />}
                          />
                       </View>
                       <View className="flex-[1.5] px-1">
                          <DatePicker
                            label="Validade"
                            value={batch.expiry_date}
                            onChange={(v) => updateBatch(index, 'expiry_date', v)}
                          />
                       </View>
                       <View className="w-1/4 pl-2">
                          <FormField
                            label="Qtd"
                            placeholder="0"
                            value={batch.quantity}
                            onChangeText={(v) => updateBatch(index, 'quantity', v)}
                            keyboardType="numeric"
                          />
                       </View>
                    </View>
                  </Card>
                ))}
                
                <View className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 items-center">
                  <Text className="text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                    Stock Inicial Total: {totalBatchStock} {formData.unit}
                  </Text>
                </View>
              </View>
            ) : (
              <Card variant="glass" glassIntensity={5} className="p-8 items-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                <Calendar size={32} color="#94a3b8" className="mb-2 opacity-50" />
                <Text className="text-slate-400 text-center text-xs font-medium">Nenhum lote de validade adicionado.{"\n"}O stock inicial será Zero.</Text>
              </Card>
            )}
          </View>

          <Button 
            variant="gradient"
            gradientColors={['#4f46e5', '#6366f1']}
            title="Criar Produto e Lotes" 
            onPress={handleSave} 
            isLoading={isSubmitting}
            className="h-14 mt-4 shadow-lg shadow-indigo-500/30"
          />
        </View>
      </ScrollView>

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
