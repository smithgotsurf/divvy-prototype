import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "./context/BudgetContext";
import App from "./App";
import TimelinePage from "./pages/TimelinePage";
import SetupPage from "./pages/SetupPage";
import SummaryPage from "./pages/SummaryPage";
import SettingsPage from "./pages/SettingsPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BudgetProvider>
      <HashRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<TimelinePage />} />
            <Route path="summary" element={<SummaryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="setup" element={<SetupPage />} />
        </Routes>
      </HashRouter>
    </BudgetProvider>
  </StrictMode>,
);
