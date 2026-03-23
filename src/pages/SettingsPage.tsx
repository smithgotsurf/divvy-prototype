import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBudget } from "../context/BudgetContext";

export default function SettingsPage() {
  const { exportData, importData, resetData } = useBudget();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `divvy-budget-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importData(ev.target?.result as string);
        setStatus({ type: "success", msg: "Imported successfully" });
      } catch {
        setStatus({ type: "error", msg: "Invalid file format" });
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!window.confirm("Reset all data? This cannot be undone.")) return;
    resetData();
    navigate("/setup");
  };

  const handleTemplate = (key: string) => {
    if (!window.confirm("This will replace all current data. Continue?")) return;
    resetData();
    navigate(`/setup?template=${key}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="card bg-base-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold mb-1">Data Management</h3>
        <p className="text-sm text-secondary mb-4">
          Export your budget data as a JSON file, or import a previously exported file.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn" onClick={handleExport}>
            Export Data
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import Data
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button className="btn btn-error" onClick={handleReset}>
            Reset All Data
          </button>
        </div>
        {status && (
          <div
            className={`alert ${status.type === "success" ? "alert-success" : "alert-error"} mt-3`}
          >
            {status.msg}
          </div>
        )}
      </div>

      <div className="card bg-base-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold mb-1">Sample Templates</h3>
        <p className="text-sm text-secondary mb-4">
          Load sample data to explore the app. This replaces your current data.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn" onClick={() => handleTemplate("dual")}>
            Dual Income Sample
          </button>
          <button className="btn" onClick={() => handleTemplate("single")}>
            Single Income Sample
          </button>
        </div>
      </div>
    </div>
  );
}
