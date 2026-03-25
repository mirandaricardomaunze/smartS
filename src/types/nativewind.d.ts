/// <reference types="nativewind/types" />
import 'react-native'

declare module 'react-native' {
  interface FlatListProps<ItemT> {
    contentContainerClassName?: string
  }
  interface ScrollViewProps {
    contentContainerClassName?: string
  }
  interface TextInputProps {
    accessibilityInvalid?: boolean
    className?: string
  }
  interface ViewProps {
    className?: string
  }
  interface TextProps {
    className?: string
  }
  interface TouchableOpacityProps {
    className?: string
  }
}
