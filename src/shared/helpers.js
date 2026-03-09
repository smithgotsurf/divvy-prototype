// Format number as currency
export const fmt = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Format with cents when needed
export const fmtExact = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Format percentage
export const fmtPct = (n) => `${n}%`;

// Month name from 0-indexed month number
export const monthName = (m) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m];

// Full month name
export const monthNameFull = (m) =>
  ["January", "February", "March", "April", "May", "June",
   "July", "August", "September", "October", "November", "December"][m];

// Sum bills budget
export const billsTotal = (bills, field = "budget") =>
  bills.reduce((s, b) => s + (b[field] || 0), 0);

// Calculate allocation dollar amount from percentage and total income
export const allocAmount = (pct, totalIncome) =>
  Math.round(totalIncome * pct / 100);

// Total income from earners array
export const totalIncome = (earners) =>
  earners.reduce((s, e) => s + e.income, 0);

// Calculate proportional split ratios
export const splitRatios = (earners) => {
  const total = totalIncome(earners);
  if (total === 0) return earners.map(() => 0);
  return earners.map(e => e.income / total);
};

// Fund closing balance
export const fundClosing = (fund) =>
  fund.opening + fund.transfersIn - fund.transfersOut;

// Delta indicator class
export const deltaClass = (budget, actual) => {
  if (actual === 0) return "";
  if (actual <= budget) return "under";
  return "over";
};
