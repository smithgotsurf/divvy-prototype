# Divvy

A monthly budget allocation web app for tracking sections, earner splits, and fund balances.

Hosted at: [https://smithgotsurf.github.io/divvy-prototype/](https://smithgotsurf.github.io/divvy-prototype/)

## Tech

- React 19, TypeScript (strict mode)
- Tailwind CSS 4 + DaisyUI 5
- Vite 6, react-router-dom v7 (HashRouter)
- Immer for state management
- ESLint + Prettier

## Project Structure

```
src/
├── main.tsx              # HashRouter + route definitions
├── App.tsx               # Layout shell (navbar, nav, sidebar)
├── index.css             # Tailwind imports, DaisyUI theme
├── data.ts               # Data model, factories, templates
├── types/
│   └── index.ts          # All TypeScript interfaces
├── context/
│   └── BudgetContext.tsx  # Budget state, Immer, useLocalStorage, CRUD
├── hooks/
│   └── useLocalStorage.ts # Generic typed localStorage hook
├── components/
│   ├── EditableCell.tsx   # Click-to-edit inline cell
│   ├── Modal.tsx          # Shared DaisyUI modal wrapper
│   ├── SectionGrid.tsx    # Budget section table with earner columns
│   ├── FundsGrid.tsx      # Fund balance tracking
│   ├── MonthCard.tsx      # Collapsible month view
│   ├── RowModal.tsx       # Add/edit item or fund form
│   ├── ManageSectionsModal.tsx # Month settings
│   └── YtdSidebar.tsx     # Year-to-date summary
├── pages/
│   ├── TimelinePage.tsx   # Month card timeline
│   ├── SummaryPage.tsx    # Year-end summary
│   ├── SetupPage.tsx      # First-time setup wizard
│   └── SettingsPage.tsx   # Export, import, reset
└── shared/
    └── helpers.ts         # Formatters, math utils
```

## Dev

```bash
npm run dev          # starts on port 5175
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run format       # Prettier
```
