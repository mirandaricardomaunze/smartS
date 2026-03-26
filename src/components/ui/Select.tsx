import React, { useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, useColorScheme } from 'react-native'
import { ChevronDown, Check } from 'lucide-react-native'
import BottomSheet from './BottomSheet'
import Card from './Card'

interface Option<T extends string> {
  label: string
  value: T
}

interface SelectProps<T extends string> {
  label: string
  options: Option<T>[]
  value: T
  onValueChange: (value: T) => void
  placeholder?: string
  error?: string
}

export default function Select<T extends string>({ 
  label, 
  options, 
  value, 
  onValueChange, 
  placeholder = 'Seleccionar...',
  error 
}: SelectProps<T>) {
  const [visible, setVisible] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const selectedOption = options.find(o => o.value === value)

  return (
    <View className="mb-4">
      <Text className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      
      <TouchableOpacity 
        onPress={() => setVisible(true)}
        className={`h-14 px-4 flex-row items-center justify-between rounded-2xl border ${error ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} bg-slate-50 dark:bg-white/5`}
      >
        <Text className={`${selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'} font-medium`}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={isDark ? '#94a3b8' : '#64748b'} />
      </TouchableOpacity>

      {error && <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{error}</Text>}

      <BottomSheet visible={visible} onClose={() => setVisible(false)} height={0.5}>
        <View className="px-6 flex-1">
          <Text style={{ fontFamily: 'Inter-Bold' }} className="text-lg font-black text-slate-900 dark:text-white mb-6">
            {label}
          </Text>
          
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => {
                  onValueChange(item.value)
                  setVisible(false)
                }}
                className={`p-4 mb-2 flex-row items-center justify-between rounded-2xl ${value === item.value ? 'bg-primary/10 border border-primary/20' : 'bg-slate-50 dark:bg-white/5 border border-transparent'}`}
              >
                <Text className={`font-bold ${value === item.value ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                  {item.label}
                </Text>
                {value === item.value && <Check size={18} color="#4f46e5" />}
              </TouchableOpacity>
            )}
            contentContainerClassName="pb-10"
          />
        </View>
      </BottomSheet>
    </View>
  )
}
