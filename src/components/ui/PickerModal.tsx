import React from 'react'
import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import { Check, X } from 'lucide-react-native'
import BottomSheet from './BottomSheet'

interface PickerOption {
  label: string
  value: string
}

interface PickerModalProps {
  visible: boolean
  onClose: () => void
  title: string
  options: PickerOption[]
  selectedValue: string
  onSelect: (value: string) => void
}

export default function PickerModal({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect
}: PickerModalProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={0.5}
    >
      <View className="px-6 pb-12">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-black text-slate-800 dark:text-white">{title}</Text>
          <TouchableOpacity 
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
          >
            <X size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const isSelected = item.value === selectedValue
            return (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.value)
                  onClose()
                }}
                className={`flex-row justify-between items-center p-4 mb-2 rounded-2xl ${
                  isSelected 
                    ? 'bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20' 
                    : 'bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <Text className={`text-base font-bold ${
                  isSelected ? 'text-primary dark:text-primary-dark' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {item.label}
                </Text>
                {isSelected && <Check size={20} color="#4f46e5" />}
              </TouchableOpacity>
            )
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BottomSheet>
  )
}
