import { useState, useRef, useEffect } from "react";

interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number";
  className?: string;
  formatter?: (value: number) => string;
  placeholder?: string;
}

export default function EditableCell({
  value,
  onChange,
  type = "text",
  className = "",
  formatter,
  placeholder,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | number>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = type === "number" ? parseFloat(draft as string) || 0 : draft;
    if (next !== value) onChange(next);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`ec-input ${className}`}
        type={type === "number" ? "number" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
      />
    );
  }

  const display = formatter ? formatter(value as number) : value;

  return (
    <span
      className={`ec ${className}`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setDraft(value);
          setEditing(true);
        }
      }}
    >
      {display ||
        (placeholder ? (
          <span className="ec-empty">{placeholder}</span>
        ) : (
          <span className="ec-empty">—</span>
        ))}
    </span>
  );
}
