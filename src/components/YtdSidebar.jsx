import { useMemo } from "react";
import { useBudget } from "../context/BudgetContext";
import { fmt, totalIncome, allocAmount, billsTotal, monthNameFull } from "../shared/helpers";

export default function YtdSidebar() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  const ytd = useMemo(() => {
    if (months.length === 0) return null;

    // Aggregate bills by name
    const billMap = {};
    let totalBillsBudget = 0;
    let totalBillsActual = 0;

    // Aggregate allocations by name
    const allocMap = {};
    let totalAllocBudget = 0;
    let totalAllocActual = 0;

    // Fund balances (latest month's closing)
    const latestMonth = months[months.length - 1];

    for (const m of months) {
      const income = totalIncome(m.earners);

      for (const b of m.bills) {
        if (!billMap[b.name]) billMap[b.name] = { budget: 0, actual: 0 };
        billMap[b.name].budget += b.budget;
        billMap[b.name].actual += b.actual;
        totalBillsBudget += b.budget;
        totalBillsActual += b.actual;
      }

      for (const a of m.allocations) {
        if (!allocMap[a.name]) allocMap[a.name] = { budget: 0, actual: 0, pct: a.pct };
        const budgetAmt = allocAmount(a.pct, income);
        allocMap[a.name].budget += budgetAmt;
        allocMap[a.name].actual += a.actual;
        totalAllocBudget += budgetAmt;
        totalAllocActual += a.actual;
      }
    }

    // Projection: annualize based on months elapsed
    const monthsElapsed = months.length;
    const projectionFactor = monthsElapsed > 0 ? 12 / monthsElapsed : 1;

    return {
      billMap,
      allocMap,
      totalBillsBudget,
      totalBillsActual,
      totalAllocBudget,
      totalAllocActual,
      latestMonth,
      monthsElapsed,
      projectionFactor,
    };
  }, [months, currentYear]);

  if (!ytd) return <div className="ys-empty">No data yet</div>;

  const { billMap, allocMap, totalBillsBudget, totalBillsActual, totalAllocBudget, totalAllocActual, monthsElapsed, projectionFactor } = ytd;

  const indicator = (budget, actual) => {
    if (actual === 0) return "";
    if (actual > budget) return "ys-over";
    if (actual > budget * 0.9) return "ys-warn";
    return "ys-ok";
  };

  return (
    <div className="ys">
      <h3 className="ys-title">YTD Summary</h3>
      <p className="ys-sub">{monthsElapsed} month{monthsElapsed !== 1 ? "s" : ""} of data</p>

      <div className="ys-section">
        <h4>Bills</h4>
        {Object.entries(billMap).map(([name, { budget, actual }]) => (
          <div key={name} className={`ys-row ${indicator(budget, actual)}`}>
            <span className="ys-name">{name}</span>
            <span className="ys-vals">
              {fmt(actual)} / {fmt(budget)}
            </span>
          </div>
        ))}
        <div className="ys-row ys-total">
          <span>Bills Total</span>
          <span>{fmt(totalBillsActual)} / {fmt(totalBillsBudget)}</span>
        </div>
      </div>

      <div className="ys-section">
        <h4>Allocations</h4>
        {Object.entries(allocMap).map(([name, { budget, actual, pct }]) => (
          <div key={name} className={`ys-row ${indicator(budget, actual)}`}>
            <span className="ys-name">{name} ({pct}%)</span>
            <span className="ys-vals">{fmt(actual)} / {fmt(budget)}</span>
          </div>
        ))}
        <div className="ys-row ys-total">
          <span>Allocations Total</span>
          <span>{fmt(totalAllocActual)} / {fmt(totalAllocBudget)}</span>
        </div>
      </div>

      <div className="ys-section">
        <h4>Projected Year-End</h4>
        {Object.entries(billMap).map(([name, { budget, actual }]) => {
          const projected = Math.round(actual * projectionFactor);
          const annualBudget = Math.round(budget * projectionFactor);
          return (
            <div key={name} className={`ys-row ${indicator(annualBudget, projected)}`}>
              <span className="ys-name">{name}</span>
              <span className="ys-vals">{fmt(projected)} / {fmt(annualBudget)}</span>
            </div>
          );
        })}
      </div>

      <div className="ys-section">
        <h4>Fund Balances</h4>
        {ytd.latestMonth.funds.map((f) => {
          const closing = f.opening + f.transfersIn - f.transfersOut;
          const belowMin = closing < f.minBal;
          return (
            <div key={f.id} className={`ys-row ${belowMin ? "ys-over" : "ys-ok"}`}>
              <span className="ys-name">{f.name}</span>
              <span className="ys-vals">{fmt(closing)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
