---
trigger: always_on
description: Princípio DRY (Don't Repeat Yourself)
---

# DRY Principle & Component Reuse

## Activation: Always On

## Core Rules
- **Zero Duplication**: If a UI pattern or business logic is repeated more than twice, it must be abstracted into a reusable component, hook, or service.
- **Unified Layouts (Mandatory)**: 
    - All detail views (Customer, Supplier, etc.) MUST use the `DetailModalLayout` component.
    - All creation/editing forms MUST use a unified form layout component (to be implemented if not already existing) or consistent `BottomSheet` patterns.
- **Style Consistency**: Never use ad-hoc Tailwind classes for spacing or paddings that deviate from the design system. Use shared tokens and UI components.

## Implementation Pattern
- **UI**: Components in `src/components/ui/` should be generic and data-agnostic.
- **Hooks**: Shared logic like data fetching or formatting must stay in `src/hooks/` or feature-specific hooks.
- **Services**: Business rules must be centralized in the `services/` layer of each feature or global services.

## Example: Unified Details
```typescript
// Correct: Using the layout
return (
  <DetailModalLayout
    title={item.name}
    stats={stats}
    sections={sections}
  >
    {customContent}
  </DetailModalLayout>
)
```
