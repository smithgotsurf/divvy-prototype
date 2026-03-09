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
export const makeAllocation = (name = "", pct = 0, fixed = false) => ({
  id: crypto.randomUUID(),
  name, pct, fixed,
  actual: 0,
});

// Factory: create a blank fund
export const makeFund = (name = "", opening = 0, minBal = 0) => ({
  id: crypto.randomUUID(),
  name, opening, transfersIn: 0, transfersOut: 0, minBal,
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

// Seed: profile with earners
export const SEED_PROFILE = {
  earners: [
    makeEarner("Josh", 10600),
    makeEarner("Jacklyn", 0),
  ],
  useSplit: true,
};

// Seed: bill templates
export const SEED_BILLS = [
  makeBill("Mortgage", 2050, 2050, 0, 0, "recurring 1st", false),
  makeBill("Equity Line", 1500, 1500, 0, 0, "due 22nd", false),
  makeBill("Escrow", 700, 700, 0, 0, "", false),
  makeBill("T-Mobile", 142, 142, 0, 0, "autopay 1st", true),
  makeBill("Misc", 100, 100, 0, 0, "", false),
  makeBill("Duke Energy", 325, 325, 0, 0, "scheduled 20th", false),
  makeBill("McLambs LP", 105, 105, 0, 0, "", false),
  makeBill("Car Insurance", 175, 175, 0, 0, "due Mar & Sep", false),
  makeBill("Life Insurance", 63, 36, 27, 0, "autopay 9/1", true),
];

// Seed: allocation templates
export const SEED_ALLOCATIONS = [
  makeAllocation("Grocery", 13, false),
  makeAllocation("Charity", 10, true),
  makeAllocation("Savings", 5, false),
];

// Seed: fund templates
export const SEED_FUNDS = [
  makeFund("Joint Savings", 1325, 250),
  makeFund("Rainy Day Fund", 5400, 25),
  makeFund("Josh Savings", 26832, 250),
  makeFund("Jacklyn Savings", 19648, 250),
];

// Build seed months for Jan-Mar 2026
function buildSeedMonths() {
  const totalIncome = 10600;

  // January
  const jan = makeMonth(2026, 0, SEED_PROFILE.earners, SEED_BILLS, SEED_ALLOCATIONS, SEED_FUNDS);
  // Set actuals for Jan
  const janActuals = { "Mortgage": 2050, "Equity Line": 1500, "T-Mobile": 142, "Duke Energy": 631, "Misc": 150 };
  jan.bills.forEach(b => { if (janActuals[b.name] !== undefined) b.actual = janActuals[b.name]; });
  jan.allocations.forEach(a => { a.actual = Math.round(totalIncome * a.pct / 100); });
  // Jan funds
  jan.funds[0].opening = 1325; jan.funds[0].transfersIn = 540; jan.funds[0].transfersOut = 1023;
  jan.funds[1].opening = 5400; jan.funds[1].transfersIn = 208; jan.funds[1].transfersOut = 0;
  jan.funds[2].opening = 26832; jan.funds[2].transfersIn = 0; jan.funds[2].transfersOut = 6500;
  jan.funds[3].opening = 19648; jan.funds[3].transfersIn = 197; jan.funds[3].transfersOut = 998;

  // February
  const feb = makeMonth(2026, 1, SEED_PROFILE.earners, SEED_BILLS, SEED_ALLOCATIONS, SEED_FUNDS);
  const febActuals = { "Mortgage": 2050, "Equity Line": 1500, "T-Mobile": 146, "Duke Energy": 538, "Car Insurance": 1041 };
  feb.bills.forEach(b => { if (febActuals[b.name] !== undefined) b.actual = febActuals[b.name]; });
  feb.allocations.forEach(a => { a.actual = Math.round(totalIncome * a.pct / 100); });
  // Feb funds — carry forward from Jan closing
  feb.funds[0].opening = 842; feb.funds[0].transfersIn = 530; feb.funds[0].transfersOut = 720;
  feb.funds[1].opening = 5608; feb.funds[1].transfersIn = 171; feb.funds[1].transfersOut = 0;
  feb.funds[2].opening = 20332; feb.funds[2].transfersIn = 0; feb.funds[2].transfersOut = 0;
  feb.funds[3].opening = 18847; feb.funds[3].transfersIn = 0; feb.funds[3].transfersOut = 315;

  // March (current month — mostly empty actuals)
  const mar = makeMonth(2026, 2, SEED_PROFILE.earners, SEED_BILLS, SEED_ALLOCATIONS, SEED_FUNDS);
  const marActuals = { "Mortgage": 2050 };
  mar.bills.forEach(b => { if (marActuals[b.name] !== undefined) b.actual = marActuals[b.name]; });
  mar.allocations.forEach(a => { a.actual = Math.round(totalIncome * a.pct / 100); });
  mar.funds[0].opening = 652; mar.funds[0].transfersIn = 0; mar.funds[0].transfersOut = 0;
  mar.funds[1].opening = 5779; mar.funds[1].transfersIn = 0; mar.funds[1].transfersOut = 0;
  mar.funds[2].opening = 20332; mar.funds[2].transfersIn = 0; mar.funds[2].transfersOut = 0;
  mar.funds[3].opening = 18532; mar.funds[3].transfersIn = 0; mar.funds[3].transfersOut = 0;

  return [jan, feb, mar];
}

export const SEED_MONTHS = buildSeedMonths();

// Default app state
export const SEED_STATE = {
  profile: SEED_PROFILE,
  years: {
    2026: { months: SEED_MONTHS },
  },
  currentYear: 2026,
  setupComplete: true,
};
