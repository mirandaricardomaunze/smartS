import React from 'react';
import { View, Text, Dimensions, useColorScheme } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Card from '@/components/ui/Card';
import { Wallet } from 'lucide-react-native';
import { useFormatter } from '@/hooks/useFormatter';
import EmptyState from '@/components/ui/EmptyState';

interface InventoryValueChartProps {
  labels: string[];
  data: number[];
}

export default function InventoryValueChart({ labels, data }: InventoryValueChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const { formatCurrency } = useFormatter();

  if (labels.length === 0) {
    return <EmptyState title="Sem dados de stock" description="Adicione produtos com categorias para visualizar a distribuição de valor." />
  }

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Emerald for money
    labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(71, 85, 105, ${opacity})`,
    style: { borderRadius: 16 },
    barPercentage: 0.5,
    propsForLabels: { fontSize: 10 },
    propsForBackgroundLines: { strokeDasharray: '', stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  };

  const chartData = {
    labels,
    datasets: [{ data }]
  };

  const totalValue = data.reduce((a, b) => a + b, 0);

  return (
    <View className="flex-1">
      <View className="flex-row items-center mb-6">
        <View className="flex-1 mr-2">
          <Text className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-1">Categorias</Text>
          <Text className="text-slate-900 dark:text-white font-black text-base" numberOfLines={1}>Distribuição de Valor</Text>
        </View>
        <View className="bg-emerald-500/10 px-3 py-2 rounded-2xl items-end border border-emerald-500/20 max-w-[120px]">
            <Text className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[1px]" numberOfLines={1}>Total</Text>
            <Text className="text-emerald-500 font-black text-xs" numberOfLines={1}>{formatCurrency(totalValue)}</Text>
        </View>
      </View>

      <BarChart
        data={chartData}
        width={screenWidth - 80}
        height={200}
        chartConfig={chartConfig}
        fromZero
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingRight: 10,
          marginLeft: -15
        }}
        withInnerLines={false}
        withVerticalLabels
        showValuesOnTopOfBars
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
}
