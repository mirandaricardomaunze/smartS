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

  return (
    <View className={`w-full mb-4 ${className || ''}`}>
      {label && <Text style={labelStyle} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</Text>}
      <View 
        style={containerStyle}
        className={`flex-row items-center border rounded-2xl bg-white dark:bg-slate-900 ${error ? 'border-red-500' : 'border-slate-100 dark:border-white/5 shadow-premium-sm focus:border-primary'} px-4 h-14`}
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
