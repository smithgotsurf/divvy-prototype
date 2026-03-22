import { useState } from "react";
import type { Fund } from "../types";
import { useBudget } from "../context/BudgetContext";
import EditableCell from "./EditableCell";
import RowModal from "./RowModal";
import { fmt, fundClosing } from "../shared/helpers";

interface FundsGridProps {
  year: number;
  monthIndex: number;
  funds: Fund[];
}

const fmtMin = (v: number): string => (v ? fmt(v) : "–");

export default function FundsGrid({ year, monthIndex, funds }: FundsGridProps) {
  const { updateFund, addFund, removeFund } = useBudget();
  const [modal, setModal] = useState<{ data: Fund; isNew: boolean } | null>(null);

  const handleAdd = () => {
    setModal({
      data: { id: "", name: "", minBal: 0, opening: 0, transfersIn: 0, transfersOut: 0, notes: "" },
      isNew: true,
    });
  };

  const handleSave = (draft: Record<string, string | number>) => {
    if (modal!.isNew) {
      addFund(year, monthIndex, draft as unknown as Partial<Fund>);
    } else {
      updateFund(year, monthIndex, modal!.data.id, draft as unknown as Partial<Fund>);
    }
  };

  return (
    <div className="fg">
      <div className="fg-hdr">
        <span className="fg-title">Funds</span>
        <button className="fg-add" onClick={handleAdd}>
          + Add
        </button>
      </div>
      <table className="fg-tbl">
        <thead>
          <tr>
            <th className="fg-th-name col-name">Fund</th>
            <th className="fg-th-num col-narrow">Min</th>
            <th className="fg-th-num col-num">Opening</th>
            <th className="fg-th-num col-num">In</th>
            <th className="fg-th-num col-num">Out</th>
            <th className="fg-th-num col-num">Closing</th>
            <th className="fg-th-notes">Notes</th>
            <th className="fg-th-x col-x"></th>
          </tr>
        </thead>
        <tbody>
          {funds.map((f) => {
            const closing = fundClosing(f);
            const belowMin = f.minBal > 0 && closing < f.minBal;
            return (
              <tr key={f.id} className={belowMin ? "fg-warn" : ""}>
                <td>
                  <EditableCell
                    value={f.name}
                    onChange={(v) => updateFund(year, monthIndex, f.id, { name: v as string })}
                  />
                </td>
                <td className="num fg-min-cell">
                  <EditableCell
                    value={f.minBal || ""}
                    type="number"
                    formatter={fmtMin}
                    onChange={(v) =>
                      updateFund(year, monthIndex, f.id, { minBal: (v as number) || 0 })
                    }
                  />
                </td>
                <td className="num">
                  <EditableCell
                    value={f.opening}
                    type="number"
                    formatter={fmt}
                    onChange={(v) => updateFund(year, monthIndex, f.id, { opening: v as number })}
                  />
                </td>
                <td className="num">
                  <EditableCell
                    value={f.transfersIn}
                    type="number"
                    formatter={fmt}
                    onChange={(v) =>
                      updateFund(year, monthIndex, f.id, { transfersIn: v as number })
                    }
                  />
                </td>
                <td className="num">
                  <EditableCell
                    value={f.transfersOut}
                    type="number"
                    formatter={fmt}
                    onChange={(v) =>
                      updateFund(year, monthIndex, f.id, { transfersOut: v as number })
                    }
                  />
                </td>
                <td className={`num ${belowMin ? "fg-below" : ""}`}>{fmt(closing)}</td>
                <td>
                  <EditableCell
                    value={f.notes}
                    onChange={(v) => updateFund(year, monthIndex, f.id, { notes: v as string })}
                    className="fg-notes"
                  />
                </td>
                <td className="row-actions">
                  <button
                    className="row-edit"
                    onClick={() => setModal({ data: f, isNew: false })}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    className="fg-rm"
                    onClick={() => {
                      if (confirm(`Remove "${f.name || "this fund"}"?`))
                        removeFund(year, monthIndex, f.id);
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {modal && (
        <RowModal
          type="fund"
          data={modal.data as unknown as Record<string, string | number>}
          onSave={handleSave}
          onClose={() => setModal(null)}
          showSplit={false}
          earnerNames={[]}
        />
      )}
    </div>
  );
}
