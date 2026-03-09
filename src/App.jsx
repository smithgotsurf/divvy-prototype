import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useBudget } from "./context/BudgetContext";
import YtdSidebar from "./components/YtdSidebar";

export default function App() {
  const { currentYear, setCurrentYear, state } = useBudget();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const years = Object.keys(state.years).map(Number).sort();
  const navigate = useNavigate();

  return (
    <div className={`app ${sidebarOpen ? "sb-open" : ""}`}>
      <header className="hdr">
        <div className="hdr-left">
          <h1 className="logo" onClick={() => navigate("/")}>Divvy</h1>
          <nav className="nav">
            <button className="nav-btn active" onClick={() => navigate("/")}>Timeline</button>
            <button className="nav-btn" onClick={() => navigate("/summary")}>Summary</button>
          </nav>
        </div>
        <div className="hdr-right">
          <select className="yr-sel" value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="sb-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide YTD" : "Show YTD"}
          </button>
          <button className="nav-btn" onClick={() => navigate("/settings")}>Settings</button>
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
