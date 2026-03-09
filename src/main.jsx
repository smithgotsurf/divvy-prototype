import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { BudgetProvider } from "./context/BudgetContext";
import App from "./App";
import "./app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BudgetProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </BudgetProvider>
  </StrictMode>
);
