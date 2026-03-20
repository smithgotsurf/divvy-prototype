import { useState, useEffect, useRef } from "react";

// Field defs per section type
const FIELDS = {
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

export default function RowModal({ type, data, onSave, onClose, showSplit, earnerNames, income }) {
  const [draft, setDraft] = useState(() => ({
    ...data,
    _pct: income > 0 ? Math.round((data.budget / income) * 10000) / 100 : 0,
  }));
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
    const { _pct, ...clean } = draft;
    onSave(clean);
    onClose();
  };

  const fields = FIELDS[type].filter(f => !f.split || showSplit);
  const isNew = !data.name && !data.budget && !data.opening;
  const title = isNew ? `Add ${type === "item" ? "Item" : "Fund"}` : `Edit ${draft.name || type}`;

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
            const val = draft[f.key] ?? "";

            return (
              <div className="rm-field" key={f.key}>
                <label className="rm-label">{label}</label>
                {f.hasPct ? (
                  <div className="rm-row">
                    <input
                      ref={i === 0 ? firstInputRef : null}
                      className="rm-input rm-input-num"
                      type="number"
                      value={draft.budget || ""}
                      placeholder="0"
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        set("budget", v);
                        set("_pct", income > 0 ? Math.round((v / income) * 10000) / 100 : 0);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                    />
                    <input
                      className="rm-input rm-input-num rm-input-pct"
                      type="number"
                      value={draft._pct || ""}
                      placeholder="%"
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        set("_pct", pct);
                        set("budget", income > 0 ? Math.round(income * pct / 100) : 0);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                    />
                    <span className="rm-pct-label">%</span>
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
