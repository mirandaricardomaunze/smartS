import React from 'react'
import { View } from 'react-native'
import Input from '../ui/Input'

interface FormFieldProps extends React.ComponentProps<typeof Input> {}

export default function FormField(props: FormFieldProps) {
  return (
    <View className="mb-2">
      <Input {...props} />
    </View>
  )
}
