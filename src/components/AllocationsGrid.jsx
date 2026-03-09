import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import { fmt, fmtPct, totalIncome, allocAmount } from "../shared/helpers";

export default function AllocationsGrid({ year, monthIndex, allocations, ytdData }) {
  const { updateAllocation, addAllocation, removeAllocation, profile } = useBudget();
  const income = totalIncome(profile.earners);
  const showSplit = profile.earners.length === 2;
  const e1Name = profile.earners[0]?.name || "Earner 1";
  const e2Name = profile.earners[1]?.name || "Earner 2";

  const budgetTotal = allocations.reduce((s, a) => s + allocAmount(a.pct, income), 0);
  const actualTotal = allocations.reduce((s, a) => s + a.actual, 0);

  return (
    <div className="ag">
      <div className="ag-hdr">
        <span className="ag-title">Allocations</span>
        <button className="ag-add" onClick={() => addAllocation(year, monthIndex)}>+ Add</button>
      </div>
      <table className="ag-tbl">
        <thead>
          <tr>
            <th className="ag-th-name">Item</th>
            <th className="ag-th-pct">%</th>
            <th className="ag-th-num">Budget</th>
            {showSplit && <th className="ag-th-num">{e1Name}</th>}
            {showSplit && <th className="ag-th-num">{e2Name}</th>}
            <th className="ag-th-num">Actual</th>
            <th className="ag-th-notes">YTD</th>
            <th className="ag-th-x"></th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a) => {
            const budgetAmt = allocAmount(a.pct, income);
            const ytd = ytdData?.[a.name] || null;
            return (
              <tr key={a.id}>
                <td>
                  <EditableCell value={a.name} onChange={(v) => updateAllocation(year, monthIndex, a.id, { name: v })} />
                </td>
                <td className="num">
                  <EditableCell value={a.pct} type="number" formatter={fmtPct} onChange={(v) => updateAllocation(year, monthIndex, a.id, { pct: v })} />
                </td>
                <td className="num">{fmt(budgetAmt)}</td>
                {showSplit && (
                  <td className="num">
                    <EditableCell value={a.earner1} type="number" formatter={fmt} onChange={(v) => updateAllocation(year, monthIndex, a.id, { earner1: v })} />
                  </td>
                )}
                {showSplit && (
                  <td className="num">
                    <EditableCell value={a.earner2} type="number" formatter={fmt} onChange={(v) => updateAllocation(year, monthIndex, a.id, { earner2: v })} />
                  </td>
                )}
                <td className="num">
                  <EditableCell value={a.actual} type="number" formatter={fmt} onChange={(v) => updateAllocation(year, monthIndex, a.id, { actual: v })} />
                </td>
                <td className="ag-ytd">{ytd !== null ? `YTD: ${fmt(ytd)}` : ""}</td>
                <td>
                  <button className="ag-rm" onClick={() => removeAllocation(year, monthIndex, a.id)} title="Remove">×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="ag-totals">
            <td>Subtotal</td>
            <td></td>
            <td className="num">{fmt(budgetTotal)}</td>
            {showSplit && <td></td>}
            {showSplit && <td></td>}
            <td className="num">{fmt(actualTotal)}</td>
            <td></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
