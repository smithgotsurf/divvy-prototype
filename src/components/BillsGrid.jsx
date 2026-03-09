import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import { fmt, billsTotal } from "../shared/helpers";

export default function BillsGrid({ year, monthIndex, bills }) {
  const { updateBill, addBill, removeBill, profile } = useBudget();
  const showSplit = profile.earners.length === 2;
  const e1Name = profile.earners[0]?.name || "Earner 1";
  const e2Name = profile.earners[1]?.name || "Earner 2";

  const budgetTotal = billsTotal(bills, "budget");
  const actualTotal = billsTotal(bills, "actual");

  return (
    <div className="bg">
      <div className="bg-hdr">
        <span className="bg-title">Bills</span>
        <button className="bg-add" onClick={() => addBill(year, monthIndex)}>+ Add</button>
      </div>
      <table className="bg-tbl">
        <thead>
          <tr>
            <th className="bg-th-name">Item</th>
            <th className="bg-th-num">Budget</th>
            {showSplit && <th className="bg-th-num">{e1Name}</th>}
            {showSplit && <th className="bg-th-num">{e2Name}</th>}
            <th className="bg-th-num">Actual</th>
            <th className="bg-th-notes">Notes</th>
            <th className="bg-th-x"></th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => (
            <tr key={b.id} className={b.actual > b.budget && b.actual > 0 ? "bg-over" : ""}>
              <td>
                <EditableCell value={b.name} onChange={(v) => updateBill(year, monthIndex, b.id, { name: v })} />
              </td>
              <td className="num">
                <EditableCell value={b.budget} type="number" formatter={fmt} onChange={(v) => updateBill(year, monthIndex, b.id, { budget: v })} />
              </td>
              {showSplit && (
                <td className="num">
                  <EditableCell value={b.earner1} type="number" formatter={fmt} onChange={(v) => updateBill(year, monthIndex, b.id, { earner1: v })} />
                </td>
              )}
              {showSplit && (
                <td className="num">
                  <EditableCell value={b.earner2} type="number" formatter={fmt} onChange={(v) => updateBill(year, monthIndex, b.id, { earner2: v })} />
                </td>
              )}
              <td className="num">
                <EditableCell value={b.actual} type="number" formatter={fmt} onChange={(v) => updateBill(year, monthIndex, b.id, { actual: v })} />
              </td>
              <td>
                <EditableCell value={b.notes} onChange={(v) => updateBill(year, monthIndex, b.id, { notes: v })} className="bg-notes" />
              </td>
              <td>
                <button className="bg-rm" onClick={() => removeBill(year, monthIndex, b.id)} title="Remove">×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-totals">
            <td>Subtotal</td>
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
