import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, Linking } from 'react-native'
import { useColorScheme } from 'nativewind'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Check, Crown, Zap, Building2, MessageSquare,
  AlertCircle, CreditCard, Smartphone, Copy
} from 'lucide-react-native'
import { router } from 'expo-router'
import * as Clipboard from 'expo-clipboard'

import { useFormatter } from '@/hooks/useFormatter'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
import { feedback } from '@/utils/haptics'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useToastStore } from '@/store/useToastStore'
import { PlanType } from '@/types'

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'BASIC' as PlanType,
    name: 'Essencial',
    price: 600,
    icon: <Zap size={24} color="#6366f1" />,
    color: '#6366f1',
    features: [
      'Gestão de Inventário & Stock',
      'Registo de 500 Produtos',
      'Leitor de Código de Barras',
      '1 Utilizador (Operador)',
      'Backup de Dados Local',
      'Histórico de Movimentos',
    ],
  },
  {
    id: 'PRO' as PlanType,
    name: 'Profissional',
    price: 2000,
    icon: <Crown size={24} color="#f59e0b" />,
    color: '#f59e0b',
    popular: true,
    features: [
      'Tudo no Essencial',
      'Produtos Ilimitados',
      'Relatórios PDF & Excel',
      'Gestão de Validades & Lotes',
      'Sincronização Cloud',
      'Até 5 Utilizadores + Permissões',
    ],
  },
  {
    id: 'ELITE' as PlanType,
    name: 'Elite',
    price: null, // Custom
    icon: <Building2 size={24} color="#10b981" />,
    color: '#10b981',
    features: [
      'Tudo no Profissional',
      'Multi-empresa / Multi-loja',
      'Gestão de RH & Vendedores',
      'Dashboard & KPIs Avançados',
      'Auditoria de Sistema Completa',
      'Utilizadores Ilimitados',
      'Suporte VIP 24/7',
    ],
  },
]

// ─── Payment method config ────────────────────────────────────────────────────

type PaymentMethod = 'mpesa' | 'visa'

const PAYMENT_CONFIG = {
  mpesa: {
    name: 'M-Pesa',
    holder: 'Miranda Ricardo Maunze',
    number: '847750120',
    reference: 'SmartS',
    instructions: 'Envie o valor exacto para o número acima. Após a transferência, envie o comprovativo via WhatsApp.',
  },
  visa: {
    name: 'Cartão / Banco',
    bank: 'Millennium BIM',
    holder: 'Miranda Ricardo Maunze',
    iban: 'MZ59 0001 0000 0000 0000 0000 0',
    nib: '0001.0000.0000000000000.00',
    instructions: 'Faça a transferência bancária com o seu cartão Visa/Mastercard ou por internet banking. Use o seu nome como referência.',
  },
}

const WHATSAPP_NUMBER = '258847750120'
const SUPPORT_EMAIL = 'mirandaricardomaunze@gmail.com'

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChoosePlanScreen() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { user } = useAuthStore()
  const { status, plan: currentPlan } = useSubscription()
  const { formatCurrency } = useFormatter()
  const { show: showToast } = useToastStore()

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa')

  const handleSelectPlan = (planId: PlanType) => {
    const plan = PLANS.find(p => p.id === planId)
    if (!plan) return
    setSelectedPlan(plan)
    setPaymentMethod('mpesa')
    setShowPaymentModal(true)
    feedback.light()
  }

  const handleConfirmPayment = () => {
    if (!selectedPlan) return
    setShowPaymentModal(false)
    feedback.success()

    const method = paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cartão/Banco'
    const message =
      `Olá! Efectuei o pagamento do plano *${selectedPlan.name}* (${method}) no SmartS.\n` +
      `Conta: ${user?.email ?? ''}\n` +
      `Aguardo a activação. Obrigado!`

    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`
    Linking.canOpenURL(url).then(supported => {
      Linking.openURL(
        supported ? url : `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
      )
    })

    setTimeout(() => setShowConfirmModal(true), 1500)
  }

  const copyToClipboard = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value)
    showToast(`${label} copiado!`, 'success')
    feedback.light()
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#0f172a]">
      <LinearGradient
        colors={isDark ? ['#0f172a', '#0f172a'] : ['#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 50, paddingBottom: 25, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        <View className="mb-4">
          <BackButton variant="glass" />
        </View>
        <Text className="text-white text-2xl font-black mb-1">Planos SmartS</Text>
        <Text className="text-indigo-100 text-xs opacity-90">Escolha o plano ideal para o seu negócio.</Text>

        {status === 'EXPIRED' && (
          <View className="mt-4 flex-row items-center bg-red-500/20 p-4 rounded-2xl border border-red-500/30">
            <AlertCircle size={20} color="#fecaca" />
            <Text className="text-red-100 text-sm font-bold ml-2 flex-1">
              O seu período experimental terminou. Escolha um plano para continuar.
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 mt-4">
          {PLANS.map((plan) => (
            <View
              key={plan.id}
              className={`mb-6 p-6 rounded-[40px] bg-white dark:bg-slate-900 border-2 ${
                plan.popular ? 'border-amber-400' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              {plan.popular && (
                <View className="absolute -top-3 right-8 bg-amber-400 px-4 py-1 rounded-full z-10">
                  <Text className="text-amber-950 text-[10px] font-black uppercase tracking-widest">Recomendado</Text>
                </View>
              )}

              <View className="flex-row items-center mb-6">
                <View className="w-12 h-12 rounded-2xl items-center justify-center bg-slate-50 dark:bg-slate-800 mr-4">
                  {plan.icon}
                </View>
                <View>
                  <Text className="text-slate-900 dark:text-white text-xl font-bold">{plan.name}</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold">
                    {plan.price != null ? `${formatCurrency(plan.price)} / mês` : 'Sob consulta'}
                  </Text>
                </View>
              </View>

              <View className="mb-6 px-1">
                {plan.features.map((feature, i) => (
                  <View key={i} className="flex-row items-center mb-3">
                    <View className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 items-center justify-center mr-3">
                      <Check size={12} color="#6366f1" strokeWidth={4} />
                    </View>
                    <Text className="text-slate-600 dark:text-slate-300 text-sm">{feature}</Text>
                  </View>
                ))}
              </View>

              <Button
                title={currentPlan === plan.id ? '✓ Plano Activo' : `Escolher ${plan.name}`}
                variant={plan.popular ? 'primary' : 'secondary'}
                onPress={() => handleSelectPlan(plan.id)}
                disabled={currentPlan === plan.id}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        className="mx-6 mb-8 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-row items-center justify-center"
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Dúvida sobre Planos SmartS`)}
      >
        <MessageSquare size={18} color="#64748b" />
        <Text className="text-slate-600 dark:text-slate-400 font-bold ml-2">Dúvidas? Fale com o suporte</Text>
      </TouchableOpacity>

      {/* ── Payment Method Modal ── */}
      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 w-full rounded-t-[40px] p-6">
            <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full self-center mb-6" />

            <Text className="text-slate-900 dark:text-white text-2xl font-black mb-1">
              Pagamento — {selectedPlan?.name}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Escolha o método de pagamento preferido.
            </Text>

            {/* Method Selector */}
            <View className="flex-row mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
              {(['mpesa', 'visa'] as PaymentMethod[]).map((method) => {
                const active = paymentMethod === method
                return (
                  <TouchableOpacity
                    key={method}
                    onPress={() => { setPaymentMethod(method); feedback.light() }}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                      active ? 'bg-white dark:bg-slate-700 shadow-sm' : ''
                    }`}
                  >
                    {method === 'mpesa'
                      ? <Smartphone size={16} color={active ? '#ef4444' : '#94a3b8'} />
                      : <CreditCard size={16} color={active ? '#4f46e5' : '#94a3b8'} />
                    }
                    <Text className={`ml-2 text-sm font-bold ${
                      active ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                    }`}>
                      {PAYMENT_CONFIG[method].name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* M-Pesa Details */}
            {paymentMethod === 'mpesa' && (
              <View className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 mb-5 border border-slate-100 dark:border-white/10">
                <_InfoRow
                  label="Titular"
                  value={PAYMENT_CONFIG.mpesa.holder}
                  onCopy={() => copyToClipboard(PAYMENT_CONFIG.mpesa.holder, 'Titular')}
                  accentColor="#ef4444"
                  letter="M"
                />
                <View className="h-px bg-slate-100 dark:bg-white/10 my-3" />
                <_InfoRow
                  label="Número"
                  value={PAYMENT_CONFIG.mpesa.number}
                  onCopy={() => copyToClipboard(PAYMENT_CONFIG.mpesa.number, 'Número')}
                  accentColor="#ef4444"
                  letter="#"
                />
              </View>
            )}

            {/* Visa / Bank Details */}
            {paymentMethod === 'visa' && (
              <View className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 mb-5 border border-slate-100 dark:border-white/10">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {PAYMENT_CONFIG.visa.bank}
                </Text>
                <_InfoRow
                  label="Titular"
                  value={PAYMENT_CONFIG.visa.holder}
                  onCopy={() => copyToClipboard(PAYMENT_CONFIG.visa.holder, 'Titular')}
                  accentColor="#4f46e5"
                  letter="V"
                />
                <View className="h-px bg-slate-100 dark:bg-white/10 my-3" />
                <_InfoRow
                  label="NIB"
                  value={PAYMENT_CONFIG.visa.nib}
                  onCopy={() => copyToClipboard(PAYMENT_CONFIG.visa.nib, 'NIB')}
                  accentColor="#4f46e5"
                  letter="B"
                />
                <View className="h-px bg-slate-100 dark:bg-white/10 my-3" />
                <_InfoRow
                  label="IBAN"
                  value={PAYMENT_CONFIG.visa.iban}
                  onCopy={() => copyToClipboard(PAYMENT_CONFIG.visa.iban, 'IBAN')}
                  accentColor="#4f46e5"
                  letter="I"
                />
              </View>
            )}

            {/* Instruction note */}
            <View className="flex-row items-start bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl mb-6 border border-amber-100 dark:border-amber-900/30">
              <AlertCircle size={16} color="#f59e0b" />
              <Text className="text-amber-800 dark:text-amber-200 text-xs font-medium ml-2 flex-1 leading-5">
                {PAYMENT_CONFIG[paymentMethod].instructions}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Cancelar" variant="ghost" onPress={() => setShowPaymentModal(false)} />
              </View>
              <View className="flex-[2]">
                <Button
                  title="Paguei → WhatsApp"
                  variant="primary"
                  icon={<MessageSquare size={18} color="white" />}
                  onPress={handleConfirmPayment}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirmation Modal ── */}
      <Modal visible={showConfirmModal} transparent animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-slate-900 w-full p-8 rounded-[32px] items-center">
            <View className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mb-6">
              <Check size={40} color="#10b981" />
            </View>
            <Text className="text-slate-900 dark:text-white text-2xl font-black text-center mb-3">
              Pedido Enviado!
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8 leading-6">
              A nossa equipa irá verificar o pagamento e activar o seu plano em até{' '}
              <Text className="font-bold text-slate-700 dark:text-slate-200">24 horas</Text>.
              Receberá uma notificação quando estiver activo.
            </Text>
            <View className="w-full">
              <Button
                title="Entendido"
                variant="primary"
                onPress={() => {
                  setShowConfirmModal(false)
                  router.replace('/(app)/dashboard')
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Helper sub-component ────────────────────────────────────────────────────

function _InfoRow({
  label, value, onCopy, accentColor, letter,
}: {
  label: string; value: string; onCopy: () => void; accentColor: string; letter: string
}) {
  return (
    <View className="flex-row items-center">
      <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: `${accentColor}20` }}>
        <Text style={{ color: accentColor }} className="font-black text-sm">{letter}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">{label}</Text>
        <Text className="text-slate-900 dark:text-white font-black text-base">{value}</Text>
      </View>
      <TouchableOpacity onPress={onCopy} className="p-2">
        <Copy size={16} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  )
}
