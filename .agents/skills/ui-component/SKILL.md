---
name: Generate UI Component
description: Rules and templates for creating reusable UI components using NativeWind.
---
# Skill: Generate UI Component

## Rules
- NativeWind classes only — no StyleSheet
- Explicit margins (`mt-`, `mb-`, `mx-`, `my-`) — never `gap`
- Dark mode support with `dark:` prefix
- TypeScript props interface always required
- **Visual Harmony**: Use the `premium-*` color palette and shadows for depth.
- **Vibrant Actions**: High-intensity colors (Indigo, Emerald, Sky) must be reserved for primary actions only.
- **Contrast**: Ensure high contrast in Light Mode (use `slate-700`+ for primary labels).
- **Text Safety**: NEVER leave rogue whitespace, comments with leading spaces, or raw strings outside `<Text>` components (prevents "Text strings must be rendered within a <Text> component" error).
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
