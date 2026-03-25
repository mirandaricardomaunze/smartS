---
description: # Criar Novo Ecrã  ## Descrição Cria um novo ecrã completo seguindo o fluxo Screen → Hook → Service → Repository.
---

# Create New Screen

## Description
Creates a complete screen following the Screen → Hook → Service → Repository flow.

## Usage: `/novo-ecra [feature] [name]`
## Example: `/novo-ecra products ProductList`

## Steps

### 1. Create route file
Create `app/(app)/[feature]/[name].tsx`

### 2. Verify feature exists
Check if `src/features/[feature]/` exists. If not, run `/nova-feature [feature]` first.

### 3. Build the screen
The screen must:
- Import and use the feature hook
- Show `<Loading />` while fetching
- Show `<EmptyState />` when list is empty
- Show error message in Portuguese when request fails
- Use only components from `src/components/ui/`
- Apply permission checks — hide actions the user cannot perform

### 4. Apply styles
Use NativeWind classes per @../rules/06-ui.md. Support dark mode.

### 5. Add navigation
Check if the screen needs to be added to tab navigation or stack navigator.

### 6. Confirm
Show the created screen code and ask for adjustments.