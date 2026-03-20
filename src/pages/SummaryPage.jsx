import { useMemo, useState } from "react";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "../components/EditableCell";
import { fmt } from "../shared/helpers";

export default function SummaryPage() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  const [nextYearBudgets, setNextYearBudgets] = useState({});

  const summary = useMemo(() => {
    const sectionMap = {};

    for (const m of months) {
      for (const s of m.sections) {
        if (!sectionMap[s.name]) sectionMap[s.name] = {};
        for (const item of s.items) {
          if (!sectionMap[s.name][item.name]) sectionMap[s.name][item.name] = { budget: 0, actual: 0 };
          sectionMap[s.name][item.name].budget += item.budget;
          sectionMap[s.name][item.name].actual += item.actual;
        }
      }
    }

    return sectionMap;
  }, [months]);

  const monthCount = months.length;
  const projFactor = monthCount > 0 ? 12 / monthCount : 1;

  const { grandBudget, grandActual } = useMemo(() => {
    let b = 0, a = 0;
    for (const items of Object.values(summary)) {
      for (const { budget, actual } of Object.values(items)) { b += budget; a += actual; }
    }
    return { grandBudget: b, grandActual: a };
  }, [summary]);

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
          {Object.entries(summary).map(([sectionName, items]) => {
            return [
              <tr key={`section-${sectionName}`} className="sp-section">
                <td colSpan={6}>{sectionName}</td>
              </tr>,
              ...Object.entries(items).map(([name, { budget, actual }]) => {
                const delta = budget - actual;
                const est = Math.round(actual * projFactor / 12);
                return (
                  <tr key={`${sectionName}-${name}`}>
                    <td>{name}</td>
                    <td className="num">{fmt(budget)}</td>
                    <td className="num">{fmt(actual)}</td>
                    <td className={`num ${delta >= 0 ? "under" : "over"}`}>{fmt(delta)}</td>
                    <td className="num muted">{fmt(est)}</td>
                    <td className="num">
                      <EditableCell
                        value={nextYearBudgets[`${sectionName}-${name}`] ?? est}
                        type="number"
                        formatter={fmt}
                        onChange={(v) => setNextYearBudgets(prev => ({ ...prev, [`${sectionName}-${name}`]: v }))}
                      />
                    </td>
                  </tr>
                );
              }),
            ];
          })}

          <tr className="sp-totals">
            <td>Total</td>
            <td className="num">{fmt(grandBudget)}</td>
            <td className="num">{fmt(grandActual)}</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
