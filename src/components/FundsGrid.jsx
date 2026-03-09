import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import { fmt, fundClosing } from "../shared/helpers";

export default function FundsGrid({ year, monthIndex, funds }) {
  const { updateFund, addFund, removeFund } = useBudget();

  return (
    <div className="fg">
      <div className="fg-hdr">
        <span className="fg-title">Funds</span>
        <button className="fg-add" onClick={() => addFund(year, monthIndex)}>+ Add</button>
      </div>
      <table className="fg-tbl">
        <thead>
          <tr>
            <th className="fg-th-name">Fund</th>
            <th className="fg-th-num">Opening</th>
            <th className="fg-th-num">In</th>
            <th className="fg-th-num">Out</th>
            <th className="fg-th-num">Closing</th>
            <th className="fg-th-num">Min</th>
            <th className="fg-th-x"></th>
          </tr>
        </thead>
        <tbody>
          {funds.map((f) => {
            const closing = fundClosing(f);
            const belowMin = closing < f.minBal;
            return (
              <tr key={f.id} className={belowMin ? "fg-warn" : ""}>
                <td>
                  <EditableCell value={f.name} onChange={(v) => updateFund(year, monthIndex, f.id, { name: v })} />
                </td>
                <td className="num">
                  <EditableCell value={f.opening} type="number" formatter={fmt} onChange={(v) => updateFund(year, monthIndex, f.id, { opening: v })} />
                </td>
                <td className="num">
                  <EditableCell value={f.transfersIn} type="number" formatter={fmt} onChange={(v) => updateFund(year, monthIndex, f.id, { transfersIn: v })} />
                </td>
                <td className="num">
                  <EditableCell value={f.transfersOut} type="number" formatter={fmt} onChange={(v) => updateFund(year, monthIndex, f.id, { transfersOut: v })} />
                </td>
                <td className={`num ${belowMin ? "fg-below" : ""}`}>{fmt(closing)}</td>
                <td className="num muted">{fmt(f.minBal)}</td>
                <td>
                  <button className="fg-rm" onClick={() => removeFund(year, monthIndex, f.id)} title="Remove">×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
