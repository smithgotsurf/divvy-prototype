import { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import BillsGrid from "./BillsGrid";
import AllocationsGrid from "./AllocationsGrid";
import FundsGrid from "./FundsGrid";
import { fmt, monthNameFull, totalIncome, splitRatios, billsTotal, allocAmount } from "../shared/helpers";

export default function MonthCard({ monthData, ytdData, defaultCollapsed = false, isLatest = false, onClone, sectionStyle = "" }) {
  const { profile } = useBudget();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { year, month, earners, bills, allocations, funds } = monthData;

  const income = totalIncome(earners);
  const ratios = splitRatios(earners);

  const billsBudget = billsTotal(bills, "budget");
  const billsActual = billsTotal(bills, "actual");
  const allocBudget = allocations.reduce((s, a) => s + allocAmount(a.pct, income), 0);
  const allocActual = allocations.reduce((s, a) => s + a.actual, 0);
  const totalBudget = billsBudget + allocBudget;
  const totalActual = billsActual + allocActual;
  const delta = totalBudget - totalActual;

  return (
    <div className={`mc${sectionStyle ? ` mc--variant-${sectionStyle}` : ""}`} id={`month-${monthData.id}`}>
      <div className="mc-hdr" onClick={() => setCollapsed(!collapsed)} style={{ cursor: "pointer" }}>
        <h2 className="mc-title">
          <span className="mc-chevron">{collapsed ? "▸" : "▾"}</span>
          {monthNameFull(month)} {year}
        </h2>
        <div className="mc-totals">
          <span>Budget: {fmt(totalBudget)}</span>
          <span>Actual: {fmt(totalActual)}</span>
          <span className={delta >= 0 ? "under" : "over"}>
            {delta >= 0 ? "+" : ""}{fmt(delta)}
          </span>
          {isLatest && onClone && (
            <button className="mc-clone" onClick={(e) => { e.stopPropagation(); onClone(); }}>+ Clone</button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="mc-income">
            {earners.map((e, i) => (
              <span key={i}>
                {e.name}: {fmt(e.income)}
                {earners.length > 1 && ` (${Math.round(ratios[i] * 100)}%)`}
              </span>
            ))}
          </div>

          <div className="mc-section mc-section--bills">
            <BillsGrid year={year} monthIndex={month} bills={bills} />
          </div>
          <div className="mc-section mc-section--alloc">
            <AllocationsGrid year={year} monthIndex={month} allocations={allocations} ytdData={ytdData} />
          </div>
          <div className="mc-section mc-section--funds">
            <FundsGrid year={year} monthIndex={month} funds={funds} />
          </div>
        </>
      )}
    </div>
  );
}
