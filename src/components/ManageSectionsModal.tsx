import { useState, useRef } from "react";
import type { Section, Earner } from "../types";
import Modal from "./Modal";

interface ManageSectionsModalProps {
  sections: Section[];
  earners: Earner[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onUpdateEarner: (index: number, income: number) => void;
  onRemoveMonth?: () => void;
  monthLabel?: string;
  onClose: () => void;
}

export default function ManageSectionsModal({
  sections,
  earners,
  onAdd,
  onRename,
  onRemove,
  onUpdateEarner,
  onRemoveMonth,
  monthLabel,
  onClose,
}: ManageSectionsModalProps) {
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName("");
      inputRef.current?.focus();
    }
  };

  return (
    <Modal
      title={monthLabel ? `${monthLabel} Settings` : "Month Settings"}
      onClose={onClose}
      footer={
        <div className="flex w-full justify-between">
          {onRemoveMonth && (
            <button
              className="btn btn-error"
              onClick={() => {
                if (confirm(`Delete ${monthLabel || "this month"}? This cannot be undone.`)) {
                  onClose();
                  onRemoveMonth();
                }
              }}
            >
              Delete
            </button>
          )}
          <button className="btn btn-primary ml-auto" onClick={onClose}>
            Done
          </button>
        </div>
      }
    >
      <div className="mb-4 pb-4 border-b border-base-300">
        <label className="label">
          <span className="label-text font-semibold">Income</span>
        </label>
        {earners.map(
          (e, i) =>
            e.name && (
              <div key={i} className="flex items-center gap-2 mb-2">
                <span className="text-sm">{e.name}</span>
                <input
                  className="input input-bordered w-full font-mono max-w-32"
                  type="number"
                  value={e.income || ""}
                  onChange={(ev) => onUpdateEarner(i, parseFloat(ev.target.value) || 0)}
                />
              </div>
            ),
        )}
      </div>

      <div>
        <label className="label">
          <span className="label-text font-semibold">Sections</span>
        </label>
        {sections.map((s) => (
          <div key={s.id} className="flex items-center gap-2 mb-2">
            <input
              className="input input-bordered w-full"
              value={s.name}
              onChange={(e) => onRename(s.id, e.target.value)}
            />
            <button
              className="btn btn-ghost btn-xs text-error"
              onClick={() => {
                if (confirm(`Delete "${s.name}" and all its items?`)) onRemove(s.id);
              }}
              title="Delete section"
            >
              ×
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <input
            ref={inputRef}
            className="input input-bordered w-full"
            value={newName}
            placeholder="New section name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <button className="btn btn-ghost btn-sm" onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>
    </Modal>
  );
}
