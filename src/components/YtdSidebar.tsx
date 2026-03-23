import { useMemo } from "react";
import type { Month } from "../types";
import { useBudget } from "../context/BudgetContext";
import { fmt, fundClosing } from "../shared/helpers";

interface YtdItemData {
  budget: number;
  actual: number;
}

interface YtdSectionData {
  items: Record<string, YtdItemData>;
  budget: number;
  actual: number;
}

interface YtdData {
  sectionMap: Record<string, YtdSectionData>;
  totalBudget: number;
  totalActual: number;
  latestMonth: Month;
  monthsElapsed: number;
}

export default function YtdSidebar() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  const ytd = useMemo((): YtdData | null => {
    if (months.length === 0) return null;

    const sectionMap: Record<string, YtdSectionData> = {};
    let totalBudget = 0;
    let totalActual = 0;

    for (const m of months) {
      for (const s of m.sections) {
        if (!sectionMap[s.name]) sectionMap[s.name] = { items: {}, budget: 0, actual: 0 };
        for (const item of s.items) {
          if (!sectionMap[s.name].items[item.name])
            sectionMap[s.name].items[item.name] = { budget: 0, actual: 0 };
          sectionMap[s.name].items[item.name].budget += item.budget;
          sectionMap[s.name].items[item.name].actual += item.actual;
          sectionMap[s.name].budget += item.budget;
          sectionMap[s.name].actual += item.actual;
          totalBudget += item.budget;
          totalActual += item.actual;
        }
      }
    }

    const latestMonth = months[months.length - 1];
    const monthsElapsed = months.length;

    return { sectionMap, totalBudget, totalActual, latestMonth, monthsElapsed };
  }, [months]);

  if (!ytd) return <div className="text-center py-8 text-base-content/40">No data yet</div>;

  const { sectionMap, latestMonth, monthsElapsed } = ytd;

  const indicator = (budget: number, actual: number): string => {
    if (actual === 0) return "";
    if (actual > budget) return "text-error";
    if (actual > budget * 0.9) return "text-warning";
    return "";
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-1">YTD Summary</h3>
      <p className="text-sm text-secondary mb-4">
        {monthsElapsed} month{monthsElapsed !== 1 ? "s" : ""} of data
      </p>

      {Object.entries(sectionMap).map(([sectionName, { items, budget, actual }]) => (
        <div key={sectionName} className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-base-content/70">{sectionName}</h4>
          {Object.entries(items).map(([name, { budget: b, actual: a }]) => (
            <div
              key={name}
              className={`flex justify-between items-center py-0.5 text-sm ${indicator(b, a)}`}
            >
              <span className="truncate">{name}</span>
              <span className="font-mono text-xs ml-2 shrink-0">
                {fmt(a)} / {fmt(b)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center py-0.5 text-sm font-semibold border-t border-base-300 mt-1 pt-1">
            <span>{sectionName} Total</span>
            <span>
              {fmt(actual)} / {fmt(budget)}
            </span>
          </div>
        </div>
      ))}

      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2 text-base-content/70">Fund Balances</h4>
        {latestMonth.funds.map((f) => {
          const closing = fundClosing(f);
          const belowMin = closing < f.minBal;
          return (
            <div
              key={f.id}
              className={`flex justify-between items-center py-0.5 text-sm ${belowMin ? "text-error" : ""}`}
            >
              <span className="truncate">{f.name}</span>
              <span className="font-mono text-xs ml-2 shrink-0">{fmt(closing)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
