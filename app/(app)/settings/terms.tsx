import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import Screen from '@/components/layout/Screen'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'
import { FileText, Copyright, User, AlertCircle, Scale, Github } from 'lucide-react-native'

export default function TermsScreen() {
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
      <Header title="Termos e Copyright" showBack />
      
      <ScrollView 
        className="flex-1" 
        contentContainerClassName="px-6 pt-8 pb-20"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            Termos Legais
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Informações sobre o uso do software e propriedade intelectual.
          </Text>
        </View>

        <Section 
          icon={<Copyright size={20} color="#4f46e5" />}
          title="Propriedade Intelectual"
          content="O SmartS é um software proprietário desenvolvido e mantido por Miranda Ricardo Maunze. Todos os direitos reservados."
        />

        <Section 
          icon={<User size={20} color="#4f46e5" />}
          title="Autor"
          content="Nome: Miranda Ricardo Maunze\nEmail: mirandaricardomaunze@gmail.com\nMaputo, Moçambique."
        />

        <Section 
          icon={<Scale size={20} color="#4f46e5" />}
          title="Termos de Uso"
          content="Ao utilizar esta aplicação, concordas em não fazer engenharia reversa, redistribuir ou utilizar o código para fins não autorizados pelo autor."
        />

        <Section 
          icon={<AlertCircle size={20} color="#4f46e5" />}
          title="Isenção de Responsabilidade"
          content="Embora façamos o melhor para garantir a integridade dos teus dados, o software é fornecido 'como está'. O autor não se responsabiliza por perdas financeiras ou de dados resultantes do uso indevido ou falhas de hardware."
        />

        <View className="mt-4 p-8 rounded-[40px] bg-slate-900 dark:bg-indigo-900/10 border border-white/5 items-center">
          <Copyright size={32} color="#6366f1" className="mb-4" />
          <Text style={{ fontFamily: 'Inter-Black' }} className="text-white text-xl font-black mb-2 text-center text-indigo-400">
             © 2026 Miranda Ricardo Maunze
          </Text>
          <Text className="text-slate-400 text-center text-sm font-medium">
            SmartS - Gestão Inteligente e Offline
          </Text>
        </View>

        <Text className="text-center text-slate-400 dark:text-slate-600 text-[10px] mt-10 uppercase tracking-[2px] font-black">
          Versão Pro 2.4.0
        </Text>
      </ScrollView>
    </Screen>
  )
}
