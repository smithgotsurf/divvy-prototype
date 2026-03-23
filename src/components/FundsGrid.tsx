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
    <div>
      <div className="flex justify-between items-center px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
          Funds
        </span>
        <button className="btn btn-ghost btn-xs" onClick={handleAdd}>
          + Add
        </button>
      </div>
      <table className="table table-sm table-fixed w-full [&_td]:py-1 [&_th]:py-1.5">
        <colgroup>
          <col className="w-48" />
          <col className="w-16" />
          <col className="w-20" />
          <col className="w-20" />
          <col className="w-20" />
          <col className="w-20" />
          <col />
          <col className="w-12" />
        </colgroup>
        <thead>
          <tr>
            <th className="text-xs font-semibold uppercase tracking-wide text-base-content/50 text-left">
              Fund
            </th>
            <th className="text-xs font-semibold uppercase tracking-wide text-base-content/50 text-right">
              Min
            </th>
            <th className="text-xs font-semibold uppercase tracking-wide text-base-content/50 text-right">
              Opening
            </th>
            <th className="text-xs font-semibold uppercase tracking-wide text-base-content/50 text-right">
              In
            </th>
            <th className="text-xs font-semibold uppercase tracking-wide text-base-content/50 text-right">
              Out
            </th>
            <th className="text-xs font-semibold uppercase tracking-wide text-base-content/50 text-right">
              Closing
            </th>
            <th className="text-xs font-semibold uppercase tracking-wide text-base-content/50 text-left">
              Notes
            </th>
            <th className="text-xs font-semibold uppercase tracking-wide text-base-content/50 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {funds.map((f) => {
            const closing = fundClosing(f);
            const belowMin = f.minBal > 0 && closing < f.minBal;
            return (
              <tr key={f.id} className={belowMin ? "bg-warning/10" : ""}>
                <td className="text-xs font-medium">
                  <EditableCell
                    value={f.name}
                    onChange={(v) => updateFund(year, monthIndex, f.id, { name: v as string })}
                  />
                </td>
                <td className="text-right font-mono">
                  <EditableCell
                    value={f.minBal || ""}
                    type="number"
                    formatter={fmtMin}
                    onChange={(v) =>
                      updateFund(year, monthIndex, f.id, { minBal: (v as number) || 0 })
                    }
                  />
                </td>
                <td className="text-right font-mono">
                  <EditableCell
                    value={f.opening}
                    type="number"
                    formatter={fmt}
                    onChange={(v) => updateFund(year, monthIndex, f.id, { opening: v as number })}
                  />
                </td>
                <td className="text-right font-mono">
                  <EditableCell
                    value={f.transfersIn}
                    type="number"
                    formatter={fmt}
                    onChange={(v) =>
                      updateFund(year, monthIndex, f.id, { transfersIn: v as number })
                    }
                  />
                </td>
                <td className="text-right font-mono">
                  <EditableCell
                    value={f.transfersOut}
                    type="number"
                    formatter={fmt}
                    onChange={(v) =>
                      updateFund(year, monthIndex, f.id, { transfersOut: v as number })
                    }
                  />
                </td>
                <td
                  className={`text-right font-mono ${belowMin ? "text-error font-semibold" : ""}`}
                >
                  {fmt(closing)}
                </td>
                <td>
                  <EditableCell
                    value={f.notes}
                    onChange={(v) => updateFund(year, monthIndex, f.id, { notes: v as string })}
                    className="text-xs text-base-content/60"
                  />
                </td>
                <td className="text-right">
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setModal({ data: f, isNew: false })}
                    title="Edit"
                  >
                    ✎
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
          onDelete={
            modal.isNew
              ? undefined
              : () => removeFund(year, monthIndex, modal.data.id)
          }
          onClose={() => setModal(null)}
          showSplit={false}
          earnerNames={[]}
        />
      )}
    </div>
  );
}
