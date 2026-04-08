import React from 'react';
import { View, Text } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { router } from 'expo-router';
import Button from '@/components/ui/Button';

export default function NoAccessScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-8">
      <View className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 rounded-full items-center justify-center mb-6">
        <ShieldAlert size={48} color="#ef4444" />
      </View>
      
      <Text style={{ fontFamily: "Inter-Black" }} className="text-2xl text-slate-900 dark:text-white text-center mb-2">
        Acesso Restrito
      </Text>
      
      <Text className="text-slate-500 dark:text-slate-400 text-center mb-10 leading-6">
        Lamentamos, mas não tem permissões suficientes para aceder a esta funcionalidade. Por favor, contacte o administrador da sua empresa.
      </Text>
      
      <Button 
        title="Voltar ao Início"
        onPress={() => router.replace('/(app)/dashboard')}
        className="px-12"
      />
    </View>
  );
}
