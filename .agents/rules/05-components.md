---
description: # Componentes UI com NativeWind
---

# Componentes UI com NativeWind

## Ativação: Glob
## Padrão: src/components/**/*.tsx

## Regras de Estilo
- Usar NativeWind (classes Tailwind) para todos os estilos
- Espaçamentos com margin explícita (`mx-`, `my-`, `mt-`, `mb-`)
- Nunca usar `gap` — usar `space-x-` ou `space-y-` no NativeWind
- Componentes UI nunca têm lógica de negócio

## Componentes Base Obrigatórios
```
src/components/ui/
├ Button.tsx      → variantes: primary, secondary, danger, ghost
├ Input.tsx       → com label, erro e ícone opcional
├ Card.tsx        → container com sombra e border radius
├ Badge.tsx       → status visual
├ Loading.tsx     → spinner reutilizável
└ EmptyState.tsx  → estado vazio de listas
```

## Padrão de Props
```typescript
interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
  disabled?: boolean
}
```

## Regras de Acessibilidade
- Sempre incluir `accessibilityLabel` em botões e inputs
- Usar `accessibilityRole` nos componentes interativos