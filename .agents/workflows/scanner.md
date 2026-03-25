---
description: # Barcode Scanner Feature  ## Description Implements or fixes the barcode scanner feature for product lookup and stock movements.
---

# Barcode Scanner Feature

## Description
Implements or fixes the barcode scanner feature for product lookup and stock movements.

## Usage: `/scanner`

## Steps

### 1. Verify dependency
Check `expo-barcode-scanner` is installed and permissions are declared in `app.json`

### 2. Create scanner component
Create `src/features/scanner/components/BarcodeScanner.tsx` that:
- Requests camera permission on mount
- Shows camera preview with scan overlay UI
- Debounces scans (min 1.5s between reads)
- Returns scanned barcode via `onScan(barcode: string)` callback
- Has a close/cancel button

### 3. Create scanner hook
Create `src/features/scanner/hooks/useScanner.ts` that:
- Calls `productsRepository.getByBarcode(barcode)`
- Returns found product or null
- Handles "product not found" case

### 4. Create scanner screen
Create `app/(app)/scanner/index.tsx` that:
- Opens the BarcodeScanner component
- On scan, looks up product
- If found → shows product details + quick movement buttons (entry / exit)
- If not found → shows "Produto não encontrado" with option to create

### 5. Quick movement modal
Create a modal that allows:
- Selecting movement type (entry / exit)
- Entering quantity
- Confirming with one tap
- Calls movementsService.create() and closes

### 6. Confirm
List all created files and test the scan-to-movement flow