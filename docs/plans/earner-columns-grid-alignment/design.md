# Earner Columns & Grid Alignment — Design

## Overview

Add per-earner columns to AllocationsGrid (matching BillsGrid), fix earner column visibility, align columns across grids, and tweak FundsGrid (notes column, inline min balance).

## Origin

The original Google Sheets budget had columns `Budget | Josh | Jacklyn | Actual` consistently across Bills and Allocations. The prototype app currently only has earner columns in BillsGrid (and hides them when earner 2 income is $0). AllocationsGrid has no earner columns. FundsGrid uses a Min column that would be better as Notes, with min balance tucked inline with the fund name.

## Changes

### 1. BillsGrid — earner column visibility fix

- Show earner columns when `profile.earners.length === 2`
- Remove the `earner2.income > 0` check from `showSplit`
- No other changes to BillsGrid

### 2. AllocationsGrid — add earner columns

- Add `earner1`, `earner2` fields to `makeAllocation()` factory (default 0)
- Update seed data with earner values (pre-filled from split ratio)
- Update BudgetContext CRUD (`addAllocation`, `updateAllocation`) to handle earner fields
- Column order: **Item | % | Budget | Josh | Jacklyn | Actual | YTD | ×**
- Earner columns are editable, pre-filled from income split ratio, independently overridable
- Same visibility rule as BillsGrid: show when `profile.earners.length === 2`

### 3. Column alignment between Bills and Allocations

- Use consistent column widths so Budget, Josh, Jacklyn, Actual, and Notes/YTD columns align vertically across BillsGrid and AllocationsGrid
- The `%` column in Allocations borrows width from the Item column — Item gets narrower, `%` sits tight next to it
- Both grids' numeric columns line up when stacked

### 4. Separator between Allocations and Funds

- Add the same horizontal divider treatment that exists between Bills and Allocations

### 5. FundsGrid — Notes column + inline min balance

- Replace the Min column with an editable Notes column
- Add `notes` field to `makeFund()` factory (default empty string)
- `minBal` stays in the data model but moves inline with the fund name
- Display: `Rainy Day Fund · min $25` — min part in smaller muted text
- Min balance is click-to-edit and optional (blank/zero = no minimum shown)
- Below-minimum warning styling still triggers when closing balance < minBal

## Data Model Changes

### makeAllocation — add earner fields

```js
// Before
makeAllocation(name, pct, fixed) => ({ id, name, pct, fixed, actual })

// After
makeAllocation(name, pct, fixed, earner1 = 0, earner2 = 0) => ({ id, name, pct, fixed, actual, earner1, earner2 })
```

### makeFund — add notes field

```js
// Before
makeFund(name, opening, minBal) => ({ id, name, opening, transfersIn, transfersOut, minBal })

// After
makeFund(name, opening, minBal, notes = "") => ({ id, name, opening, transfersIn, transfersOut, minBal, notes })
```

## Files Affected

- `src/data.js` — factory functions, seed data
- `src/components/BillsGrid.jsx` — visibility condition
- `src/components/AllocationsGrid.jsx` — add earner columns, subtotals
- `src/components/FundsGrid.jsx` — notes column, inline min balance
- `src/app.css` — column width alignment, separator, inline min styling
- `src/context/BudgetContext.jsx` — allocation CRUD updates (if needed)
