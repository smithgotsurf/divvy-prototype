# Unified Sections Implementation Plan

> Design: [design.md](./design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed Bills + Allocations structure with user-defined sections containing uniform line items.

**Architecture:** Collapse `bills[]` and `allocations[]` into `sections[]` where each section has a `name` and `items[]`. All items share the same shape. Percentage is a derived display value. A new `SectionGrid` component replaces both `BillsGrid` and `AllocationsGrid`.

**Tech Stack:** React 19, Vite 6, plain JS (no TypeScript, no tests)

**Note:** The app will not build/run correctly between Tasks 3 and 8. Complete through Task 8 before testing in the browser.

**Code Review Checkpoints:** Group related tasks for review rather than reviewing each task individually:
- **Checkpoint 1:** After Tasks 1-3 (Data layer — factories, helpers, context CRUD)
- **Checkpoint 2:** After Tasks 4-6 (UI components — SectionGrid, RowModal, ManageSectionsModal)
- **Checkpoint 3:** After Tasks 7-8 (MonthCard + TimelinePage integration)
- **Checkpoint 4:** After Tasks 9-11 (Setup wizard, Summary, YTD Sidebar)
- **Final Review:** After Task 12 (Import compatibility, cleanup, build verification)

## Tasks

| # | Task | Description | Model |
|---|------|-------------|-------|
| 1 | [Data Factories & Helpers](#task-1-data-factories--helpers) | Replace makeBill/makeAllocation with makeSection/makeItem, update helpers | sonnet |
| 2 | [Templates](#task-2-templates) | Convert TEMPLATE_DUAL and TEMPLATE_SINGLE to sections format | sonnet |
| 3 | [BudgetContext CRUD](#task-3-budgetcontext-crud) | Replace bill/allocation CRUD with section/item CRUD, update cloneMonth/completeSetup/importData | sonnet |
| 4 | [SectionGrid Component](#task-4-sectiongrid-component) | New component replacing BillsGrid and AllocationsGrid | sonnet |
| 5 | [RowModal Update](#task-5-rowmodal-update) | Merge bill/allocation types into item, add bidirectional Budget/% | sonnet |
| 6 | [ManageSectionsModal](#task-6-managesectionsmodal) | New modal for add/rename/delete sections | sonnet |
| 7 | [MonthCard Integration](#task-7-monthcard-integration) | Wire up SectionGrid, gear icon, remove old grid imports | sonnet |
| 8 | [TimelinePage Update](#task-8-timelinepage-update) | Remove YTD computation, simplify props | sonnet |
| 9 | [Setup Wizard](#task-9-setup-wizard) | Merge bills/allocations steps into section-based Budget Items step | sonnet |
| 10 | [SummaryPage Update](#task-10-summarypage-update) | Aggregate by sections instead of bills/allocations | sonnet |
| 11 | [YTD Sidebar Update](#task-11-ytd-sidebar-update) | Group by sections, remove percentage display | sonnet |
| 12 | [Cleanup & Verification](#task-12-cleanup--verification) | Delete old files, verify build, commit | sonnet |

---

### Task 1: Data Factories & Helpers

**Files:**
- Modify: `src/data.js` — replace `makeBill`, `makeAllocation`, `makeMonth` with `makeSection`, `makeItem`, updated `makeMonth`
- Modify: `src/shared/helpers.js` — rename `billsTotal` to `itemsTotal`, remove `allocAmount`

- [ ] **Step 1: Replace factories in data.js**

Remove `makeBill` and `makeAllocation`. Add `makeSection` and `makeItem`. Update `makeMonth` to accept `sections` instead of `bills` and `allocations`.

```js
// Replace makeBill and makeAllocation with:

// Factory: create a blank section (items get IDs assigned by makeMonth or addItem)
export const makeSection = (name = "", items = []) => ({
  id: crypto.randomUUID(),
  name,
  items,
});

// Factory: create a blank line item
export const makeItem = (name = "", budget = 0, earner1 = 0, earner2 = 0, actual = 0, notes = "") => ({
  id: crypto.randomUUID(),
  name, budget, earner1, earner2, actual, notes,
});

// Update makeMonth signature and body:
export const makeMonth = (year, month, earners, sections, funds) => ({
  id: `${year}-${String(month + 1).padStart(2, "0")}`,
  year,
  month,
  earners: earners.map(e => ({ ...e })),
  sections: sections.map(s => ({
    ...s,
    id: crypto.randomUUID(),
    items: s.items.map(item => ({ ...item, id: crypto.randomUUID() })),
  })),
  funds: funds.map(f => ({ ...f, id: crypto.randomUUID() })),
});
```

- [ ] **Step 2: Update helpers.js**

Rename `billsTotal` to `itemsTotal` (same logic, just renamed). Remove `allocAmount`.

```js
// Rename billsTotal → itemsTotal (same implementation)
export const itemsTotal = (items, field = "budget") =>
  items.reduce((s, item) => s + (item[field] || 0), 0);

// Delete allocAmount entirely
```

- [ ] **Step 3: Commit**

```bash
git add src/data.js src/shared/helpers.js
git commit -m "refactor: replace bill/allocation factories with section/item"
```

---

### Task 2: Templates

**Files:**
- Modify: `src/data.js` — update `TEMPLATE_DUAL` and `TEMPLATE_SINGLE`

- [ ] **Step 1: Update TEMPLATE_DUAL**

Replace `bills` and `allocations` arrays with `sections`. Pre-calculate budget amounts for items that were previously percentage-based. For TEMPLATE_DUAL, total income = 6500 + 4000 = 10500.

```js
export const TEMPLATE_DUAL = {
  label: "Dual income household",
  description: "Two earners splitting bills proportionally",
  earnerCount: 2,
  useSplit: true,
  earners: [
    { name: "Jack", income: 6500 },
    { name: "Jill", income: 4000 },
  ],
  sections: [
    {
      name: "Fixed Bills",
      items: [
        { name: "Mortgage/Rent", budget: 2200, notes: "" },
        { name: "Utilities", budget: 250, notes: "" },
        { name: "Internet", budget: 80, notes: "" },
        { name: "Phone", budget: 120, notes: "" },
        { name: "Car Insurance", budget: 180, notes: "" },
        { name: "Subscriptions", budget: 60, notes: "" },
      ],
    },
    {
      name: "Flexible Spending",
      items: [
        { name: "Grocery", budget: 1260, notes: "" },
        { name: "Savings", budget: 1050, notes: "" },
        { name: "Charity", budget: 525, notes: "" },
      ],
    },
  ],
  funds: [
    { name: "Joint Savings", opening: 5000, minBal: 1000 },
    { name: "Emergency Fund", opening: 10000, minBal: 5000 },
  ],
};
```

- [ ] **Step 2: Update TEMPLATE_SINGLE**

Same pattern. Single income = 5500.

```js
export const TEMPLATE_SINGLE = {
  label: "Single income household",
  description: "One earner managing all expenses",
  earnerCount: 1,
  useSplit: false,
  earners: [
    { name: "Jack", income: 5500 },
    { name: "", income: 0 },
  ],
  sections: [
    {
      name: "Fixed Bills",
      items: [
        { name: "Rent", budget: 1500, notes: "" },
        { name: "Utilities", budget: 180, notes: "" },
        { name: "Internet", budget: 70, notes: "" },
        { name: "Phone", budget: 80, notes: "" },
        { name: "Car Insurance", budget: 150, notes: "" },
        { name: "Subscriptions", budget: 45, notes: "" },
      ],
    },
    {
      name: "Flexible Spending",
      items: [
        { name: "Grocery", budget: 660, notes: "" },
        { name: "Savings", budget: 440, notes: "" },
        { name: "Fun Money", budget: 275, notes: "" },
      ],
    },
  ],
  funds: [
    { name: "Savings Account", opening: 4000, minBal: 1000 },
    { name: "Emergency Fund", opening: 8000, minBal: 3000 },
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add src/data.js
git commit -m "refactor: convert templates to sections format"
```

---

### Task 3: BudgetContext CRUD

**Files:**
- Modify: `src/context/BudgetContext.jsx` — replace all bill/allocation CRUD, update cloneMonth, completeSetup, importData, provider exports

- [ ] **Step 1: Update imports**

```js
// Change:
import { STORAGE_KEY, EMPTY_STATE, makeMonth, makeBill, makeAllocation, makeFund } from "../data";
import { totalIncome, splitRatios, allocAmount, fundClosing } from "../shared/helpers";

// To:
import { STORAGE_KEY, EMPTY_STATE, makeMonth, makeSection, makeItem, makeFund } from "../data";
import { totalIncome, splitRatios, fundClosing } from "../shared/helpers";
```

- [ ] **Step 2: Replace bill/allocation CRUD with section/item CRUD**

Remove `addBill`, `updateBill`, `removeBill`, `addAllocation`, `updateAllocation`, `removeAllocation`. Replace with:

```js
// --- Section CRUD ---
const addSection = useCallback((year, monthIndex, name) => {
  updateMonth(year, monthIndex, (m) => ({
    ...m,
    sections: [...m.sections, makeSection(name || "New Section")],
  }));
}, [updateMonth]);

const renameSection = useCallback((year, monthIndex, sectionId, name) => {
  updateMonth(year, monthIndex, (m) => ({
    ...m,
    sections: m.sections.map(s => s.id === sectionId ? { ...s, name } : s),
  }));
}, [updateMonth]);

const removeSection = useCallback((year, monthIndex, sectionId) => {
  updateMonth(year, monthIndex, (m) => ({
    ...m,
    sections: m.sections.filter(s => s.id !== sectionId),
  }));
}, [updateMonth]);

// --- Item CRUD within a section ---
const addItem = useCallback((year, monthIndex, sectionId, data) => {
  const item = data
    ? makeItem(data.name, data.budget, data.earner1, data.earner2, data.actual, data.notes)
    : makeItem("New Item");
  updateMonth(year, monthIndex, (m) => ({
    ...m,
    sections: m.sections.map(s =>
      s.id === sectionId ? { ...s, items: [...s.items, item] } : s
    ),
  }));
}, [updateMonth]);

const updateItem = useCallback((year, monthIndex, sectionId, itemId, updates) => {
  updateMonth(year, monthIndex, (m) => ({
    ...m,
    sections: m.sections.map(s =>
      s.id === sectionId
        ? { ...s, items: s.items.map(item => item.id === itemId ? { ...item, ...updates } : item) }
        : s
    ),
  }));
}, [updateMonth]);

const removeItem = useCallback((year, monthIndex, sectionId, itemId) => {
  updateMonth(year, monthIndex, (m) => ({
    ...m,
    sections: m.sections.map(s =>
      s.id === sectionId
        ? { ...s, items: s.items.filter(item => item.id !== itemId) }
        : s
    ),
  }));
}, [updateMonth]);
```

- [ ] **Step 3: Update cloneMonth**

Replace the `newBills` and `newAllocs` logic with `newSections`:

```js
// Replace newBills + newAllocs + the month construction with:
const newSections = source.sections.map(s => ({
  ...s,
  id: crypto.randomUUID(),
  items: s.items.map(item => ({
    ...item,
    id: crypto.randomUUID(),
    actual: 0,
  })),
}));

// In the newMonth object, replace bills/allocations with:
const newMonth = {
  id: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`,
  year: nextYear,
  month: nextMonth,
  earners: source.earners.map(e => ({ ...e })),
  sections: newSections,
  funds: newFunds,
};
```

- [ ] **Step 4: Update completeSetup**

Change signature from `(profile, bills, allocations, funds)` to `(profile, sections, funds)`:

```js
const completeSetup = useCallback((profile, sections, funds) => {
  const ratios = splitRatios(profile.earners);

  const initSections = sections.map(s => ({
    name: s.name,
    items: s.items.map(item => {
      const e1 = Math.round(item.budget * (ratios[0] || 1));
      const e2 = item.budget - e1;
      return makeItem(item.name, item.budget, e1, e2, 0, item.notes || "");
    }),
  }));

  const initFunds = funds.map(f =>
    makeFund(f.name, f.opening || 0, f.minBal || 0)
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstMonth = makeMonth(year, month, profile.earners, initSections, initFunds);

  const newState = {
    profile,
    years: { [year]: { months: [firstMonth] } },
    currentYear: year,
    setupComplete: true,
  };

  persist(newState);
}, [persist]);
```

- [ ] **Step 5: Update importData for old format compatibility**

```js
const importData = useCallback((jsonString) => {
  const parsed = JSON.parse(jsonString);
  if (!parsed.profile || !parsed.years || parsed.setupComplete === undefined) {
    throw new Error("Invalid Divvy budget file");
  }

  // Migrate old format (bills + allocations) to sections
  for (const yearKey of Object.keys(parsed.years)) {
    const yearData = parsed.years[yearKey];
    for (const m of yearData.months) {
      if (m.bills && m.allocations && !m.sections) {
        const income = totalIncome(m.earners);
        m.sections = [
          {
            id: crypto.randomUUID(),
            name: "Bills",
            items: m.bills.map(b => ({
              id: crypto.randomUUID(),
              name: b.name,
              budget: b.budget || 0,
              actual: b.actual || 0,
              earner1: b.earner1 || 0,
              earner2: b.earner2 || 0,
              notes: b.notes || "",
            })),
          },
          {
            id: crypto.randomUUID(),
            name: "Allocations",
            items: m.allocations.map(a => ({
              id: crypto.randomUUID(),
              name: a.name,
              budget: a.budget || Math.round((a.pct || 0) * income / 100),
              actual: a.actual || 0,
              earner1: a.earner1 || 0,
              earner2: a.earner2 || 0,
              notes: "",
            })),
          },
        ];
        delete m.bills;
        delete m.allocations;
      }
    }
  }

  persist(parsed);
}, [persist]);
```

- [ ] **Step 6: Update provider exports**

Replace old CRUD names in the `<BudgetContext.Provider value={...}>`:

```js
// Remove: updateBill, addBill, removeBill, updateAllocation, addAllocation, removeAllocation
// Add: addSection, renameSection, removeSection, addItem, updateItem, removeItem
```

- [ ] **Step 7: Commit**

```bash
git add src/context/BudgetContext.jsx
git commit -m "refactor: replace bill/allocation CRUD with section/item CRUD"
```

---

### Task 4: SectionGrid Component

**Files:**
- Create: `src/components/SectionGrid.jsx` — new unified grid component

This component is based on the existing `BillsGrid.jsx`. It renders one section's items with columns: Item | % | Budget | (Earner splits) | Actual | Notes | Actions.

- [ ] **Step 1: Create SectionGrid.jsx**

```jsx
import { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import RowModal from "./RowModal";
import { fmt, fmtPct, itemsTotal, totalIncome } from "../shared/helpers";

export default function SectionGrid({ year, monthIndex, section, earners }) {
  const { updateItem, addItem, removeItem } = useBudget();
  const [modal, setModal] = useState(null);
  const income = totalIncome(earners);
  const showSplit = earners.length === 2;
  const e1Name = earners[0]?.name || "Earner 1";
  const e2Name = earners[1]?.name || "Earner 2";

  const { items } = section;
  const budgetTotal = itemsTotal(items, "budget");
  const actualTotal = itemsTotal(items, "actual");
  const e1Total = itemsTotal(items, "earner1");
  const e2Total = itemsTotal(items, "earner2");

  const handleAdd = () => {
    setModal({ data: { name: "", budget: 0, earner1: 0, earner2: 0, actual: 0, notes: "" }, isNew: true });
  };

  const handleSave = (draft) => {
    if (modal.isNew) {
      addItem(year, monthIndex, section.id, draft);
    } else {
      updateItem(year, monthIndex, section.id, modal.data.id, draft);
    }
  };

  return (
    <div className="sg">
      <div className="sg-hdr">
        <span className="sg-title">{section.name}</span>
        <button className="sg-add" onClick={handleAdd}>+ Add</button>
      </div>
      <table className="sg-tbl">
        <thead>
          <tr>
            <th className="sg-th-name col-name">Item</th>
            <th className="sg-th-pct col-narrow">%</th>
            <th className="sg-th-num col-num">Budget</th>
            {showSplit && <th className="sg-th-num col-num">{e1Name}</th>}
            {showSplit && <th className="sg-th-num col-num">{e2Name}</th>}
            <th className="sg-th-num col-num">Actual</th>
            <th className="sg-th-notes">Notes</th>
            <th className="sg-th-x col-x"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={item.actual > item.budget && item.actual > 0 ? "sg-over" : ""}>
              <td>
                <EditableCell value={item.name} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { name: v })} />
              </td>
              <td className="num muted">{income > 0 ? fmtPct(Math.round((item.budget / income) * 10000) / 100) : ""}</td>
              <td className="num">
                <EditableCell value={item.budget} type="number" formatter={fmt} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { budget: v })} />
              </td>
              {showSplit && (
                <td className="num">
                  <EditableCell value={item.earner1} type="number" formatter={fmt} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { earner1: v })} />
                </td>
              )}
              {showSplit && (
                <td className="num">
                  <EditableCell value={item.earner2} type="number" formatter={fmt} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { earner2: v })} />
                </td>
              )}
              <td className="num">
                <EditableCell value={item.actual} type="number" formatter={fmt} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { actual: v })} />
              </td>
              <td>
                <EditableCell value={item.notes} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { notes: v })} className="sg-notes" />
              </td>
              <td className="row-actions">
                <button className="row-edit" onClick={() => setModal({ data: item, isNew: false })} title="Edit">✎</button>
                <button className="sg-rm" onClick={() => { if (confirm(`Remove "${item.name || 'this item'}"?`)) removeItem(year, monthIndex, section.id, item.id); }} title="Remove">×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="sg-totals">
            <td>Subtotal</td>
            <td></td>
            <td className="num">{fmt(budgetTotal)}</td>
            {showSplit && <td className="num">{fmt(e1Total)}</td>}
            {showSplit && <td className="num">{fmt(e2Total)}</td>}
            <td className="num">{fmt(actualTotal)}</td>
            <td></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      {modal && (
        <RowModal
          type="item"
          data={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
          showSplit={showSplit}
          earnerNames={[e1Name, e2Name]}
          income={income}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add CSS for SectionGrid**

In `src/app.css`, the new `sg-*` classes reuse the same styles as the old `bg-*` classes. Add these alongside or replacing the old ones. The key classes needed:

```css
/* SectionGrid — reuses shared grid patterns */
.sg { padding: 0; }

.sg-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 4px;
}

.sg-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.sg-add {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 500;
  padding: 2px 8px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.sg-add:hover { border-color: var(--accent); color: var(--accent); }

.sg-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  table-layout: fixed;
}

.sg-tbl th {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  padding: 4px 8px 6px;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

.sg-tbl td {
  padding: 3px 8px;
  border-bottom: 1px solid var(--border-light);
  vertical-align: middle;
}

.sg-tbl tbody tr:hover { background: var(--surface-alt); }
.sg-tbl tbody tr:last-child td { border-bottom: none; }

.sg-tbl .sg-th-num { text-align: right; }
.sg-tbl .sg-th-pct { text-align: right; }
.sg-th-notes { width: 200px; }
.sg-th-x { width: 48px; }

.sg-totals td {
  font-weight: 600;
  border-top: 2px solid var(--border);
  border-bottom: none;
  padding-top: 6px;
  padding-bottom: 8px;
}

.sg-over { background: var(--red-bg); }
.sg-over:hover { background: #fde8e8 !important; }

.sg-rm {
  font-size: 0.85rem;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius);
  transition: all 0.15s;
}
.sg-rm:hover { background: var(--red-bg); color: var(--red); }

.sg-notes { color: var(--text-muted); font-size: 0.78rem; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SectionGrid.jsx src/app.css
git commit -m "feat: add SectionGrid component replacing BillsGrid and AllocationsGrid"
```

---

### Task 5: RowModal Update

**Files:**
- Modify: `src/components/RowModal.jsx` — merge bill/allocation into item type, add bidirectional Budget/%

- [ ] **Step 1: Update FIELDS and modal logic**

Replace the `FIELDS` object entirely (remove the `bill` and `allocation` entries, remove the `computed` field concept, replace with `item` and `fund` only):

```js
const FIELDS = {
  item: [
    { key: "name", label: "Item", type: "text" },
    { key: "budget", label: "Budget", type: "number", hasPct: true },
    { key: "earner1", label: "__e1__", type: "number", split: true },
    { key: "earner2", label: "__e2__", type: "number", split: true },
    { key: "actual", label: "Actual", type: "number" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  fund: [
    { key: "name", label: "Fund Name", type: "text" },
    { key: "minBal", label: "Min Balance", type: "number" },
    { key: "opening", label: "Opening", type: "number" },
    { key: "transfersIn", label: "Transfers In", type: "number" },
    { key: "transfersOut", label: "Transfers Out", type: "number" },
    { key: "notes", label: "Notes", type: "text" },
  ],
};
```

Update the title logic:

```js
const title = isNew ? `Add ${type === "item" ? "Item" : "Fund"}` : `Edit ${draft.name || type}`;
```

For the `hasPct` field, render a bidirectional Budget + % row. When Budget changes, compute `% = budget / income * 100` (two decimal places). When % changes, compute `budget = Math.round(income * pct / 100)`. Track a local `pct` in draft state initialized from `income > 0 ? Math.round((data.budget / income) * 10000) / 100 : 0`.

Replace the `f.computed` rendering block with a `f.hasPct` block:

```jsx
{f.hasPct ? (
  <div className="rm-row">
    <input
      ref={i === 0 ? firstInputRef : null}
      className="rm-input rm-input-num"
      type="number"
      value={draft.budget || ""}
      placeholder="0"
      onChange={(e) => {
        const v = parseFloat(e.target.value) || 0;
        set("budget", v);
        set("_pct", income > 0 ? Math.round((v / income) * 10000) / 100 : 0);
      }}
      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
    />
    <input
      className="rm-input rm-input-num rm-input-pct"
      type="number"
      value={draft._pct || ""}
      placeholder="%"
      onChange={(e) => {
        const pct = parseFloat(e.target.value) || 0;
        set("_pct", pct);
        set("budget", income > 0 ? Math.round(income * pct / 100) : 0);
      }}
      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
    />
    <span className="rm-pct-label">%</span>
  </div>
) : (
  // ... existing input rendering
)}
```

Initialize `_pct` in the draft state: in `useState`, compute it from `data.budget` and `income`:

```js
const [draft, setDraft] = useState(() => ({
  ...data,
  _pct: income > 0 ? Math.round((data.budget / income) * 10000) / 100 : 0,
}));
```

In `handleSave`, strip `_pct` before passing to `onSave`:

```js
const handleSave = () => {
  const { _pct, ...clean } = draft;
  onSave(clean);
  onClose();
};
```

- [ ] **Step 2: Add CSS for the % input in modal**

```css
.rm-input-pct { max-width: 80px; }
.rm-pct-label {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-muted);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RowModal.jsx src/app.css
git commit -m "refactor: merge bill/allocation modal types into item with bidirectional Budget/%"
```

---

### Task 6: ManageSectionsModal

**Files:**
- Create: `src/components/ManageSectionsModal.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useState, useRef, useEffect } from "react";

export default function ManageSectionsModal({ sections, onAdd, onRename, onRemove, onClose }) {
  const [newName, setNewName] = useState("");
  const backdropRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="rm-backdrop" ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="rm">
        <div className="rm-hdr">
          <h3 className="rm-title">Manage Sections</h3>
          <button className="rm-close" onClick={onClose}>×</button>
        </div>
        <div className="rm-body">
          {sections.map((s) => (
            <div key={s.id} className="ms-row">
              <input
                className="rm-input"
                value={s.name}
                onChange={(e) => onRename(s.id, e.target.value)}
              />
              <button
                className="ms-rm"
                onClick={() => {
                  if (confirm(`Delete "${s.name}" and all its items?`)) onRemove(s.id);
                }}
                title="Delete section"
              >×</button>
            </div>
          ))}
          <div className="ms-add-row">
            <input
              ref={inputRef}
              className="rm-input"
              value={newName}
              placeholder="New section name"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <button className="ms-add-btn" onClick={handleAdd}>Add</button>
          </div>
        </div>
        <div className="rm-footer">
          <button className="rm-save" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CSS**

```css
/* ManageSectionsModal */
.ms-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.ms-row .rm-input { flex: 1; }

.ms-rm {
  font-size: 1rem;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius);
  flex-shrink: 0;
  transition: all 0.15s;
}
.ms-rm:hover { background: var(--red-bg); color: var(--red); }

.ms-add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}
.ms-add-row .rm-input { flex: 1; }

.ms-add-btn {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.ms-add-btn:hover { border-color: var(--accent); color: var(--accent); }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ManageSectionsModal.jsx src/app.css
git commit -m "feat: add ManageSectionsModal component"
```

---

### Task 7: MonthCard Integration

**Files:**
- Modify: `src/components/MonthCard.jsx` — wire up SectionGrid, gear icon, ManageSectionsModal, remove old imports

- [ ] **Step 1: Rewrite MonthCard.jsx**

```jsx
import { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import SectionGrid from "./SectionGrid";
import FundsGrid from "./FundsGrid";
import ManageSectionsModal from "./ManageSectionsModal";
import { fmt, monthNameFull, totalIncome, splitRatios, itemsTotal } from "../shared/helpers";

export default function MonthCard({ monthData, defaultCollapsed = false, isLatest = false, onClone, sectionStyle = "" }) {
  const { profile, addSection, renameSection, removeSection } = useBudget();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showManage, setShowManage] = useState(false);
  const { year, month, earners, sections, funds } = monthData;

  const income = totalIncome(earners);
  const ratios = splitRatios(earners);

  const totalBudget = sections.reduce((s, sec) => s + itemsTotal(sec.items, "budget"), 0);
  const totalActual = sections.reduce((s, sec) => s + itemsTotal(sec.items, "actual"), 0);
  const delta = totalBudget - totalActual;

  return (
    <div className={`mc${sectionStyle ? ` mc--variant-${sectionStyle}` : ""}`} id={`month-${monthData.id}`}>
      <div className="mc-hdr" onClick={() => setCollapsed(!collapsed)} style={{ cursor: "pointer" }}>
        <h2 className="mc-title">
          <span className="mc-chevron">{collapsed ? "▸" : "▾"}</span>
          {monthNameFull(month)} {year}
        </h2>
        <div className="mc-totals">
          <span>Budget: {fmt(totalBudget)}</span>
          <span>Actual: {fmt(totalActual)}</span>
          <span className={delta >= 0 ? "under" : "over"}>
            {delta >= 0 ? "+" : ""}{fmt(delta)}
          </span>
          <button className="mc-gear" onClick={(e) => { e.stopPropagation(); setShowManage(true); }} title="Manage sections">⚙</button>
          {isLatest && onClone && (
            <button className="mc-clone" onClick={(e) => { e.stopPropagation(); onClone(); }}>+ Clone</button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="mc-income">
            {earners.map((e, i) => (
              <span key={i}>
                {e.name}: {fmt(e.income)}
                {earners.length > 1 && ` (${Math.round(ratios[i] * 100)}%)`}
              </span>
            ))}
          </div>

          {sections.map((s) => (
            <div key={s.id} className="mc-section">
              <SectionGrid year={year} monthIndex={month} section={s} earners={earners} />
            </div>
          ))}

          <div className="mc-section mc-section--funds">
            <FundsGrid year={year} monthIndex={month} funds={funds} />
          </div>
        </>
      )}

      {showManage && (
        <ManageSectionsModal
          sections={sections}
          onAdd={(name) => addSection(year, month, name)}
          onRename={(id, name) => renameSection(year, month, id, name)}
          onRemove={(id) => removeSection(year, month, id)}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add gear icon CSS**

```css
.mc-gear {
  font-size: 0.85rem;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius);
  transition: all 0.15s;
}
.mc-gear:hover { color: var(--accent); }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MonthCard.jsx src/app.css
git commit -m "feat: integrate SectionGrid and ManageSectionsModal into MonthCard"
```

---

### Task 8: TimelinePage Update

**Files:**
- Modify: `src/pages/TimelinePage.jsx` — remove YTD computation, simplify MonthCard props

- [ ] **Step 1: Rewrite TimelinePage.jsx**

```jsx
import { useOutletContext } from "react-router-dom";
import { useBudget } from "../context/BudgetContext";
import MonthCard from "../components/MonthCard";

export default function TimelinePage() {
  const { sectionStyle } = useOutletContext();
  const { currentYear, getMonths, cloneMonth } = useBudget();
  const months = getMonths(currentYear);

  if (months.length === 0) {
    return <div className="tl-empty">No months yet. Clone a month to get started.</div>;
  }

  const lastMonth = months[months.length - 1];
  const reversed = [...months].reverse();

  return (
    <div className="tl">
      {reversed.map((m) => (
        <MonthCard
          key={m.id}
          monthData={m}
          defaultCollapsed={m.id !== lastMonth.id}
          isLatest={m.id === lastMonth.id}
          onClone={() => cloneMonth(currentYear, lastMonth.month)}
          sectionStyle={sectionStyle}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/TimelinePage.jsx
git commit -m "refactor: remove YTD computation from TimelinePage"
```

---

### Task 9: Setup Wizard

**Files:**
- Modify: `src/pages/SetupPage.jsx` — merge bills/allocations steps into section-based "Budget Items" step

- [ ] **Step 1: Rewrite SetupPage.jsx**

Key changes:
- `STEPS` changes from `["Start", "Earners", "Bills", "Allocations", "Funds"]` to `["Start", "Earners", "Budget Items", "Funds"]`
- Replace `bills` and `allocations` state with `sections` state
- Step 2 becomes the combined Budget Items step with section groups
- Step 3 becomes Funds (was step 4)
- `applyTemplate` reads `sections` from template instead of `bills`/`allocations`
- `finish()` calls `completeSetup(profile, validSections, validFunds)`

```jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBudget } from "../context/BudgetContext";
import { TEMPLATES } from "../data";
import { totalIncome } from "../shared/helpers";

const STEPS = ["Start", "Earners", "Budget Items", "Funds"];

export default function SetupPage() {
  const { completeSetup } = useBudget();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);

  const [earnerCount, setEarnerCount] = useState(1);
  const [earners, setEarners] = useState([
    { name: "", income: 0 },
    { name: "", income: 0 },
  ]);
  const [useSplit, setUseSplit] = useState(false);

  const [sections, setSections] = useState([
    { name: "Bills", items: [{ name: "", budget: 0, notes: "" }] },
  ]);

  const [funds, setFunds] = useState([{ name: "", opening: 0, minBal: 0 }]);

  const income = totalIncome(earners.slice(0, earnerCount));

  const applyTemplate = (t) => {
    setEarnerCount(t.earnerCount);
    setEarners([...t.earners]);
    setUseSplit(t.useSplit);
    setSections(t.sections.map(s => ({
      name: s.name,
      items: s.items.map(item => ({ ...item })),
    })));
    setFunds([...t.funds]);
    setStep(1);
  };

  useEffect(() => {
    const key = searchParams.get("template");
    if (key && TEMPLATES[key]) {
      applyTemplate(TEMPLATES[key]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateEarner = (i, field, value) => {
    const next = [...earners];
    next[i] = { ...next[i], [field]: field === "income" ? (parseFloat(value) || 0) : value };
    setEarners(next);
  };

  const updateSectionName = (si, name) => {
    const next = [...sections];
    next[si] = { ...next[si], name };
    setSections(next);
  };

  const updateSectionItem = (si, ii, field, value) => {
    const next = [...sections];
    const items = [...next[si].items];
    items[ii] = { ...items[ii], [field]: field === "budget" ? (parseFloat(value) || 0) : value };
    next[si] = { ...next[si], items };
    setSections(next);
  };

  const addItemToSection = (si) => {
    const next = [...sections];
    next[si] = { ...next[si], items: [...next[si].items, { name: "", budget: 0, notes: "" }] };
    setSections(next);
  };

  const removeItemFromSection = (si, ii) => {
    const next = [...sections];
    next[si] = { ...next[si], items: next[si].items.filter((_, j) => j !== ii) };
    setSections(next);
  };

  const addSection = () => {
    setSections([...sections, { name: "New Section", items: [{ name: "", budget: 0, notes: "" }] }]);
  };

  const removeSection = (si) => {
    setSections(sections.filter((_, i) => i !== si));
  };

  const updateFund = (i, field, value) => {
    const next = [...funds];
    next[i] = { ...next[i], [field]: ["opening", "minBal"].includes(field) ? (parseFloat(value) || 0) : value };
    setFunds(next);
  };

  const finish = () => {
    const profile = {
      earners: earners.slice(0, earnerCount).filter(e => e.name),
      useSplit: earnerCount === 2 && useSplit,
    };
    const validSections = sections
      .map(s => ({
        name: s.name,
        items: s.items.filter(item => item.name),
      }))
      .filter(s => s.items.length > 0);
    const validFunds = funds.filter(f => f.name);
    completeSetup(profile, validSections, validFunds);
    navigate("/");
  };

  return (
    <div className="setup">
      <h2>Set Up Divvy</h2>
      <div className="setup-steps">
        {STEPS.map((s, i) => (
          <span key={s} className={`setup-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>{s}</span>
        ))}
      </div>

      {step === 0 && (
        <div className="setup-panel">
          <h3>Choose a starting point</h3>
          <div className="setup-templates">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button key={key} className="setup-tpl-card" onClick={() => applyTemplate(t)}>
                <h4>{t.label}</h4>
                <p>{t.description}</p>
              </button>
            ))}
            <button className="setup-tpl-card" onClick={() => setStep(1)}>
              <h4>Start blank</h4>
              <p>Set up everything from scratch</p>
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="setup-panel">
          <h3>How many earners?</h3>
          <div className="setup-toggle">
            <button className={earnerCount === 1 ? "active" : ""} onClick={() => setEarnerCount(1)}>1</button>
            <button className={earnerCount === 2 ? "active" : ""} onClick={() => setEarnerCount(2)}>2</button>
          </div>
          {[0, 1].slice(0, earnerCount).map(i => (
            <div key={i} className="setup-field">
              <label>Name</label>
              <input value={earners[i].name} onChange={(e) => updateEarner(i, "name", e.target.value)} />
              <label>Monthly Income</label>
              <input type="number" value={earners[i].income || ""} onChange={(e) => updateEarner(i, "income", e.target.value)} />
            </div>
          ))}
          {earnerCount === 2 && (
            <label className="setup-check">
              <input type="checkbox" checked={useSplit} onChange={(e) => setUseSplit(e.target.checked)} />
              Use proportional split for bills
            </label>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="setup-panel">
          <h3>Budget Items</h3>
          <p className="setup-hint">Organize your budget into sections. You can always add more later.</p>
          {sections.map((s, si) => (
            <div key={si} className="setup-section-group">
              <div className="setup-section-hdr">
                <input
                  className="setup-section-name"
                  value={s.name}
                  onChange={(e) => updateSectionName(si, e.target.value)}
                  placeholder="Section name"
                />
                {sections.length > 1 && (
                  <button className="setup-rm" onClick={() => removeSection(si)} title="Remove section">×</button>
                )}
              </div>
              <div className="setup-row setup-row-hdr">
                <span>Name</span>
                <span className="hdr-num">Amount</span>
                <span className="hdr-num">%</span>
                <span></span>
              </div>
              {s.items.map((item, ii) => (
                <div key={ii} className="setup-row">
                  <input placeholder="Item name" value={item.name} onChange={(e) => updateSectionItem(si, ii, "name", e.target.value)} />
                  <input type="number" placeholder="Amount" value={item.budget || ""} onChange={(e) => updateSectionItem(si, ii, "budget", e.target.value)} />
                  <span className="setup-pct-display">
                    {item.budget && income > 0 ? `${Math.round((item.budget / income) * 10000) / 100}%` : ""}
                  </span>
                  <button className="setup-rm" onClick={() => removeItemFromSection(si, ii)}>×</button>
                </div>
              ))}
              <button className="setup-add" onClick={() => addItemToSection(si)}>+ Add Item</button>
            </div>
          ))}
          <button className="setup-add" onClick={addSection} style={{ marginTop: 16 }}>+ Add Section</button>
        </div>
      )}

      {step === 3 && (
        <div className="setup-panel">
          <h3>Funds to Track</h3>
          <p className="setup-hint">Track account balances alongside your budget.</p>
          <div className="setup-row setup-row-hdr">
            <span>Name</span><span className="hdr-num">Opening</span><span className="hdr-num">Min</span><span></span>
          </div>
          {funds.map((f, i) => (
            <div key={i} className="setup-row">
              <input placeholder="Fund name" value={f.name} onChange={(e) => updateFund(i, "name", e.target.value)} />
              <input type="number" placeholder="Opening balance" value={f.opening || ""} onChange={(e) => updateFund(i, "opening", e.target.value)} />
              <input type="number" placeholder="Min balance" value={f.minBal || ""} onChange={(e) => updateFund(i, "minBal", e.target.value)} />
              <button className="setup-rm" onClick={() => setFunds(funds.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="setup-add" onClick={() => setFunds([...funds, { name: "", opening: 0, minBal: 0 }])}>
            + Add Fund
          </button>
        </div>
      )}

      <div className="setup-nav">
        {step > 0 && <button className="setup-back" onClick={() => setStep(step - 1)}>Back</button>}
        {step > 0 && step < 3 && <button className="setup-next" onClick={() => setStep(step + 1)}>Next</button>}
        {step === 3 && <button className="setup-finish" onClick={finish}>Start Budgeting</button>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CSS for setup section groups**

```css
.setup-section-group {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}
.setup-section-group:last-of-type { border-bottom: none; }

.setup-section-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.setup-section-name {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 6px 10px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  background: var(--surface-alt);
  color: var(--text);
  flex: 1;
}
.setup-section-name:focus { outline: none; border-color: var(--accent); }

.setup-pct-display {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-muted);
  min-width: 60px;
  text-align: right;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/SetupPage.jsx src/app.css
git commit -m "refactor: merge bills/allocations setup into section-based Budget Items step"
```

---

### Task 10: SummaryPage Update

**Files:**
- Modify: `src/pages/SummaryPage.jsx` — aggregate by sections instead of bills/allocations

- [ ] **Step 1: Rewrite SummaryPage.jsx**

```jsx
import { useMemo, useState } from "react";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "../components/EditableCell";
import { fmt } from "../shared/helpers";

export default function SummaryPage() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  const [nextYearBudgets, setNextYearBudgets] = useState({});

  const summary = useMemo(() => {
    // Group items by section name, then by item name
    const sectionMap = {};

    for (const m of months) {
      for (const s of m.sections) {
        if (!sectionMap[s.name]) sectionMap[s.name] = {};
        for (const item of s.items) {
          if (!sectionMap[s.name][item.name]) sectionMap[s.name][item.name] = { budget: 0, actual: 0 };
          sectionMap[s.name][item.name].budget += item.budget;
          sectionMap[s.name][item.name].actual += item.actual;
        }
      }
    }

    return sectionMap;
  }, [months]);

  const monthCount = months.length;
  const projFactor = monthCount > 0 ? 12 / monthCount : 1;

  const { grandBudget, grandActual } = useMemo(() => {
    let b = 0, a = 0;
    for (const items of Object.values(summary)) {
      for (const { budget, actual } of Object.values(items)) { b += budget; a += actual; }
    }
    return { grandBudget: b, grandActual: a };
  }, [summary]);

  return (
    <div className="sp">
      <h2>{currentYear} Summary</h2>
      <p className="sp-sub">{monthCount} of 12 months</p>

      <table className="sp-tbl">
        <thead>
          <tr>
            <th>Item</th>
            <th className="num">Annual Budget</th>
            <th className="num">Annual Actual</th>
            <th className="num">Delta</th>
            <th className="num">{currentYear + 1} Est</th>
            <th className="num">{currentYear + 1} Budget</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(summary).map(([sectionName, items]) => {
            return [
              <tr key={`section-${sectionName}`} className="sp-section">
                <td colSpan={6}>{sectionName}</td>
              </tr>,
              ...Object.entries(items).map(([name, { budget, actual }]) => {
                const delta = budget - actual;
                const est = Math.round(actual * projFactor / 12);
                return (
                  <tr key={`${sectionName}-${name}`}>
                    <td>{name}</td>
                    <td className="num">{fmt(budget)}</td>
                    <td className="num">{fmt(actual)}</td>
                    <td className={`num ${delta >= 0 ? "under" : "over"}`}>{fmt(delta)}</td>
                    <td className="num muted">{fmt(est)}</td>
                    <td className="num">
                      <EditableCell
                        value={nextYearBudgets[`${sectionName}-${name}`] ?? est}
                        type="number"
                        formatter={fmt}
                        onChange={(v) => setNextYearBudgets(prev => ({ ...prev, [`${sectionName}-${name}`]: v }))}
                      />
                    </td>
                  </tr>
                );
              }),
            ];
          })}

          <tr className="sp-totals">
            <td>Total</td>
            <td className="num">{fmt(grandBudget)}</td>
            <td className="num">{fmt(grandActual)}</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

- [ ] **Step 2: Commit**

```bash
git add src/pages/SummaryPage.jsx
git commit -m "refactor: update SummaryPage to aggregate by sections"
```

---

### Task 11: YTD Sidebar Update

**Files:**
- Modify: `src/components/YtdSidebar.jsx` — group by section name, remove percentage display

Note: The old "Projected Year-End" section is intentionally removed — it was bills-only and the Summary page covers year-end projections for all items.

- [ ] **Step 1: Rewrite YtdSidebar.jsx**

```jsx
import { useMemo } from "react";
import { useBudget } from "../context/BudgetContext";
import { fmt, fundClosing } from "../shared/helpers";

export default function YtdSidebar() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  const ytd = useMemo(() => {
    if (months.length === 0) return null;

    // Aggregate items by section name → item name
    const sectionMap = {};
    let totalBudget = 0;
    let totalActual = 0;

    for (const m of months) {
      for (const s of m.sections) {
        if (!sectionMap[s.name]) sectionMap[s.name] = { items: {}, budget: 0, actual: 0 };
        for (const item of s.items) {
          if (!sectionMap[s.name].items[item.name]) sectionMap[s.name].items[item.name] = { budget: 0, actual: 0 };
          sectionMap[s.name].items[item.name].budget += item.budget;
          sectionMap[s.name].items[item.name].actual += item.actual;
          sectionMap[s.name].budget += item.budget;
          sectionMap[s.name].actual += item.actual;
          totalBudget += item.budget;
          totalActual += item.actual;
        }
      }
    }

    const latestMonth = months[months.length - 1];
    const monthsElapsed = months.length;

    return { sectionMap, totalBudget, totalActual, latestMonth, monthsElapsed };
  }, [months, currentYear]);

  if (!ytd) return <div className="ys-empty">No data yet</div>;

  const { sectionMap, totalBudget, totalActual, latestMonth, monthsElapsed } = ytd;

  const indicator = (budget, actual) => {
    if (actual === 0) return "";
    if (actual > budget) return "ys-over";
    if (actual > budget * 0.9) return "ys-warn";
    return "ys-ok";
  };

  return (
    <div className="ys">
      <h3 className="ys-title">YTD Summary</h3>
      <p className="ys-sub">{monthsElapsed} month{monthsElapsed !== 1 ? "s" : ""} of data</p>

      {Object.entries(sectionMap).map(([sectionName, { items, budget, actual }]) => (
        <div key={sectionName} className="ys-section">
          <h4>{sectionName}</h4>
          {Object.entries(items).map(([name, { budget: b, actual: a }]) => (
            <div key={name} className={`ys-row ${indicator(b, a)}`}>
              <span className="ys-name">{name}</span>
              <span className="ys-vals">{fmt(a)} / {fmt(b)}</span>
            </div>
          ))}
          <div className="ys-row ys-total">
            <span>{sectionName} Total</span>
            <span>{fmt(actual)} / {fmt(budget)}</span>
          </div>
        </div>
      ))}

      <div className="ys-section">
        <h4>Fund Balances</h4>
        {latestMonth.funds.map((f) => {
          const closing = fundClosing(f);
          const belowMin = closing < f.minBal;
          return (
            <div key={f.id} className={`ys-row ${belowMin ? "ys-over" : "ys-ok"}`}>
              <span className="ys-name">{f.name}</span>
              <span className="ys-vals">{fmt(closing)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/YtdSidebar.jsx
git commit -m "refactor: update YtdSidebar to group by sections"
```

---

### Task 12: Cleanup & Verification

**Files:**
- Delete: `src/components/BillsGrid.jsx`
- Delete: `src/components/AllocationsGrid.jsx`
- Modify: `src/app.css` — remove old `bg-*` and `ag-*` CSS classes
- Verify: `npm run build` passes

- [ ] **Step 1: Delete old grid components**

```bash
rm src/components/BillsGrid.jsx src/components/AllocationsGrid.jsx
```

- [ ] **Step 2: Clean up CSS**

In `src/app.css`, remove all CSS rules prefixed with `bg-` (BillsGrid) and `ag-` (AllocationsGrid). These include:

- `.bg`, `.ag` padding rules
- `.bg-hdr`, `.ag-hdr` header styles
- `.bg-title`, `.ag-title` title styles
- `.bg-add`, `.ag-add` button styles
- `.bg-tbl`, `.ag-tbl` table styles and their `th`/`td` rules
- `.bg-th-num`, `.ag-th-num`, `.bg-th-pct`, `.ag-th-pct` alignment
- `.bg-th-notes`, `.ag-th-notes` width
- `.bg-th-x`, `.ag-th-x` width
- `.bg-totals`, `.ag-totals` totals row styles
- `.bg-over` over-budget row styles
- `.bg-rm`, `.ag-rm` remove button styles
- `.bg-notes` notes cell styles
- `.ag-ytd` YTD cell styles
- `.mc-section--bills`, `.mc-section--alloc` section variant classes

Keep `.fg-*` (FundsGrid) styles intact.

Also update any shared selectors that reference the old class names. For example:
- `.bg-tbl th, .ag-tbl th, .fg-tbl th, .sp-tbl th` → `.fg-tbl th, .sp-tbl th`
- Similar for `td`, `tbody tr:hover`, `tbody tr:last-child td` selectors

The `td.num.muted` rule (pct column font size) and `.row-edit`, `.row-actions` rules should remain as they're used by SectionGrid.

Also check `@media` query blocks for references to old class names (e.g., `.bg-tbl td`, `.ag-tbl td` in the responsive section) and remove/update those too.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: clean build with no errors.

- [ ] **Step 4: Verify grep for old references**

Search for any remaining references to `bills`, `allocations`, `makeBill`, `makeAllocation`, `allocAmount`, `billsTotal`, `BillsGrid`, `AllocationsGrid` across all source files. These should only appear in the import compatibility code in `importData`.

```bash
grep -r "makeBill\|makeAllocation\|allocAmount\|billsTotal\|BillsGrid\|AllocationsGrid\|\.bg-\|\.ag-" src/
```

Expected: no results (or only the `importData` migration code if it references old field names). Also verify `SettingsPage.jsx` — it should work unchanged since it calls `resetData()` and navigates to setup, but confirm it has no direct bill/allocation references.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete old grid components, clean up CSS, verify build"
```
