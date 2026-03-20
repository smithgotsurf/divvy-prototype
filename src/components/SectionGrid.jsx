import { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import RowModal from "./RowModal";
import { fmt, fmtPct, itemsTotal, totalIncome } from "../shared/helpers";

export default function SectionGrid({ year, monthIndex, section, earners }) {
  const { updateItem, addItem, removeItem } = useBudget();
  const [modal, setModal] = useState(null); // { data, isNew }
  const income = totalIncome(earners);
  const showSplit = earners.length === 2;
  const e1Name = earners[0]?.name || "Earner 1";
  const e2Name = earners[1]?.name || "Earner 2";

  const budgetTotal = itemsTotal(section.items, "budget");
  const e1Total = itemsTotal(section.items, "earner1");
  const e2Total = itemsTotal(section.items, "earner2");
  const actualTotal = itemsTotal(section.items, "actual");

  const handleAdd = () => {
    setModal({ data: { name: "", budget: 0, earner1: 0, earner2: 0, actual: 0, notes: "" }, isNew: true });
  };

  const handleSave = (draft) => {
    if (modal.isNew) {
      addItem(year, monthIndex, section.id, draft);
    } else {
      updateItem(year, monthIndex, section.id, modal.data.id, draft);
    }
  };

  return (
    <div className="sg">
      <div className="sg-hdr">
        <span className="sg-title">{section.name}</span>
        <button className="sg-add" onClick={handleAdd}>+ Add</button>
      </div>
      <table className="sg-tbl">
        <thead>
          <tr>
            <th className="col-name">Item</th>
            <th className="sg-th-pct col-narrow">%</th>
            <th className="sg-th-num col-num">Budget</th>
            {showSplit && <th className="sg-th-num col-num">{e1Name}</th>}
            {showSplit && <th className="sg-th-num col-num">{e2Name}</th>}
            <th className="sg-th-num col-num">Actual</th>
            <th className="sg-th-notes">Notes</th>
            <th className="sg-th-x col-x"></th>
          </tr>
        </thead>
        <tbody>
          {section.items.map((item) => (
            <tr key={item.id} className={item.actual > item.budget && item.actual > 0 ? "sg-over" : ""}>
              <td>
                <EditableCell value={item.name} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { name: v })} />
              </td>
              <td className="num muted">{income > 0 ? fmtPct(Math.round((item.budget / income) * 10000) / 100) : ""}</td>
              <td className="num">
                <EditableCell value={item.budget} type="number" formatter={fmt} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { budget: v })} />
              </td>
              {showSplit && (
                <td className="num">
                  <EditableCell value={item.earner1} type="number" formatter={fmt} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { earner1: v })} />
                </td>
              )}
              {showSplit && (
                <td className="num">
                  <EditableCell value={item.earner2} type="number" formatter={fmt} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { earner2: v })} />
                </td>
              )}
              <td className="num">
                <EditableCell value={item.actual} type="number" formatter={fmt} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { actual: v })} />
              </td>
              <td>
                <EditableCell value={item.notes} onChange={(v) => updateItem(year, monthIndex, section.id, item.id, { notes: v })} className="sg-notes" />
              </td>
              <td className="row-actions">
                <button className="row-edit" onClick={() => setModal({ data: item, isNew: false })} title="Edit">✎</button>
                <button className="sg-rm" onClick={() => { if (confirm(`Remove "${item.name || 'this item'}"?`)) removeItem(year, monthIndex, section.id, item.id); }} title="Remove">×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="sg-totals">
            <td>Subtotal</td>
            <td></td>
            <td className="num">{fmt(budgetTotal)}</td>
            {showSplit && <td className="num">{fmt(e1Total)}</td>}
            {showSplit && <td className="num">{fmt(e2Total)}</td>}
            <td className="num">{fmt(actualTotal)}</td>
            <td></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      {modal && (
        <RowModal
          type="item"
          data={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
          showSplit={showSplit}
          earnerNames={[e1Name, e2Name]}
          income={income}
          earners={earners}
        />
      )}
    </div>
  );
}
