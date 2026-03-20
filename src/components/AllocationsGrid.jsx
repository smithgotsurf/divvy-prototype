import { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import RowModal from "./RowModal";
import { fmt, fmtPct, totalIncome, allocAmount } from "../shared/helpers";

export default function AllocationsGrid({ year, monthIndex, allocations, ytdData }) {
  const { updateAllocation, addAllocation, removeAllocation, profile } = useBudget();
  const [modal, setModal] = useState(null);
  const income = totalIncome(profile.earners);
  const showSplit = profile.earners.length === 2;
  const e1Name = profile.earners[0]?.name || "Earner 1";
  const e2Name = profile.earners[1]?.name || "Earner 2";

  const budgetTotal = allocations.reduce((s, a) => s + allocAmount(a.pct, income), 0);
  const actualTotal = allocations.reduce((s, a) => s + a.actual, 0);

  const handleAdd = () => {
    setModal({ data: { name: "", pct: 0, budget: 0, earner1: 0, earner2: 0, actual: 0 }, isNew: true });
  };

  const handleSave = (draft) => {
    // Extract pct (computed from budget in modal), pass the rest
    const { budget, ...rest } = draft;
    if (modal.isNew) {
      addAllocation(year, monthIndex, rest);
    } else {
      updateAllocation(year, monthIndex, modal.data.id, rest);
    }
  };

  return (
    <div className="ag">
      <div className="ag-hdr">
        <span className="ag-title">Allocations</span>
        <button className="ag-add" onClick={handleAdd}>+ Add</button>
      </div>
      <table className="ag-tbl">
        <thead>
          <tr>
            <th className="ag-th-name col-name">Item</th>
            <th className="ag-th-pct col-narrow">%</th>
            <th className="ag-th-num col-num">Budget</th>
            {showSplit && <th className="ag-th-num col-num">{e1Name}</th>}
            {showSplit && <th className="ag-th-num col-num">{e2Name}</th>}
            <th className="ag-th-num col-num">Actual</th>
            <th className="ag-th-notes">YTD</th>
            <th className="ag-th-x col-x"></th>
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
                <td className="num muted">{fmtPct(a.pct)}</td>
                <td className="num">
                  <EditableCell value={budgetAmt} type="number" formatter={fmt} onChange={(v) => {
                    const newPct = income > 0 ? Math.round((v / income) * 10000) / 100 : 0;
                    updateAllocation(year, monthIndex, a.id, { pct: newPct });
                  }} />
                </td>
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
                <td className="row-actions">
                  <button className="row-edit" onClick={() => setModal({ data: { ...a, budget: budgetAmt }, isNew: false })} title="Edit">✎</button>
                  <button className="ag-rm" onClick={() => { if (confirm(`Remove "${a.name || 'this allocation'}"?`)) removeAllocation(year, monthIndex, a.id); }} title="Remove">×</button>
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
      {modal && (
        <RowModal
          type="allocation"
          data={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
          showSplit={showSplit}
          earnerNames={[e1Name, e2Name]}
          income={income}
        />
      )}
    </div>
  );
}
