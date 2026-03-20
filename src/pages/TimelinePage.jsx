import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useBudget } from "../context/BudgetContext";
import MonthCard from "../components/MonthCard";
import { allocAmount, totalIncome } from "../shared/helpers";

export default function TimelinePage() {
  const { sectionStyle } = useOutletContext();
  const { currentYear, getMonths, cloneMonth } = useBudget();
  const months = getMonths(currentYear);

  // Compute YTD data for each month (chronological order)
  const ytdByMonth = useMemo(() => {
    const result = {};
    const running = {};

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
  const reversed = [...months].reverse();

  return (
    <div className="tl">
      {reversed.map((m) => (
        <MonthCard
          key={m.id}
          monthData={m}
          ytdData={ytdByMonth[m.id]}
          defaultCollapsed={m.id !== lastMonth.id}
          isLatest={m.id === lastMonth.id}
          onClone={() => cloneMonth(currentYear, lastMonth.month)}
          sectionStyle={sectionStyle}
        />
      ))}
    </div>
  );
}
