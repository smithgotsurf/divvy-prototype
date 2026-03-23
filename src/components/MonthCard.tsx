import { useState } from "react";
import type { Month } from "../types";
import { useBudget } from "../context/BudgetContext";
import SectionGrid from "./SectionGrid";
import FundsGrid from "./FundsGrid";
import ManageSectionsModal from "./ManageSectionsModal";
import { fmt, monthNameFull, splitRatios, itemsTotal } from "../shared/helpers";

interface MonthCardProps {
  monthData: Month;
  defaultCollapsed?: boolean;
  isLatest?: boolean;
  onClone?: () => void;
  onRemove?: () => void;
  sectionStyle?: string;
}

export default function MonthCard({
  monthData,
  defaultCollapsed = false,
  isLatest = false,
  onClone,
  onRemove,
  sectionStyle: _sectionStyle = "",
}: MonthCardProps) {
  const { addSection, renameSection, removeSection, updateMonth } = useBudget();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showManage, setShowManage] = useState(false);
  const { year, month, earners, sections, funds } = monthData;

  const ratios = splitRatios(earners);

  const totalBudget = sections.reduce((s, sec) => s + itemsTotal(sec.items, "budget"), 0);
  const totalActual = sections.reduce((s, sec) => s + itemsTotal(sec.items, "actual"), 0);
  const delta = totalBudget - totalActual;

  return (
    <div
      className="card bg-[oklch(97.5%_0.008_70)] shadow-sm border border-base-300 mb-5 overflow-hidden"
      id={`month-${monthData.id}`}
    >
      <div
        className="flex items-baseline justify-between px-4 py-3 border-b border-base-300 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h2 className="text-base font-bold tracking-tight">
          <span className="inline-block w-4 text-sm text-base-content/40">
            {collapsed ? "▸" : "▾"}
          </span>
          {monthNameFull(month)} {year}
        </h2>
        <div className="flex gap-4 font-mono text-sm text-secondary">
          <span>Budget: {fmt(totalBudget)}</span>
          <span>Actual: {fmt(totalActual)}</span>
          <span className={delta >= 0 ? "text-success" : "text-error"}>
            {delta >= 0 ? "+" : ""}
            {fmt(delta)}
          </span>
          {isLatest && onClone && (
            <button
              className="btn btn-ghost btn-xs border-dashed border-base-300 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                onClone();
              }}
            >
              + Clone
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="flex items-center justify-between px-4 py-1.5 text-xs text-base-content/50 border-b border-base-300">
            <div className="flex gap-4">
              {earners.map((e, i) => (
                <span key={i}>
                  {e.name}: {fmt(e.income)}
                  {earners.length > 1 && ` (${Math.round(ratios[i] * 100)}%)`}
                </span>
              ))}
            </div>
            <button
              className="btn btn-ghost btn-xs border-dashed border-base-300"
              onClick={() => setShowManage(true)}
            >
              ⚙ Settings
            </button>
          </div>

          {sections.map((s) => (
            <div key={s.id} className="mx-3 my-2 border border-base-300 rounded-sm bg-base-100">
              <SectionGrid year={year} monthIndex={month} section={s} earners={earners} />
            </div>
          ))}

          <div className="mx-3 my-2 border border-base-300 rounded-sm bg-base-100">
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
          onUpdateEarner={(i: number, income: number) =>
            updateMonth(year, month, (m: Month) => ({
              ...m,
              earners: m.earners.map((e, idx) => (idx === i ? { ...e, income } : e)),
            }))
          }
          onRemoveMonth={onRemove}
          monthLabel={`${monthNameFull(month)} ${year}`}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}
