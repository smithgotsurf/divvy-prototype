import { useEffect, useRef } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ title, onClose, footer, children, className = "" }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="modal modal-open"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className={`modal-box ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="modal-action">{footer}</div>}
      </div>
    </div>
  );
}
