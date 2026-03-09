import { useBudget } from "./context/BudgetContext";

export default function App() {
  const { setupComplete } = useBudget();
  return <div className="app">{setupComplete ? "Timeline" : "Setup"}</div>;
}
