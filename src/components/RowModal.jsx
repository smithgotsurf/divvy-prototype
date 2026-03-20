import { useState, useEffect, useRef } from "react";

// Field defs per section type
const FIELDS = {
  bill: [
    { key: "name", label: "Item", type: "text" },
    { key: "budget", label: "Budget", type: "number" },
    { key: "earner1", label: "__e1__", type: "number", split: true },
    { key: "earner2", label: "__e2__", type: "number", split: true },
    { key: "actual", label: "Actual", type: "number" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  allocation: [
    { key: "name", label: "Item", type: "text" },
    { key: "budget", label: "Budget", type: "number", computed: true },
    { key: "earner1", label: "__e1__", type: "number", split: true },
    { key: "earner2", label: "__e2__", type: "number", split: true },
    { key: "actual", label: "Actual", type: "number" },
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

export default function RowModal({ type, data, onSave, onClose, showSplit, earnerNames, income }) {
  const [draft, setDraft] = useState({ ...data });
  const backdropRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) firstInputRef.current.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const set = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const fields = FIELDS[type].filter(f => !f.split || showSplit);
  const isNew = !data.name && !data.budget && !data.opening;
  const title = isNew ? `Add ${type === "bill" ? "Bill" : type === "allocation" ? "Allocation" : "Fund"}` : `Edit ${draft.name || type}`;

  return (
    <div className="rm-backdrop" ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="rm">
        <div className="rm-hdr">
          <h3 className="rm-title">{title}</h3>
          <button className="rm-close" onClick={onClose}>×</button>
        </div>
        <div className="rm-body">
          {fields.map((f, i) => {
            const label = f.label.replace("__e1__", earnerNames?.[0] || "Earner 1").replace("__e2__", earnerNames?.[1] || "Earner 2");
            const val = f.computed ? draft.budget : (draft[f.key] ?? "");

            return (
              <div className="rm-field" key={f.key}>
                <label className="rm-label">{label}</label>
                {f.computed ? (
                  <div className="rm-row">
                    <input
                      ref={i === 0 ? firstInputRef : null}
                      className="rm-input rm-input-num"
                      type="number"
                      value={val || ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        const newPct = income > 0 ? Math.round((v / income) * 10000) / 100 : 0;
                        set("budget", v);
                        set("pct", newPct);
                      }}
                    />
                    <span className="rm-pct">{draft.pct ? `${draft.pct}%` : ""}</span>
                  </div>
                ) : (
                  <input
                    ref={i === 0 ? firstInputRef : null}
                    className={`rm-input${f.type === "number" ? " rm-input-num" : ""}`}
                    type={f.type === "number" ? "number" : "text"}
                    value={val}
                    placeholder={f.type === "number" ? "0" : ""}
                    onChange={(e) => {
                      const v = f.type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value;
                      set(f.key, v);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="rm-footer">
          <button className="rm-cancel" onClick={onClose}>Cancel</button>
          <button className="rm-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
