---
description: # Generate Report  ## Description Generates a professional report (PDF or Excel) for the requested report type.
---

# Generate Report

## Description
Generates a professional report (PDF or Excel) for the requested report type.

## Usage: `/gerar-relatorio [type]`
## Types: stock | movements | expiry | product

## Steps

### 1. Identify report type
Based on the type, determine which repository to query:
- `stock` → inventoryRepository.getAll()
- `movements` → movementsRepository.getByDateRange()
- `expiry` → expiryRepository.getExpiring()
- `product` → productsRepository.getById()

### 2. Check permissions
Verify user has `view_reports` permission per @../rules/03-permissions.md

### 3. Fetch data
Fetch the required data from the local SQLite repository

### 4. Generate PDF
Create the PDF with:
- Company logo (from user profile)
- Report title and date range
- Summary KPIs at the top
- Data table with all records
- Footer with generation timestamp and user name
- White background, no colored fills (print-friendly)

### 5. Export options
Offer export via:
- Save to device
- Share as PDF (email / WhatsApp)
- Share as Excel (movements and stock reports only)

### 6. Log to history
Record the report generation in the history table with user and timestamp