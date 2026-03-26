import React from 'react';
import { View, Text, Dimensions, useColorScheme } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Card from '@/components/ui/Card';
import { Wallet } from 'lucide-react-native';
import { useFormatter } from '@/hooks/useFormatter';

interface InventoryValueChartProps {
  labels: string[];
  data: number[];
}

export default function InventoryValueChart({ labels, data }: InventoryValueChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const { formatCurrency } = useFormatter();

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Emerald for money
    labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(71, 85, 105, ${opacity})`,
    style: { borderRadius: 16 },
    barPercentage: 0.5,
    propsForBackgroundLines: { strokeDasharray: '', stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  };

  const chartData = {
    labels: labels.length > 0 ? labels : ['LIMPEZA', 'ALIMENTOS', 'OUTROS'],
    datasets: [{ data: data.length > 0 ? data : [0, 0, 0] }]
  };

  const totalValue = data.reduce((a, b) => a + b, 0);

  return (
    <Card variant="premium" className="p-4 mb-6 rounded-[24px]">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-1">Valor em Stock</Text>
          <Text className="text-slate-900 dark:text-white font-black text-lg">Distribuição por Categoria</Text>
        </View>
        <View className="items-end">
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Total Estimado</Text>
            <Text className="text-emerald-500 font-black text-xs">{formatCurrency(totalValue)}</Text>
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
          paddingRight: 35
        }}
        withInnerLines={false}
        withVerticalLabels
        showValuesOnTopOfBars
        yAxisLabel=""
        yAxisSuffix=""
      />
    </Card>
  );
}
