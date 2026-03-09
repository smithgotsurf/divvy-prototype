import { useBudget } from "../context/BudgetContext";
import BillsGrid from "./BillsGrid";
import AllocationsGrid from "./AllocationsGrid";
import FundsGrid from "./FundsGrid";
import { fmt, monthNameFull, totalIncome, splitRatios, billsTotal, allocAmount } from "../shared/helpers";

export default function MonthCard({ monthData, ytdData }) {
  const { profile } = useBudget();
  const { year, month, earners, bills, allocations, funds } = monthData;

  const income = totalIncome(earners);
  const ratios = splitRatios(earners);

  // Calculate totals
  const billsBudget = billsTotal(bills, "budget");
  const billsActual = billsTotal(bills, "actual");
  const allocBudget = allocations.reduce((s, a) => s + allocAmount(a.pct, income), 0);
  const allocActual = allocations.reduce((s, a) => s + a.actual, 0);
  const totalBudget = billsBudget + allocBudget;
  const totalActual = billsActual + allocActual;
  const delta = totalBudget - totalActual;

  return (
    <div className="mc" id={`month-${monthData.id}`}>
      <div className="mc-hdr">
        <h2 className="mc-title">{monthNameFull(month)} {year}</h2>
        <div className="mc-totals">
          <span>Budget: {fmt(totalBudget)}</span>
          <span>Actual: {fmt(totalActual)}</span>
          <span className={delta >= 0 ? "under" : "over"}>
            {delta >= 0 ? "+" : ""}{fmt(delta)}
          </span>
        </div>
      </div>

      <div className="mc-income">
        {earners.map((e, i) => (
          <span key={i}>
            {e.name}: {fmt(e.income)}
            {earners.length > 1 && ` (${Math.round(ratios[i] * 100)}%)`}
          </span>
        ))}
      </div>

      <BillsGrid year={year} monthIndex={month} bills={bills} />
      <AllocationsGrid year={year} monthIndex={month} allocations={allocations} ytdData={ytdData} />
      <FundsGrid year={year} monthIndex={month} funds={funds} />
    </div>
  );
}
