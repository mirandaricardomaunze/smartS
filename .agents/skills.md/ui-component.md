# Skill: Generate UI Component

## Activation: Model Decision
## Description: Apply when asked to create a reusable UI component

## Rules
- NativeWind classes only — no StyleSheet
- Explicit margins (`mt-`, `mb-`, `mx-`, `my-`) — never `gap`
- Dark mode support with `dark:` prefix
- TypeScript props interface always required
- Comments in English
- No business logic
- Default export only
- Save to: `src/components/ui/[ComponentName].tsx`

## Output Template
```typescript
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'

// Props interface for [ComponentName]
interface [ComponentName]Props {
  // define props here
  loading?: boolean
  disabled?: boolean
}

// [ComponentName] — [description]
export default function [ComponentName]({ loading, disabled, ...props }: [ComponentName]Props) {
  return (
    <View className="...">
      {loading ? (
        <ActivityIndicator />
      ) : (
        // content
      )}
    </View>
  )
}
```

## Always Consider
- `loading` state
- `disabled` state (reduced opacity)
- `error` state
- `empty` state (for lists)
- Dark mode variants