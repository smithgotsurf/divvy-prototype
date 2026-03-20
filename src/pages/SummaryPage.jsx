import { useMemo, useState } from "react";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "../components/EditableCell";
import { fmt, totalIncome, itemsTotal } from "../shared/helpers";

export default function SummaryPage() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  // Local state for next-year budget planning (not persisted — just a planning tool)
  const [nextYearBudgets, setNextYearBudgets] = useState({});

  const summary = useMemo(() => {
    const billRows = {};
    const allocRows = {};

    for (const m of months) {
      const income = totalIncome(m.earners);

      for (const b of m.bills) {
        if (!billRows[b.name]) billRows[b.name] = { budget: 0, actual: 0 };
        billRows[b.name].budget += b.budget;
        billRows[b.name].actual += b.actual;
      }

      for (const a of m.allocations) {
        if (!allocRows[a.name]) allocRows[a.name] = { budget: 0, actual: 0, pct: a.pct };
        allocRows[a.name].budget += allocAmount(a.pct, income);
        allocRows[a.name].actual += a.actual;
      }
    }

    return { billRows, allocRows };
  }, [months]);

  const { billRows, allocRows } = summary;

  const monthCount = months.length;
  const projFactor = monthCount > 0 ? 12 / monthCount : 1;

  return (
    <div className="sp">
      <h2>{currentYear} Summary</h2>
      <p className="sp-sub">{monthCount} of 12 months</p>

      <table className="sp-tbl">
        <thead>
          <tr>
            <th>Item</th>
            <th className="num">Annual Budget</th>
            <th className="num">Annual Actual</th>
            <th className="num">Delta</th>
            <th className="num">{currentYear + 1} Est</th>
            <th className="num">{currentYear + 1} Budget</th>
          </tr>
        </thead>
        <tbody>
          <tr className="sp-section"><td colSpan={6}>Bills</td></tr>
          {Object.entries(billRows).map(([name, { budget, actual }]) => {
            const delta = budget - actual;
            const est = Math.round(actual * projFactor / 12);
            return (
              <tr key={name}>
                <td>{name}</td>
                <td className="num">{fmt(budget)}</td>
                <td className="num">{fmt(actual)}</td>
                <td className={`num ${delta >= 0 ? "under" : "over"}`}>{fmt(delta)}</td>
                <td className="num muted">{fmt(est)}</td>
                <td className="num">
                  <EditableCell
                    value={nextYearBudgets[name] ?? est}
                    type="number"
                    formatter={fmt}
                    onChange={(v) => setNextYearBudgets(prev => ({ ...prev, [name]: v }))}
                  />
                </td>
              </tr>
            );
          })}

          <tr className="sp-section"><td colSpan={6}>Allocations</td></tr>
          {Object.entries(allocRows).map(([name, { budget, actual, pct }]) => {
            const delta = budget - actual;
            return (
              <tr key={name}>
                <td>{name} ({pct}%)</td>
                <td className="num">{fmt(budget)}</td>
                <td className="num">{fmt(actual)}</td>
                <td className={`num ${delta >= 0 ? "under" : "over"}`}>{fmt(delta)}</td>
                <td className="num muted">—</td>
                <td className="num muted">—</td>
              </tr>
            );
          })}

          <tr className="sp-totals">
            <td>Total</td>
            <td className="num">
              {fmt(Object.values(billRows).reduce((s, r) => s + r.budget, 0) + Object.values(allocRows).reduce((s, r) => s + r.budget, 0))}
            </td>
            <td className="num">
              {fmt(Object.values(billRows).reduce((s, r) => s + r.actual, 0) + Object.values(allocRows).reduce((s, r) => s + r.actual, 0))}
            </td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
