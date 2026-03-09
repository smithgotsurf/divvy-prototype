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

```
src/
  App.jsx              — App shell with header, nav, sidebar
  main.jsx             — Entry point, routing, providers
  app.css              — All styles (CSS variables, data-dense grids)
  data.js              — Data model, factories, seed data
  components/
    EditableCell.jsx   — Click-to-edit inline cell (text/number)
    BillsGrid.jsx      — Editable bills table with subtotals
    AllocationsGrid.jsx — Percentage allocations with YTD
    FundsGrid.jsx      — Fund balance tracking (open/in/out/close)
    MonthCard.jsx      — Composes grids into single month view
    YtdSidebar.jsx     — Year-to-date summary sidebar
  context/
    BudgetContext.jsx  — Central state, localStorage persistence, CRUD
  pages/
    TimelinePage.jsx   — Continuous month card scroll
    SummaryPage.jsx    — Year summary with next-year planning
    SetupPage.jsx      — First-time setup wizard
  shared/
    helpers.js         — Formatters (fmt, fmtPct), math utils
```

## Routing

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | TimelinePage | Continuous month card timeline |
| `/summary` | SummaryPage | Year summary and next-year planning |
| `/setup` | SetupPage | First-time setup wizard |

## Data persistence

All data stored in localStorage under key `divvy-budget`. BudgetContext handles load/save.

`useBudget()` hook provides:
- `state`, `profile`, `currentYear`, `setupComplete`
- `setCurrentYear(year)`, `updateProfile(profile)`
- `getMonths(year)`, `getMonth(year, month)`, `updateMonth(year, monthIndex, updater)`
- `cloneMonth(year, fromMonthIndex)` — creates next month from previous
- `addBill/updateBill/removeBill(year, monthIndex, ...)`
- `addAllocation/updateAllocation/removeAllocation(year, monthIndex, ...)`
- `addFund/updateFund/removeFund(year, monthIndex, ...)`
- `completeSetup(profile, bills, allocations, funds)`, `resetData()`

## Coding conventions

- Short CSS class names and inline styles for one-off styling
- CSS variables for theme colors (see `:root` in app.css)
- Compact JSX — keep components concise
- Shared utilities in `shared/helpers.js`
- Default exports for all components; named exports for data/helpers

## Styling

- CSS variables for theme (see `:root` in app.css)
- Google Fonts: DM Sans (body), DM Mono (grid numbers)
- Desktop-first, data-dense design
