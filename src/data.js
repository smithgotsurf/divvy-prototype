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
export const makeAllocation = (name = "", pct = 0, fixed = false, earner1 = 0, earner2 = 0) => ({
  id: crypto.randomUUID(),
  name, pct, fixed,
  actual: 0,
  earner1, earner2,
});

// Factory: create a blank fund
export const makeFund = (name = "", opening = 0, minBal = 0, notes = "") => ({
  id: crypto.randomUUID(),
  name, opening, transfersIn: 0, transfersOut: 0, minBal, notes,
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

// Empty state — fresh start, redirects to setup
export const EMPTY_STATE = {
  profile: { earners: [], useSplit: false },
  years: {},
  currentYear: new Date().getFullYear(),
  setupComplete: false,
};

// Templates for setup wizard prefill
export const TEMPLATE_DUAL = {
  label: "Dual income household",
  description: "Two earners splitting bills proportionally",
  earnerCount: 2,
  useSplit: true,
  earners: [
    { name: "Jack", income: 6500 },
    { name: "Jill", income: 4000 },
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
    { name: "Jack", income: 5500 },
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
