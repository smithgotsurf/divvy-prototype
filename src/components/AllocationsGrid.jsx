import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import { fmt, fmtPct, totalIncome, allocAmount } from "../shared/helpers";

export default function AllocationsGrid({ year, monthIndex, allocations, ytdData }) {
  const { updateAllocation, addAllocation, removeAllocation, profile } = useBudget();
  const income = totalIncome(profile.earners);

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
            <th className="ag-th-num">%</th>
            <th className="ag-th-num">Budget</th>
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
      </table>
    </div>
  );
}
