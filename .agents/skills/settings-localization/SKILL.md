---
name: Global Settings & Localization
description: Rules for managing currency, language and dark mode settings across the application.
---

# Skill: Global Settings & Localization

## Overview
This skill defines how to manage and apply global settings (currency, language, dark mode) throughout the SmartS application. It ensures a consistent user experience by centralizing the application of these settings via hooks and stores.

## Implementation Rules
1. **Never Hardcode Currency Symbols**: Always use the global currency setting from the `settingsStore`.
2. **Use `useFormatter` Hook**: All components displaying monetary values MUST use the `useFormatter` hook.
   - Example: `const { formatCurrency } = useFormatter();`
   - UI: `{formatCurrency(value)}`
3. **Use `useSettings` Hook**: For non-formatting settings like dark mode or language, use the `useSettings` hook.
4. **Localization (NIF/NUIT)**: Ensure tax identifier labels use the `NIF / NUIT` format to support multiple regions.
5. **Persistence**: Settings are stored in Zustand and should be persisted to local storage (SQLite or AsyncStorage) to survive app restarts.
6. **Dashboard Naming**: Always use "Saúde de Estoque" instead of "Saúde de Inventário" for the inventory health chart labels.

## Formatting Rules
- **Mozambique (MZN)**: Symbol is `MT`.
- **Angola (AOA)**: Symbol is `Kz`.
- **Portugal/Europe (EUR)**: Symbol is `€`.
- **Brazil (BRL)**: Symbol is `R$`.
- **USA/Global (USD)**: Symbol is `$`.

## Verification Steps
- Change currency in Settings and verify all financial displays update immediately.
- Toggle Dark Mode and verify all `Card`, `Input`, and `Screen` components adjust their themes.
- Generate a PDF report and verify the header reflects the active company's information and global currency.
