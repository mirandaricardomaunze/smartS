import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import { Shield, Lock, Eye, Server, Mail, ChevronLeft } from 'lucide-react-native'
import { useRouter } from 'expo-router'

export default function PrivacyScreen() {
  const router = useRouter()

  const Section = ({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) => (
    <Card className="mb-6 p-6 rounded-[32px] bg-white dark:bg-[#0f172a] border-none shadow-sm">
      <View className="flex-row items-center mb-4">
        <View className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 items-center justify-center mr-3">
          {icon}
        </View>
        <Text style={{ fontFamily: 'Inter-Black' }} className="text-lg font-black text-slate-900 dark:text-white">
          {title}
        </Text>
      </View>
      <Text className="text-sm leading-6 text-slate-600 dark:text-slate-400 font-medium">
        {content}
      </Text>
    </Card>
  )

  return (
    <Screen padHorizontal={false} withHeader>
      <Header title="Privacidade" showBack />
      
      <ScrollView 
        className="flex-1" 
        contentContainerClassName="px-6 pt-8 pb-20"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            A Tua Privacidade
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Entendemos que a gestão do teu negócio exige total confiança.
          </Text>
        </View>

        <Section 
          icon={<Lock size={20} color="#4f46e5" />}
          title="Segurança de Dados"
          content="Todos os teus dados de inventário e movimentos são armazenados localmente no teu dispositivo (SQLite) e sincronizados de forma encriptada com o nosso servidor seguro (Supabase)."
        />

        <Section 
          icon={<Eye size={20} color="#4f46e5" />}
          title="O que recolhemos"
          content="Recolhemos apenas os dados necessários para o funcionamento da app: informações de produtos, stock, vendas e dados de perfil (nome e email). Não partilhamos estes dados com terceiros."
        />

        <Section 
          icon={<Server size={20} color="#4f46e5" />}
          title="Armazenamento Offline"
          content="O SmartS foi desenhado com o conceito 'Offline-First'. Isso significa que tens controlo total sobre os teus dados locais, podendo limpar o histórico a qualquer momento nas definições."
        />

        <Section 
          icon={<Shield size={20} color="#4f46e5" />}
          title="Teus Direitos"
          content="Tens o direito de aceder, corrigir ou eliminar os teus dados. Podes gerir a maior parte destas ações diretamente na app ou contactando o suporte."
        />

        <View className="mt-4 p-8 rounded-[40px] bg-primary items-center shadow-lg shadow-primary/30">
          <Mail size={32} color="white" className="mb-4" />
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-white text-xl font-black mb-2 text-center">
            Dúvidas ou Suporte?
          </Text>
          <Text className="text-white/80 text-center text-sm font-medium mb-6">
            Estamos aqui para ajudar com qualquer questão sobre a tua privacidade.
          </Text>
          <TouchableOpacity 
            className="bg-white px-8 py-4 rounded-2xl active:opacity-90"
            onPress={() => {}}
          >
            <Text className="text-primary font-black text-sm">mirandaricardomaunze@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-slate-400 dark:text-slate-600 text-[10px] mt-10 uppercase tracking-[2px] font-black">
          Última Atualização: Março 2026
        </Text>
      </ScrollView>
    </Screen>
  )
}
