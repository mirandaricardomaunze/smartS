/// <reference types="nativewind/types" />

import 'react-native';

declare module 'react-native' {
  interface FlatListProps<ItemT> {
    contentContainerClassName?: string;
  }
  interface ScrollViewProps {
    contentContainerClassName?: string;
  }
}
