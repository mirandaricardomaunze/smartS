import React from 'react';
import { View, Text, Dimensions, useColorScheme } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Card from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import EmptyState from '@/components/ui/EmptyState';

interface FinancialTrendChartProps {
  labels: string[];
  revenue: number[];
  expenses: number[];
}

export default function FinancialTrendChart({ labels, revenue, expenses }: FinancialTrendChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  if (labels.length === 0) {
    return <EmptyState title="Sem dados financeiros" description="Registe vendas para visualizar a tendência de receita e despesas." />
  }

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Indigo for Revenue
    labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(71, 85, 105, ${opacity})`,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 10 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#6366f1' },
    propsForBackgroundLines: { strokeDasharray: '', stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  };

  const data = {
    labels,
    datasets: [
      {
        data: revenue,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 3
      },
      {
        data: expenses,
        color: (opacity = 1) => `rgba(244, 63, 94, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ['Receita', 'Despesas']
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center mb-6">
        <View className="flex-1 mr-2">
          <Text className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-1">Performance</Text>
          <Text className="text-slate-900 dark:text-white font-black text-base" numberOfLines={1}>Receita vs Gastos</Text>
        </View>
        <View className="flex-row items-center bg-emerald-500/10 px-2 py-1 rounded-lg max-w-[80px]">
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
          paddingRight: 10,
          marginLeft: -15
        }}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
      />
      
      <View className="flex-row justify-center mt-6 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
        <View className="flex-row items-center mr-6">
            <View className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shadow-sm" />
            <Text className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Total Receita</Text>
        </View>
        <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-rose-500 mr-2 shadow-sm" />
            <Text className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Total Despesa</Text>
        </View>
      </View>
    </View>
  );
}
