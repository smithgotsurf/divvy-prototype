import { useOutletContext } from "react-router-dom";
import { useBudget } from "../context/BudgetContext";
import MonthCard from "../components/MonthCard";

export default function TimelinePage() {
  const { sectionStyle } = useOutletContext<{ sectionStyle: string }>();
  const { currentYear, getMonths, cloneMonth, removeMonth } = useBudget();
  const months = getMonths(currentYear);

  if (months.length === 0) {
    return (
      <div className="text-center py-20 px-5 text-base-content/50">
        No months yet. Clone a month to get started.
      </div>
    );
  }

  const lastMonth = months[months.length - 1];
  const reversed = [...months].reverse();

  return (
    <div className="max-w-4xl mx-auto">
      {reversed.map((m) => (
        <MonthCard
          key={m.id}
          monthData={m}
          defaultCollapsed={m.id !== lastMonth.id}
          isLatest={m.id === lastMonth.id}
          onClone={() => cloneMonth(currentYear, lastMonth.month)}
          onRemove={() => removeMonth(currentYear, m.month)}
          sectionStyle={sectionStyle}
        />
      ))}
    </div>
  );
}
