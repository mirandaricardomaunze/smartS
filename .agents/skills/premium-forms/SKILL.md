---
name: Premium Form Development
description: Rules and templates for creating premium-looking forms with correct layout and behavior.
---

# Skill: Premium Form Development

## Core Layout & Aesthetic Rules
1. **Vertical Hierarchy**: Always stack fields vertically (Email, Phone, etc.). Side-by-side layouts (columns) are ONLY allowed for very short inputs (e.g., Code + Quantity) on tablets.
2. **Spacing**: Use `mb-6` between form fields and `mb-8` for the main action button to avoid home indicator clipping.
3. **Glassmorphism**: Use `variant="glass"` for overview cards or summary sections in forms.
4. **Contrast & Depth**: Use `shadow-premium-md` or `shadow-premium-lg` for cards to create depth.
5. **Vibrant Actions**: Use `variant="gradient"` or `primary` ONLY for the final confirmation button. Secondary actions must use `ghost` or `secondary`.
6. **Localization**: Tax ID labels must be `NIF / NUIT / Contribuinte`.
7. **Standard Modal Height**: All form-related `BottomSheet` components must use `height={0.85}` to ensure consistent space for fields and avoid keyboard overlap.
8. **Auth Screens (Full screen Glassmorphism)**:
    - Use `LinearGradient` as the base background.
    - Center form content using `View className="flex-1 justify-center px-6 py-10"`.
    - Use `Card variant="glass"` for the form container.
    - Set `KeyboardAvoidingView behavior="padding"` for maximum stability.
9. **Input Contrast**:
    - On glass backgrounds, always use `textStyle={{ color: '#ffffff' }}` for the `Input`.
    - Set `placeholderTextColor="rgba(255,255,255,0.4)"` for readability.
    - Use semi-transparent backgrounds for input containers: `containerStyle={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}`.

## Component Usage
- **BottomSheet**: Wrap the entire form in the custom `BottomSheet`.
- **Input**: Use the UI `Input` component with labels and error states.
- **Button**: Use the `primary` variant for "Save/Create" and `secondary` or `ghost` for "Cancel".

## Implementation Template
```tsx
// Example of Full-Screen Auth Form (Login/Register)
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Screen from '@/components/layout/Screen'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function AuthScreen() {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#4f46e5', '#a855f7']} style={{ position: 'absolute', fill: '1' }} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Screen scrollable className="bg-transparent" noSafeTop noSafeBottom>
          <View className="flex-1 justify-center px-6 py-10">
            <Card variant="glass" className="p-8">
              <Input 
                label="E-mail" 
                textStyle={{ color: '#fff' }} 
                placeholderTextColor="rgba(255,255,255,0.4)"
                containerStyle={{ backgroundColor: 'rgba(255,255,255,0.08)' }} 
              />
              <Button title="Entrar" variant="primary" />
            </Card>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </View>
  )
}
```

## Accessibility
- Always provide `accessibilityLabel` for buttons.
- Use `keyboardType` appropriately (e.g., `email-address`, `numeric`).
