import type { Earner, Item, Section, Fund, Month, BudgetState, Template } from "./types";

export const STORAGE_KEY = "divvy-budget";

// Month names for display
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Factory: create a blank earner
export const makeEarner = (name = "", income = 0): Earner => ({ name, income });

// Factory: create a blank section (items get IDs assigned by makeMonth or addItem)
export const makeSection = (name = "", items: Item[] = []): Section => ({
  id: crypto.randomUUID(),
  name,
  items,
});

// Factory: create a blank line item
export const makeItem = (
  name = "",
  budget = 0,
  earner1 = 0,
  earner2 = 0,
  actual = 0,
  notes = "",
): Item => ({
  id: crypto.randomUUID(),
  name,
  budget,
  earner1,
  earner2,
  actual,
  notes,
});

// Factory: create a blank fund
export const makeFund = (name = "", opening = 0, minBal = 0, notes = ""): Fund => ({
  id: crypto.randomUUID(),
  name,
  opening,
  transfersIn: 0,
  transfersOut: 0,
  minBal,
  notes,
});

// Factory: create a month record
export const makeMonth = (
  year: number,
  month: number,
  earners: Earner[],
  sections: {
    name: string;
    items: {
      name: string;
      budget?: number;
      earner1?: number;
      earner2?: number;
      actual?: number;
      notes?: string;
    }[];
  }[],
  funds: { name: string; opening?: number; minBal?: number; notes?: string }[],
): Month => ({
  id: `${year}-${String(month + 1).padStart(2, "0")}`,
  year,
  month, // 0-indexed
  earners: earners.map((e) => ({ ...e })),
  sections: sections.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    items: s.items.map((item) => ({ ...item, id: crypto.randomUUID() }) as Item),
  })),
  funds: funds.map((f) => ({ ...f, id: crypto.randomUUID() }) as Fund),
});

// Empty state — fresh start, redirects to setup
export const EMPTY_STATE: BudgetState = {
  profile: { earners: [], useSplit: false },
  years: {},
  currentYear: new Date().getFullYear(),
  setupComplete: false,
};

// Templates for setup wizard prefill
export const TEMPLATE_DUAL: Template = {
  label: "Dual income household",
  description: "Two earners splitting bills proportionally",
  earnerCount: 2,
  useSplit: true,
  earners: [
    { name: "Jack", income: 6500 },
    { name: "Jill", income: 4000 },
  ],
  sections: [
    {
      name: "Fixed Bills",
      items: [
        { name: "Mortgage/Rent", budget: 2200, notes: "" },
        { name: "Utilities", budget: 250, notes: "" },
        { name: "Internet", budget: 80, notes: "" },
        { name: "Phone", budget: 120, notes: "" },
        { name: "Car Insurance", budget: 180, notes: "" },
        { name: "Subscriptions", budget: 60, notes: "" },
      ],
    },
    {
      name: "Flexible Spending",
      items: [
        { name: "Grocery", budget: 1260, notes: "" },
        { name: "Savings", budget: 1050, notes: "" },
        { name: "Charity", budget: 525, notes: "" },
      ],
    },
  ],
  funds: [
    { name: "Joint Savings", opening: 5000, minBal: 1000 },
    { name: "Emergency Fund", opening: 10000, minBal: 5000 },
  ],
};

export const TEMPLATE_SINGLE: Template = {
  label: "Single income household",
  description: "One earner managing all expenses",
  earnerCount: 1,
  useSplit: false,
  earners: [
    { name: "Jack", income: 5500 },
    { name: "", income: 0 },
  ],
  sections: [
    {
      name: "Fixed Bills",
      items: [
        { name: "Rent", budget: 1500, notes: "" },
        { name: "Utilities", budget: 180, notes: "" },
        { name: "Internet", budget: 70, notes: "" },
        { name: "Phone", budget: 80, notes: "" },
        { name: "Car Insurance", budget: 150, notes: "" },
        { name: "Subscriptions", budget: 45, notes: "" },
      ],
    },
    {
      name: "Flexible Spending",
      items: [
        { name: "Grocery", budget: 660, notes: "" },
        { name: "Savings", budget: 440, notes: "" },
        { name: "Fun Money", budget: 275, notes: "" },
      ],
    },
  ],
  funds: [
    { name: "Savings Account", opening: 4000, minBal: 1000 },
    { name: "Emergency Fund", opening: 8000, minBal: 3000 },
  ],
};

export const TEMPLATES: Record<string, Template> = { dual: TEMPLATE_DUAL, single: TEMPLATE_SINGLE };
