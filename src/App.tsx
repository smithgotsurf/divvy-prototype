import { useState } from "react";
import { Outlet, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useBudget } from "./context/BudgetContext";
import YtdSidebar from "./components/YtdSidebar";
import { monthNameFull } from "./shared/helpers";

export default function App() {
  const { currentYear, setCurrentYear, state, getMonths, cloneMonth } = useBudget()!;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const years = Object.keys(state.years).map(Number).sort();
  const navigate = useNavigate();
  const location = useLocation();

  if (!state.setupComplete && location.pathname !== "/setup") {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <header className="navbar bg-base-100 border-b border-base-300 shadow-sm sticky top-0 z-50 px-6 min-h-[52px]">
        <div className="flex items-center gap-3">
          <h1
            className="text-lg font-bold tracking-tight text-primary cursor-pointer select-none"
            onClick={() => navigate("/")}
          >
            Divvy
          </h1>
          <nav className="flex gap-0.5">
            <button
              className={`btn btn-ghost btn-sm text-secondary${location.pathname === "/" ? " btn-active" : ""}`}
              onClick={() => navigate("/")}
            >
              Timeline
            </button>
            <button
              className={`btn btn-ghost btn-sm text-secondary${location.pathname === "/summary" ? " btn-active" : ""}`}
              onClick={() => navigate("/summary")}
            >
              Summary
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select select-bordered select-sm font-mono text-sm"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {(() => {
            const months = getMonths(currentYear);
            if (months.length === 0) return null;
            const last = months[months.length - 1];
            const nextMonth = last.month + 1;
            const label = nextMonth > 11 ? `Jan ${currentYear + 1}` : monthNameFull(nextMonth);
            return (
              <button
                className="btn btn-ghost btn-sm border-dashed border-base-300"
                onClick={() => cloneMonth(currentYear, last.month)}
              >
                + {label}
              </button>
            );
          })()}
          <button
            className="btn btn-ghost btn-sm border border-base-300"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "Hide YTD" : "Show YTD"}
          </button>
          <button
            className={`btn btn-ghost btn-sm text-secondary${location.pathname === "/settings" ? " btn-active" : ""}`}
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ sectionStyle: "d" }} />
        </div>
        {sidebarOpen && (
          <aside className="w-80 min-w-80 border-l border-base-300 bg-base-100 overflow-y-auto p-5 shadow-sm">
            <YtdSidebar />
          </aside>
        )}
      </div>
    </div>
  );
}
