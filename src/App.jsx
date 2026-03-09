import { useState } from "react";
import { Outlet, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useBudget } from "./context/BudgetContext";
import YtdSidebar from "./components/YtdSidebar";
import { monthNameFull } from "./shared/helpers";

export default function App() {
  const { currentYear, setCurrentYear, state, getMonths, cloneMonth } = useBudget();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const years = Object.keys(state.years).map(Number).sort();
  const navigate = useNavigate();
  const location = useLocation();

  if (!state.setupComplete && location.pathname !== "/setup") {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className={`app ${sidebarOpen ? "sb-open" : ""}`}>
      <header className="hdr">
        <div className="hdr-left">
          <h1 className="logo" onClick={() => navigate("/")}>Divvy</h1>
          <nav className="nav">
            <button className={`nav-btn${location.pathname === "/" ? " active" : ""}`} onClick={() => navigate("/")}>Timeline</button>
            <button className={`nav-btn${location.pathname === "/summary" ? " active" : ""}`} onClick={() => navigate("/summary")}>Summary</button>
          </nav>
        </div>
        <div className="hdr-right">
          <select className="yr-sel" value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {(() => {
            const months = getMonths(currentYear);
            if (months.length === 0) return null;
            const last = months[months.length - 1];
            const nextMonth = last.month + 1;
            const label = nextMonth > 11 ? `Jan ${currentYear + 1}` : monthNameFull(nextMonth);
            return (
              <button className="hdr-clone" onClick={() => cloneMonth(currentYear, last.month)}>
                + {label}
              </button>
            );
          })()}
          <button className="sb-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide YTD" : "Show YTD"}
          </button>
          <button className={`nav-btn${location.pathname === "/settings" ? " active" : ""}`} onClick={() => navigate("/settings")}>Settings</button>
        </div>
      </header>

      <div className="main">
        <div className="content">
          <Outlet />
        </div>
        {sidebarOpen && <aside className="sidebar"><YtdSidebar /></aside>}
      </div>
    </div>
  );
}
