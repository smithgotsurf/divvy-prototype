# Earner Columns & Grid Alignment — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

> Design: [design.md](./design.md)

**Goal:** Add per-earner columns to AllocationsGrid, fix earner column visibility, align columns across grids, and tweak FundsGrid with a notes column and inline min balance.

**Architecture:** Data model changes to `makeAllocation` (add earner fields) and `makeFund` (add notes). CSS column widths enforced via shared classes so Bills/Allocations grids align vertically. FundsGrid gets a notes column and min balance moves inline with fund name.

**Tech Stack:** React 19, plain CSS, localStorage persistence. No tests — prototype-grade code.

**Conventions:** Default exports for components, named exports for data/helpers. Short CSS class names. DM Mono for numbers. Inline editing via EditableCell.

**Code Review Checkpoints:** Group related tasks for review rather than reviewing each task individually:
- **Checkpoint 1:** After Tasks 1-3 (Data model + BillsGrid visibility + AllocationsGrid earner columns)
- **Checkpoint 2:** After Tasks 4-6 (Column alignment CSS + grid separator + FundsGrid changes)
- **Final Review:** After all tasks complete

---

## Tasks

| # | Task | Description | Model |
|---|------|-------------|-------|
| 1 | [Data Model Updates](#task-1-data-model-updates) | Add earner fields to allocations, notes to funds | sonnet |
| 2 | [BillsGrid Visibility Fix](#task-2-billsgrid-visibility-fix) | Show earner columns when 2 earners exist | sonnet |
| 3 | [AllocationsGrid Earner Columns](#task-3-allocationsgrid-earner-columns) | Add Josh/Jacklyn columns with editing | sonnet |
| 4 | [Column Alignment CSS](#task-4-column-alignment-css) | Align Budget/Earner/Actual across grids | sonnet |
| 5 | [Grid Separator](#task-5-grid-separator) | Add divider between Allocations and Funds | sonnet |
| 6 | [FundsGrid Notes + Inline Min](#task-6-fundsgrid-notes--inline-min) | Replace Min column with Notes, inline min balance | sonnet |

---

### Task 1: Data Model Updates

**Files:**
- Modify: `src/data.js:19-23` (makeAllocation)
- Modify: `src/data.js:26-29` (makeFund)
- Modify: `src/data.js:65-69` (SEED_ALLOCATIONS)
- Modify: `src/data.js:72-77` (SEED_FUNDS)
- Modify: `src/context/BudgetContext.jsx:160-164` (addAllocation)
- Modify: `src/context/BudgetContext.jsx:207-208` (completeSetup — initAllocations)

**Step 1: Update `makeAllocation` factory**

In `src/data.js`, change `makeAllocation` to accept and store earner fields:

```js
export const makeAllocation = (name = "", pct = 0, fixed = false, earner1 = 0, earner2 = 0) => ({
  id: crypto.randomUUID(),
  name, pct, fixed,
  actual: 0,
  earner1, earner2,
});
```

**Step 2: Update `makeFund` factory**

In `src/data.js`, add `notes` parameter:

```js
export const makeFund = (name = "", opening = 0, minBal = 0, notes = "") => ({
  id: crypto.randomUUID(),
  name, opening, transfersIn: 0, transfersOut: 0, minBal, notes,
});
```

**Step 3: Update SEED_ALLOCATIONS with earner values**

Seed data has Josh earning $10,600 and Jacklyn $0, so Josh gets 100% of each allocation:

```js
export const SEED_ALLOCATIONS = [
  makeAllocation("Grocery", 13, false, 1380, 0),
  makeAllocation("Charity", 10, true, 1060, 0),
  makeAllocation("Savings", 5, false, 530, 0),
];
```

**Step 4: Update SEED_FUNDS with notes**

Add notes to seed funds that had relevant info in the spreadsheet:

```js
export const SEED_FUNDS = [
  makeFund("Joint Savings", 1325, 250, ""),
  makeFund("Rainy Day Fund", 5400, 25, ""),
  makeFund("Josh Savings", 26832, 250, ""),
  makeFund("Jacklyn Savings", 19648, 250, ""),
];
```

**Step 5: Update `addAllocation` in BudgetContext**

In `src/context/BudgetContext.jsx:160-164`, the new allocation should default earner fields to 0:

```js
const addAllocation = useCallback((year, monthIndex) => {
  updateMonth(year, monthIndex, (m) => ({
    ...m,
    allocations: [...m.allocations, makeAllocation("New Allocation", 0, false, 0, 0)],
  }));
}, [updateMonth]);
```

**Step 6: Update `completeSetup` in BudgetContext**

In `src/context/BudgetContext.jsx:207-208`, pass earner splits when creating allocations from setup:

```js
const initAllocations = allocations.map(a => {
  const amt = allocAmount(a.pct, income);
  const e1 = Math.round(amt * (ratios[0] || 1));
  const e2 = amt - e1;
  return makeAllocation(a.name, a.pct, a.fixed || false, e1, e2);
});
```

**Step 7: Update `cloneMonth` in BudgetContext**

In `src/context/BudgetContext.jsx:89-94`, ensure earner fields carry forward (they already do via spread, but actuals get zeroed — earner values should persist like bills do). Current code already handles this correctly via `...a` spread + `actual: 0`.

No change needed — earner1/earner2 carry forward automatically.

**Step 8: Commit**

```bash
git add src/data.js src/context/BudgetContext.jsx
git commit -m "feat: add earner fields to allocations, notes to funds"
```

---

### Task 2: BillsGrid Visibility Fix

**Files:**
- Modify: `src/components/BillsGrid.jsx:7`

**Step 1: Change `showSplit` condition**

In `src/components/BillsGrid.jsx:7`, change:

```js
// Before
const showSplit = profile.useSplit && profile.earners.length === 2 && profile.earners[1].income > 0;

// After
const showSplit = profile.earners.length === 2;
```

**Step 2: Verify visually**

Run `npm run dev`, open the app. With seed data (Josh $10,600, Jacklyn $0), the Josh and Jacklyn columns should now appear in the Bills section.

**Step 3: Commit**

```bash
git add src/components/BillsGrid.jsx
git commit -m "fix: show earner columns when 2 earners exist regardless of income"
```

---

### Task 3: AllocationsGrid Earner Columns

**Files:**
- Modify: `src/components/AllocationsGrid.jsx`

**Step 1: Add earner column logic and rendering**

Replace the entire `AllocationsGrid.jsx` with earner columns added. Key changes:
- Import `profile` from useBudget
- Add `showSplit` check (same as BillsGrid: `profile.earners.length === 2`)
- Get earner names from profile
- Add `<th>` headers for earner columns between Budget and Actual
- Add `<td>` cells with EditableCell for earner1/earner2
- Add subtotal footer row

```jsx
import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import { fmt, fmtPct, totalIncome, allocAmount } from "../shared/helpers";

export default function AllocationsGrid({ year, monthIndex, allocations, ytdData }) {
  const { updateAllocation, addAllocation, removeAllocation, profile } = useBudget();
  const income = totalIncome(profile.earners);
  const showSplit = profile.earners.length === 2;
  const e1Name = profile.earners[0]?.name || "Earner 1";
  const e2Name = profile.earners[1]?.name || "Earner 2";

  const budgetTotal = allocations.reduce((s, a) => s + allocAmount(a.pct, income), 0);
  const actualTotal = allocations.reduce((s, a) => s + a.actual, 0);

  return (
    <div className="ag">
      <div className="ag-hdr">
        <span className="ag-title">Allocations</span>
        <button className="ag-add" onClick={() => addAllocation(year, monthIndex)}>+ Add</button>
      </div>
      <table className="ag-tbl">
        <thead>
          <tr>
            <th className="ag-th-name">Item</th>
            <th className="ag-th-pct">%</th>
            <th className="ag-th-num">Budget</th>
            {showSplit && <th className="ag-th-num">{e1Name}</th>}
            {showSplit && <th className="ag-th-num">{e2Name}</th>}
            <th className="ag-th-num">Actual</th>
            <th className="ag-th-notes">YTD</th>
            <th className="ag-th-x"></th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a) => {
            const budgetAmt = allocAmount(a.pct, income);
            const ytd = ytdData?.[a.name] || null;
            return (
              <tr key={a.id}>
                <td>
                  <EditableCell value={a.name} onChange={(v) => updateAllocation(year, monthIndex, a.id, { name: v })} />
                </td>
                <td className="num">
                  <EditableCell value={a.pct} type="number" formatter={fmtPct} onChange={(v) => updateAllocation(year, monthIndex, a.id, { pct: v })} />
                </td>
                <td className="num">{fmt(budgetAmt)}</td>
                {showSplit && (
                  <td className="num">
                    <EditableCell value={a.earner1} type="number" formatter={fmt} onChange={(v) => updateAllocation(year, monthIndex, a.id, { earner1: v })} />
                  </td>
                )}
                {showSplit && (
                  <td className="num">
                    <EditableCell value={a.earner2} type="number" formatter={fmt} onChange={(v) => updateAllocation(year, monthIndex, a.id, { earner2: v })} />
                  </td>
                )}
                <td className="num">
                  <EditableCell value={a.actual} type="number" formatter={fmt} onChange={(v) => updateAllocation(year, monthIndex, a.id, { actual: v })} />
                </td>
                <td className="ag-ytd">{ytd !== null ? `YTD: ${fmt(ytd)}` : ""}</td>
                <td>
                  <button className="ag-rm" onClick={() => removeAllocation(year, monthIndex, a.id)} title="Remove">×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="ag-totals">
            <td>Subtotal</td>
            <td></td>
            <td className="num">{fmt(budgetTotal)}</td>
            {showSplit && <td></td>}
            {showSplit && <td></td>}
            <td className="num">{fmt(actualTotal)}</td>
            <td></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
```

**Step 2: Add `ag-totals` and `ag-th-pct` CSS**

In `src/app.css`, add after the existing `.ag-ytd` block (~line 343):

```css
/* Allocation totals row */
.ag-totals td {
  font-weight: 600;
  border-top: 2px solid var(--border);
  border-bottom: none;
  padding-top: 6px;
  padding-bottom: 8px;
}

/* Pct column — narrow, tucked next to Item */
.ag-th-pct { text-align: right; width: 48px; }
```

**Step 3: Verify visually**

Allocations grid should show: Item | % | Budget | Josh | Jacklyn | Actual | YTD | × with a subtotal footer. The % column should be narrow.

**Step 4: Commit**

```bash
git add src/components/AllocationsGrid.jsx src/app.css
git commit -m "feat: add earner columns and subtotal to AllocationsGrid"
```

---

### Task 4: Column Alignment CSS

**Files:**
- Modify: `src/app.css`
- Modify: `src/components/BillsGrid.jsx` (add CSS classes to columns)
- Modify: `src/components/AllocationsGrid.jsx` (add CSS classes to columns)

This task ensures Budget, Josh, Jacklyn, Actual, Notes/YTD, and × columns are the same width across both grids so they align vertically.

**Step 1: Define shared column width classes**

In `src/app.css`, add a new section after the shared grid styles (~line 298):

```css
/* ── Column Alignment (shared across Bills & Allocations) ── */
.col-num { width: 100px; }
.col-notes { width: 100px; }
.col-x { width: 28px; }
```

**Step 2: Apply classes to BillsGrid `<th>` elements**

In `src/components/BillsGrid.jsx`, update the `<thead>`:

```jsx
<thead>
  <tr>
    <th className="bg-th-name">Item</th>
    <th className="bg-th-num col-num">Budget</th>
    {showSplit && <th className="bg-th-num col-num">{e1Name}</th>}
    {showSplit && <th className="bg-th-num col-num">{e2Name}</th>}
    <th className="bg-th-num col-num">Actual</th>
    <th className="bg-th-notes col-notes">Notes</th>
    <th className="bg-th-x col-x"></th>
  </tr>
</thead>
```

**Step 3: Apply classes to AllocationsGrid `<th>` elements**

In `src/components/AllocationsGrid.jsx`, update the `<thead>`:

```jsx
<thead>
  <tr>
    <th className="ag-th-name">Item</th>
    <th className="ag-th-pct">%</th>
    <th className="ag-th-num col-num">Budget</th>
    {showSplit && <th className="ag-th-num col-num">{e1Name}</th>}
    {showSplit && <th className="ag-th-num col-num">{e2Name}</th>}
    <th className="ag-th-num col-num">Actual</th>
    <th className="ag-th-notes col-notes">YTD</th>
    <th className="ag-th-x col-x"></th>
  </tr>
</thead>
```

The Item column in BillsGrid will auto-expand to fill remaining space. In AllocationsGrid, Item + % together fill the same horizontal space as BillsGrid's Item column — no explicit width needed since both are `auto` and the table fills 100%.

**Step 4: Verify visually**

View a month card — Budget, Josh, Jacklyn, Actual columns should align vertically between Bills and Allocations grids. The % column in Allocations steals from the Item column width.

**Step 5: Commit**

```bash
git add src/app.css src/components/BillsGrid.jsx src/components/AllocationsGrid.jsx
git commit -m "feat: align columns across Bills and Allocations grids"
```

---

### Task 5: Grid Separator

**Files:**
- Modify: `src/app.css`

**Step 1: Check existing separator between Bills and Allocations**

The current separation comes from the section headers (`.bg-hdr`, `.ag-hdr`) padding. There's no explicit `border-top` between sections. Look at the existing spacing — both `.bg` and `.ag` have `padding: 0`, the visual break comes from the section header rows.

**Step 2: Add separator between Allocations and Funds**

In `src/app.css`, add after the `.bg, .ag, .fg { padding: 0; }` rule (~line 219):

```css
.fg { border-top: 1px solid var(--border-light); }
```

This adds a light horizontal line above the Funds section header, matching the visual weight of the existing Bills/Allocations separation.

**Step 3: Verify visually**

There should now be a visible divider line between the Allocations and Funds sections.

**Step 4: Commit**

```bash
git add src/app.css
git commit -m "feat: add separator between Allocations and Funds grids"
```

---

### Task 6: FundsGrid Notes + Inline Min

**Files:**
- Modify: `src/components/FundsGrid.jsx`
- Modify: `src/app.css`

**Step 1: Update FundsGrid component**

Replace the full FundsGrid with the new layout — Min column removed, Notes column added, min balance shown inline with fund name:

```jsx
import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import { fmt, fundClosing } from "../shared/helpers";

export default function FundsGrid({ year, monthIndex, funds }) {
  const { updateFund, addFund, removeFund } = useBudget();

  return (
    <div className="fg">
      <div className="fg-hdr">
        <span className="fg-title">Funds</span>
        <button className="fg-add" onClick={() => addFund(year, monthIndex)}>+ Add</button>
      </div>
      <table className="fg-tbl">
        <thead>
          <tr>
            <th className="fg-th-name">Fund</th>
            <th className="fg-th-num">Opening</th>
            <th className="fg-th-num">In</th>
            <th className="fg-th-num">Out</th>
            <th className="fg-th-num">Closing</th>
            <th className="fg-th-notes">Notes</th>
            <th className="fg-th-x"></th>
          </tr>
        </thead>
        <tbody>
          {funds.map((f) => {
            const closing = fundClosing(f);
            const belowMin = f.minBal > 0 && closing < f.minBal;
            return (
              <tr key={f.id} className={belowMin ? "fg-warn" : ""}>
                <td>
                  <div className="fg-name-cell">
                    <EditableCell value={f.name} onChange={(v) => updateFund(year, monthIndex, f.id, { name: v })} />
                    <span className="fg-min">
                      {f.minBal > 0 ? " · " : ""}
                      <EditableCell
                        value={f.minBal || ""}
                        type="number"
                        formatter={(v) => v ? `min ${fmt(v)}` : ""}
                        onChange={(v) => updateFund(year, monthIndex, f.id, { minBal: v || 0 })}
                        placeholder="+ min"
                      />
                    </span>
                  </div>
                </td>
                <td className="num">
                  <EditableCell value={f.opening} type="number" formatter={fmt} onChange={(v) => updateFund(year, monthIndex, f.id, { opening: v })} />
                </td>
                <td className="num">
                  <EditableCell value={f.transfersIn} type="number" formatter={fmt} onChange={(v) => updateFund(year, monthIndex, f.id, { transfersIn: v })} />
                </td>
                <td className="num">
                  <EditableCell value={f.transfersOut} type="number" formatter={fmt} onChange={(v) => updateFund(year, monthIndex, f.id, { transfersOut: v })} />
                </td>
                <td className={`num ${belowMin ? "fg-below" : ""}`}>{fmt(closing)}</td>
                <td>
                  <EditableCell value={f.notes} onChange={(v) => updateFund(year, monthIndex, f.id, { notes: v })} className="bg-notes" />
                </td>
                <td>
                  <button className="fg-rm" onClick={() => removeFund(year, monthIndex, f.id)} title="Remove">×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Note:** This uses a `placeholder` prop on EditableCell. Check if EditableCell supports `placeholder` — if not, it needs a small tweak. Current EditableCell (`src/components/EditableCell.jsx`) should be checked. If it doesn't support placeholder, add it as an optional prop that shows muted text when value is empty.

**Step 2: Add CSS for inline min balance**

In `src/app.css`, add after the `.fg-below` rule (~line 348):

```css
/* Fund name cell with inline min */
.fg-name-cell {
  display: flex;
  align-items: baseline;
  gap: 0;
}

.fg-min {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.fg-min .ec { font-size: 0.7rem; color: var(--text-muted); }
.fg-min .ec-empty { font-style: normal; }
```

**Step 3: Check EditableCell for `placeholder` support**

Read `src/components/EditableCell.jsx`. If it doesn't support a `placeholder` prop, add one:
- When value is empty/falsy and not editing, show `placeholder` text in muted style
- When clicked, open the edit input as normal

**Step 4: Update `addFund` in BudgetContext**

In `src/context/BudgetContext.jsx:182-186`, the `makeFund` call already works — `makeFund("New Fund", 0, 0)` will get `notes=""` from the default parameter. No change needed.

**Step 5: Verify visually**

- Fund names should show `Rainy Day Fund · min $25` with the min part in small muted text
- Clicking on `min $25` should open an editor for the min balance value
- Funds with no min balance should show just the name (or a subtle `+ min` placeholder)
- Notes column should be editable
- Below-min warning styling should still work

**Step 6: Commit**

```bash
git add src/components/FundsGrid.jsx src/app.css src/components/EditableCell.jsx
git commit -m "feat: replace Min column with Notes, inline min balance in FundsGrid"
```

---

## Verification

After all tasks, clear localStorage (`localStorage.removeItem('divvy-budget')`) and reload to get fresh seed data. Verify:

1. Bills grid shows Josh/Jacklyn columns even though Jacklyn income is $0
2. Allocations grid shows Josh/Jacklyn columns with editable earner amounts
3. Budget, earner, and Actual columns align vertically between Bills and Allocations
4. Visible separator line between Allocations and Funds
5. Funds grid has Notes column instead of Min
6. Fund names show inline min balance (e.g., `Rainy Day Fund · min $25`)
7. Min balance is click-to-edit and optional
8. Below-min warning still highlights funds when closing < minBal
