# Divvy

A monthly budget allocation web app prototype for tracking bills, percentage-based allocations, and fund balances.

Hosted at: [https://smithgotsurf.github.io/divvy-prototype/](https://smithgotsurf.github.io/divvy-prototype/)

✨Vibe✨ coded with Claude

## Tech

- React 19
- react-router-dom v7 (HashRouter)
- Vite

## Project Structure

```
src/
├── main.jsx              # HashRouter + route definitions
├── App.jsx               # Layout shell (header, nav, sidebar)
├── app.css               # All styles (CSS variables, data-dense grids)
├── data.js               # Data model, factories, sample templates
├── context/
│   └── BudgetContext.jsx  # Budget state, localStorage persistence, CRUD
├── components/
│   ├── EditableCell.jsx   # Click-to-edit inline cell
│   ├── BillsGrid.jsx     # Bills table with earner columns
│   ├── AllocationsGrid.jsx # Percentage allocations with YTD
│   ├── FundsGrid.jsx     # Fund balance tracking
│   ├── MonthCard.jsx     # Collapsible month view
│   └── YtdSidebar.jsx    # Year-to-date summary
├── pages/
│   ├── TimelinePage.jsx   # Month card timeline
│   ├── SummaryPage.jsx    # Year-end summary
│   ├── SetupPage.jsx      # First-time setup wizard
│   └── SettingsPage.jsx   # Export, import, reset
└── shared/
    └── helpers.js         # Formatters, math utils
```

## Dev

```bash
npm run dev   # starts on port 5175
```
