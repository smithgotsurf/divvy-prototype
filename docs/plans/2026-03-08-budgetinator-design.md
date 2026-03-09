# Divvy — Design Document

## Overview

A single-page application (SPA) that turns a proven Google Sheets budgeting system into a shareable, standalone tool. The core philosophy: **opinionated budget allocation** — separating fixed bills from percentage-based allocations (grocery, charity, savings), with built-in fund balance tracking.

The target audience is households (single or dual-income) who want a lightweight, structured way to allocate monthly income to bills and savings goals.

## Origin

Built from 4+ years of a real Google Sheets budget system. The sheets work well but can't be shared as a product. The SPA preserves the density and workflow while adding automatic YTD tracking and trend visualization that would be manual effort in a spreadsheet.

## Core Concepts

### Income Model
- 1-2 earners, each with a name and monthly income
- Optional proportional split calculated from incomes (e.g., 70/30)
- Split pre-fills per-earner amounts on line items, but each is independently editable
- Overrides persist through month cloning (e.g., spouse always pays $27 for life insurance regardless of split ratio)

### Budget Structure (3 sections)

**1. Bills** — Fixed recurring obligations
- Line items: name, budgeted amount, earner 1 share, earner 2 share, actual, notes
- Autopay flag per item
- Typically covered by first paycheck of the month
- Examples: Mortgage, Escrow, T-Mobile, Duke Energy, Car Insurance

**2. Percentage Allocations** — Income-based targets
- Each has a name, percentage, and calculated dollar amount
- Percentages are user-defined (e.g., Grocery 13%, Charity 10%, Savings 5%)
- Some may be "fixed" (charity at 10% is non-negotiable for some users)
- Actual always matches budget (these are transfers, not variable bills)
- Typically covered by second paycheck

**3. Fund Tracking** — Account balance visibility
- Funds: name, opening balance, minimum balance threshold
- Monthly tracking: opening balance, transfers in/out, closing balance
- Examples: Joint Savings, Rainy Day Fund, Personal Savings (per earner)
- Closing balance carries forward to next month's opening balance

### Monthly Workflow
1. Clone previous month (budget values + fund balances carry forward)
2. Adjust any budget amounts for the new month
3. Fill in actuals as bills are scheduled/paid throughout the month
4. Fund balances update as transfers are recorded

### Year Planning
- Summary view aggregates all 12 months: annual budget, annual actual, delta
- Includes "next year estimate" and "next year budget" columns
- Primary use: end-of-year review and next-year planning
- New year creation prompts review of prior year summary to set new budgets

## UI Design

### Layout: Continuous Timeline with YTD Sidebar

**Main area** — vertical scroll of month cards, current month centered
- Scroll up for past months, down for future (as created)
- Each month card is compact and data-dense

**Right sidebar (collapsible)** — live YTD dashboard
- YTD budget vs actual per line item
- Section totals (bills, grocery, charity, savings)
- Fund balance trends (sparklines)
- Projected year-end (extrapolate current pace to 12 months)
- Over/under indicators (red/amber/green)
- Zero manual effort — computed automatically from entered monthly data

**Top nav / header**
- Year selector
- Toggle to year summary view
- Settings (earners, template management)

### Month Card Structure

```
[ Month/Year ]  [ Total Budget: $X,XXX | Actual: $X,XXX | Delta: +/- $XXX ]

Income: Josh $10,600 | Jacklyn $0                    Split: 100% / 0%

BILLS
Item            | Budget | Josh    | Jacklyn | Actual  | Notes
Mortgage        | 2,050  | 2,050   | 0       | 2,050   | recurring 1st
Equity Line     | 1,500  | 1,500   | 0       | 1,500   | due 22nd
Duke Energy     | 325    | 325     | 0       | 538     | scheduled 20th
...
Subtotal        | 5,160  |         |         | 5,275   |

ALLOCATIONS
Grocery   (13%) | 1,380  |         |         | 1,380   |
Charity   (10%) | 1,060  |         |         | 1,060   | YTD: $2,120
Savings    (5%) | 530    |         |         | 530     | YTD: $652

FUNDS
Fund            | Opening | In    | Out   | Closing | Min
Rainy Day       | 5,608   | 171   | 0     | 5,779   | $25
Josh Savings    | 20,332  | 0     | 0     | 20,332  | $250
Jack Savings    | 18,847  | 0     | 315   | 18,532  | $250
```

### Key Interactions
- **Inline cell editing** — click to edit, tab/enter to advance, escape to cancel
- **Clone month** — button on latest month to create next month
- **Add/remove line items** — per section, subtle inline controls
- **New year** — creates January from December, shows prior year summary for planning
- **First-time setup** — guided flow: earners, income, bill items, percentage allocations, funds

### Year Summary View
- Toggled from main nav, replaces timeline temporarily
- Grid: rows = line items, columns = Annual Budget | Annual Actual | Delta | Next Year Est | Next Year Budget
- Computed from the 12 monthly records
- Next Year Budget column is editable for planning

## Tech Stack

Consistent with existing prototypes (maa-prototype, tcc-prototype):

- **Vite 6** — build tool
- **React 19** — UI framework (no TypeScript)
- **React Router DOM v7** — HashRouter for GitHub Pages compatibility
- **Plain CSS** — CSS variables for theming, short class names, data-dense styling
- **localStorage** — persistence with load/save helpers and a storage key constant
- **Context API** — centralized state management with custom hooks

### Project Structure (planned)
```
src/
  main.jsx              — entry point, router setup
  App.jsx               — layout shell, sidebar toggle
  app.css               — global styles, CSS variables, theme
  data.js               — seed data, storage key, defaults
  context/
    BudgetContext.jsx    — state management, localStorage persistence
  pages/
    TimelinePage.jsx     — continuous month card scroll
    SummaryPage.jsx      — year summary grid
    SetupPage.jsx        — first-time setup wizard
  components/
    MonthCard.jsx        — single month's budget grid
    BillsGrid.jsx        — editable bills table
    AllocationsGrid.jsx  — percentage-based allocations
    FundsGrid.jsx        — fund balance tracking
    YtdSidebar.jsx       — collapsible YTD dashboard
    EditableCell.jsx     — inline edit component
  shared/
    helpers.js           — formatting, calculations, date utils
```

## Not In Scope (Prototype)

- Cloud sync / user accounts
- Bank/Quicken import
- Mobile-optimized layout (desktop-first)
- Data migration from existing sheets (manual entry or separate script)
- Multi-year data in a single view (one year at a time)
