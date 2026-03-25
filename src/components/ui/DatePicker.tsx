import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { format, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DatePickerProps {
  label?: string
  value: string // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void
  error?: string
}

export default function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  const [show, setShow] = useState(false)
  
  const currentDate = useMemo(() => {
    if (!value) return new Date()
    const d = parseISO(value)
    return isValid(d) ? d : new Date()
  }, [value])

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false)
    }
    
    if (event.type === 'set' && selectedDate) {
      const formatted = format(selectedDate, 'yyyy-MM-dd')
      onChange(formatted)
    } else if (event.type === 'dismissed') {
      setShow(false)
    }
  }

  const formattedDisplayValue = useMemo(() => {
    try {
      return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch (e) {
      return value
    }
  }, [currentDate, value])

  return (
    <View className="w-full mb-4">
      {label && <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</Text>}
      
      <TouchableOpacity
        onPress={() => setShow(true)}
        activeOpacity={0.7}
        className={`flex-row items-center border rounded-2xl bg-white dark:bg-slate-900 ${
          error ? 'border-red-500' : 'border-slate-100 dark:border-white/5 shadow-premium-sm'
        } px-4 h-14`}
      >
        <CalendarIcon size={20} color="#94a3b8" className="mr-3" />
        <Text className="flex-1 text-base text-slate-900 dark:text-white font-medium">
          {formattedDisplayValue}
        </Text>
        <ChevronDown size={18} color="#94a3b8" />
      </TouchableOpacity>

      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}

      {show && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          locale="pt-BR"
        />
      )}
    </View>
  )
}
