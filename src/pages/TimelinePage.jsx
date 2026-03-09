import { useEffect, useRef, useMemo } from "react";
import { useBudget } from "../context/BudgetContext";
import MonthCard from "../components/MonthCard";
import { allocAmount, totalIncome } from "../shared/helpers";

export default function TimelinePage() {
  const { currentYear, getMonths, cloneMonth } = useBudget();
  const months = getMonths(currentYear);
  const timelineRef = useRef(null);

  // Auto-scroll to latest month on load
  useEffect(() => {
    if (months.length === 0) return;
    const latest = months[months.length - 1];
    const el = document.getElementById(`month-${latest.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentYear]); // only on year change, not every month update

  // Compute YTD data for each month
  const ytdByMonth = useMemo(() => {
    const result = {};
    const running = {}; // running totals by allocation name

    for (const m of months) {
      const income = totalIncome(m.earners);
      const monthYtd = {};

      for (const a of m.allocations) {
        if (!running[a.name]) running[a.name] = 0;
        running[a.name] += a.actual || allocAmount(a.pct, income);
        monthYtd[a.name] = running[a.name];
      }

      result[m.id] = monthYtd;
    }

    return result;
  }, [months]);

  if (months.length === 0) {
    return <div className="tl-empty">No months yet. Clone a month to get started.</div>;
  }

  const lastMonth = months[months.length - 1];

  return (
    <div className="tl" ref={timelineRef}>
      {months.map((m) => (
        <MonthCard key={m.id} monthData={m} ytdData={ytdByMonth[m.id]} />
      ))}

      <div className="tl-clone">
        <button className="tl-clone-btn" onClick={() => cloneMonth(currentYear, lastMonth.month)}>
          + Clone Next Month
        </button>
      </div>
    </div>
  );
}
