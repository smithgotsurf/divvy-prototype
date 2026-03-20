# Unified Sections Design

Replace the fixed Bills + Allocations structure with user-defined sections containing uniform line items.

## Motivation

Bills and Allocations are functionally identical — both are line items with a budget and actual amount. The percentage-based budgeting in Allocations is just an input shortcut, not a fundamentally different concept. The YTD column in Allocations is redundant with the Summary page and provides no value in the monthly view. Unifying them simplifies the data model, removes artificial separation, and lets users organize their budget however they want.

## Data Model

### Current month shape

```
{
  bills: [{ id, name, budget, actual, earner1, earner2, notes, autopay }],
  allocations: [{ id, name, pct, actual, earner1, earner2, fixed }],
  funds: [{ id, name, opening, transfersIn, transfersOut, minBal, notes }]
}
```

### New month shape

```
{
  sections: [
    {
      id: string,
      name: string,
      items: [
        { id, name, budget, actual, earner1, earner2, notes }
      ]
    }
  ],
  funds: [{ id, name, opening, transfersIn, transfersOut, minBal, notes }]
}
```

Key changes:

- `bills` and `allocations` arrays replaced by `sections` array
- Each section has an `id`, `name`, and `items` array
- All items share the same shape — no `pct`, `fixed`, or `autopay` fields. These are intentionally removed: `autopay` was never used functionally, `fixed` had no behavioral impact, and `pct` is replaced by a derived display calculation.
- Percentage is purely a display calculation (`budget / totalIncome(earners) * 100`), shown as a read-only `%` column for all items. Rounded to two decimal places.
- Funds remain unchanged as a separate concept at the bottom

### Factories

```js
makeSection(name = "") => ({
  id: crypto.randomUUID(),
  name,
  items: []
})

makeItem(name = "", budget = 0, earner1 = 0, earner2 = 0, actual = 0, notes = "") => ({
  id: crypto.randomUUID(),
  name, budget, earner1, earner2, actual, notes
})
```

### BudgetContext CRUD API

Replaces `addBill/updateBill/removeBill` and `addAllocation/updateAllocation/removeAllocation`:

```
addSection(year, monthIndex, name)
renameSection(year, monthIndex, sectionId, name)
removeSection(year, monthIndex, sectionId)
addItem(year, monthIndex, sectionId, data?)
updateItem(year, monthIndex, sectionId, itemId, updates)
removeItem(year, monthIndex, sectionId, itemId)
```

### cloneMonth behavior

Clone all sections and their items. Zero out `actual` on every item. Keep `budget`, `earner1`, `earner2`, `notes`. Fund behavior unchanged (opening = previous closing).

### completeSetup signature

Changes from `completeSetup(profile, bills, allocations, funds)` to `completeSetup(profile, sections, funds)`. Earner splits on items are computed during setup the same way they are today — proportional to income ratio.

## Monthly Display

### MonthCard

- Income bar (unchanged)
- For each section: an inset card containing a `SectionGrid` component
- Gear icon in the month card header opens "Manage Sections" modal
- Funds grid at the bottom (unchanged)
- Collapsed header totals (Budget / Actual / Delta) sum across all sections

### SectionGrid (replaces BillsGrid and AllocationsGrid)

Single component rendered once per section. Columns:

| Item | % | Budget | (Earner 1) | (Earner 2) | Actual | Notes | Actions |

- `%` column: read-only, calculated as `budget / totalIncome(earners) * 100`, rounded to two decimal places, same styling as current (muted, smaller font, right-aligned)
- Earner columns: shown only when `profile.earners.length === 2`
- Subtotal row per section
- Inline editing for quick single-value tweaks
- Edit button (always visible) opens row modal for multi-field editing
- "+ Add" button in section header opens row modal in new-item mode
- Delete button with confirm dialog

### Manage Sections Modal

Accessed via gear icon in month card header:

- Lists all sections by name
- Add new section: text input + add button, inserts at end
- Rename sections inline
- Delete section with confirm dialog (deletes all items within)
- Sections render in array order
- Reordering is explicitly out of scope for now (can be added later)

Gear icon placement: right side of the month card header, before the Clone button.

## Row Edit Modal

The existing `RowModal` simplifies. The `type="bill"` and `type="allocation"` cases merge into `type="item"`.

Modal fields for a section item:

- **Name** (text)
- **Budget** (number) + **%** (number) — same row, bidirectional. Editing Budget updates % (`budget / totalIncome * 100`, two decimal places). Editing % updates Budget (`Math.round(totalIncome * pct / 100)`, whole dollars). Whichever is touched last wins.
- **Earner 1** / **Earner 2** (number, shown if dual income)
- **Actual** (number)
- **Notes** (text)

The `type="fund"` case stays as-is.

## Setup Wizard

Steps collapse from 5 to 4:

1. **Start** — template picker (unchanged)
2. **Earners** — 1 or 2 with income (unchanged)
3. **Budget Items** — new combined step:
   - Sections shown as collapsible groups
   - Each section: editable name, list of item rows
   - Each item row: Name + Budget amount (with optional % input shortcut on the same line)
   - "+ Add Item" within each section
   - "+ Add Section" at the bottom
   - Can remove items and sections
4. **Funds** — account balances and minimums (unchanged)

### Template updates

Templates change from `{ bills: [...], allocations: [...] }` to `{ sections: [...] }`:

**TEMPLATE_DUAL:**
```
sections: [
  {
    name: "Fixed Bills",
    items: [Mortgage/Rent, Utilities, Internet, Phone, Car Insurance, Subscriptions]
  },
  {
    name: "Flexible Spending",
    items: [Grocery, Savings, Charity]
  }
]
```

**TEMPLATE_SINGLE:**
```
sections: [
  {
    name: "Fixed Bills",
    items: [Rent, Utilities, Internet, Phone, Car Insurance, Subscriptions]
  },
  {
    name: "Flexible Spending",
    items: [Grocery, Savings, Fun Money]
  }
]
```

Items that were previously percentage-based (Grocery, Savings, etc.) get their budget amounts pre-calculated from the template earner income during setup.

## Compatibility

No on-load migration. The user will export existing data before deploying the new format.

**Import function** (`importData` in BudgetContext):

- Detect old format: month objects have `bills` and `allocations` arrays but no `sections`
- Convert each month:
  - `bills` array becomes a section named "Bills". Each bill maps to an item: keep `name`, `budget`, `actual`, `earner1`, `earner2`, `notes`. Strip `autopay`.
  - `allocations` array becomes a section named "Allocations". Each allocation maps to an item: set `budget = Math.round(pct * totalIncome(month.earners) / 100)`, keep `actual`, `earner1`, `earner2`, set `notes = ""`. Strip `pct` and `fixed`.
- New format JSON imports directly

**Export function**: no changes needed, exports current state as-is.

## Affected Files

| File | Change |
|------|--------|
| `src/data.js` | New `makeSection`, `makeItem` factories. Update templates. Remove `makeBill`, `makeAllocation`. |
| `src/context/BudgetContext.jsx` | Replace bill/allocation CRUD with section/item CRUD. Update `cloneMonth`. Update `importData` for old format. |
| `src/components/SectionGrid.jsx` | **New file.** Replaces `BillsGrid.jsx` and `AllocationsGrid.jsx`. |
| `src/components/BillsGrid.jsx` | **Delete.** |
| `src/components/AllocationsGrid.jsx` | **Delete.** |
| `src/components/ManageSectionsModal.jsx` | **New file.** Gear icon modal for add/rename/delete sections. |
| `src/components/RowModal.jsx` | Merge `bill`/`allocation` types into single `item` type. Add bidirectional Budget/% fields. |
| `src/components/MonthCard.jsx` | Render N `SectionGrid` components. Add gear icon. Update totals calculation. |
| `src/components/YtdSidebar.jsx` | Iterate sections instead of bills + allocations. Group items by section name. Remove percentage display from item names. |
| `src/pages/TimelinePage.jsx` | Remove YTD computation and `ytdData` prop (YTD column no longer exists). |
| `src/pages/SummaryPage.jsx` | Aggregate across sections. Show one section header per user-defined section. All items get the same treatment (budget/actual/delta + next-year estimate). |
| `src/pages/SetupPage.jsx` | Merge bills/allocations steps into single "Budget Items" step with section groups. |
| `src/shared/helpers.js` | Remove `allocAmount`. `billsTotal` becomes generic `itemsTotal`. |
