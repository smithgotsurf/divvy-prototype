import { useState, useRef, useEffect } from "react";

export default function ManageSectionsModal({ sections, onAdd, onRename, onRemove, onClose }) {
  const [newName, setNewName] = useState("");
  const backdropRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="rm-backdrop" ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="rm">
        <div className="rm-hdr">
          <h3 className="rm-title">Manage Sections</h3>
          <button className="rm-close" onClick={onClose}>×</button>
        </div>
        <div className="rm-body">
          {sections.map((s) => (
            <div key={s.id} className="ms-row">
              <input
                className="rm-input"
                value={s.name}
                onChange={(e) => onRename(s.id, e.target.value)}
              />
              <button
                className="ms-rm"
                onClick={() => {
                  if (confirm(`Delete "${s.name}" and all its items?`)) onRemove(s.id);
                }}
                title="Delete section"
              >×</button>
            </div>
          ))}
          <div className="ms-add-row">
            <input
              ref={inputRef}
              className="rm-input"
              value={newName}
              placeholder="New section name"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <button className="ms-add-btn" onClick={handleAdd}>Add</button>
          </div>
        </div>
        <div className="rm-footer">
          <button className="rm-save" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
