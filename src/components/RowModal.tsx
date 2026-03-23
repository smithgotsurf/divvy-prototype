import { useState, useEffect, useRef } from "react";
import type { Earner } from "../types";
import { splitRatios } from "../shared/helpers";
import Modal from "./Modal";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number";
  hasPct?: boolean;
  split?: boolean;
}

// Field defs per section type
const FIELDS: Record<string, FieldDef[]> = {
  item: [
    { key: "name", label: "Item", type: "text" },
    { key: "budget", label: "Budget", type: "number", hasPct: true },
    { key: "earner1", label: "__e1__", type: "number", split: true },
    { key: "earner2", label: "__e2__", type: "number", split: true },
    { key: "actual", label: "Actual", type: "number" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  fund: [
    { key: "name", label: "Fund Name", type: "text" },
    { key: "minBal", label: "Min Balance", type: "number" },
    { key: "opening", label: "Opening", type: "number" },
    { key: "transfersIn", label: "Transfers In", type: "number" },
    { key: "transfersOut", label: "Transfers Out", type: "number" },
    { key: "notes", label: "Notes", type: "text" },
  ],
};

interface RowModalProps {
  type: "item" | "fund";
  data: Record<string, string | number>;
  onSave: (draft: Record<string, string | number>) => void;
  onDelete?: () => void;
  onClose: () => void;
  showSplit: boolean;
  earnerNames: string[];
  income?: number;
  earners?: Earner[];
}

export default function RowModal({
  type,
  data,
  onSave,
  onDelete,
  onClose,
  showSplit,
  earnerNames,
  income,
  earners,
}: RowModalProps) {
  const ratios = earners ? splitRatios(earners) : [];
  const [draft, setDraft] = useState<Record<string, string | number>>(() => ({
    ...data,
    _pct: income && income > 0 ? Math.round(((data.budget as number) / income) * 10000) / 100 : 0,
  }));
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstInputRef.current) firstInputRef.current.focus();
  }, []);

  const set = (key: string, val: string | number) => setDraft((prev) => ({ ...prev, [key]: val }));

  const updateBudgetWithSplit = (budget: number) => {
    setDraft((prev) => {
      const next: Record<string, string | number> = {
        ...prev,
        budget,
        _pct: income && income > 0 ? Math.round((budget / income) * 10000) / 100 : 0,
      };
      if (showSplit && ratios.length === 2) {
        next.earner1 = Math.round(budget * ratios[0]);
        next.earner2 = budget - (next.earner1 as number);
      }
      return next;
    });
  };

  const handleSave = () => {
    const { _pct: _, ...clean } = draft;
    onSave(clean);
    onClose();
  };

  const fields = FIELDS[type].filter((f) => !f.split || showSplit);
  const isNew = !data.name && !data.budget && !data.opening;
  const title = isNew ? `Add ${type === "item" ? "Item" : "Fund"}` : `Edit ${draft.name || type}`;

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <div className="flex w-full justify-between">
          {onDelete && !isNew ? (
            <button
              className="btn btn-error"
              onClick={() => {
                if (confirm(`Delete "${draft.name || type}"?`)) {
                  onDelete();
                  onClose();
                }
              }}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      }
    >
      {fields.map((f, i) => {
        const label = f.label
          .replace("__e1__", earnerNames?.[0] || "Earner 1")
          .replace("__e2__", earnerNames?.[1] || "Earner 2");
        const val = draft[f.key] ?? "";

        return (
          <div className="form-control mb-3" key={f.key}>
            <label className="label">
              <span className="label-text">{label}</span>
            </label>
            {f.hasPct ? (
              <div className="flex gap-2 items-center">
                <input
                  ref={i === 0 ? firstInputRef : null}
                  className="input input-bordered w-full font-mono"
                  type="number"
                  value={draft.budget || ""}
                  placeholder="0"
                  onChange={(e) => updateBudgetWithSplit(parseFloat(e.target.value) || 0)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                />
                <input
                  className="input input-bordered w-full font-mono"
                  type="number"
                  value={draft._pct || ""}
                  placeholder="%"
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value) || 0;
                    const newBudget = income && income > 0 ? Math.round((income * pct) / 100) : 0;
                    setDraft((prev) => {
                      const next: Record<string, string | number> = {
                        ...prev,
                        _pct: pct,
                        budget: newBudget,
                      };
                      if (showSplit && ratios.length === 2) {
                        next.earner1 = Math.round(newBudget * ratios[0]);
                        next.earner2 = newBudget - (next.earner1 as number);
                      }
                      return next;
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                />
                <span className="text-sm text-secondary">%</span>
              </div>
            ) : (
              <input
                ref={i === 0 ? firstInputRef : null}
                className={`input input-bordered w-full${f.type === "number" ? " font-mono" : ""}`}
                type={f.type === "number" ? "number" : "text"}
                value={val}
                placeholder={f.type === "number" ? "0" : ""}
                onChange={(e) => {
                  const v = f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
                  set(f.key, v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            )}
          </div>
        );
      })}
    </Modal>
  );
}
