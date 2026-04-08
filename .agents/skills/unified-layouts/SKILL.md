---
name: Unified Layout Patterns
description: Rules and templates for implementing unified, DRY, and responsive detail views.
---
# Skill: Unified Layout Patterns

## Rules
- **Mandatory Skeleton**: All detail views MUST use `DetailModalLayout` from `src/components/ui/`.
- **Zero Inline Spacing Override**: Always use the Layout's built-in padding and margins to ensure consistency.
- **Stat Normalization**: Metrics must follow the `DetailStat` interface (3 columns max, standard variants).
- **Section Grouping**: Contact info and primary attributes must be grouped into the `sections` array for standard rendering.
- **Recursive Consistency**: Any new sub-lists (like related entities) must be passed as `children` and use the same `Card` and `Badge` styles.

## Usage Template
```typescript
import DetailModalLayout, { DetailStat, DetailSectionItem } from '@/components/ui/DetailModalLayout'
import { [Icon] } from 'lucide-react-native'

// Inside your feature component:
const stats: DetailStat[] = [
  { label: 'Label', value: 'Value', icon: [Icon], variant: 'success' }
]

const sections: DetailSectionItem[] = [
  { icon: [Icon], label: 'Info', value: data.value, action: () => {} }
]

return (
  <DetailModalLayout
    visible={visible}
    onClose={onClose}
    title={data.name}
    stats={stats}
    sections={sections}
  >
    {/* Custom Content here */}
  </DetailModalLayout>
)
```

## Critical Checks
- **Text Wrapping**: Ensure long strings in `sections` have `numberOfLines={1}` in the layout but remain readable.
- **Empty States**: If stats are missing, handle by passing an empty array or the loading state.
- **Accessibility**: Ensure `headerIcon` has appropriate contrast.
