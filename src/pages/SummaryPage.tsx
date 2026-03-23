import { useMemo, useState } from "react";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "../components/EditableCell";
import { fmt } from "../shared/helpers";

export default function SummaryPage() {
  const { currentYear, getMonths } = useBudget();
  const months = getMonths(currentYear);

  const [nextYearBudgets, setNextYearBudgets] = useState<Record<string, number>>({});

  const summary = useMemo(() => {
    const sectionMap: Record<string, Record<string, { budget: number; actual: number }>> = {};

    for (const m of months) {
      for (const s of m.sections) {
        if (!sectionMap[s.name]) sectionMap[s.name] = {};
        for (const item of s.items) {
          if (!sectionMap[s.name][item.name])
            sectionMap[s.name][item.name] = { budget: 0, actual: 0 };
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
    let b = 0,
      a = 0;
    for (const items of Object.values(summary)) {
      for (const { budget, actual } of Object.values(items)) {
        b += budget;
        a += actual;
      }
    }
    return { grandBudget: b, grandActual: a };
  }, [summary]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card bg-base-100 shadow-sm p-6">
      <h2>{currentYear} Summary</h2>
      <p className="text-sm text-secondary mb-4">{monthCount} of 12 months</p>

      <table className="table table-sm w-full">
        <thead>
          <tr className="bg-base-200">
            <th>Item</th>
            <th className="text-right font-mono">Annual Budget</th>
            <th className="text-right font-mono">Annual Actual</th>
            <th className="text-right font-mono">Delta</th>
            <th className="text-right font-mono">{currentYear + 1} Est</th>
            <th className="text-right font-mono">{currentYear + 1} Budget</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(summary).map(([sectionName, items]) => {
            return [
              <tr key={`section-${sectionName}`} className="bg-base-200/50 font-bold">
                <td colSpan={6}>{sectionName}</td>
              </tr>,
              ...Object.entries(items).map(([name, { budget, actual }]) => {
                const delta = budget - actual;
                const est = Math.round((actual * projFactor) / 12);
                return (
                  <tr key={`${sectionName}-${name}`}>
                    <td>{name}</td>
                    <td className="text-right font-mono">{fmt(budget)}</td>
                    <td className="text-right font-mono">{fmt(actual)}</td>
                    <td
                      className={`text-right font-mono ${delta >= 0 ? "text-success" : "text-error"}`}
                    >
                      {fmt(delta)}
                    </td>
                    <td className="text-right font-mono text-base-content/50">{fmt(est)}</td>
                    <td className="text-right font-mono">
                      <EditableCell
                        value={nextYearBudgets[`${sectionName}-${name}`] ?? est}
                        type="number"
                        formatter={fmt}
                        onChange={(v) =>
                          setNextYearBudgets((prev) => ({
                            ...prev,
                            [`${sectionName}-${name}`]: v as number,
                          }))
                        }
                      />
                    </td>
                  </tr>
                );
              }),
            ];
          })}

          <tr className="font-bold border-t-2 border-base-300">
            <td>Total</td>
            <td className="text-right font-mono">{fmt(grandBudget)}</td>
            <td className="text-right font-mono">{fmt(grandActual)}</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}
