# Divvy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

> Design: [2026-03-08-budgetinator-design.md](./2026-03-08-budgetinator-design.md)

**Goal:** Build a monthly budget allocation SPA that separates fixed bills from percentage-based allocations with fund balance tracking, using a continuous timeline layout with a live YTD sidebar.

**Architecture:** Single-page React app with Context API for state, localStorage for persistence. Two routes: timeline (default) and year summary. Data flows through BudgetContext which manages years, months, earners, bills, allocations, and funds. Month cards are the primary UI unit — dense editable grids composed of BillsGrid, AllocationsGrid, and FundsGrid.

**Tech Stack:** Vite 6, React 19, React Router DOM v7 (HashRouter), plain CSS with CSS variables, localStorage.

**Conventions (from maa-prototype and tcc-prototype):**
- Short CSS class names (`.hdr`, `.nav`, `.mc`)
- CSS variables in `:root` for theming
- Default exports for components; named exports for data/helpers
- `STORAGE_KEY` constant, `load()`/`save()` pattern for localStorage
- Context pattern: `createContext` + `AppProvider` + `useAppContext()` hook
- Google Fonts for typography
- HashRouter with `base: '/divvy-prototype/'` for GitHub Pages
- Port 5175 (next after 5174/5173)
- Compact JSX, inline styles for one-offs

---

**Code Review Checkpoints:** Group related tasks for review rather than reviewing each task individually:
- **Checkpoint 1:** After Tasks 1-3 (Project scaffold, data model, context/persistence — app loads with seed data)
- **Checkpoint 2:** After Tasks 4-7 (All editable grid components — grids render and edit inline)
- **Checkpoint 3:** After Tasks 8-10 (MonthCard, TimelinePage, App shell — full timeline browsing works)
- **Checkpoint 4:** After Tasks 11-13 (YTD sidebar, setup wizard, year summary — all features complete)
- **Final Review:** After Tasks 14-15 (CSS polish, CLAUDE.md — production-ready prototype)

---

## Tasks

| # | Task | Description | Model |
|---|------|-------------|-------|
| 1 | [Project Scaffold](#task-1-project-scaffold) | Vite + React + Router boilerplate, config files | sonnet |
| 2 | [Data Model & Seed Data](#task-2-data-model--seed-data) | data.js with types, defaults, seed budget data | sonnet |
| 3 | [BudgetContext & Persistence](#task-3-budgetcontext--persistence) | Context provider, localStorage, CRUD operations | opus |
| 4 | [Helpers & EditableCell](#task-4-helpers--editablecell) | Shared formatters, date utils, inline edit component | sonnet |
| 5 | [BillsGrid](#task-5-billsgrid) | Editable bills table with subtotal row | sonnet |
| 6 | [AllocationsGrid](#task-6-allocationsgrid) | Percentage-based allocations with YTD display | sonnet |
| 7 | [FundsGrid](#task-7-fundsgrid) | Fund balance tracking with opening/in/out/closing | sonnet |
| 8 | [MonthCard](#task-8-monthcard) | Compose grids into a single month view with header | sonnet |
| 9 | [TimelinePage](#task-9-timelinepage) | Continuous month scroll, clone month, auto-scroll to current | opus |
| 10 | [App Shell & Routing](#task-10-app-shell--routing) | Layout, nav, sidebar toggle, route setup | sonnet |
| 11 | [YtdSidebar](#task-11-ytdsidebar) | Live YTD budget vs actual, trends, projections | opus |
| 12 | [SetupPage](#task-12-setuppage) | First-time setup wizard for earners, bills, allocations, funds | sonnet |
| 13 | [SummaryPage](#task-13-summarypage) | Year summary grid with next-year planning | sonnet |
| 14 | [CSS Theming & Polish](#task-14-css-theming--polish) | CSS variables, fonts, dense data styling, responsive basics | sonnet |
| 15 | [CLAUDE.md & Cleanup](#task-15-claudemd--cleanup) | Project documentation following prototype conventions | sonnet |

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/app.css` (minimal placeholder)

**Step 1: Initialize project**

```bash
cd /Users/josh/Code/plans/google-sheets-budgetinator
npm init -y
npm install react@^19 react-dom@^19 react-router-dom@^7
npm install -D vite@^6 @vitejs/plugin-react@^4
```

**Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/divvy-prototype/',
  server: {
    port: 5175,
  },
})
```

**Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Divvy</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Create src/main.jsx**

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
```

**Step 5: Create src/App.jsx** (placeholder)

```jsx
export default function App() {
  return <div className="app">Divvy</div>;
}
```

**Step 6: Create src/app.css** (minimal reset)

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; }
```

**Step 7: Update package.json scripts**

Ensure scripts section has:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Step 8: Verify**

Run: `npm run dev`
Expected: Vite dev server starts on port 5175, browser shows "Divvy"

**Step 9: Commit**

```bash
git init
git add package.json package-lock.json vite.config.js index.html src/
git commit -m "chore: scaffold Divvy prototype with Vite + React 19"
```

---

### Task 2: Data Model & Seed Data

**Files:**
- Create: `src/data.js`
- Create: `src/shared/helpers.js`

**Step 1: Create src/data.js**

This defines the storage key, default structures, and seed data that mirrors the real Google Sheets structure. The seed data should represent a realistic 2-3 month budget so the app has something to display immediately.

```js
export const STORAGE_KEY = "divvy-budget";

// Month names for display
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Factory: create a blank earner
export const makeEarner = (name = "", income = 0) => ({ name, income });

// Factory: create a blank bill line item
export const makeBill = (name = "", budget = 0, earner1 = 0, earner2 = 0, actual = 0, notes = "", autopay = false) => ({
  id: crypto.randomUUID(),
  name, budget, earner1, earner2, actual, notes, autopay,
});

// Factory: create a blank allocation
export const makeAllocation = (name = "", pct = 0, fixed = false) => ({
  id: crypto.randomUUID(),
  name, pct, fixed,
  actual: 0,
});

// Factory: create a blank fund
export const makeFund = (name = "", opening = 0, minBal = 0) => ({
  id: crypto.randomUUID(),
  name, opening, transfersIn: 0, transfersOut: 0, minBal,
});

// Factory: create a month record
export const makeMonth = (year, month, earners, bills, allocations, funds) => ({
  id: `${year}-${String(month + 1).padStart(2, "0")}`,
  year,
  month, // 0-indexed
  earners: earners.map(e => ({ ...e })),
  bills: bills.map(b => ({ ...b, id: crypto.randomUUID() })),
  allocations: allocations.map(a => ({ ...a, id: crypto.randomUUID() })),
  funds: funds.map(f => ({ ...f, id: crypto.randomUUID() })),
});

// Seed: profile with earners
export const SEED_PROFILE = {
  earners: [
    makeEarner("Josh", 10600),
    makeEarner("Jacklyn", 0),
  ],
  useSplit: true,
};

// Seed: bill templates
export const SEED_BILLS = [
  makeBill("Mortgage", 2050, 2050, 0, 0, "recurring 1st", false),
  makeBill("Equity Line", 1500, 1500, 0, 0, "due 22nd", false),
  makeBill("Escrow", 700, 700, 0, 0, "", false),
  makeBill("T-Mobile", 142, 142, 0, 0, "autopay 1st", true),
  makeBill("Misc", 100, 100, 0, 0, "", false),
  makeBill("Duke Energy", 325, 325, 0, 0, "scheduled 20th", false),
  makeBill("McLambs LP", 105, 105, 0, 0, "", false),
  makeBill("Car Insurance", 175, 175, 0, 0, "due Mar & Sep", false),
  makeBill("Life Insurance", 63, 36, 27, 0, "autopay 9/1", true),
];

// Seed: allocation templates
export const SEED_ALLOCATIONS = [
  makeAllocation("Grocery", 13, false),
  makeAllocation("Charity", 10, true),
  makeAllocation("Savings", 5, false),
];

// Seed: fund templates
export const SEED_FUNDS = [
  makeFund("Joint Savings", 1325, 250),
  makeFund("Rainy Day Fund", 5400, 25),
  makeFund("Josh Savings", 26832, 250),
  makeFund("Jacklyn Savings", 19648, 250),
];

// Build seed months for Jan-Mar 2026
function buildSeedMonths() {
  const totalIncome = 10600;

  // January
  const jan = makeMonth(2026, 0, SEED_PROFILE.earners, SEED_BILLS, SEED_ALLOCATIONS, SEED_FUNDS);
  // Set actuals for Jan
  const janActuals = { "Mortgage": 2050, "Equity Line": 1500, "T-Mobile": 142, "Duke Energy": 631, "Misc": 150 };
  jan.bills.forEach(b => { if (janActuals[b.name] !== undefined) b.actual = janActuals[b.name]; });
  jan.allocations.forEach(a => { a.actual = Math.round(totalIncome * a.pct / 100); });
  // Jan funds
  jan.funds[0].opening = 1325; jan.funds[0].transfersIn = 540; jan.funds[0].transfersOut = 1023;
  jan.funds[1].opening = 5400; jan.funds[1].transfersIn = 208; jan.funds[1].transfersOut = 0;
  jan.funds[2].opening = 26832; jan.funds[2].transfersIn = 0; jan.funds[2].transfersOut = 6500;
  jan.funds[3].opening = 19648; jan.funds[3].transfersIn = 197; jan.funds[3].transfersOut = 998;

  // February
  const feb = makeMonth(2026, 1, SEED_PROFILE.earners, SEED_BILLS, SEED_ALLOCATIONS, SEED_FUNDS);
  const febActuals = { "Mortgage": 2050, "Equity Line": 1500, "T-Mobile": 146, "Duke Energy": 538, "Car Insurance": 1041 };
  feb.bills.forEach(b => { if (febActuals[b.name] !== undefined) b.actual = febActuals[b.name]; });
  feb.allocations.forEach(a => { a.actual = Math.round(totalIncome * a.pct / 100); });
  // Feb funds — carry forward from Jan closing
  feb.funds[0].opening = 842; feb.funds[0].transfersIn = 530; feb.funds[0].transfersOut = 720;
  feb.funds[1].opening = 5608; feb.funds[1].transfersIn = 171; feb.funds[1].transfersOut = 0;
  feb.funds[2].opening = 20332; feb.funds[2].transfersIn = 0; feb.funds[2].transfersOut = 0;
  feb.funds[3].opening = 18847; feb.funds[3].transfersIn = 0; feb.funds[3].transfersOut = 315;

  // March (current month — mostly empty actuals)
  const mar = makeMonth(2026, 2, SEED_PROFILE.earners, SEED_BILLS, SEED_ALLOCATIONS, SEED_FUNDS);
  const marActuals = { "Mortgage": 2050 };
  mar.bills.forEach(b => { if (marActuals[b.name] !== undefined) b.actual = marActuals[b.name]; });
  mar.allocations.forEach(a => { a.actual = Math.round(totalIncome * a.pct / 100); });
  mar.funds[0].opening = 652; mar.funds[0].transfersIn = 0; mar.funds[0].transfersOut = 0;
  mar.funds[1].opening = 5779; mar.funds[1].transfersIn = 0; mar.funds[1].transfersOut = 0;
  mar.funds[2].opening = 20332; mar.funds[2].transfersIn = 0; mar.funds[2].transfersOut = 0;
  mar.funds[3].opening = 18532; mar.funds[3].transfersIn = 0; mar.funds[3].transfersOut = 0;

  return [jan, feb, mar];
}

export const SEED_MONTHS = buildSeedMonths();

// Default app state
export const SEED_STATE = {
  profile: SEED_PROFILE,
  years: {
    2026: { months: SEED_MONTHS },
  },
  currentYear: 2026,
  setupComplete: true,
};
```

**Step 2: Create src/shared/helpers.js**

```js
// Format number as currency
export const fmt = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Format with cents when needed
export const fmtExact = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Format percentage
export const fmtPct = (n) => `${n}%`;

// Month name from 0-indexed month number
export const monthName = (m) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m];

// Full month name
export const monthNameFull = (m) =>
  ["January", "February", "March", "April", "May", "June",
   "July", "August", "September", "October", "November", "December"][m];

// Sum bills budget
export const billsTotal = (bills, field = "budget") =>
  bills.reduce((s, b) => s + (b[field] || 0), 0);

// Calculate allocation dollar amount from percentage and total income
export const allocAmount = (pct, totalIncome) =>
  Math.round(totalIncome * pct / 100);

// Total income from earners array
export const totalIncome = (earners) =>
  earners.reduce((s, e) => s + e.income, 0);

// Calculate proportional split ratios
export const splitRatios = (earners) => {
  const total = totalIncome(earners);
  if (total === 0) return earners.map(() => 0);
  return earners.map(e => e.income / total);
};

// Fund closing balance
export const fundClosing = (fund) =>
  fund.opening + fund.transfersIn - fund.transfersOut;

// Delta indicator class
export const deltaClass = (budget, actual) => {
  if (actual === 0) return "";
  if (actual <= budget) return "under";
  return "over";
};
```

**Step 3: Verify**

Import data.js in App.jsx temporarily to verify no syntax errors:
```jsx
import { SEED_STATE } from "./data";
export default function App() {
  console.log("Seed state:", SEED_STATE);
  return <div className="app">Divvy — {SEED_STATE.currentYear}</div>;
}
```

Run: `npm run dev`
Expected: Console shows seed state object, page shows "Divvy — 2026"

**Step 4: Remove the temporary console.log, commit**

```bash
git add src/data.js src/shared/helpers.js src/App.jsx
git commit -m "feat: add data model, seed data, and shared helpers"
```

---

### Task 3: BudgetContext & Persistence

**Files:**
- Create: `src/context/BudgetContext.jsx`
- Modify: `src/main.jsx` — wrap with BudgetProvider

**Step 1: Create src/context/BudgetContext.jsx**

This is the central state manager. It stores the full app state in localStorage and provides CRUD operations for months, bills, allocations, and funds.

```jsx
import { createContext, useContext, useState, useCallback } from "react";
import { STORAGE_KEY, SEED_STATE, makeMonth, makeBill, makeAllocation, makeFund } from "../data";
import { totalIncome, splitRatios, allocAmount, fundClosing } from "../shared/helpers";

const BudgetContext = createContext();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function BudgetProvider({ children }) {
  const [state, setState] = useState(() => load() || SEED_STATE);

  const persist = useCallback((next) => {
    setState(next);
    save(next);
  }, []);

  // Update a function that takes previous state and returns next state
  const update = useCallback((fn) => {
    setState(prev => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  // --- Profile ---
  const updateProfile = useCallback((profile) => {
    update(prev => ({ ...prev, profile }));
  }, [update]);

  // --- Year/Month ---
  const setCurrentYear = useCallback((year) => {
    update(prev => ({ ...prev, currentYear: year }));
  }, [update]);

  const getMonths = useCallback((year) => {
    return state.years[year]?.months || [];
  }, [state]);

  const getMonth = useCallback((year, month) => {
    return getMonths(year).find(m => m.month === month) || null;
  }, [getMonths]);

  const updateMonth = useCallback((year, monthIndex, updater) => {
    update(prev => {
      const yearData = prev.years[year] || { months: [] };
      const months = yearData.months.map(m =>
        m.month === monthIndex ? (typeof updater === "function" ? updater(m) : { ...m, ...updater }) : m
      );
      return { ...prev, years: { ...prev.years, [year]: { ...yearData, months } } };
    });
  }, [update]);

  // Clone previous month to create next month
  const cloneMonth = useCallback((year, fromMonthIndex) => {
    update(prev => {
      const yearData = prev.years[year] || { months: [] };
      const source = yearData.months.find(m => m.month === fromMonthIndex);
      if (!source) return prev;

      let nextMonth = fromMonthIndex + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = year + 1;
      }

      // Check if target month already exists
      const targetYearData = prev.years[nextYear] || { months: [] };
      if (targetYearData.months.find(m => m.month === nextMonth)) return prev;

      // Clone bills (keep budget + earner splits, zero out actuals)
      const newBills = source.bills.map(b => ({
        ...b,
        id: crypto.randomUUID(),
        actual: 0,
      }));

      // Clone allocations (zero out actuals)
      const newAllocs = source.allocations.map(a => ({
        ...a,
        id: crypto.randomUUID(),
        actual: 0,
      }));

      // Clone funds (opening = previous closing, zero transfers)
      const newFunds = source.funds.map(f => ({
        ...f,
        id: crypto.randomUUID(),
        opening: fundClosing(f),
        transfersIn: 0,
        transfersOut: 0,
      }));

      const newMonth = {
        id: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`,
        year: nextYear,
        month: nextMonth,
        earners: source.earners.map(e => ({ ...e })),
        bills: newBills,
        allocations: newAllocs,
        funds: newFunds,
      };

      const updatedTargetYear = {
        ...targetYearData,
        months: [...targetYearData.months, newMonth].sort((a, b) => a.month - b.month),
      };

      const nextState = {
        ...prev,
        years: { ...prev.years, [nextYear]: updatedTargetYear },
        currentYear: nextYear,
      };

      return nextState;
    });
  }, [update]);

  // --- Bill CRUD within a month ---
  const updateBill = useCallback((year, monthIndex, billId, updates) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      bills: m.bills.map(b => b.id === billId ? { ...b, ...updates } : b),
    }));
  }, [updateMonth]);

  const addBill = useCallback((year, monthIndex) => {
    const income = totalIncome(state.profile.earners);
    const ratios = splitRatios(state.profile.earners);
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      bills: [...m.bills, makeBill("New Bill", 0, 0, 0)],
    }));
  }, [updateMonth, state.profile]);

  const removeBill = useCallback((year, monthIndex, billId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      bills: m.bills.filter(b => b.id !== billId),
    }));
  }, [updateMonth]);

  // --- Allocation CRUD within a month ---
  const updateAllocation = useCallback((year, monthIndex, allocId, updates) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      allocations: m.allocations.map(a => a.id === allocId ? { ...a, ...updates } : a),
    }));
  }, [updateMonth]);

  const addAllocation = useCallback((year, monthIndex) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      allocations: [...m.allocations, makeAllocation("New Allocation", 0)],
    }));
  }, [updateMonth]);

  const removeAllocation = useCallback((year, monthIndex, allocId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      allocations: m.allocations.filter(a => a.id !== allocId),
    }));
  }, [updateMonth]);

  // --- Fund CRUD within a month ---
  const updateFund = useCallback((year, monthIndex, fundId, updates) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: m.funds.map(f => f.id === fundId ? { ...f, ...updates } : f),
    }));
  }, [updateMonth]);

  const addFund = useCallback((year, monthIndex) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: [...m.funds, makeFund("New Fund", 0, 0)],
    }));
  }, [updateMonth]);

  const removeFund = useCallback((year, monthIndex, fundId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: m.funds.filter(f => f.id !== fundId),
    }));
  }, [updateMonth]);

  // --- Setup ---
  const completeSetup = useCallback((profile, bills, allocations, funds) => {
    const income = totalIncome(profile.earners);
    const ratios = splitRatios(profile.earners);

    const initBills = bills.map(b => {
      const e1 = Math.round(b.budget * (ratios[0] || 1));
      const e2 = b.budget - e1;
      return makeBill(b.name, b.budget, e1, e2, 0, b.notes || "", b.autopay || false);
    });

    const initAllocations = allocations.map(a =>
      makeAllocation(a.name, a.pct, a.fixed || false)
    );

    const initFunds = funds.map(f =>
      makeFund(f.name, f.opening || 0, f.minBal || 0)
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstMonth = makeMonth(year, month, profile.earners, initBills, initAllocations, initFunds);

    const newState = {
      profile,
      years: { [year]: { months: [firstMonth] } },
      currentYear: year,
      setupComplete: true,
    };

    persist(newState);
  }, [persist]);

  // Reset to seed data
  const resetData = useCallback(() => {
    persist(SEED_STATE);
  }, [persist]);

  return (
    <BudgetContext.Provider value={{
      state,
      profile: state.profile,
      currentYear: state.currentYear,
      setupComplete: state.setupComplete,
      setCurrentYear,
      updateProfile,
      getMonths,
      getMonth,
      updateMonth,
      cloneMonth,
      updateBill,
      addBill,
      removeBill,
      updateAllocation,
      addAllocation,
      removeAllocation,
      updateFund,
      addFund,
      removeFund,
      completeSetup,
      resetData,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  return useContext(BudgetContext);
}
```

**Step 2: Update src/main.jsx to wrap with BudgetProvider**

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { BudgetProvider } from "./context/BudgetContext";
import App from "./App";
import "./app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BudgetProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </BudgetProvider>
  </StrictMode>
);
```

**Step 3: Verify context works**

Update App.jsx temporarily:
```jsx
import { useBudget } from "./context/BudgetContext";
import { fmt } from "./shared/helpers";

export default function App() {
  const { currentYear, getMonths, profile } = useBudget();
  const months = getMonths(currentYear);
  return (
    <div className="app">
      <h1>Divvy — {currentYear}</h1>
      <p>Earners: {profile.earners.map(e => `${e.name} (${fmt(e.income)})`).join(", ")}</p>
      <p>Months loaded: {months.length}</p>
    </div>
  );
}
```

Run: `npm run dev`
Expected: Shows "Divvy — 2026", earner names/incomes, "Months loaded: 3"

**Step 4: Revert App.jsx to simple placeholder, commit**

```jsx
import { useBudget } from "./context/BudgetContext";

export default function App() {
  const { setupComplete } = useBudget();
  return <div className="app">{setupComplete ? "Timeline" : "Setup"}</div>;
}
```

```bash
git add src/context/ src/main.jsx src/App.jsx
git commit -m "feat: add BudgetContext with localStorage persistence and CRUD operations"
```

---

### Task 4: Helpers & EditableCell

**Files:**
- Create: `src/components/EditableCell.jsx`
- Modify: `src/shared/helpers.js` (already created — verify complete)

**Step 1: Create src/components/EditableCell.jsx**

A reusable inline-edit cell. Click to enter edit mode, tab/enter to confirm, escape to cancel. Supports text and number types.

```jsx
import { useState, useRef, useEffect } from "react";

export default function EditableCell({ value, onChange, type = "text", className = "", formatter }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = type === "number" ? (parseFloat(draft) || 0) : draft;
    if (next !== value) onChange(next);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`ec-input ${className}`}
        type={type === "number" ? "number" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
      />
    );
  }

  const display = formatter ? formatter(value) : value;

  return (
    <span
      className={`ec ${className}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") { setDraft(value); setEditing(true); } }}
    >
      {display || <span className="ec-empty">—</span>}
    </span>
  );
}
```

**Step 2: Verify**

Temporarily render an EditableCell in App.jsx to confirm click-to-edit works:
```jsx
import EditableCell from "./components/EditableCell";
import { fmt } from "./shared/helpers";

export default function App() {
  return (
    <div className="app" style={{ padding: 40 }}>
      <EditableCell value={2050} type="number" formatter={fmt} onChange={(v) => console.log("changed:", v)} />
    </div>
  );
}
```

Run: `npm run dev`
Expected: Shows "$2,050", click to edit, type new value, press Enter, console logs new value.

**Step 3: Revert App.jsx, commit**

```bash
git add src/components/EditableCell.jsx
git commit -m "feat: add EditableCell component for inline editing"
```

---

### Task 5: BillsGrid

**Files:**
- Create: `src/components/BillsGrid.jsx`

**Step 1: Create src/components/BillsGrid.jsx**

Dense editable table for the bills section. Shows columns: Item | Budget | Earner1 | Earner2 | Actual | Notes. Includes a subtotal row and an "add bill" button.

The earner columns should only appear if there are 2 earners with a split enabled.

```jsx
import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import { fmt, billsTotal } from "../shared/helpers";

export default function BillsGrid({ year, monthIndex, bills }) {
  const { updateBill, addBill, removeBill, profile } = useBudget();
  const showSplit = profile.useSplit && profile.earners.length === 2 && profile.earners[1].income > 0;
  const e1Name = profile.earners[0]?.name || "Earner 1";
  const e2Name = profile.earners[1]?.name || "Earner 2";

  const budgetTotal = billsTotal(bills, "budget");
  const actualTotal = billsTotal(bills, "actual");

  return (
    <div className="bg">
      <div className="bg-hdr">
        <span className="bg-title">Bills</span>
        <button className="bg-add" onClick={() => addBill(year, monthIndex)}>+ Add</button>
      </div>
      <table className="bg-tbl">
        <thead>
          <tr>
            <th className="bg-th-name">Item</th>
            <th className="bg-th-num">Budget</th>
            {showSplit && <th className="bg-th-num">{e1Name}</th>}
            {showSplit && <th className="bg-th-num">{e2Name}</th>}
            <th className="bg-th-num">Actual</th>
            <th className="bg-th-notes">Notes</th>
            <th className="bg-th-x"></th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => (
            <tr key={b.id} className={b.actual > b.budget && b.actual > 0 ? "bg-over" : ""}>
              <td>
                <EditableCell value={b.name} onChange={(v) => updateBill(year, monthIndex, b.id, { name: v })} />
              </td>
              <td className="num">
                <EditableCell value={b.budget} type="number" formatter={fmt} onChange={(v) => updateBill(year, monthIndex, b.id, { budget: v })} />
              </td>
              {showSplit && (
                <td className="num">
                  <EditableCell value={b.earner1} type="number" formatter={fmt} onChange={(v) => updateBill(year, monthIndex, b.id, { earner1: v })} />
                </td>
              )}
              {showSplit && (
                <td className="num">
                  <EditableCell value={b.earner2} type="number" formatter={fmt} onChange={(v) => updateBill(year, monthIndex, b.id, { earner2: v })} />
                </td>
              )}
              <td className="num">
                <EditableCell value={b.actual} type="number" formatter={fmt} onChange={(v) => updateBill(year, monthIndex, b.id, { actual: v })} />
              </td>
              <td>
                <EditableCell value={b.notes} onChange={(v) => updateBill(year, monthIndex, b.id, { notes: v })} className="bg-notes" />
              </td>
              <td>
                <button className="bg-rm" onClick={() => removeBill(year, monthIndex, b.id)} title="Remove">×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-totals">
            <td>Subtotal</td>
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

**Step 2: Verify**

Temporarily wire into App.jsx with a test month from context. Confirm table renders, cells are editable, add/remove works.

**Step 3: Commit**

```bash
git add src/components/BillsGrid.jsx
git commit -m "feat: add BillsGrid component with inline editing"
```

---

### Task 6: AllocationsGrid

**Files:**
- Create: `src/components/AllocationsGrid.jsx`

**Step 1: Create src/components/AllocationsGrid.jsx**

Shows percentage-based allocations. Each row: Name (with percentage) | Budget Amount | Actual | YTD note. Budget amount is auto-calculated from percentage × total income but can be displayed. Actual is typically equal to budget (these are transfers).

```jsx
import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import { fmt, fmtPct, totalIncome, allocAmount } from "../shared/helpers";

export default function AllocationsGrid({ year, monthIndex, allocations, ytdData }) {
  const { updateAllocation, addAllocation, removeAllocation, profile, getMonths } = useBudget();
  const income = totalIncome(profile.earners);

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
            <th className="ag-th-num">%</th>
            <th className="ag-th-num">Budget</th>
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
      </table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/AllocationsGrid.jsx
git commit -m "feat: add AllocationsGrid component with percentage calculations"
```

---

### Task 7: FundsGrid

**Files:**
- Create: `src/components/FundsGrid.jsx`

**Step 1: Create src/components/FundsGrid.jsx**

Tracks fund balances: Opening | Transfers In | Transfers Out | Closing | Min Balance. Closing is auto-calculated. Highlight if closing < minimum.

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
            <th className="fg-th-num">Min</th>
            <th className="fg-th-x"></th>
          </tr>
        </thead>
        <tbody>
          {funds.map((f) => {
            const closing = fundClosing(f);
            const belowMin = closing < f.minBal;
            return (
              <tr key={f.id} className={belowMin ? "fg-warn" : ""}>
                <td>
                  <EditableCell value={f.name} onChange={(v) => updateFund(year, monthIndex, f.id, { name: v })} />
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
                <td className="num muted">{fmt(f.minBal)}</td>
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

**Step 2: Commit**

```bash
git add src/components/FundsGrid.jsx
git commit -m "feat: add FundsGrid component with balance tracking"
```

---

### Task 8: MonthCard

**Files:**
- Create: `src/components/MonthCard.jsx`

**Step 1: Create src/components/MonthCard.jsx**

Composes the three grids into a single month view. Shows header with month/year, totals, income/split info.

```jsx
import { useBudget } from "../context/BudgetContext";
import BillsGrid from "./BillsGrid";
import AllocationsGrid from "./AllocationsGrid";
import FundsGrid from "./FundsGrid";
import { fmt, monthNameFull, totalIncome, splitRatios, billsTotal, allocAmount } from "../shared/helpers";

export default function MonthCard({ monthData, ytdData }) {
  const { profile } = useBudget();
  const { year, month, earners, bills, allocations, funds } = monthData;

  const income = totalIncome(earners);
  const ratios = splitRatios(earners);

  // Calculate totals
  const billsBudget = billsTotal(bills, "budget");
  const billsActual = billsTotal(bills, "actual");
  const allocBudget = allocations.reduce((s, a) => s + allocAmount(a.pct, income), 0);
  const allocActual = allocations.reduce((s, a) => s + a.actual, 0);
  const totalBudget = billsBudget + allocBudget;
  const totalActual = billsActual + allocActual;
  const delta = totalBudget - totalActual;

  return (
    <div className="mc" id={`month-${monthData.id}`}>
      <div className="mc-hdr">
        <h2 className="mc-title">{monthNameFull(month)} {year}</h2>
        <div className="mc-totals">
          <span>Budget: {fmt(totalBudget)}</span>
          <span>Actual: {fmt(totalActual)}</span>
          <span className={delta >= 0 ? "under" : "over"}>
            {delta >= 0 ? "+" : ""}{fmt(delta)}
          </span>
        </div>
      </div>

      <div className="mc-income">
        {earners.map((e, i) => (
          <span key={i}>
            {e.name}: {fmt(e.income)}
            {earners.length > 1 && ` (${Math.round(ratios[i] * 100)}%)`}
          </span>
        ))}
      </div>

      <BillsGrid year={year} monthIndex={month} bills={bills} />
      <AllocationsGrid year={year} monthIndex={month} allocations={allocations} ytdData={ytdData} />
      <FundsGrid year={year} monthIndex={month} funds={funds} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/MonthCard.jsx
git commit -m "feat: add MonthCard component composing bills, allocations, and funds grids"
```

---

### Task 9: TimelinePage

**Files:**
- Create: `src/pages/TimelinePage.jsx`

**Step 1: Create src/pages/TimelinePage.jsx**

Continuous vertical scroll of month cards. Auto-scrolls to the current/latest month on load. Includes "Clone Next Month" button after the last month card. Computes YTD data for each month.

```jsx
import { useEffect, useRef, useMemo } from "react";
import { useBudget } from "../context/BudgetContext";
import MonthCard from "../components/MonthCard";
import { allocAmount, totalIncome } from "../shared/helpers";

export default function TimelinePage() {
  const { currentYear, getMonths, cloneMonth } = useBudget();
  const months = getMonths(currentYear);
  const timelineRef = useRef(null);

  // Auto-scroll to latest month on load
  useEffect(() => {
    if (months.length === 0) return;
    const latest = months[months.length - 1];
    const el = document.getElementById(`month-${latest.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentYear]); // only on year change, not every month update

  // Compute YTD data for each month
  const ytdByMonth = useMemo(() => {
    const result = {};
    const running = {}; // running totals by allocation name

    for (const m of months) {
      const income = totalIncome(m.earners);
      const monthYtd = {};

      for (const a of m.allocations) {
        if (!running[a.name]) running[a.name] = 0;
        running[a.name] += a.actual || allocAmount(a.pct, income);
        monthYtd[a.name] = running[a.name];
      }

      result[m.id] = monthYtd;
    }

    return result;
  }, [months]);

  if (months.length === 0) {
    return <div className="tl-empty">No months yet. Clone a month to get started.</div>;
  }

  const lastMonth = months[months.length - 1];
  const canClone = lastMonth.month < 11 || true; // can always clone (handles year rollover)

  return (
    <div className="tl" ref={timelineRef}>
      {months.map((m) => (
        <MonthCard key={m.id} monthData={m} ytdData={ytdByMonth[m.id]} />
      ))}

      <div className="tl-clone">
        <button className="tl-clone-btn" onClick={() => cloneMonth(currentYear, lastMonth.month)}>
          + Clone Next Month
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/TimelinePage.jsx
git commit -m "feat: add TimelinePage with continuous month scroll and YTD computation"
```

---

### Task 10: App Shell & Routing

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`

**Step 1: Update src/main.jsx with routes**

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "./context/BudgetContext";
import App from "./App";
import TimelinePage from "./pages/TimelinePage";
import "./app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BudgetProvider>
      <HashRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<TimelinePage />} />
          </Route>
        </Routes>
      </HashRouter>
    </BudgetProvider>
  </StrictMode>
);
```

Note: SummaryPage and SetupPage routes will be added in their respective tasks.

**Step 2: Update src/App.jsx**

```jsx
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useBudget } from "./context/BudgetContext";

export default function App() {
  const { currentYear, setCurrentYear, state } = useBudget();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const years = Object.keys(state.years).map(Number).sort();
  const navigate = useNavigate();

  return (
    <div className={`app ${sidebarOpen ? "sb-open" : ""}`}>
      <header className="hdr">
        <div className="hdr-left">
          <h1 className="logo" onClick={() => navigate("/")}>Divvy</h1>
          <nav className="nav">
            <button className="nav-btn active" onClick={() => navigate("/")}>Timeline</button>
            <button className="nav-btn" onClick={() => navigate("/summary")}>Summary</button>
          </nav>
        </div>
        <div className="hdr-right">
          <select className="yr-sel" value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="sb-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide YTD" : "Show YTD"}
          </button>
          <button className="nav-btn" onClick={() => navigate("/settings")}>Settings</button>
        </div>
      </header>

      <div className="main">
        <div className="content">
          <Outlet />
        </div>
        {sidebarOpen && <aside className="sidebar" id="ytd-sidebar"></aside>}
      </div>
    </div>
  );
}
```

Note: The sidebar `<aside>` is a placeholder. The YtdSidebar component (Task 11) will render into it via a portal or direct composition. We'll refine this in Task 11.

**Step 3: Verify**

Run: `npm run dev`
Expected: Header shows "Divvy", year selector shows 2026, Timeline/Summary nav buttons visible. Month cards render with editable cells. Clone Next Month button appears at bottom.

**Step 4: Commit**

```bash
git add src/App.jsx src/main.jsx
git commit -m "feat: add App shell with header, nav, year selector, and routing"
```

---

### Task 11: YtdSidebar

**Files:**
- Create: `src/components/YtdSidebar.jsx`
- Modify: `src/App.jsx` — render YtdSidebar in sidebar slot

**Step 1: Create src/components/YtdSidebar.jsx**

Computes YTD budget vs actual for all line items across months in the current year. Shows section totals, delta indicators, and projected year-end based on current pace.

```jsx
import { useMemo } from "react";
import { useBudget } from "../context/BudgetContext";
import { fmt, totalIncome, allocAmount, billsTotal, monthNameFull } from "../shared/helpers";

export default function YtdSidebar() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  const ytd = useMemo(() => {
    if (months.length === 0) return null;

    // Aggregate bills by name
    const billMap = {};
    let totalBillsBudget = 0;
    let totalBillsActual = 0;

    // Aggregate allocations by name
    const allocMap = {};
    let totalAllocBudget = 0;
    let totalAllocActual = 0;

    // Fund balances (latest month's closing)
    const latestMonth = months[months.length - 1];

    for (const m of months) {
      const income = totalIncome(m.earners);

      for (const b of m.bills) {
        if (!billMap[b.name]) billMap[b.name] = { budget: 0, actual: 0 };
        billMap[b.name].budget += b.budget;
        billMap[b.name].actual += b.actual;
        totalBillsBudget += b.budget;
        totalBillsActual += b.actual;
      }

      for (const a of m.allocations) {
        if (!allocMap[a.name]) allocMap[a.name] = { budget: 0, actual: 0, pct: a.pct };
        const budgetAmt = allocAmount(a.pct, income);
        allocMap[a.name].budget += budgetAmt;
        allocMap[a.name].actual += a.actual;
        totalAllocBudget += budgetAmt;
        totalAllocActual += a.actual;
      }
    }

    // Projection: annualize based on months elapsed
    const monthsElapsed = months.length;
    const projectionFactor = monthsElapsed > 0 ? 12 / monthsElapsed : 1;

    return {
      billMap,
      allocMap,
      totalBillsBudget,
      totalBillsActual,
      totalAllocBudget,
      totalAllocActual,
      latestMonth,
      monthsElapsed,
      projectionFactor,
    };
  }, [months, currentYear]);

  if (!ytd) return <div className="ys-empty">No data yet</div>;

  const { billMap, allocMap, totalBillsBudget, totalBillsActual, totalAllocBudget, totalAllocActual, monthsElapsed, projectionFactor } = ytd;

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

      <div className="ys-section">
        <h4>Bills</h4>
        {Object.entries(billMap).map(([name, { budget, actual }]) => (
          <div key={name} className={`ys-row ${indicator(budget, actual)}`}>
            <span className="ys-name">{name}</span>
            <span className="ys-vals">
              {fmt(actual)} / {fmt(budget)}
            </span>
          </div>
        ))}
        <div className="ys-row ys-total">
          <span>Bills Total</span>
          <span>{fmt(totalBillsActual)} / {fmt(totalBillsBudget)}</span>
        </div>
      </div>

      <div className="ys-section">
        <h4>Allocations</h4>
        {Object.entries(allocMap).map(([name, { budget, actual, pct }]) => (
          <div key={name} className={`ys-row ${indicator(budget, actual)}`}>
            <span className="ys-name">{name} ({pct}%)</span>
            <span className="ys-vals">{fmt(actual)} / {fmt(budget)}</span>
          </div>
        ))}
        <div className="ys-row ys-total">
          <span>Allocations Total</span>
          <span>{fmt(totalAllocActual)} / {fmt(totalAllocBudget)}</span>
        </div>
      </div>

      <div className="ys-section">
        <h4>Projected Year-End</h4>
        {Object.entries(billMap).map(([name, { budget, actual }]) => {
          const projected = Math.round(actual * projectionFactor);
          const annualBudget = Math.round(budget * projectionFactor);
          return (
            <div key={name} className={`ys-row ${indicator(annualBudget, projected)}`}>
              <span className="ys-name">{name}</span>
              <span className="ys-vals">{fmt(projected)} / {fmt(annualBudget)}</span>
            </div>
          );
        })}
      </div>

      <div className="ys-section">
        <h4>Fund Balances</h4>
        {ytd.latestMonth.funds.map((f) => {
          const closing = f.opening + f.transfersIn - f.transfersOut;
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

**Step 2: Update src/App.jsx to render YtdSidebar**

Replace the sidebar placeholder:
```jsx
// In the imports, add:
import YtdSidebar from "./components/YtdSidebar";

// Replace: {sidebarOpen && <aside className="sidebar" id="ytd-sidebar"></aside>}
// With:
{sidebarOpen && <aside className="sidebar"><YtdSidebar /></aside>}
```

**Step 3: Verify**

Run: `npm run dev`
Expected: Click "Show YTD" — sidebar appears with bills/allocations YTD data, projections, fund balances. Over-budget items highlighted.

**Step 4: Commit**

```bash
git add src/components/YtdSidebar.jsx src/App.jsx
git commit -m "feat: add YtdSidebar with budget vs actual, projections, and fund balances"
```

---

### Task 12: SetupPage

**Files:**
- Create: `src/pages/SetupPage.jsx`
- Modify: `src/main.jsx` — add setup route
- Modify: `src/App.jsx` — redirect to setup if not complete

**Step 1: Create src/pages/SetupPage.jsx**

A multi-step wizard: (1) Earners & income, (2) Bill line items, (3) Percentage allocations, (4) Funds. Each step has a "Next" button. Final step has "Start Budgeting."

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBudget } from "../context/BudgetContext";

const STEPS = ["Earners", "Bills", "Allocations", "Funds"];

export default function SetupPage() {
  const { completeSetup } = useBudget();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1: Earners
  const [earnerCount, setEarnerCount] = useState(1);
  const [earners, setEarners] = useState([
    { name: "", income: 0 },
    { name: "", income: 0 },
  ]);
  const [useSplit, setUseSplit] = useState(false);

  // Step 2: Bills
  const [bills, setBills] = useState([{ name: "", budget: 0, notes: "", autopay: false }]);

  // Step 3: Allocations
  const [allocations, setAllocations] = useState([{ name: "Grocery", pct: 13, fixed: false }]);

  // Step 4: Funds
  const [funds, setFunds] = useState([{ name: "", opening: 0, minBal: 0 }]);

  const updateEarner = (i, field, value) => {
    const next = [...earners];
    next[i] = { ...next[i], [field]: field === "income" ? (parseFloat(value) || 0) : value };
    setEarners(next);
  };

  const updateBill = (i, field, value) => {
    const next = [...bills];
    next[i] = { ...next[i], [field]: field === "budget" ? (parseFloat(value) || 0) : field === "autopay" ? value : value };
    setBills(next);
  };

  const updateAlloc = (i, field, value) => {
    const next = [...allocations];
    next[i] = { ...next[i], [field]: field === "pct" ? (parseFloat(value) || 0) : field === "fixed" ? value : value };
    setAllocations(next);
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
    const validBills = bills.filter(b => b.name);
    const validAllocs = allocations.filter(a => a.name && a.pct > 0);
    const validFunds = funds.filter(f => f.name);
    completeSetup(profile, validBills, validAllocs, validFunds);
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

      {step === 1 && (
        <div className="setup-panel">
          <h3>Monthly Bills</h3>
          <p className="setup-hint">Add your recurring bills. You can always add more later.</p>
          {bills.map((b, i) => (
            <div key={i} className="setup-row">
              <input placeholder="Bill name" value={b.name} onChange={(e) => updateBill(i, "name", e.target.value)} />
              <input type="number" placeholder="Amount" value={b.budget || ""} onChange={(e) => updateBill(i, "budget", e.target.value)} />
              <input placeholder="Notes" value={b.notes} onChange={(e) => updateBill(i, "notes", e.target.value)} />
              <label className="setup-check-sm">
                <input type="checkbox" checked={b.autopay} onChange={(e) => updateBill(i, "autopay", e.target.checked)} /> Auto
              </label>
              <button className="setup-rm" onClick={() => setBills(bills.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="setup-add" onClick={() => setBills([...bills, { name: "", budget: 0, notes: "", autopay: false }])}>
            + Add Bill
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="setup-panel">
          <h3>Percentage Allocations</h3>
          <p className="setup-hint">These are income-based amounts — like grocery, charity, and savings.</p>
          {allocations.map((a, i) => (
            <div key={i} className="setup-row">
              <input placeholder="Name" value={a.name} onChange={(e) => updateAlloc(i, "name", e.target.value)} />
              <input type="number" placeholder="%" value={a.pct || ""} onChange={(e) => updateAlloc(i, "pct", e.target.value)} />
              <label className="setup-check-sm">
                <input type="checkbox" checked={a.fixed} onChange={(e) => updateAlloc(i, "fixed", e.target.checked)} /> Fixed %
              </label>
              <button className="setup-rm" onClick={() => setAllocations(allocations.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="setup-add" onClick={() => setAllocations([...allocations, { name: "", pct: 0, fixed: false }])}>
            + Add Allocation
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="setup-panel">
          <h3>Funds to Track</h3>
          <p className="setup-hint">Track account balances alongside your budget.</p>
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
        {step < 3 && <button className="setup-next" onClick={() => setStep(step + 1)}>Next</button>}
        {step === 3 && <button className="setup-finish" onClick={finish}>Start Budgeting</button>}
      </div>
    </div>
  );
}
```

**Step 2: Update src/main.jsx — add setup route**

Add the import and route:
```jsx
import SetupPage from "./pages/SetupPage";

// Add inside <Routes>:
<Route path="setup" element={<SetupPage />} />
```

**Step 3: Update src/App.jsx — redirect to setup if needed**

Add to App component, before the return:
```jsx
import { Outlet, useNavigate, Navigate, useLocation } from "react-router-dom";

// Inside App component:
const location = useLocation();
if (!state.setupComplete && location.pathname !== "/setup") {
  return <Navigate to="/setup" replace />;
}
```

**Step 4: Verify**

Clear localStorage (`localStorage.removeItem("divvy-budget")`), reload. Should redirect to setup wizard. Complete all 4 steps, click "Start Budgeting" — should redirect to timeline with the configured month.

**Step 5: Commit**

```bash
git add src/pages/SetupPage.jsx src/main.jsx src/App.jsx
git commit -m "feat: add SetupPage wizard for first-time configuration"
```

---

### Task 13: SummaryPage

**Files:**
- Create: `src/pages/SummaryPage.jsx`
- Modify: `src/main.jsx` — add summary route

**Step 1: Create src/pages/SummaryPage.jsx**

Year summary grid. Rows = line items, columns = Annual Budget | Annual Actual | Delta | Next Year Budget (editable). Computed from monthly records.

```jsx
import { useMemo, useState } from "react";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "../components/EditableCell";
import { fmt, totalIncome, allocAmount } from "../shared/helpers";

export default function SummaryPage() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  // Local state for next-year budget planning (not persisted — just a planning tool)
  const [nextYearBudgets, setNextYearBudgets] = useState({});

  const summary = useMemo(() => {
    const billRows = {};
    const allocRows = {};

    for (const m of months) {
      const income = totalIncome(m.earners);

      for (const b of m.bills) {
        if (!billRows[b.name]) billRows[b.name] = { budget: 0, actual: 0 };
        billRows[b.name].budget += b.budget;
        billRows[b.name].actual += b.actual;
      }

      for (const a of m.allocations) {
        if (!allocRows[a.name]) allocRows[a.name] = { budget: 0, actual: 0, pct: a.pct };
        allocRows[a.name].budget += allocAmount(a.pct, income);
        allocRows[a.name].actual += a.actual;
      }
    }

    return { billRows, allocRows };
  }, [months]);

  const { billRows, allocRows } = summary;

  const monthCount = months.length;
  const projFactor = monthCount > 0 ? 12 / monthCount : 1;

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
          <tr className="sp-section"><td colSpan={6}>Bills</td></tr>
          {Object.entries(billRows).map(([name, { budget, actual }]) => {
            const delta = budget - actual;
            const est = Math.round(actual * projFactor / 12);
            return (
              <tr key={name}>
                <td>{name}</td>
                <td className="num">{fmt(budget)}</td>
                <td className="num">{fmt(actual)}</td>
                <td className={`num ${delta >= 0 ? "under" : "over"}`}>{fmt(delta)}</td>
                <td className="num muted">{fmt(est)}</td>
                <td className="num">
                  <EditableCell
                    value={nextYearBudgets[name] ?? est}
                    type="number"
                    formatter={fmt}
                    onChange={(v) => setNextYearBudgets(prev => ({ ...prev, [name]: v }))}
                  />
                </td>
              </tr>
            );
          })}

          <tr className="sp-section"><td colSpan={6}>Allocations</td></tr>
          {Object.entries(allocRows).map(([name, { budget, actual, pct }]) => {
            const delta = budget - actual;
            return (
              <tr key={name}>
                <td>{name} ({pct}%)</td>
                <td className="num">{fmt(budget)}</td>
                <td className="num">{fmt(actual)}</td>
                <td className={`num ${delta >= 0 ? "under" : "over"}`}>{fmt(delta)}</td>
                <td className="num muted">—</td>
                <td className="num muted">—</td>
              </tr>
            );
          })}

          <tr className="sp-totals">
            <td>Total</td>
            <td className="num">
              {fmt(Object.values(billRows).reduce((s, r) => s + r.budget, 0) + Object.values(allocRows).reduce((s, r) => s + r.budget, 0))}
            </td>
            <td className="num">
              {fmt(Object.values(billRows).reduce((s, r) => s + r.actual, 0) + Object.values(allocRows).reduce((s, r) => s + r.actual, 0))}
            </td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Update src/main.jsx — add summary route**

```jsx
import SummaryPage from "./pages/SummaryPage";

// Add inside <Routes>:
<Route path="summary" element={<SummaryPage />} />
```

**Step 3: Verify**

Run: `npm run dev`
Navigate to Summary. Should show aggregated bill/allocation data across all months with deltas and projections.

**Step 4: Commit**

```bash
git add src/pages/SummaryPage.jsx src/main.jsx
git commit -m "feat: add SummaryPage with year-end review and next-year planning"
```

---

### Task 14: CSS Theming & Polish

**Files:**
- Modify: `src/app.css` — full styling
- Modify: `index.html` — Google Fonts link

**Step 1: Update index.html with Google Fonts**

Add to `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Using Inter (clean, data-dense) and JetBrains Mono (for numbers in the grids).

**Step 2: Write src/app.css**

This is the largest single file. Key design principles:
- Data-dense: tight padding, compact rows, small font sizes for grids
- Clear visual hierarchy: section headers, subtle borders, alternating backgrounds
- Color coding: green for under-budget, red for over-budget, amber for warning
- The editable cells should look like regular text until hovered (then a subtle border appears)

The CSS should cover all class names used across all components. Write the full stylesheet covering:

**Root variables:**
```css
:root {
  --bg: #fafafa;
  --surface: #ffffff;
  --border: #e2e2e2;
  --text: #1a1a1a;
  --text-muted: #888;
  --accent: #2563eb;
  --green: #16a34a;
  --red: #dc2626;
  --amber: #d97706;
  --green-bg: #f0fdf4;
  --red-bg: #fef2f2;
  --amber-bg: #fffbeb;
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Key sections to style:**
- `.app` — flex column, full height
- `.hdr` — sticky top bar, flex between left (logo + nav) and right (year select + sidebar toggle)
- `.main` — flex row, content + optional sidebar
- `.content` — flex-grow, scrollable
- `.sidebar` — fixed width (~320px), border-left, scrollable
- `.mc` — month card with border, margin between cards
- `.bg-tbl`, `.ag-tbl`, `.fg-tbl` — dense tables with compact padding
- `.ec` — editable cell hover state
- `.ec-input` — edit mode input styling
- `.setup` — centered wizard layout
- `.sp-tbl` — summary table
- `.ys` — sidebar sections
- `.under` / `.over` — color indicators
- `.num` — right-aligned, monospace font

Provide the complete CSS. Target compact table cells (padding: 4px 8px), 13px base font for grids, 14px for body text.

**Step 3: Verify**

Run: `npm run dev`
Expected: Clean, data-dense layout. Month cards look spreadsheet-tight. Sidebar styled. Hover on cells shows edit indicator.

**Step 4: Commit**

```bash
git add src/app.css index.html
git commit -m "feat: add CSS theming with Inter/JetBrains Mono, data-dense grid styling"
```

---

### Task 15: CLAUDE.md & Cleanup

**Files:**
- Create: `CLAUDE.md`

**Step 1: Create CLAUDE.md following prototype conventions**

```markdown
# Divvy Prototype

Divvy — monthly budget allocation web app prototype. React SPA deployed to GitHub Pages.

## Dev commands

- `npm run dev` — start Vite dev server (port 5175)
- `npm run build` — production build

## Tech stack

- React 19, Vite 6, react-router-dom v7 (HashRouter)
- No TypeScript, no tests — prototype-grade code
- Deployed to GitHub Pages; HashRouter + `base: '/divvy-prototype/'` in vite.config.js

## Project structure

[Document the actual final structure here, mirroring the format from tcc-prototype/CLAUDE.md]

## Routing

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | TimelinePage | Continuous month card timeline |
| `/summary` | SummaryPage | Year summary and next-year planning |
| `/setup` | SetupPage | First-time setup wizard |

## Data persistence

All data stored in localStorage under key `divvy-budget`. BudgetContext handles load/save:

[Document the useBudget() hook API]

## Coding conventions

- Short CSS class names and inline styles for one-off styling
- CSS variables for theme colors (see `:root` in app.css)
- Compact JSX — keep components concise
- Shared utilities in `shared/helpers.js`
- Default exports for all components; named exports for data/helpers

## Styling

- CSS variables for theme (see `:root` in app.css)
- Google Fonts: Inter (sans body), JetBrains Mono (grid numbers)
- Desktop-first, data-dense design
```

**Step 2: Final cleanup pass**

- Remove any remaining `console.log` statements
- Verify all imports are used
- Verify app loads cleanly with no console errors

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project documentation"
```

---

## Execution Notes

- **Frontend-design skill:** Should be invoked during Task 14 (CSS Theming) to ensure the design is polished and distinctive rather than generic. The skill can guide color palette, typography, and spacing decisions.
- **Seed data:** The seed data in Task 2 is based on the real 2026 Google Sheets data. It gives the prototype a realistic feel immediately.
- **No tests:** Consistent with maa-prototype and tcc-prototype conventions — this is prototype-grade code.
- **localStorage key:** `divvy-budget` — follows the `{app}-{noun}` pattern from the other prototypes.
