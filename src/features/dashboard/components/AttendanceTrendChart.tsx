import React from 'react';
import { View, Text, Dimensions, useColorScheme } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Card from '@/components/ui/Card';
import { Users, CheckCircle2 } from 'lucide-react-native';

interface AttendanceTrendChartProps {
  labels: string[];
  data: number[];
}

export default function AttendanceTrendChart({ labels, data }: AttendanceTrendChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: isDark ? '#0f172a' : '#ffffff',
    backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Indigo for Team
    labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(71, 85, 105, ${opacity})`,
    style: { borderRadius: 16 },
    barPercentage: 0.6,
    propsForBackgroundLines: { strokeDasharray: '', stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  };

  const chartData = {
    labels: labels.length > 0 ? labels : ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
    datasets: [{ data: data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0] }]
  };

  const avgAttendance = data.length > 0 ? (data.reduce((a, b) => a + b, 0) / data.length) : 0;

  return (
    <Card variant="premium" className="p-4 mb-10 rounded-[24px]">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-1">Assiduidade Semanal</Text>
          <Text className="text-slate-900 dark:text-white font-black text-lg">Presença da Equipa</Text>
        </View>
        <View className="items-end">
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Média Semanal</Text>
            <Text className={`font-black text-xs ${avgAttendance >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {avgAttendance.toFixed(1)}%
            </Text>
        </View>
      </View>

      <BarChart
        data={chartData}
        width={screenWidth - 80}
        height={180}
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
        yAxisSuffix="%"
      />

      <View className="mt-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex-row items-center border border-slate-100 dark:border-white/5">
         <View className="w-8 h-8 bg-emerald-500/20 rounded-xl items-center justify-center mr-3">
            <Users size={18} color="#10b981" />
         </View>
         <Text className="text-slate-600 dark:text-slate-300 text-[11px] font-medium leading-[16px] flex-1">
            Mantenha a monitorização constante para garantir o cumprimento das escalas moçambicanas e otimizar o processamento de salários.
         </Text>
      </View>
    </Card>
  );
}
