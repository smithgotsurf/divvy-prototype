# Divvy

Divvy — monthly budget allocation web app. React SPA deployed to GitHub Pages.

## Dev commands

- `npm run dev` — start Vite dev server (port 5175)
- `npm run build` — TypeScript check + production build (`tsc -b && vite build`)
- `npm run lint` — run ESLint
- `npm run format` — format with Prettier
- `npm run format:check` — check formatting

## Tech stack

- React 19, Vite 6, react-router-dom v7 (HashRouter)
- TypeScript (strict mode)
- Tailwind CSS 4 + DaisyUI 5 for styling
- Immer for immutable state updates
- ESLint (typescript-eslint) + Prettier for code quality
- Deployed to GitHub Pages; HashRouter + `base: '/divvy-prototype/'` in vite.config.ts

## Project structure

```
src/
  App.tsx              — App shell with navbar, nav, sidebar
  main.tsx             — Entry point, routing, providers
  index.css            — Tailwind imports, DaisyUI theme config
  data.ts              — Data model, factories, templates (EMPTY_STATE, TEMPLATE_DUAL, TEMPLATE_SINGLE)
  types/
    index.ts           — All TypeScript interfaces (domain, context, templates)
  components/
    EditableCell.tsx   — Click-to-edit inline cell (text/number)
    Modal.tsx          — Shared DaisyUI modal wrapper (backdrop, title, footer)
    SectionGrid.tsx    — Budget section table with earner columns and subtotals
    FundsGrid.tsx      — Fund balance tracking (open/in/out/close) with min and notes
    MonthCard.tsx      — Composes grids into single month view (collapsible)
    RowModal.tsx       — Add/edit item or fund modal form
    ManageSectionsModal.tsx — Month settings (income, sections, delete month)
    YtdSidebar.tsx     — Year-to-date summary sidebar
  context/
    BudgetContext.tsx  — Central state with Immer, useLocalStorage persistence, CRUD
  hooks/
    useLocalStorage.ts — Generic typed localStorage hook
  pages/
    TimelinePage.tsx   — Continuous month card scroll (newest first)
    SummaryPage.tsx    — Year summary with next-year planning
    SetupPage.tsx      — First-time setup wizard with template picker
    SettingsPage.tsx   — Export, import, reset, sample templates
  shared/
    helpers.ts         — Formatters (fmt, fmtPct), math utils
```

## Routing

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | TimelinePage | Continuous month card timeline |
| `/summary` | SummaryPage | Year summary and next-year planning |
| `/setup` | SetupPage | First-time setup wizard with template picker |
| `/settings` | SettingsPage | Export/import data, reset, load sample templates |

## Data persistence

All data stored in localStorage under key `divvy-budget`. BudgetContext uses `useLocalStorage` hook for persistence and Immer `produce()` for state mutations.

`useBudget()` hook provides:
- `state`, `profile`, `currentYear`, `setupComplete`
- `setCurrentYear(year)`, `updateProfile(profile)`
- `getMonths(year)`, `getMonth(year, month)`, `updateMonth(year, monthIndex, updater)`
- `cloneMonth(year, fromMonthIndex)` — creates next month from previous
- `removeMonth(year, monthIndex)` — deletes a month
- `addSection/renameSection/removeSection(year, monthIndex, ...)`
- `addItem/updateItem/removeItem(year, monthIndex, sectionId, ...)`
- `addFund/updateFund/removeFund(year, monthIndex, ...)`
- `completeSetup(profile, sections, funds)`, `resetData()`
- `exportData()` — returns state as JSON string
- `importData(jsonString)` — validates, migrates legacy format, loads into state

## Coding conventions

- TypeScript strict mode — all types in `src/types/index.ts`
- Props interfaces for all components (defined in each component file)
- Tailwind utility classes + DaisyUI component classes for all styling
- No custom CSS files — all styles inline via className
- DaisyUI components used: btn, modal, table, card, navbar, input, select, steps, alert, join
- Immer `produce()` for state mutations in BudgetContext
- Default exports for components; named exports for types/hooks/helpers

## Styling

- Tailwind CSS 4 + DaisyUI 5 (configured in `src/index.css` via `@plugin`)
- Custom "divvy" theme with warm earth tone palette (oklch colors)
- Google Fonts: DM Sans (body), DM Mono (grid numbers) — loaded in `index.html`
- Desktop-first, data-dense design
