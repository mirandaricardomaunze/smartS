import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import {
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  Clock,
  Plane,
  FileText,
  Edit2,
  Heart,
  Globe,
  Download,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react-native'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import EmptyState from '@/components/ui/EmptyState'
import { useEmployees } from '@/features/hr/hooks/useEmployees'
import { useAttendance } from '@/features/hr/hooks/useAttendance'
import { usePayroll } from '@/features/hr/hooks/usePayroll'
import { useLeaves } from '@/features/hr/hooks/useLeaves'
import { useFormatter } from '@/hooks/useFormatter'
import { useCountryConfig } from '@/hooks/useCountryConfig'
import { generatePayslipPDF } from '@/features/hr/utils/hrExportUtils'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { feedback } from '@/utils/haptics'
import { Attendance, Leave } from '@/features/hr/types'

type TabType = 'geral' | 'ponto' | 'financeiro' | 'ferias' | 'documentos'

// ─── Helpers de tradução ──────────────────────────────────────────────────────

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: 'Férias', sick: 'Baixa Médica', maternity: 'Maternidade',
  paternity: 'Paternidade', unpaid: 'Sem Vencimento', bereavement: 'Luto', other: 'Outro',
}

const LEAVE_STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado', rejected: 'Recusado', pending: 'Pendente',
}

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Presente', late: 'Atrasado', absent: 'Falta', justified: 'Justificado',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function countDays(start: string, end: string): number {
  const s = new Date(start), e = new Date(end)
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1)
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function EmployeeProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('geral')
  const { formatCurrency } = useFormatter()
  const countryConfig = useCountryConfig()

  const { employees, isLoading: loadingEmp } = useEmployees()
  const employee = employees.find(e => e.id === id)

  // Carrega apenas os registos DESTE funcionário
  const { attendance, isLoading: loadingAttendance } = useAttendance({ employeeId: id })
  const { payslips, isLoading: loadingPayroll } = usePayroll({ employeeId: id })
  const { leaves, isLoading: loadingLeaves } = useLeaves({ employeeId: id })

  if (loadingEmp && !employee) return <Loading />
  if (!employee) return <EmptyState title="Não encontrado" description="Funcionário não localizado." />

  // ─── Tab: Dados Gerais ──────────────────────────────────────────────────────
  const renderGeral = () => (
    <Animated.View entering={FadeInUp} className="px-6 space-y-4 pb-20">
      <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-primary uppercase tracking-widest mb-4">
          Dados Pessoais
        </Text>
        <View className="space-y-4">
          <InfoRow icon={<Globe size={16} color="#64748b" />} label="Nacionalidade / Estado Civil"
            value={[employee.nacionality, employee.civil_status].filter(Boolean).join(' • ') || '—'} />
          <InfoRow icon={<User size={16} color="#64748b" />} label="BI / NIT"
            value={`${employee.bi_number || '—'} / ${employee.nit || '—'}`} />
          <InfoRow icon={<Heart size={16} color="#f43f5e" />} label="Contacto de Emergência"
            value={employee.emergency_contact || 'Não registado'} />
          <InfoRow icon={<MapPin size={16} color="#64748b" />} label="Endereço"
            value={employee.address || 'Não registado'} />
        </View>
      </Card>

      <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-primary uppercase tracking-widest mb-4">
          Dados Bancários
        </Text>
        <View className="space-y-4">
          <InfoRow icon={<Building2 size={16} color="#10b981" />} label="Instituição"
            value={employee.bank_name || 'Não definido'} />
          <View className="flex-row justify-between">
            <View>
              <Text className="text-slate-400 text-[10px] font-bold uppercase">Conta</Text>
              <Text className="text-slate-800 dark:text-white font-medium mt-0.5">{employee.bank_account || '—'}</Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">NIB</Text>
              <Text className="text-slate-800 dark:text-white font-medium mt-0.5">{employee.nib || '—'}</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card variant="premium" className="p-5 border-slate-100 dark:border-white/5">
        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-xs font-black text-primary uppercase tracking-widest mb-4">
          Vínculo Laboral
        </Text>
        <View className="space-y-4">
          <InfoRow icon={<Briefcase size={16} color="#64748b" />} label="Cargo / Departamento"
            value={[employee.position, employee.department].filter(Boolean).join(' • ') || '—'} />
          <InfoRow icon={<Calendar size={16} color="#64748b" />} label="Início / Fim de Contrato"
            value={`${formatDate(employee.contract_start_date)} → ${formatDate(employee.contract_end_date)}`} />
        </View>
      </Card>
    </Animated.View>
  )

  // ─── Tab: Ponto / Assiduidade ───────────────────────────────────────────────
  const renderAttendance = () => {
    if (loadingAttendance) return <Loading />
    return (
      <Animated.View entering={FadeInUp} className="px-6 pb-20">
        {/* Resumo */}
        {attendance.length > 0 && (
          <View className="flex-row mb-4">
            <StatMini label="Total" value={attendance.length} color="text-indigo-600" />
            <StatMini label="Presenças" value={attendance.filter(a => a.status === 'present' || a.status === 'late').length} color="text-emerald-600" />
            <StatMini label="Faltas" value={attendance.filter(a => a.status === 'absent').length} color="text-rose-600" />
            <StatMini label="Justif." value={attendance.filter(a => a.status === 'justified').length} color="text-amber-600" />
          </View>
        )}
        <FlatList
          data={attendance}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }: { item: Attendance }) => (
            <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-3">
                  <Clock size={18} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                    {formatDate(item.date)}
                  </Text>
                  <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-tight mt-0.5">
                    {item.clock_in ? `ENT: ${item.clock_in}` : 'Sem entrada'}
                    {item.clock_out ? ` • SAI: ${item.clock_out}` : ''}
                    {item.total_minutes > 0 ? ` • ${Math.round(item.total_minutes / 60)}h` : ''}
                  </Text>
                </View>
              </View>
              <AttendanceBadge status={item.status} />
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState title="Sem registos" description="Nenhum registo de assiduidade encontrado." />
          }
        />
      </Animated.View>
    )
  }

  // ─── Tab: Financeiro / Recibos ──────────────────────────────────────────────
  const renderFinanceiro = () => {
    if (loadingPayroll) return <Loading />
    const totalPaid = payslips.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.net_salary, 0)
    return (
      <Animated.View entering={FadeInUp} className="px-6 pb-20">
        {payslips.length > 0 && (
          <Card variant="premium" className="p-4 mb-4 flex-row justify-between border-slate-100 dark:border-white/5">
            <View>
              <Text className="text-slate-400 text-[9px] font-bold uppercase">Total Recebido</Text>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-indigo-600 text-base font-black">
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-400 text-[9px] font-bold uppercase">Recibos</Text>
              <Text style={{ fontFamily: 'Inter-Black' }} className="text-slate-900 dark:text-white text-base font-black">
                {payslips.length}
              </Text>
            </View>
          </Card>
        )}
        <FlatList
          data={payslips}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <CreditCard size={18} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][item.period_month - 1]} {item.period_year}
                  </Text>
                  <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-tight mt-0.5">
                    Base: {formatCurrency(item.base_salary)} • Líquido: {formatCurrency(item.net_salary)}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Badge
                  variant={item.status === 'paid' ? 'success' : 'warning'}
                  label={item.status === 'paid' ? 'Pago' : 'Processado'}
                />
                <TouchableOpacity
                  onPress={() => generatePayslipPDF(item, employee, countryConfig).catch(() => {})}
                  className="mt-2 p-1.5 bg-slate-100 dark:bg-white/10 rounded-lg"
                >
                  <FileText size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState title="Sem recibos" description="Nenhum salário processado ainda." />
          }
        />
      </Animated.View>
    )
  }

  // ─── Tab: Férias e Ausências ────────────────────────────────────────────────
  const renderFerias = () => {
    if (loadingLeaves) return <Loading />
    const usedVacDays = leaves
      .filter(l => l.type === 'vacation' && l.status === 'approved' &&
        l.start_date?.startsWith(new Date().getFullYear().toString()))
      .reduce((acc, l) => acc + countDays(l.start_date, l.end_date), 0)

    return (
      <Animated.View entering={FadeInUp} className="px-6 pb-20">
        {/* Saldo de Férias */}
        <Card variant="premium" className="p-4 mb-4 flex-row justify-between border-slate-100 dark:border-white/5">
          <View className="items-center flex-1">
            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Alocados</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-indigo-600 text-lg">22</Text>
            <Text className="text-slate-400 text-[9px]">dias/ano</Text>
          </View>
          <View className="w-[1px] bg-slate-100 dark:bg-white/10" />
          <View className="items-center flex-1">
            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Usados</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-amber-600 text-lg">{usedVacDays}</Text>
            <Text className="text-slate-400 text-[9px]">este ano</Text>
          </View>
          <View className="w-[1px] bg-slate-100 dark:bg-white/10" />
          <View className="items-center flex-1">
            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Restantes</Text>
            <Text style={{ fontFamily: 'Inter-Black' }} className="text-emerald-600 text-lg">{Math.max(0, 22 - usedVacDays)}</Text>
            <Text className="text-slate-400 text-[9px]">dias</Text>
          </View>
        </Card>

        <FlatList
          data={leaves}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }: { item: Leave }) => {
            const days = countDays(item.start_date, item.end_date)
            return (
              <Card variant="premium" className="p-4 mb-3 border-slate-100 dark:border-white/5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-3">
                      <Plane size={18} color="#4f46e5" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Inter-Bold' }} className="text-slate-900 dark:text-white font-black text-sm">
                        {LEAVE_TYPE_LABELS[item.type] || item.type}
                      </Text>
                      <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-tight mt-0.5">
                        {formatDate(item.start_date)} → {formatDate(item.end_date)} • {days} dia{days !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <LeaveBadge status={item.status} />
                </View>
                {item.reason ? (
                  <View className="mt-2 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-lg">
                    <Text className="text-slate-500 text-[10px] leading-4">{item.reason}</Text>
                  </View>
                ) : null}
              </Card>
            )
          }}
          ListEmptyComponent={
            <EmptyState title="Sem pedidos" description="Nenhum pedido de ausência registado." />
          }
        />
      </Animated.View>
    )
  }

  // ─── Tab: Documentos ────────────────────────────────────────────────────────
  const renderDocumentos = () => (
    <Animated.View entering={FadeInUp} className="px-6 space-y-3 pb-20">
      <DocRow label="Cópia do BI / Passaporte" />
      <DocRow label="Contrato de Trabalho" />
      <DocRow label="Certificado de Habilitações" />
      <TouchableOpacity className="mt-4 bg-primary/10 py-4 rounded-2xl items-center border border-dashed border-primary/30">
        <Plus size={20} color="#4f46e5" />
        <Text className="text-primary font-black text-[10px] uppercase mt-1">Carregar Documento</Text>
      </TouchableOpacity>
    </Animated.View>
  )

  const TABS: { key: TabType; label: string }[] = [
    { key: 'geral', label: 'Geral' },
    { key: 'ponto', label: 'Ponto' },
    { key: 'financeiro', label: 'Recibos' },
    { key: 'ferias', label: 'Férias' },
    { key: 'documentos', label: 'Docs' },
  ]

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Perfil do Funcionário" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View entering={FadeInUp} className="px-6 py-6 items-center">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center border-2 border-white dark:border-white/5 shadow-sm">
            <User size={48} color="#4f46e5" />
          </View>

          <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white mt-4">
            {employee.name}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            {employee.position || 'Sem Cargo'} • {employee.department || '—'}
          </Text>

          {/* Status badge */}
          <View className="mt-2">
            <Badge
              variant={employee.status === 'active' ? 'success' : employee.status === 'suspended' ? 'warning' : 'danger'}
              label={employee.status === 'active' ? 'Activo' : employee.status === 'suspended' ? 'Suspenso' : 'Cessado'}
            />
          </View>

          <View className="flex-row mt-5 space-x-2">
            <TouchableOpacity className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
              <Phone size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
              <Mail size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tabs Bar */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="bg-white dark:bg-white/5 p-1 rounded-2xl flex-row border border-slate-100 dark:border-white/10 shadow-sm">
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => { feedback.light(); setActiveTab(tab.key) }}
                  className={`px-4 py-3 items-center rounded-xl ${activeTab === tab.key ? 'bg-primary shadow-sm' : ''}`}
                >
                  <Text
                    style={{ fontFamily: 'Inter-Bold' }}
                    className={`text-[9px] font-black uppercase tracking-tight ${activeTab === tab.key ? 'text-white' : 'text-slate-500'}`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {activeTab === 'geral'       && renderGeral()}
        {activeTab === 'ponto'       && renderAttendance()}
        {activeTab === 'financeiro'  && renderFinanceiro()}
        {activeTab === 'ferias'      && renderFerias()}
        {activeTab === 'documentos'  && renderDocumentos()}
      </ScrollView>
    </Screen>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-start">
      <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 items-center justify-center mr-3 mt-0.5">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-slate-400 text-[10px] font-bold uppercase">{label}</Text>
        <Text className="text-slate-800 dark:text-white font-medium mt-0.5">{value}</Text>
      </View>
    </View>
  )
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-1 items-center bg-slate-50 dark:bg-white/5 rounded-2xl p-3 mr-2 last:mr-0">
      <Text className={`${color} font-black text-lg`}>{value}</Text>
      <Text className="text-slate-400 text-[9px] font-bold uppercase">{label}</Text>
    </View>
  )
}

function AttendanceBadge({ status }: { status: string }) {
  switch (status) {
    case 'present':   return <Badge variant="success" label="Presente" />
    case 'late':      return <Badge variant="warning" label="Atrasado" />
    case 'absent':    return <Badge variant="danger"  label="Falta" />
    case 'justified': return <Badge variant="info"    label="Justificado" />
    default:          return <Badge variant="neutral" label={status} />
  }
}

function LeaveBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved': return <Badge variant="success" label="Aprovado" />
    case 'rejected': return <Badge variant="danger"  label="Recusado" />
    default:         return <Badge variant="warning" label="Pendente" />
  }
}

function DocRow({ label }: { label: string }) {
  return (
    <Card variant="premium" className="p-4 border-slate-100 dark:border-white/5 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <FileText size={18} color="#94a3b8" />
        <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs ml-3">{label}</Text>
      </View>
      <Badge variant="neutral" label="Não Carregado" />
    </Card>
  )
}
