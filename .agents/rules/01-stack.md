---
trigger: always_on
description: # Stack e Tecnologias do Projeto
---

# Stack & General Rules

## Activation: Always On

## Tech Stack
- React Native + Expo
- Expo Router (file-based routing)
- Supabase (auth + cloud DB + storage)
- SQLite via expo-sqlite (offline-first)
- Zustand (global state)
- NativeWind (Tailwind styling)
- TypeScript (strict mode)
- expo-barcode-scanner (scanner)
- expo-notifications (push notifications)
- expo-image-picker (product images)

## General Rules
- Always use strict TypeScript — no `any`
- Code comments always in English
- Use `const` by default, `let` only when needed
- Absolute imports with `@/` prefix
- Never call Supabase or SQLite directly from a component
- Mandatory use of `useFormatter` hook for all currency displays
- All user-facing text in Portuguese (UI labels, messages, errors)
- All code identifiers (variables, functions, types) in Englishex: `@/features/auth/hooks/useAuth`)