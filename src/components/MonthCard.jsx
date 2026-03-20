import { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import SectionGrid from "./SectionGrid";
import FundsGrid from "./FundsGrid";
import ManageSectionsModal from "./ManageSectionsModal";
import { fmt, monthNameFull, totalIncome, splitRatios, itemsTotal } from "../shared/helpers";

export default function MonthCard({ monthData, defaultCollapsed = false, isLatest = false, onClone, sectionStyle = "" }) {
  const { addSection, renameSection, removeSection, updateMonth } = useBudget();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showManage, setShowManage] = useState(false);
  const { year, month, earners, sections, funds } = monthData;

  const income = totalIncome(earners);
  const ratios = splitRatios(earners);

  const totalBudget = sections.reduce((s, sec) => s + itemsTotal(sec.items, "budget"), 0);
  const totalActual = sections.reduce((s, sec) => s + itemsTotal(sec.items, "actual"), 0);
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
            <div className="mc-income-left">
              {earners.map((e, i) => (
                <span key={i}>
                  {e.name}: {fmt(e.income)}
                  {earners.length > 1 && ` (${Math.round(ratios[i] * 100)}%)`}
                </span>
              ))}
            </div>
            <button className="mc-gear" onClick={() => setShowManage(true)}>⚙ Settings</button>
          </div>

          {sections.map((s) => (
            <div key={s.id} className="mc-section">
              <SectionGrid year={year} monthIndex={month} section={s} earners={earners} />
            </div>
          ))}

          <div className="mc-section mc-section--funds">
            <FundsGrid year={year} monthIndex={month} funds={funds} />
          </div>
        </>
      )}

      {showManage && (
        <ManageSectionsModal
          sections={sections}
          earners={earners}
          onAdd={(name) => addSection(year, month, name)}
          onRename={(id, name) => renameSection(year, month, id, name)}
          onRemove={(id) => removeSection(year, month, id)}
          onUpdateEarner={(i, income) => updateMonth(year, month, (m) => ({
            ...m,
            earners: m.earners.map((e, idx) => idx === i ? { ...e, income } : e),
          }))}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}
