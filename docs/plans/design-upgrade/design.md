# Divvy Production Upgrade — Design Spec

**Date:** 2026-03-22
**Goal:** Move Divvy from prototype-grade JavaScript/CSS to a maintainable TypeScript + Tailwind codebase without changing functionality.

## Motivation

The app works well but the codebase has prototype-era friction: no type safety, 1,300 lines of flat global CSS with abbreviated class names, manual nested spread chains for state updates, and no linting. This upgrade aligns Divvy with the patterns Josh uses in retirement-planner and bbx-frontend.

## Tech Decisions

| Area | Current | Target |
|------|---------|--------|
| Language | JavaScript (JSX) | TypeScript strict mode (TSX) |
| Styling | 1,300-line `app.css` with flat classes | Tailwind CSS 4 + DaisyUI |
| Linting | None | ESLint (typescript-eslint) + Prettier |
| State mutations | Manual spread/map chains | Immer for nested updates |
| Persistence hook | Inline in BudgetContext | Extracted `useLocalStorage<T>` |

## What Does NOT Change

- React 19, Vite, react-router-dom v7
- localStorage persistence model (key: `divvy-budget`)
- Component structure: pages/, components/, context/, shared/
- GitHub Pages deployment with HashRouter
- No test framework (can add later)
- No authentication, no backend
- Native `confirm()` dialogs (see "Deferred: ConfirmDialog Component" below)

---

## Workstream 1: TypeScript Migration

### File renames
All `.jsx` → `.tsx`, `data.js` → `data.ts`, `helpers.js` → `helpers.ts`

### Type definitions (`src/types/index.ts`)
Core domain types extracted from current `data.js` shapes:

```ts
interface Earner { name: string; income: number }

interface Item {
  id: string; name: string; budget: number; actual: number;
  earner1: number; earner2: number; notes: string;
}

interface Section { id: string; name: string; items: Item[] }

interface Fund {
  id: string; name: string; opening: number;
  transfersIn: number; transfersOut: number; minBal: number; notes: string;
}

interface Month {
  id: string; year: number; month: number;
  earners: Earner[]; sections: Section[]; funds: Fund[];
}

interface YearData { months: Month[] }

interface Profile { earners: Earner[]; useSplit: boolean }

interface BudgetState {
  profile: Profile;
  years: Record<number, YearData>;
  currentYear: number;
  setupComplete: boolean;
}
```

Additional types needed:
- **`BudgetContextValue`** — typed interface for everything `useBudget()` returns (all 23+ fields)
- **`Template`** — setup wizard template shape (differs from `Month`: items lack `id`/`earner1`/`earner2`/`actual`, templates have `label`/`description`/`earnerCount`/`useSplit`)
- **`LegacyMonth`** — for the `importData` migration path (old `bills + allocations` format), used with runtime validation before converting to current `Month` shape
- **`ItemDraft`** — extends `Item` with `_pct: number` for `RowModal`'s local editing state (not persisted)

### Component props
Each component gets an explicit props interface. Key components:
- `MonthCard` — `monthData: Month`, callbacks, display options
- `SectionGrid` — `year`, `monthIndex`, `section: Section`, `earners: Earner[]`
- `FundsGrid` — `year`, `monthIndex`, `funds: Fund[]`
- `EditableCell` — `value`, `onChange`, `type`, `formatter`, `className` passthrough
- `RowModal` — `section: Section`, field definitions, callbacks
- `ManageSectionsModal` — `sections`, `earners`, callbacks including `onRemoveMonth`

### Config
- `tsconfig.json` with `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Build script: `"build": "tsc -b && vite build"`

### Notes
- `SetupPage` renders outside the `App` layout shell (sibling route in `main.tsx`) — has its own top-level layout that needs independent typing
- Earners are identified by array index (no `id` field) — positional coupling via `earner1`/`earner2` on items. Accept this for now, note as future improvement.

---

## Workstream 2: Immer + useLocalStorage

Doing this before Tailwind so the biggest file-touching workstream (WS3) works with clean state code.

### Extract `useLocalStorage<T>` hook (`src/hooks/useLocalStorage.ts`)
Reusable typed hook (matching retirement-planner pattern):
```ts
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void]
```

### Add Immer to BudgetContext
Replace manual spread/map chains with `produce()`:
```ts
// Before (error-prone)
updateMonth(year, monthIndex, (m) => ({
  ...m,
  sections: m.sections.map(s =>
    s.id === sectionId ? { ...s, items: s.items.filter(item => item.id !== itemId) } : s
  ),
}));

// After (with Immer)
updateMonth(year, monthIndex, (draft) => {
  const section = draft.sections.find(s => s.id === sectionId);
  if (section) section.items = section.items.filter(item => item.id !== itemId);
});
```

---

## Workstream 3: ESLint + Prettier

Run this before the Tailwind rewrite so formatting is consistent during the largest change.

### ESLint
- Flat config (`eslint.config.js`)
- `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Matching retirement-planner's rule set

### Prettier
- Minimal `.prettierrc` (defaults, maybe `printWidth: 100`)
- Add `"lint"` and `"format"` scripts to package.json

### No pre-commit hooks for now
Can add Husky + lint-staged later if desired.

---

## Workstream 4: Tailwind CSS 4 + DaisyUI

### Setup
- Install `@tailwindcss/vite` plugin + `daisyui` (verify DaisyUI v5 compatibility with Tailwind 4 — v5 uses CSS-based config, not `tailwind.config.js`)
- Update `vite.config.ts` to add the Tailwind plugin
- Minimal `src/index.css`: `@import "tailwindcss"` + DaisyUI theme config + Google Fonts imports
- Verify where fonts are currently loaded (CSS `@import` vs `<link>` in `index.html`) and preserve

### Migration strategy
- Delete `app.css` entirely
- Replace all class-based styling with Tailwind utility classes + DaisyUI component classes inline in TSX
- One component at a time, verifying visual parity
- Components that accept `className` props (e.g., `EditableCell`) must be migrated together with their parent components to avoid class mismatches

### DaisyUI component mapping

| Current pattern | DaisyUI replacement |
|----------------|---------------------|
| `.mc` (month card wrapper) | `card` |
| `.mc-hdr` (collapsible header) | Custom with Tailwind (DaisyUI `collapse` may be too opinionated) |
| Modal backdrop + `.rm` | `modal` |
| Buttons (`.mc-clone`, `.ms-add-btn`, `.ms-danger`) | `btn`, `btn-primary`, `btn-error` |
| Tables (`.sg-tbl`, funds grid) | `table` |
| Form inputs | `input`, `select` |
| Navigation tabs | `tabs` / `tab` |
| Header bar | `navbar` |
| `EditableCell` | Tailwind utilities only (custom interaction, not a DaisyUI pattern) |
| `YtdSidebar` | Tailwind utilities (simple conditional aside, DaisyUI `drawer` is overkill) |

### New shared component: `<Modal>`
Both `RowModal` and `ManageSectionsModal` duplicate the same structure: backdrop overlay, centered container, header (title + close button), scrollable body, footer with action buttons. Currently this is repeated via shared CSS classes (`.rm-backdrop`, `.rm`, `.rm-hdr`, `.rm-body`, `.rm-footer`, `.rm-close`).

Extract a reusable `<Modal>` component (`src/components/Modal.tsx`) built on DaisyUI's `modal` classes:
```tsx
interface ModalProps {
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```
- Handles backdrop click-to-close and Escape key
- `RowModal` and `ManageSectionsModal` become consumers that provide title, body content, and footer actions
- Eliminates the duplicated modal boilerplate

### Theme
Define a custom DaisyUI theme with Divvy's existing color palette:
- Primary: current `--accent` blue
- Error: current `--red`
- Success: current `--green`
- Base colors: current background/surface/text colors
- Fonts: DM Sans (sans), DM Mono (mono)

---

## Workstream 5: Documentation Updates

### CLAUDE.md
Update to reflect:
- TypeScript strict mode conventions (types in `src/types/index.ts`, prop interface pattern)
- Tailwind + DaisyUI styling approach (no custom CSS files, which DaisyUI components to prefer)
- ESLint + Prettier setup and scripts
- Immer usage pattern for state mutations in BudgetContext
- Updated file extensions (.tsx/.ts)
- Updated project structure (remove stale references to `BillsGrid`/`AllocationsGrid`, fix `completeSetup` signature)
- New files: `src/types/index.ts`, `src/hooks/useLocalStorage.ts`

### README.md
Update to reflect:
- Updated tech stack description
- Updated project structure
- Dev commands (lint, format, type-check)
- Brief description of architecture decisions

---

## Execution Order

Revised order to minimize file revisits:

1. **TypeScript** — foundational, everything else assumes .tsx files
2. **Immer + useLocalStorage** — clean up state before the big CSS migration
3. **ESLint + Prettier** — enforce formatting before the largest change
4. **Tailwind + DaisyUI** — the biggest workstream, done on a clean typed+linted codebase
5. **Documentation** — reflects the final state

---

## Verification

After each workstream:
- `npm run build` passes (includes `tsc -b` after WS1)
- `npm run dev` — app loads, all pages work, visual parity with current design
- After WS3: `npm run lint` passes clean

Final check:
- Clone a month, remove it, verify confirm dialogs
- Export/import data round-trip (including legacy format migration)
- Setup wizard flow (both templates)
- All grids editable, modals functional
- Year selector, sidebar toggle, navigation all work

---

## Deferred: ConfirmDialog Component

**Status:** Discussed 2026-03-22, punted to a future session.

**Current state:** The app uses native `confirm()` in 6+ places for destructive actions: removing items (SectionGrid line 79), removing funds (FundsGrid line 76), deleting sections (ManageSectionsModal line 60), deleting months (ManageSectionsModal line 84), resetting data (SettingsPage line 38), loading templates (SettingsPage line 44), and removing sections/items in the setup wizard (SetupPage lines 176, 192).

**Why defer:** Native `confirm()` is synchronous and one line of code. It works. A DaisyUI-styled replacement requires component state management (open/close), an async callback pattern, and more JSX at each call site. Not worth the complexity during the initial upgrade.

**When to revisit:** Once the Tailwind + DaisyUI migration is complete. The native dialogs will look visually inconsistent with the rest of the styled UI, which is the natural trigger.

**Proposed approach:** Build a reusable `<ConfirmDialog>` component (or hook like `useConfirm()`) that:
- Uses DaisyUI's `modal` component for consistent styling
- Accepts `title`, `message`, `confirmLabel`, `variant` (e.g., `"error"` for destructive actions)
- Returns a promise or takes an `onConfirm` callback
- A hook pattern (`const confirm = useConfirm()`) would keep call sites clean — something like `await confirm("Delete April 2026?")` instead of managing modal state at every call site
- Should be built on top of the shared `<Modal>` component from WS4
