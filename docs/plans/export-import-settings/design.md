# Export/Import, Settings Page, and Sample Templates

## Context

The app currently has personal seed data (Josh/Jacklyn, specific bills/amounts) hardcoded in `src/data.js`. Before making the repo public on GitHub Pages, we need to:
1. Save personal data via export
2. Replace seed data with generic sample templates
3. Add import to restore personal data later
4. Create a Settings page for data management
5. Add a template picker to the Setup wizard

## Files to modify

| File | Action |
|------|--------|
| `src/data.js` | Remove personal seed data, add `EMPTY_STATE` + two template objects |
| `src/context/BudgetContext.jsx` | Switch to `EMPTY_STATE`, add `exportData`/`importData` to provider |
| `src/pages/SetupPage.jsx` | Add step 0 "Pick a starting point" with template cards, support `?template=` URL param |
| `src/pages/SettingsPage.jsx` | **New file** — export/import/reset/template buttons |
| `src/main.jsx` | Add `/settings` route inside App layout |
| `src/App.jsx` | Fix nav button active states |
| `src/app.css` | Add settings page + template picker styles |

---

## Task 1: Replace seed data with EMPTY_STATE and templates (`src/data.js`)

Remove: `SEED_PROFILE`, `SEED_BILLS`, `SEED_ALLOCATIONS`, `SEED_FUNDS`, `SEED_MONTHS`, `buildSeedMonths()`, `SEED_STATE`.

Add `EMPTY_STATE`:
```js
export const EMPTY_STATE = {
  profile: { earners: [], useSplit: false },
  years: {},
  currentYear: new Date().getFullYear(),
  setupComplete: false,
};
```

Add two template objects (named exports). These are wizard prefill data, not full app state:
```js
export const TEMPLATE_DUAL = {
  label: "Dual income household",
  description: "Two earners splitting bills proportionally",
  earnerCount: 2,
  useSplit: true,
  earners: [
    { name: "Earner 1", income: 6500 },
    { name: "Earner 2", income: 4000 },
  ],
  bills: [
    { name: "Mortgage/Rent", budget: 2200, notes: "", autopay: false },
    { name: "Utilities", budget: 250, notes: "", autopay: true },
    { name: "Internet", budget: 80, notes: "", autopay: true },
    { name: "Phone", budget: 120, notes: "", autopay: true },
    { name: "Car Insurance", budget: 180, notes: "", autopay: false },
    { name: "Subscriptions", budget: 60, notes: "", autopay: true },
  ],
  allocations: [
    { name: "Grocery", pct: 12, fixed: false },
    { name: "Savings", pct: 10, fixed: false },
    { name: "Charity", pct: 5, fixed: true },
  ],
  funds: [
    { name: "Joint Savings", opening: 5000, minBal: 1000 },
    { name: "Emergency Fund", opening: 10000, minBal: 5000 },
  ],
};

export const TEMPLATE_SINGLE = {
  label: "Single income household",
  description: "One earner managing all expenses",
  earnerCount: 1,
  useSplit: false,
  earners: [
    { name: "Earner 1", income: 5500 },
    { name: "", income: 0 },
  ],
  bills: [
    { name: "Rent", budget: 1500, notes: "", autopay: false },
    { name: "Utilities", budget: 180, notes: "", autopay: true },
    { name: "Internet", budget: 70, notes: "", autopay: true },
    { name: "Phone", budget: 80, notes: "", autopay: true },
    { name: "Car Insurance", budget: 150, notes: "", autopay: false },
    { name: "Subscriptions", budget: 45, notes: "", autopay: true },
  ],
  allocations: [
    { name: "Grocery", pct: 12, fixed: false },
    { name: "Savings", pct: 8, fixed: false },
    { name: "Fun Money", pct: 5, fixed: false },
  ],
  funds: [
    { name: "Savings Account", opening: 4000, minBal: 1000 },
    { name: "Emergency Fund", opening: 8000, minBal: 3000 },
  ],
};

export const TEMPLATES = { dual: TEMPLATE_DUAL, single: TEMPLATE_SINGLE };
```

Keep all factory functions unchanged (`makeEarner`, `makeBill`, `makeAllocation`, `makeFund`, `makeMonth`, `MONTHS`, `STORAGE_KEY`).

---

## Task 2: Update BudgetContext (`src/context/BudgetContext.jsx`)

1. Change import: `SEED_STATE` → `EMPTY_STATE`
2. Initial state: `load() || EMPTY_STATE`
3. `resetData`: persist `EMPTY_STATE` instead of `SEED_STATE`
4. Add `exportData` and `importData`:

```js
const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

const importData = useCallback((jsonString) => {
  const parsed = JSON.parse(jsonString);
  if (!parsed.profile || !parsed.years || parsed.setupComplete === undefined) {
    throw new Error("Invalid Divvy budget file");
  }
  persist(parsed);
}, [persist]);
```

5. Add both to the provider value object.

---

## Task 3: Add template picker to SetupPage (`src/pages/SetupPage.jsx`)

1. Add imports: `useSearchParams` from `react-router-dom`, `TEMPLATES` from `../data`
2. Update steps: `["Start", "Earners", "Bills", "Allocations", "Funds"]` (5 steps)
3. On mount, check `searchParams.get("template")` — if matches a key, prefill state and skip to step 1
4. Step 0 renders three template cards: Dual income, Single income, Start blank
5. Selecting a card prefills local state and advances to step 1
6. Shift all step indices by +1 (Earners=1, Bills=2, Allocations=3, Funds=4)
7. Finish button at `step === 4`

Template prefill logic:
```js
const applyTemplate = (t) => {
  setEarnerCount(t.earnerCount);
  setEarners([...t.earners]);
  setUseSplit(t.useSplit);
  setBills([...t.bills]);
  setAllocations([...t.allocations]);
  setFunds([...t.funds]);
  setStep(1);
};
```

Step 0 UI — three clickable cards:
```jsx
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
```

---

## Task 4: Create SettingsPage (`src/pages/SettingsPage.jsx`)

New file with two sections:

**Data Management:**
- Export button → `JSON.stringify(state)` → download as `divvy-budget-YYYY-MM-DD.json`
- Import button → hidden file input → `FileReader` → `importData(text)` → show success/error
- Reset button → `window.confirm()` → `resetData()` → `navigate("/setup")`

**Sample Templates:**
- "Load dual income sample" → confirm → `resetData()` → `navigate("/setup?template=dual")`
- "Load single income sample" → confirm → `resetData()` → `navigate("/setup?template=single")`

Key functions:
```js
const handleExport = () => {
  const json = exportData();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `divvy-budget-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const handleImport = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try { importData(ev.target.result); setStatus("Imported successfully"); }
    catch { setStatus("Invalid file"); }
  };
  reader.readAsText(file);
};
```

---

## Task 5: Add route and fix nav (`src/main.jsx` + `src/App.jsx`)

**main.jsx** — add inside `<Route element={<App />}>`:
```jsx
<Route path="settings" element={<SettingsPage />} />
```

**App.jsx** — fix active nav state using `location.pathname`:
```jsx
<button className={`nav-btn${location.pathname === "/" ? " active" : ""}`} onClick={() => navigate("/")}>Timeline</button>
<button className={`nav-btn${location.pathname === "/summary" ? " active" : ""}`} onClick={() => navigate("/summary")}>Summary</button>
<button className={`nav-btn${location.pathname === "/settings" ? " active" : ""}`} onClick={() => navigate("/settings")}>Settings</button>
```

---

## Task 6: Add CSS (`src/app.css`)

Settings page styles (`.settings`, `.settings-section`, `.settings-btn`, `.settings-btn-danger`, `.settings-status`) and setup template picker (`.setup-templates`, `.setup-tpl-card`). Follow existing patterns — short class names, CSS variables, compact layout.

---

## Verification

1. Clear localStorage, reload → should redirect to Setup with template picker step
2. Pick "Dual income" → wizard prefills with sample data → finish → timeline shows sample month
3. Navigate to Settings → export → downloads JSON file
4. Reset from Settings → redirects to Setup
5. Import the exported JSON → data restores
6. Load template from Settings → redirects to Setup with prefill
7. Nav buttons show correct active state on each page
