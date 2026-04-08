import React from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { feedback } from '@/utils/haptics'

export interface FilterOption {
  label: string
  value: string
}

interface FilterBarProps {
  options: FilterOption[]
  selectedValue: string
  onSelect: (value: string) => void
  className?: string
}

export default function FilterBar({ 
  options, 
  selectedValue, 
  onSelect,
  className = ''
}: FilterBarProps) {
  
  const renderItem = ({ item }: { item: FilterOption }) => {
    const isActive = selectedValue === item.value

    return (
      <TouchableOpacity
        onPress={() => {
          feedback.light()
          onSelect(item.value)
        }}
        activeOpacity={0.7}
        className={`px-5 py-2.5 rounded-full mr-2 border shadow-sm ${
          isActive 
            ? 'bg-primary border-primary shadow-primary/20' 
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-black/5'
        }`}
      >
        <Text 
          style={{ fontFamily: 'Inter-Bold' }} 
          className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View className={`py-4 ${className}`}>
      <FlatList
        data={options}
        renderItem={renderItem}
        keyExtractor={(item) => item.value}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      />
    </View>
  )
}
