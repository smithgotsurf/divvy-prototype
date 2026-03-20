import { useBudget } from "../context/BudgetContext";

// TODO: rewrite in Tasks 9-11 to use sections[] data model
export default function YtdSidebar() {
  const { currentYear } = useBudget();
  return <div className="ys"><div className="ys-empty">YTD Summary (coming soon)</div></div>;
}
