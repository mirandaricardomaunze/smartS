import React, { useState } from 'react'
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  icon?: React.ReactNode
  containerStyle?: any
  labelStyle?: any
  textStyle?: any
}

export default function Input({ label, error, icon, className, containerStyle, labelStyle, textStyle, secureTextEntry, ...props }: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPasswordField = secureTextEntry === true

  // Extract layout and spacing classes to apply to the wrapper View
  const layoutClasses = className?.match(/\b(flex(?:-\d+)?|m[xytrb]?-\d+|w-\d+|h-\d+|w-full|h-full|absolute|relative|top-\d+|bottom-\d+|left-\d+|right-\d+|z-\d+)\b/g)?.join(' ') || ''
  const otherClasses = className?.split(' ').filter(c => !layoutClasses.includes(c)).join(' ') || ''

  const hasHeight = layoutClasses.includes('h-')
  const hasMarginBottom = layoutClasses.includes('mb-')
  const hasHorizontalPadding = otherClasses.match(/\b(p[xrly]-\d+)\b/)

  return (
    <View className={`${layoutClasses} ${!hasMarginBottom ? 'mb-4' : ''}`}>
      {label && <Text style={labelStyle} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</Text>}
      <View 
        style={containerStyle}
        className={`flex-row items-center border rounded-2xl bg-white dark:bg-slate-900 ${error ? 'border-red-500' : 'border-slate-100 dark:border-white/5 shadow-premium-sm focus:border-primary'} ${!hasHorizontalPadding ? 'px-4' : ''} ${!hasHeight ? 'h-14' : 'h-full'} ${otherClasses}`}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          style={textStyle}
          className="flex-1 text-base text-slate-900 dark:text-white font-medium"
          placeholderTextColor="rgba(255,255,255,0.4)"
          cursorColor="#4f46e5"
          accessibilityLabel={label || props.placeholder}
          aria-invalid={!!error}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="p-2 ml-1"
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color="#64748b" />
            ) : (
              <Eye size={20} color="#64748b" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  )
}
