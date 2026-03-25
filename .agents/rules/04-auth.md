---
description: # Autenticação com Supabase
---

# Autenticação com Supabase

## Ativação: Glob
## Padrão: src/features/auth/**

## Stack de Auth
- Supabase Auth (email + password)
- Zustand para estado global do utilizador
- Expo Router para proteção de rotas

## Store de Auth (Zustand)
```typescript
interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}
```

## Funções Obrigatórias
- `register(email, password)` → supabase.auth.signUp
- `login(email, password)` → supabase.auth.signInWithPassword
- `logout()` → supabase.auth.signOut + limpar store
- `getUser()` → supabase.auth.getUser

## Proteção de Rotas
- Rotas protegidas em `app/(protected)/`
- Rotas públicas em `app/(auth)/`
- Verificar sessão no layout root com `useAuthStore`

## Regras
- Nunca guardar password em SQLite ou AsyncStorage
- Sempre tratar erros de auth com mensagens amigáveis em português
- Sessão do Supabase persiste automaticamente — não duplicar lógica
- Usar `onAuthStateChange` para sincronizar store com sessão real