# Divvy Production Upgrade — Implementation Plan

> **Design:** [design.md](./design.md)
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Divvy from prototype JavaScript/CSS to TypeScript strict mode + Tailwind 4 + DaisyUI 5 + ESLint/Prettier + Immer, without changing functionality.

**Architecture:** Five sequential workstreams. TypeScript first (foundational), then Immer state cleanup, ESLint/Prettier, Tailwind+DaisyUI (biggest change), and finally documentation. Each workstream ends with a build verification gate.

**Tech Stack:** TypeScript 5, Tailwind CSS 4, DaisyUI 5, Immer, ESLint (flat config), Prettier

**Code Review Checkpoints:**
- **Checkpoint 1:** After Tasks 1-3 (TypeScript migration — types, config, all file conversions)
- **Checkpoint 2:** After Tasks 4-5 (Immer + useLocalStorage — state management cleanup)
- **Checkpoint 3:** After Tasks 6-7 (ESLint + Prettier — tooling setup and autofix)
- **Checkpoint 4:** After Tasks 8-14 (Tailwind + DaisyUI — full styling migration)
- **Final Review:** After Tasks 15-16 (Documentation updates)

---

## Tasks

| # | Task | Description | Model |
|---|------|-------------|-------|
| 1 | [TypeScript Config & Types](#task-1-typescript-config--types) | tsconfig, vite config rename, type definitions | sonnet |
| 2 | [Core File Conversions](#task-2-core-file-conversions) | Rename and type data.ts, helpers.ts, main.tsx, App.tsx | sonnet |
| 3 | [Component File Conversions](#task-3-component-file-conversions) | Rename and type all components and pages | sonnet |
| 4 | [useLocalStorage Hook](#task-4-uselocalstorage-hook) | Extract typed persistence hook | sonnet |
| 5 | [Immer in BudgetContext](#task-5-immer-in-budgetcontext) | Replace spread chains with produce() | sonnet |
| 6 | [ESLint Setup](#task-6-eslint-setup) | Install and configure ESLint flat config | sonnet |
| 7 | [Prettier Setup](#task-7-prettier-setup) | Install Prettier, format codebase, add scripts | sonnet |
| 8 | [Tailwind + DaisyUI Setup](#task-8-tailwind--daisyui-setup) | Install, configure, create index.css with theme | opus |
| 9 | [Migrate App Shell](#task-9-migrate-app-shell) | App.tsx header, nav, sidebar layout → Tailwind | sonnet |
| 10 | [Migrate Modal Component](#task-10-migrate-modal-component) | Extract shared Modal.tsx, migrate RowModal + ManageSectionsModal | opus |
| 11 | [Migrate MonthCard + EditableCell](#task-11-migrate-monthcard--editablecell) | Month card header/body + inline edit cell → Tailwind | sonnet |
| 12 | [Migrate SectionGrid + FundsGrid](#task-12-migrate-sectiongrid--fundsgrid) | Data tables → DaisyUI table + Tailwind | sonnet |
| 13 | [Migrate Pages](#task-13-migrate-pages) | TimelinePage, SummaryPage, SetupPage, SettingsPage → Tailwind | sonnet |
| 14 | [Delete app.css & Cleanup](#task-14-delete-appcss--cleanup) | Remove old CSS, verify no stale class references | sonnet |
| 15 | [Update CLAUDE.md](#task-15-update-claudemd) | Reflect new stack, patterns, structure | sonnet |
| 16 | [Update README.md](#task-16-update-readmemd) | Tech stack, structure, dev commands | sonnet |

---

## Workstream 1: TypeScript Migration

### Task 1: TypeScript Config & Types

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Rename: `vite.config.js` → `vite.config.ts`
- Create: `src/types/index.ts`
- Modify: `package.json` (build script)
- Modify: `index.html` (script src)

- [ ] **Step 1: Install TypeScript and types**

```bash
npm install -D typescript @types/react @types/react-dom
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.app.json`**

Model this on the retirement-planner config at `/Users/josh/Code/retirement-planner/tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Rename `vite.config.js` → `vite.config.ts`**

Update contents — just change extension, content stays the same (Vite handles TS config natively).

- [ ] **Step 5: Update `index.html`**

Change `<script type="module" src="/src/main.jsx">` to `src="/src/main.tsx"`.

- [ ] **Step 6: Update `package.json` build script**

```json
"build": "tsc -b && vite build"
```

- [ ] **Step 7: Create `src/types/index.ts`**

All domain types. Export everything. These are extracted from the actual shapes in `src/data.js`:

```ts
// --- Domain types ---

export interface Earner {
  name: string;
  income: number;
}

export interface Item {
  id: string;
  name: string;
  budget: number;
  actual: number;
  earner1: number;
  earner2: number;
  notes: string;
}

export interface Section {
  id: string;
  name: string;
  items: Item[];
}

export interface Fund {
  id: string;
  name: string;
  opening: number;
  transfersIn: number;
  transfersOut: number;
  minBal: number;
  notes: string;
}

export interface Month {
  id: string;
  year: number;
  month: number;
  earners: Earner[];
  sections: Section[];
  funds: Fund[];
}

export interface YearData {
  months: Month[];
}

export interface Profile {
  earners: Earner[];
  useSplit: boolean;
}

export interface BudgetState {
  profile: Profile;
  years: Record<number, YearData>;
  currentYear: number;
  setupComplete: boolean;
}

// --- Template types (setup wizard) ---
// Template items lack id/earner1/earner2/actual — they're pre-processing shapes

export interface TemplateItem {
  name: string;
  budget: number;
  notes: string;
}

export interface TemplateSection {
  name: string;
  items: TemplateItem[];
}

export interface TemplateFund {
  name: string;
  opening: number;
  minBal: number;
}

export interface Template {
  label: string;
  description: string;
  earnerCount: number;
  useSplit: boolean;
  earners: Earner[];
  sections: TemplateSection[];
  funds: TemplateFund[];
}

// --- Component-specific types ---

/** RowModal local editing state — extends Item with transient _pct field */
export interface ItemDraft extends Item {
  _pct: number;
}

// --- Context types ---

export interface BudgetContextValue {
  state: BudgetState;
  profile: Profile;
  currentYear: number;
  setupComplete: boolean;
  setCurrentYear: (year: number) => void;
  updateProfile: (profile: Profile) => void;
  getMonths: (year: number) => Month[];
  getMonth: (year: number, month: number) => Month | null;
  updateMonth: (year: number, monthIndex: number, updater: ((m: Month) => Month) | Partial<Month>) => void;
  cloneMonth: (year: number, fromMonthIndex: number) => void;
  removeMonth: (year: number, monthIndex: number) => void;
  addSection: (year: number, monthIndex: number, name: string) => void;
  renameSection: (year: number, monthIndex: number, sectionId: string, name: string) => void;
  removeSection: (year: number, monthIndex: number, sectionId: string) => void;
  addItem: (year: number, monthIndex: number, sectionId: string, data?: Partial<Item>) => void;
  updateItem: (year: number, monthIndex: number, sectionId: string, itemId: string, updates: Partial<Item>) => void;
  removeItem: (year: number, monthIndex: number, sectionId: string, itemId: string) => void;
  updateFund: (year: number, monthIndex: number, fundId: string, updates: Partial<Fund>) => void;
  addFund: (year: number, monthIndex: number, data?: Partial<Fund>) => void;
  removeFund: (year: number, monthIndex: number, fundId: string) => void;
  completeSetup: (profile: Profile, sections: TemplateSection[], funds: TemplateFund[]) => void;
  exportData: () => string;
  importData: (jsonString: string) => void;
  resetData: () => void;
}
```

- [ ] **Step 8: Verify TypeScript config**

```bash
npx tsc -b --noEmit
```

Expected: errors about .jsx files not found (we haven't renamed yet). Config itself should be valid.

- [ ] **Step 9: Commit**

```bash
git add tsconfig.json tsconfig.app.json vite.config.ts src/types/index.ts package.json index.html
git rm vite.config.js
git commit -m "feat: add TypeScript config and domain type definitions"
```

---

### Task 2: Core File Conversions

**Files:**
- Rename: `src/data.js` → `src/data.ts`
- Rename: `src/shared/helpers.js` → `src/shared/helpers.ts`
- Rename: `src/main.jsx` → `src/main.tsx`
- Rename: `src/App.jsx` → `src/App.tsx`
- Rename: `src/context/BudgetContext.jsx` → `src/context/BudgetContext.tsx`

- [ ] **Step 1: Rename files**

```bash
cd src
git mv data.js data.ts
git mv shared/helpers.js shared/helpers.ts
git mv main.jsx main.tsx
git mv App.jsx App.tsx
git mv context/BudgetContext.jsx context/BudgetContext.tsx
```

- [ ] **Step 2: Type `data.ts`**

Add imports and type annotations to factory functions and constants:

```ts
import type { Earner, Item, Section, Fund, Month, BudgetState, Template } from "./types";
```

- Type the factory return types: `makeEarner` → returns `Earner`, `makeItem` → returns `Item`, `makeSection` → returns `Section`, `makeFund` → returns `Fund`, `makeMonth` → returns `Month`.
- Type `EMPTY_STATE` as `BudgetState`.
- Type `TEMPLATE_DUAL` and `TEMPLATE_SINGLE` as `Template`.
- Type `TEMPLATES` as `Record<string, Template>`.

- [ ] **Step 3: Type `helpers.ts`**

Add parameter types to all functions:
- `fmt(n: number)`, `fmtExact(n: number)`, `fmtPct(n: number)`
- `monthName(m: number)`, `monthNameFull(m: number)`
- `itemsTotal(items: Item[], field?: keyof Item)` — import `Item` from types. Note: `field` defaults to `"budget"`, and the accessed value must be `number`. Use a type constraint or cast.
- `totalIncome(earners: Earner[])`, `splitRatios(earners: Earner[])`
- `fundClosing(fund: Fund)`
- `deltaClass(budget: number, actual: number)`

- [ ] **Step 4: Type `BudgetContext.tsx`**

- Import types: `BudgetState`, `Month`, `BudgetContextValue`, `Profile`, `Item`, `Fund`, `TemplateSection`, `TemplateFund` from `../types`.
- Type the context: `createContext<BudgetContextValue | null>(null)`.
- Type `load()` return as `BudgetState | null`.
- Type `save(state: BudgetState)`.
- Type all callback parameters (year: number, monthIndex: number, etc.).
- Type the `importData` migration section — the parsed data is `unknown` initially. Use a type assertion after validation. For the legacy `bills`/`allocations` fields, use `as any` or define a minimal inline type since this is migration code.
- Type `useBudget()` hook: `const ctx = useContext(BudgetContext); if (!ctx) throw new Error("useBudget must be used within BudgetProvider"); return ctx;`

- [ ] **Step 5: Type `main.tsx`**

Minimal changes — add `!` non-null assertion on `document.getElementById("root")!` for `createRoot`. Update CSS import from `./app.css` (will change later but keep it for now).

- [ ] **Step 6: Type `App.tsx`**

- No props interface needed (no props).
- Type the `useOutletContext` usage — the outlet context is `{ sectionStyle: string }`. Use `<Outlet context={{ sectionStyle: "d" } satisfies OutletContextType} />` and export the type.
- Or simply define inline: `Outlet context={{ sectionStyle: "d" }}` is already fine with TS.

- [ ] **Step 7: Build check**

```bash
npx tsc -b
```

Expected: May still have errors from un-renamed component files. Fix any errors in the files converted so far.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: convert core files to TypeScript (data, helpers, context, main, App)"
```

---

### Task 3: Component File Conversions

**Files:**
- Rename all `src/components/*.jsx` → `*.tsx`
- Rename all `src/pages/*.jsx` → `*.tsx`

- [ ] **Step 1: Rename all component files**

```bash
cd src/components
for f in *.jsx; do git mv "$f" "${f%.jsx}.tsx"; done
cd ../pages
for f in *.jsx; do git mv "$f" "${f%.jsx}.tsx"; done
```

- [ ] **Step 2: Type `EditableCell.tsx`**

```ts
interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number";
  className?: string;
  formatter?: (value: number) => string;
  placeholder?: string;
}
```

Add props type to function signature. Internal state types will be inferred.

- [ ] **Step 3: Type `MonthCard.tsx`**

```ts
import type { Month } from "../types";

interface MonthCardProps {
  monthData: Month;
  defaultCollapsed?: boolean;
  isLatest?: boolean;
  onClone?: () => void;
  onRemove?: () => void;
  sectionStyle?: string;
}
```

- [ ] **Step 4: Type `SectionGrid.tsx`**

```ts
import type { Section, Earner } from "../types";

interface SectionGridProps {
  year: number;
  monthIndex: number;
  section: Section;
  earners: Earner[];
}
```

The `modal` state: type as `{ data: Item; isNew: boolean } | null`.

- [ ] **Step 5: Type `FundsGrid.tsx`**

```ts
import type { Fund } from "../types";

interface FundsGridProps {
  year: number;
  monthIndex: number;
  funds: Fund[];
}
```

The `modal` state: type as `{ data: Fund; isNew: boolean } | null`.

- [ ] **Step 6: Type `RowModal.tsx`**

```ts
import type { Earner, ItemDraft } from "../types";

interface RowModalProps {
  type: "item" | "fund";
  data: Record<string, string | number>;
  onSave: (draft: Record<string, string | number>) => void;
  onClose: () => void;
  showSplit: boolean;
  earnerNames: string[];
  income?: number;
  earners?: Earner[];
}
```

Note: the `draft` state uses `ItemDraft` when `type === "item"`. The `_pct` field is stripped before save via destructuring.

- [ ] **Step 7: Type `ManageSectionsModal.tsx`**

```ts
import type { Section, Earner } from "../types";

interface ManageSectionsModalProps {
  sections: Section[];
  earners: Earner[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onUpdateEarner: (index: number, income: number) => void;
  onRemoveMonth?: () => void;
  monthLabel?: string;
  onClose: () => void;
}
```

- [ ] **Step 8: Type `YtdSidebar.tsx`**

No props — uses `useBudget()` directly. Internal `ytd` computed object needs typing:

```ts
interface YtdData {
  sectionMap: Record<string, { items: Record<string, { budget: number; actual: number }>; budget: number; actual: number }>;
  totalBudget: number;
  totalActual: number;
  latestMonth: Month;
  monthsElapsed: number;
}
```

- [ ] **Step 9: Type page components**

- `TimelinePage.tsx` — uses `useOutletContext<{ sectionStyle: string }>()`, no props interface needed.
- `SummaryPage.tsx` — no props. Type the `nextYearBudgets` state as `Record<string, number>`.
- `SetupPage.tsx` — no props. Type local state: `earners` as `Earner[]`, `sections` as `TemplateSection[]` (but items need a `budget` field that may be 0), `funds` as `TemplateFund[]`. Import `Template` type for `applyTemplate` parameter.
- `SettingsPage.tsx` — no props. Type `status` state as `{ type: "success" | "error"; msg: string } | null`.

- [ ] **Step 10: Full build check**

```bash
npx tsc -b && npm run build
```

Expected: PASS. Fix any remaining type errors. Common issues: implicit `any` on event handlers, missing null checks, `confirm()` needing `window.confirm()` for TS.

- [ ] **Step 11: Run dev server and verify**

```bash
npm run dev
```

Open http://localhost:5175/divvy-prototype/ — verify all pages load, grids work, modals open, clone/remove works.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: convert all components and pages to TypeScript with strict types"
```

---

## Workstream 2: State Management Cleanup

### Task 4: useLocalStorage Hook

**Files:**
- Create: `src/hooks/useLocalStorage.ts`
- Modify: `src/context/BudgetContext.tsx`

- [ ] **Step 1: Create `src/hooks/useLocalStorage.ts`**

Modeled on the retirement-planner pattern at `/Users/josh/Code/retirement-planner/src/hooks/useLocalStorage.ts`:

```ts
import { useState, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  const resetValue = useCallback(() => {
    setStoredValue(initialValue);
    localStorage.setItem(key, JSON.stringify(initialValue));
  }, [key, initialValue]);

  return [storedValue, setValue, resetValue];
}
```

- [ ] **Step 2: Refactor BudgetContext to use `useLocalStorage`**

Replace the manual `load()`/`save()`/`useState`/`persist` pattern in `BudgetContext.tsx`:

- Remove the standalone `load()` and `save()` functions.
- Replace `const [state, setState] = useState(() => load() || EMPTY_STATE)` with `const [state, setState, resetState] = useLocalStorage<BudgetState>(STORAGE_KEY, EMPTY_STATE)`.
- Remove the `persist` callback — `setState` from `useLocalStorage` already persists.
- Replace all `persist(newState)` calls with `setState(newState)`.
- The `update` callback changes: instead of `setState(prev => { const next = fn(prev); save(next); return next; })`, just use `setState(fn)` since `useLocalStorage.setValue` handles persistence.
- `resetData` becomes: `resetState()` (the third return value from `useLocalStorage`).

- [ ] **Step 3: Build and verify**

```bash
npx tsc -b && npm run build && npm run dev
```

Test: export data, import data, reset data, clone month, remove month. All should persist to localStorage as before.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLocalStorage.ts src/context/BudgetContext.tsx
git commit -m "refactor: extract useLocalStorage hook, simplify BudgetContext persistence"
```

---

### Task 5: Immer in BudgetContext

**Files:**
- Modify: `src/context/BudgetContext.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install Immer**

```bash
npm install immer
```

- [ ] **Step 2: Refactor `update` to use `produce`**

Import `produce` from `immer`. The `update` function currently takes `fn: (prev: BudgetState) => BudgetState`. With Immer, callers can mutate the draft directly.

Refactor the core update pattern:

```ts
import { produce } from "immer";

const update = useCallback((fn: (draft: BudgetState) => void) => {
  setState((prev) => produce(prev, fn));
}, [setState]);
```

- [ ] **Step 3: Refactor all mutation callbacks to use draft mutation**

Convert each callback from spread/map patterns to direct draft mutation. Key conversions:

**updateProfile:**
```ts
const updateProfile = useCallback((profile: Profile) => {
  update((draft) => { draft.profile = profile; });
}, [update]);
```

**setCurrentYear:**
```ts
const setCurrentYear = useCallback((year: number) => {
  update((draft) => { draft.currentYear = year; });
}, [update]);
```

**updateMonth:**
```ts
const updateMonth = useCallback((year: number, monthIndex: number, updater: ((m: Month) => Month) | Partial<Month>) => {
  update((draft) => {
    const yearData = draft.years[year];
    if (!yearData) return;
    const idx = yearData.months.findIndex((m) => m.month === monthIndex);
    if (idx === -1) return;
    if (typeof updater === "function") {
      yearData.months[idx] = updater(yearData.months[idx]);
    } else {
      Object.assign(yearData.months[idx], updater);
    }
  });
}, [update]);
```

**cloneMonth:** Convert the entire function body to draft mutation — no spread operators needed. Push `newMonth` directly onto `draft.years[nextYear].months`, sort in place.

**removeMonth:**
```ts
const removeMonth = useCallback((year: number, monthIndex: number) => {
  update((draft) => {
    const yearData = draft.years[year];
    if (!yearData) return;
    yearData.months = yearData.months.filter((m) => m.month !== monthIndex);
  });
}, [update]);
```

**Section/Item/Fund CRUD:** These all call `updateMonth` with a callback. The callbacks already return new month objects — they'll continue to work as-is since `updateMonth` handles the `typeof updater === "function"` case. No changes needed to these unless you want to simplify their inner logic too.

**completeSetup, importData:** These call `setState` directly (formerly `persist`). They pass complete new state objects — no Immer needed, just `setState(newState)`.

**resetData:** Uses `resetState()` from `useLocalStorage` — no change.

- [ ] **Step 4: Build and verify**

```bash
npx tsc -b && npm run build && npm run dev
```

Test all CRUD operations: add/edit/remove items, sections, funds. Clone month, remove month. Export and import. Reset. Everything should behave identically.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/context/BudgetContext.tsx
git commit -m "refactor: use Immer for immutable state updates in BudgetContext"
```

---

## Workstream 3: ESLint + Prettier

### Task 6: ESLint Setup

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json`

- [ ] **Step 1: Install ESLint dependencies**

```bash
npm install -D eslint @eslint/js globals typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

- [ ] **Step 2: Create `eslint.config.js`**

Model on retirement-planner at `/Users/josh/Code/retirement-planner/eslint.config.js`:

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
]);
```

Note: `package.json` currently has `"type": "commonjs"`. ESLint flat config uses ES modules. Either change `package.json` to `"type": "module"` or rename to `eslint.config.mjs`. Renaming to `.mjs` is simpler and avoids breaking anything.

- [ ] **Step 3: Add lint script to `package.json`**

```json
"lint": "eslint ."
```

- [ ] **Step 4: Run lint and fix issues**

```bash
npm run lint
```

Fix any errors. Common issues with strict TypeScript + ESLint: unused variables that need `_` prefix, missing return types (not required by our config), `any` usage in migration code.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.mjs package.json package-lock.json
git add -A  # any lint fixes
git commit -m "feat: add ESLint with TypeScript rules"
```

---

### Task 7: Prettier Setup

**Files:**
- Create: `.prettierrc`
- Modify: `package.json`

- [ ] **Step 1: Install Prettier**

```bash
npm install -D prettier
```

- [ ] **Step 2: Create `.prettierrc`**

```json
{
  "printWidth": 100
}
```

- [ ] **Step 3: Add format scripts to `package.json`**

```json
"format": "prettier --write src/",
"format:check": "prettier --check src/"
```

- [ ] **Step 4: Format the entire codebase**

```bash
npm run format
```

- [ ] **Step 5: Verify lint still passes**

```bash
npm run lint
```

- [ ] **Step 6: Build check**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Prettier, format codebase"
```

---

## Workstream 4: Tailwind CSS 4 + DaisyUI 5

### Task 8: Tailwind + DaisyUI Setup

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/index.css`
- Modify: `src/main.tsx` (CSS import)

This is the trickiest task — getting the tooling configured correctly with the right theme.

- [ ] **Step 1: Install Tailwind and DaisyUI**

```bash
npm install -D @tailwindcss/vite
npm install daisyui
```

Note: DaisyUI 5 is a runtime dependency, not devDependency (it provides CSS at build time via the `@plugin` directive).

- [ ] **Step 2: Update `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/divvy-prototype/",
  server: {
    port: 5175,
  },
});
```

- [ ] **Step 3: Create `src/index.css`**

DaisyUI 5 uses CSS-based config via `@plugin` directive (no tailwind.config.js):

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark;
}

/*
  Custom DaisyUI theme mapping Divvy's existing color palette.
  Reference: current :root variables in app.css
*/
@theme {
  --font-sans: "DM Sans", system-ui, sans-serif;
  --font-mono: "DM Mono", "Menlo", monospace;
}
```

Note: Exact DaisyUI 5 theme customization syntax may need adjustment. Check https://daisyui.com/docs/themes/ for the CSS-based customization API. The Divvy color palette (warm earth tones: `--bg: #f4f1ec`, `--accent: #b45309`, `--red: #b91c1c`, `--green: #15803d`) should be mapped to DaisyUI theme variables (`--p` for primary, `--er` for error, etc.) or applied as Tailwind custom colors. This may require reading DaisyUI v5 docs during implementation.

- [ ] **Step 4: Update `src/main.tsx` CSS import**

Change `import "./app.css"` to `import "./index.css"`.

Keep `app.css` for now — both CSS files will coexist during migration. Components will be migrated one at a time.

- [ ] **Step 5: Verify Tailwind is working**

```bash
npm run dev
```

Add a test class like `className="bg-primary text-white p-4"` to any element temporarily. Verify it applies Tailwind styles. Remove the test class.

- [ ] **Step 6: Verify DaisyUI is working**

Add a test DaisyUI class like `className="btn btn-primary"` to any button temporarily. Verify it renders as a styled DaisyUI button. Remove the test class.

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts src/index.css src/main.tsx package.json package-lock.json
git commit -m "feat: add Tailwind CSS 4 + DaisyUI 5 setup"
```

---

### Task 9: Migrate App Shell

**Files:**
- Modify: `src/App.tsx`

Reference the current CSS in `app.css` lines 41-150 (app shell, header, nav, sidebar styles) and replace with Tailwind utilities + DaisyUI classes.

- [ ] **Step 1: Migrate header**

Current classes: `.hdr`, `.hdr-left`, `.hdr-right`, `.logo`, `.nav`, `.nav-btn`, `.active`, `.yr-sel`, `.hdr-clone`, `.sb-toggle`

Replace with DaisyUI `navbar` + Tailwind utilities. Key mappings:
- `.hdr` → `navbar` with `bg-base-100 border-b border-base-300 shadow-sm sticky top-0 z-50`
- `.logo` → `btn btn-ghost text-xl font-bold` with accent color
- `.nav-btn` → `btn btn-ghost btn-sm` with conditional `btn-active`
- `.yr-sel` → `select select-bordered select-sm`
- `.hdr-clone` → `btn btn-primary btn-sm`
- `.sb-toggle` → `btn btn-ghost btn-sm`

- [ ] **Step 2: Migrate main layout**

Current: `.main`, `.content`, `.sidebar`, `.sb-open`

Replace with Tailwind flex layout:
- `.main` → `flex flex-1 overflow-hidden`
- `.content` → `flex-1 overflow-y-auto p-6`
- `.sidebar` → `w-80 border-l border-base-300 overflow-y-auto p-4 bg-base-100`

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Verify header renders correctly with nav, year selector, clone button, sidebar toggle.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: migrate App shell to Tailwind + DaisyUI"
```

---

### Task 10: Migrate Modal Component

**Files:**
- Create: `src/components/Modal.tsx`
- Modify: `src/components/RowModal.tsx`
- Modify: `src/components/ManageSectionsModal.tsx`

- [ ] **Step 1: Create shared `Modal.tsx`**

Extract the shared modal pattern using DaisyUI's `modal` component:

```tsx
import { useEffect, useRef } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, footer, children }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="modal modal-open"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="modal-box">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            ×
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="modal-action">{footer}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Refactor `RowModal.tsx` to use `Modal`**

Remove the backdrop/container/header/close JSX. Replace with:

```tsx
import Modal from "./Modal";

// In the render:
return (
  <Modal
    title={title}
    onClose={onClose}
    footer={
      <>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
      </>
    }
  >
    {/* field rendering stays the same, but with Tailwind classes */}
    {fields.map((f, i) => (
      <div className="form-control mb-3" key={f.key}>
        <label className="label"><span className="label-text">{label}</span></label>
        {/* inputs get className="input input-bordered w-full" */}
      </div>
    ))}
  </Modal>
);
```

Replace all `.rm-field`, `.rm-label`, `.rm-input`, `.rm-input-num`, `.rm-input-pct`, `.rm-row`, `.rm-pct-label` with DaisyUI form classes + Tailwind.

- [ ] **Step 3: Refactor `ManageSectionsModal.tsx` to use `Modal`**

Replace backdrop/container/header with `Modal`. The footer has the delete button (left-aligned) and Done button (right-aligned):

```tsx
<Modal
  title={monthLabel ? `${monthLabel} Settings` : "Month Settings"}
  onClose={onClose}
  footer={
    <div className="flex w-full justify-between">
      {onRemoveMonth && (
        <button className="btn btn-error" onClick={handleRemoveMonth}>
          Delete
        </button>
      )}
      <button className="btn btn-primary ml-auto" onClick={onClose}>
        Done
      </button>
    </div>
  }
>
  {/* Income and sections editing with DaisyUI form classes */}
</Modal>
```

Replace `.ms-group`, `.ms-earner-row`, `.ms-earner-name`, `.ms-rm`, `.ms-row`, `.ms-add-row`, `.ms-add-btn`, `.ms-danger` with Tailwind utilities + DaisyUI.

- [ ] **Step 4: Build and verify**

```bash
npm run build && npm run dev
```

Test: open RowModal (click ✎ edit on an item), open ManageSectionsModal (click ⚙ Settings). Both should render with DaisyUI modal styling. Test Delete button in settings modal.

- [ ] **Step 5: Commit**

```bash
git add src/components/Modal.tsx src/components/RowModal.tsx src/components/ManageSectionsModal.tsx
git commit -m "refactor: extract shared Modal component, migrate modals to DaisyUI"
```

---

### Task 11: Migrate MonthCard + EditableCell

**Files:**
- Modify: `src/components/MonthCard.tsx`
- Modify: `src/components/EditableCell.tsx`

These must be migrated together because `EditableCell` accepts `className` passthrough from parent components.

- [ ] **Step 1: Migrate `EditableCell.tsx`**

Current classes: `.ec`, `.ec-input`, `.ec-empty`, and passthrough `className` prop.

Replace with Tailwind:
- Display mode (`.ec`): `cursor-pointer hover:bg-base-200 px-1 rounded min-h-[1.5em] inline-block` + passthrough `className`
- Edit mode (`.ec-input`): `input input-bordered input-sm w-full` + passthrough `className`
- Empty placeholder (`.ec-empty`): `text-base-content/30`

The `className` prop continues to pass through — callers will provide Tailwind classes instead of old CSS classes.

- [ ] **Step 2: Migrate `MonthCard.tsx`**

Current classes: `.mc`, `.mc-hdr`, `.mc-title`, `.mc-chevron`, `.mc-totals`, `.mc-clone`, `.mc-income`, `.mc-income-left`, `.mc-gear`, `.mc-section`, `.mc-section--funds`, `.mc--variant-*`

Replace with DaisyUI `card` + Tailwind:
- `.mc` → `card bg-base-100 shadow-sm border border-base-300 mb-4`
- `.mc-hdr` → `card-title cursor-pointer flex justify-between items-center p-4` with hover effect
- `.mc-clone` → `btn btn-primary btn-xs`
- `.mc-income` → `flex justify-between items-center px-4 py-2 bg-base-200/50 border-b border-base-300`
- `.mc-gear` → `btn btn-ghost btn-xs`
- `.mc-section` → `p-4 border-b border-base-300 last:border-b-0`

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Verify month cards render with collapsible headers, income bar, section grids, and funds grid. Test collapse/expand.

- [ ] **Step 4: Commit**

```bash
git add src/components/MonthCard.tsx src/components/EditableCell.tsx
git commit -m "refactor: migrate MonthCard and EditableCell to Tailwind"
```

---

### Task 12: Migrate SectionGrid + FundsGrid

**Files:**
- Modify: `src/components/SectionGrid.tsx`
- Modify: `src/components/FundsGrid.tsx`

- [ ] **Step 1: Migrate `SectionGrid.tsx`**

Current classes: `.sg`, `.sg-hdr`, `.sg-title`, `.sg-add`, `.sg-tbl`, `.sg-th-pct`, `.sg-th-num`, `.sg-th-notes`, `.sg-th-x`, `.col-name`, `.col-narrow`, `.col-num`, `.col-x`, `.num`, `.muted`, `.sg-over`, `.sg-totals`, `.row-actions`, `.row-edit`, `.sg-rm`, `.sg-notes`

Replace with DaisyUI `table` + Tailwind:
- `.sg-tbl` → `table table-sm w-full`
- `.sg-hdr` → `flex justify-between items-center mb-2`
- `.sg-add` → `btn btn-ghost btn-xs`
- `.num` → `text-right font-mono`
- `.sg-over` row → `bg-error/10`
- `.row-edit` → `btn btn-ghost btn-xs`
- `.sg-rm` → `btn btn-ghost btn-xs text-error`
- Column widths: use Tailwind `w-` classes on `<th>` elements

Note: `EditableCell` className passthrough — change `className="sg-notes"` to appropriate Tailwind classes like `className="text-sm text-base-content/60"`.

- [ ] **Step 2: Migrate `FundsGrid.tsx`**

Same pattern as SectionGrid. Current classes: `.fg`, `.fg-hdr`, `.fg-title`, `.fg-add`, `.fg-tbl`, `.fg-th-name`, `.fg-th-num`, `.fg-th-notes`, `.fg-th-x`, `.fg-warn`, `.fg-below`, `.fg-min-cell`, `.fg-notes`, `.fg-rm`

Replace with DaisyUI `table` + Tailwind, matching SectionGrid patterns.

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Verify both grids render with correct column alignment, editable cells, totals row, add/edit/remove buttons.

- [ ] **Step 4: Commit**

```bash
git add src/components/SectionGrid.tsx src/components/FundsGrid.tsx
git commit -m "refactor: migrate SectionGrid and FundsGrid to DaisyUI table"
```

---

### Task 13: Migrate Pages

**Files:**
- Modify: `src/pages/TimelinePage.tsx`
- Modify: `src/pages/SummaryPage.tsx`
- Modify: `src/pages/SetupPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/components/YtdSidebar.tsx`

- [ ] **Step 1: Migrate `TimelinePage.tsx`**

Minimal — just `.tl` and `.tl-empty` classes. Replace with Tailwind spacing/typography.

- [ ] **Step 2: Migrate `SummaryPage.tsx`**

Current classes: `.sp`, `.sp-sub`, `.sp-tbl`, `.sp-section`, `.sp-totals`, `.num`, `.muted`, `.under`, `.over`

Replace with DaisyUI `table` + Tailwind. Same patterns as SectionGrid table migration.

- [ ] **Step 3: Migrate `SetupPage.tsx`**

Current classes: `.setup`, `.setup-steps`, `.setup-step`, `.active`, `.done`, `.setup-panel`, `.setup-templates`, `.setup-tpl-card`, `.setup-toggle`, `.setup-field`, `.setup-check`, `.setup-section-group`, `.setup-section-hdr`, `.setup-section-name`, `.setup-row`, `.setup-row-hdr`, `.hdr-num`, `.setup-pct-display`, `.setup-rm`, `.setup-add`, `.setup-hint`, `.setup-nav`, `.setup-back`, `.setup-next`, `.setup-finish`

This is the largest page. Key DaisyUI mappings:
- `.setup-steps` → DaisyUI `steps` component
- `.setup-step` → `step` with conditional `step-primary`
- `.setup-tpl-card` → `card bg-base-100 shadow-sm border hover:border-primary cursor-pointer`
- `.setup-toggle` → DaisyUI `btn-group` or `join`
- Form inputs → `input input-bordered`
- `.setup-rm` → `btn btn-ghost btn-xs text-error`
- `.setup-add` → `btn btn-ghost btn-sm`
- `.setup-nav` buttons → `btn`, `btn btn-primary`

- [ ] **Step 4: Migrate `SettingsPage.tsx`**

Current classes: `.settings`, `.settings-section`, `.settings-actions`, `.settings-btn`, `.settings-btn-danger`, `.settings-status`

Replace with Tailwind + DaisyUI:
- `.settings-btn` → `btn`
- `.settings-btn-danger` → `btn btn-error`
- `.settings-status` → DaisyUI `alert` with `alert-success` or `alert-error`

- [ ] **Step 5: Migrate `YtdSidebar.tsx`**

Current classes: `.ys`, `.ys-title`, `.ys-sub`, `.ys-section`, `.ys-row`, `.ys-name`, `.ys-vals`, `.ys-total`, `.ys-over`, `.ys-warn`, `.ys-ok`, `.ys-empty`

Replace with Tailwind utilities — no DaisyUI components needed for this simple list layout.

- [ ] **Step 6: Build and verify all pages**

```bash
npm run build && npm run dev
```

Test every page:
- Timeline: month cards render, collapse/expand, clone, remove
- Summary: table renders with all columns
- Setup: wizard steps work, template selection, form inputs
- Settings: export, import, reset, template load
- YTD Sidebar: toggle open/close, data displays

- [ ] **Step 7: Commit**

```bash
git add src/pages/ src/components/YtdSidebar.tsx
git commit -m "refactor: migrate all pages and YtdSidebar to Tailwind + DaisyUI"
```

---

### Task 14: Delete app.css & Cleanup

**Files:**
- Delete: `src/app.css`
- Modify: `src/main.tsx` (verify CSS import is `./index.css`)

- [ ] **Step 1: Search for any remaining references to old CSS classes**

```bash
grep -r "className.*\.\(mc\|sg\|fg\|rm\|ec\|ys\|sp\|hdr\|nav\|setup\|settings\)" src/ --include="*.tsx"
```

If any old class names remain, migrate them to Tailwind.

- [ ] **Step 2: Delete `app.css`**

```bash
git rm src/app.css
```

- [ ] **Step 3: Verify `main.tsx` imports `./index.css`**

Should already be done in Task 8. Confirm no reference to `app.css` remains anywhere.

- [ ] **Step 4: Full build and visual verification**

```bash
npm run build && npm run dev
```

Walk through every page and interaction. Compare visual appearance with the pre-migration app. Verify:
- [ ] Header: logo, nav buttons, year selector, clone button, sidebar toggle, settings link
- [ ] Timeline: month cards collapse/expand, totals display, income bar
- [ ] Month card: section grids with all columns, editable cells, add/edit/remove
- [ ] Funds grid: all columns, min balance warning
- [ ] Modals: RowModal (add/edit items and funds), ManageSectionsModal (settings, delete month)
- [ ] Summary: table with all columns, editable next-year budget
- [ ] Setup wizard: all 4 steps, template picker, form validation
- [ ] Settings: export, import, reset, template buttons
- [ ] YTD Sidebar: open/close, section summaries, fund balances

- [ ] **Step 5: Run lint and format**

```bash
npm run lint && npm run format:check
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: delete app.css, complete Tailwind migration"
```

---

## Workstream 5: Documentation

### Task 15: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md**

Key sections to update:

**Dev commands** — add:
```
- `npm run lint` — run ESLint
- `npm run format` — format with Prettier
- `npm run format:check` — check formatting
```
Update build command note: `npm run build` now runs `tsc -b && vite build`.

**Tech stack** — update to:
```
- React 19, Vite 6, react-router-dom v7 (HashRouter)
- TypeScript (strict mode)
- Tailwind CSS 4 + DaisyUI 5 for styling
- Immer for immutable state updates
- ESLint + Prettier for code quality
- Deployed to GitHub Pages
```

**Project structure** — update file extensions, add new files, remove stale references:
```
src/
  App.tsx              — App shell with header, nav, sidebar
  main.tsx             — Entry point, routing, providers
  index.css            — Tailwind imports, DaisyUI theme config
  data.ts              — Data model, factories, templates
  types/
    index.ts           — All TypeScript interfaces (domain, context, templates)
  components/
    EditableCell.tsx   — Click-to-edit inline cell
    Modal.tsx          — Shared modal wrapper (DaisyUI modal)
    SectionGrid.tsx    — Budget section table with earner columns
    FundsGrid.tsx      — Fund balance tracking table
    MonthCard.tsx      — Composes grids into single month view
    RowModal.tsx       — Add/edit item or fund modal form
    ManageSectionsModal.tsx — Month settings modal
    YtdSidebar.tsx     — Year-to-date summary sidebar
  context/
    BudgetContext.tsx   — Central state with Immer, useLocalStorage persistence
  hooks/
    useLocalStorage.ts — Generic typed localStorage hook
  pages/
    TimelinePage.tsx   — Continuous month card scroll
    SummaryPage.tsx    — Year summary with next-year planning
    SetupPage.tsx      — First-time setup wizard
    SettingsPage.tsx   — Export, import, reset, templates
  shared/
    helpers.ts         — Formatters, math utils
```

**Coding conventions** — update to:
```
- TypeScript strict mode — all types in src/types/index.ts
- Props interfaces for all components
- Tailwind utility classes + DaisyUI component classes for all styling
- No custom CSS files — all styles inline via className
- DaisyUI components: btn, modal, table, card, navbar, input, select, steps, alert
- Immer produce() for state mutations in BudgetContext
- Default exports for components; named exports for types/hooks/helpers
```

**Styling** — replace current section with:
```
- Tailwind CSS 4 + DaisyUI 5 (configured in src/index.css via @plugin)
- Google Fonts: DM Sans (body), DM Mono (grid numbers) — loaded in index.html
- Desktop-first, data-dense design
- DaisyUI theme with custom Divvy color palette
```

Fix stale references: remove mentions of `BillsGrid`, `AllocationsGrid`, `app.css`. Fix `completeSetup` signature to `(profile, sections, funds)`.

**Data persistence** — update `useBudget()` hook description to mention `useLocalStorage` and Immer.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for TypeScript + Tailwind stack"
```

---

### Task 16: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README.md**

Check what exists currently and update accordingly.

- [ ] **Step 2: Update README.md**

Ensure it includes:
- **Description**: Divvy — monthly budget allocation web app
- **Tech stack**: React 19, TypeScript, Vite, Tailwind CSS 4, DaisyUI 5, Immer
- **Getting started**: `npm install`, `npm run dev`
- **Scripts**: dev, build, lint, format, format:check, preview
- **Project structure**: Brief overview matching CLAUDE.md
- **Deployment**: GitHub Pages via HashRouter

Keep it concise — this is a personal project, not an open-source README.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README for production stack"
```

---

## Final Verification

After all tasks are complete:

```bash
npm run lint && npm run format:check && npm run build
```

Then `npm run dev` and manually test:
- [ ] Clone a month → new month appears
- [ ] Remove a month via settings modal → confirm dialog → month gone
- [ ] Add/edit/remove items in SectionGrid
- [ ] Add/edit/remove funds in FundsGrid
- [ ] Add/rename/remove sections via ManageSectionsModal
- [ ] Export data → valid JSON file downloads
- [ ] Import data → state loads correctly
- [ ] Reset → redirects to setup wizard
- [ ] Setup wizard → both templates work, blank start works
- [ ] Summary page → table renders, next-year budget editable
- [ ] YTD sidebar → toggle open/close, data correct
- [ ] Year selector → switches between years
