---
trigger: always_on
description: Arquitetura do Projeto
---

# Architecture & Folder Structure

## Activation: Always On

## Folder Structure
```
app/                          → Expo Router routes only
src/
├ features/
│  ├ auth/                    → login, register, session
│  ├ users/                   → user management + permissions
│  ├ products/                → product CRUD + images
│  ├ inventory/               → stock levels, minimums
│  ├ movements/               → entry, exit, transfer, adjustment
│  ├ expiry/                  → lot tracking, expiry alerts
│  ├ notes/                   → entry/exit/transfer notes
│  ├ reports/                 → PDF + Excel exports
│  ├ scanner/                 → barcode scanning
│  ├ notifications/           → push + in-app notifications
│  ├ sync/                    → sync status + conflict resolution
│  ├ backup/                  → cloud + manual backup
│  ├ history/                 → full audit log
│  ├ settings/                → dark mode, currency, language
│  └ dashboard/               → KPIs + charts
│     (each feature contains: components/, services/, hooks/, store/, types/)
├ components/
│  ├ ui/                      → Button, Input, Card, Badge, Loading, EmptyState
│  ├ layout/                  → Screen, Header, TabBar
│  └ forms/                   → FormField, FormError
├ database/
│  ├ sqlite.ts                → DB init + migrations runner
│  └ migrations/              → versioned SQL files
├ repositories/               → data access layer (SQLite + Supabase)
├ services/                   → shared business logic
├ store/                      → global Zustand stores
├ hooks/                      → shared hooks
├ utils/                      → syncData, networkListener, uuid, formatters
├ types/                      → global shared types
├ theme/                      → colors, spacing, typography
└ assets/                     → images, fonts, icons
```

## Data Flow (mandatory)
```
Screen → Hook → Service → Repository → SQLite → Supabase
```

## Layer Rules
- `app/` → routes only, zero logic
- `features/` → self-contained, each has its own components/services/hooks/store/types
- `repositories/` → only layer allowed to touch SQLite or Supabase
- `services/` → business rules, calls repositories, never touches DB directly
- `hooks/` → connects UI to services, returns state + actions
- `components/ui/` → purely visual, no business logic