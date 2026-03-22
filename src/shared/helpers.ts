import type { Item, Earner, Fund } from "../types";

// Format number as currency
export const fmt = (n: number): string =>
  (n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// Format with cents when needed
export const fmtExact = (n: number): string =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Format percentage
export const fmtPct = (n: number): string => (n ? `${n}%` : "–");

// Month name from 0-indexed month number
export const monthName = (m: number): string =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m];

// Full month name
export const monthNameFull = (m: number): string =>
  [
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
  ][m];

// Sum items budget
export const itemsTotal = (items: Item[], field: keyof Item = "budget"): number =>
  items.reduce((s, b) => s + ((b[field] as number) || 0), 0);

// Total income from earners array
export const totalIncome = (earners: Earner[]): number => earners.reduce((s, e) => s + e.income, 0);

// Calculate proportional split ratios
export const splitRatios = (earners: Earner[]): number[] => {
  const total = totalIncome(earners);
  if (total === 0) return earners.map(() => 0);
  return earners.map((e) => e.income / total);
};

// Fund closing balance
export const fundClosing = (fund: Fund): number =>
  fund.opening + fund.transfersIn - fund.transfersOut;

// Delta indicator class
export const deltaClass = (budget: number, actual: number): string => {
  if (actual === 0) return "";
  if (actual <= budget) return "under";
  return "over";
};
