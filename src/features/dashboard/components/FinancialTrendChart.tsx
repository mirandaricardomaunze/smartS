import React from 'react';
import { View, Text, Dimensions, useColorScheme } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Card from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface FinancialTrendChartProps {
  labels: string[];
  revenue: number[];
  expenses: number[];
}

export default function FinancialTrendChart({ labels, revenue, expenses }: FinancialTrendChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Indigo for Revenue
    labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(71, 85, 105, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#6366f1' },
    propsForBackgroundLines: { strokeDasharray: '', stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  };

  const data = {
    labels: labels.length > 0 ? labels : ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN'],
    datasets: [
      {
        data: revenue.length > 0 ? revenue : [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Emerald for Revenue
        strokeWidth: 3
      },
      {
        data: expenses.length > 0 ? expenses : [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(244, 63, 94, ${opacity})`, // Rose for Expenses
        strokeWidth: 2
      }
    ],
    legend: ['Receita', 'Despesas']
  };

  return (
    <Card variant="premium" className="p-4 mb-6 rounded-[24px]">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-1">Análise Financeira</Text>
          <Text className="text-slate-900 dark:text-white font-black text-lg">Receita vs Gastos</Text>
        </View>
        <View className="flex-row items-center bg-emerald-500/10 px-2 py-1 rounded-lg">
          <TrendingUp size={12} color="#10b981" />
          <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold ml-1">LTM</Text>
        </View>
      </View>

      <LineChart
        data={data}
        width={screenWidth - 80}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingRight: 40
        }}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
      />
      
      <View className="flex-row justify-center mt-4 gap-x-6">
        <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Total Receita</Text>
        </View>
        <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-rose-500 mr-2" />
            <Text className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Total Despesa</Text>
        </View>
      </View>
    </Card>
  );
}
