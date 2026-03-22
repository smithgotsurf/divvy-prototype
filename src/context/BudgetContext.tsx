import React, { createContext, useContext, useCallback } from "react";
import { produce } from "immer";
import { STORAGE_KEY, EMPTY_STATE, makeMonth, makeSection, makeItem, makeFund } from "../data";
import { totalIncome, splitRatios, fundClosing } from "../shared/helpers";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type {
  BudgetState,
  BudgetContextValue,
  Month,
  Profile,
  Item,
  Fund,
  TemplateSection,
  TemplateFund,
} from "../types";

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState, resetState] = useLocalStorage<BudgetState>(STORAGE_KEY, EMPTY_STATE);

  const update = useCallback(
    (fn: (draft: BudgetState) => void) => {
      setState((prev) => produce(prev, fn));
    },
    [setState],
  );

  // --- Profile ---
  const updateProfile = useCallback(
    (profile: Profile) => {
      update((draft) => {
        draft.profile = profile;
      });
    },
    [update],
  );

  // --- Year/Month ---
  const setCurrentYear = useCallback(
    (year: number) => {
      update((draft) => {
        draft.currentYear = year;
      });
    },
    [update],
  );

  const getMonths = useCallback(
    (year: number) => {
      return state.years[year]?.months || [];
    },
    [state],
  );

  const getMonth = useCallback(
    (year: number, month: number) => {
      return getMonths(year).find((m) => m.month === month) || null;
    },
    [getMonths],
  );

  const updateMonth = useCallback(
    (year: number, monthIndex: number, updater: ((m: Month) => Month) | Partial<Month>) => {
      update((draft) => {
        const yearData = draft.years[year];
        if (!yearData) return;
        const idx = yearData.months.findIndex((m) => m.month === monthIndex);
        if (idx === -1) return;
        if (typeof updater === "function") {
          yearData.months[idx] = updater(yearData.months[idx]);
        } else {
          Object.assign(yearData.months[idx], updater);
        }
      });
    },
    [update],
  );

  // Clone previous month to create next month
  const cloneMonth = useCallback(
    (year: number, fromMonthIndex: number) => {
      update((draft) => {
        const yearData = draft.years[year] || { months: [] };
        const source = yearData.months.find((m) => m.month === fromMonthIndex);
        if (!source) return;

        let nextMonth = fromMonthIndex + 1;
        let nextYear = year;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear = year + 1;
        }

        if (!draft.years[nextYear]) draft.years[nextYear] = { months: [] };
        const targetYearData = draft.years[nextYear];
        if (targetYearData.months.find((m) => m.month === nextMonth)) return;

        const newSections = source.sections.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          items: s.items.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
            actual: 0,
          })),
        }));

        const newFunds = source.funds.map((f) => ({
          ...f,
          id: crypto.randomUUID(),
          opening: fundClosing(f),
          transfersIn: 0,
          transfersOut: 0,
        }));

        const newMonth: Month = {
          id: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`,
          year: nextYear,
          month: nextMonth,
          earners: source.earners.map((e) => ({ ...e })),
          sections: newSections,
          funds: newFunds,
        };

        targetYearData.months.push(newMonth);
        targetYearData.months.sort((a, b) => a.month - b.month);
        draft.currentYear = nextYear;
      });
    },
    [update],
  );

  // --- Remove a month ---
  const removeMonth = useCallback(
    (year: number, monthIndex: number) => {
      update((draft) => {
        const yearData = draft.years[year];
        if (!yearData) return;
        yearData.months = yearData.months.filter((m) => m.month !== monthIndex);
      });
    },
    [update],
  );

  // --- Section CRUD within a month ---
  const addSection = useCallback(
    (year: number, monthIndex: number, name: string) => {
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        sections: [...m.sections, makeSection(name || "New Section")],
      }));
    },
    [updateMonth],
  );

  const renameSection = useCallback(
    (year: number, monthIndex: number, sectionId: string, name: string) => {
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        sections: m.sections.map((s) => (s.id === sectionId ? { ...s, name } : s)),
      }));
    },
    [updateMonth],
  );

  const removeSection = useCallback(
    (year: number, monthIndex: number, sectionId: string) => {
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        sections: m.sections.filter((s) => s.id !== sectionId),
      }));
    },
    [updateMonth],
  );

  // --- Item CRUD within a section ---
  const addItem = useCallback(
    (year: number, monthIndex: number, sectionId: string, data?: Partial<Item>) => {
      const item = data
        ? makeItem(data.name || "", data.budget || 0, data.earner1 || 0, data.earner2 || 0, data.actual || 0, data.notes || "")
        : makeItem("New Item");
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        sections: m.sections.map((s) =>
          s.id === sectionId ? { ...s, items: [...s.items, item] } : s,
        ),
      }));
    },
    [updateMonth],
  );

  const updateItem = useCallback(
    (year: number, monthIndex: number, sectionId: string, itemId: string, updates: Partial<Item>) => {
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        sections: m.sections.map((s) =>
          s.id === sectionId
            ? { ...s, items: s.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)) }
            : s,
        ),
      }));
    },
    [updateMonth],
  );

  const removeItem = useCallback(
    (year: number, monthIndex: number, sectionId: string, itemId: string) => {
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        sections: m.sections.map((s) =>
          s.id === sectionId ? { ...s, items: s.items.filter((item) => item.id !== itemId) } : s,
        ),
      }));
    },
    [updateMonth],
  );

  // --- Fund CRUD within a month ---
  const updateFund = useCallback(
    (year: number, monthIndex: number, fundId: string, updates: Partial<Fund>) => {
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        funds: m.funds.map((f) => (f.id === fundId ? { ...f, ...updates } : f)),
      }));
    },
    [updateMonth],
  );

  const addFund = useCallback(
    (year: number, monthIndex: number, data?: Partial<Fund>) => {
      const f = data ? makeFund(data.name || "", data.opening || 0, data.minBal || 0, data.notes) : makeFund("New Fund", 0, 0);
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        funds: [...m.funds, f],
      }));
    },
    [updateMonth],
  );

  const removeFund = useCallback(
    (year: number, monthIndex: number, fundId: string) => {
      updateMonth(year, monthIndex, (m) => ({
        ...m,
        funds: m.funds.filter((f) => f.id !== fundId),
      }));
    },
    [updateMonth],
  );

  // --- Setup ---
  const completeSetup = useCallback(
    (profile: Profile, sections: TemplateSection[], funds: TemplateFund[]) => {
      const ratios = splitRatios(profile.earners);

      const initSections = sections.map((s) => ({
        name: s.name,
        items: s.items.map((item) => {
          const e1 = Math.round(item.budget * (ratios[0] || 1));
          const e2 = item.budget - e1;
          return makeItem(item.name, item.budget, e1, e2, 0, item.notes || "");
        }),
      }));

      const initFunds = funds.map((f) => makeFund(f.name, f.opening || 0, f.minBal || 0));

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      const firstMonth = makeMonth(year, month, profile.earners, initSections, initFunds);

      setState({
        profile,
        years: { [year]: { months: [firstMonth] } },
        currentYear: year,
        setupComplete: true,
      });
    },
    [setState],
  );

  // Export/Import
  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importData = useCallback(
    (jsonString: string) => {
      const parsed: unknown = JSON.parse(jsonString);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("profile" in parsed) ||
        !("years" in parsed) ||
        !("setupComplete" in parsed)
      ) {
        throw new Error("Invalid Divvy budget file");
      }
      const data = parsed as BudgetState;

      // Migrate old format (bills + allocations) to sections
      for (const yearKey of Object.keys(data.years)) {
        const yearData = (data.years as any)[yearKey];
        for (const m of yearData.months) {
          if ((m as any).bills && (m as any).allocations && !(m as any).sections) {
            const income = totalIncome((m as any).earners);
            (m as any).sections = [
              {
                id: crypto.randomUUID(),
                name: "Bills",
                items: (m as any).bills.map((b: any) => ({
                  id: crypto.randomUUID(),
                  name: b.name,
                  budget: b.budget || 0,
                  actual: b.actual || 0,
                  earner1: b.earner1 || 0,
                  earner2: b.earner2 || 0,
                  notes: b.notes || "",
                })),
              },
              {
                id: crypto.randomUUID(),
                name: "Allocations",
                items: (m as any).allocations.map((a: any) => ({
                  id: crypto.randomUUID(),
                  name: a.name,
                  budget: a.budget || Math.round(((a.pct || 0) * income) / 100),
                  actual: a.actual || 0,
                  earner1: a.earner1 || 0,
                  earner2: a.earner2 || 0,
                  notes: "",
                })),
              },
            ];
            delete (m as any).bills;
            delete (m as any).allocations;
          }
        }
      }

      setState(data);
    },
    [setState],
  );

  // Reset to empty state
  const resetData = useCallback(() => {
    resetState();
  }, [resetState]);

  return (
    <BudgetContext.Provider
      value={{
        state,
        profile: state.profile,
        currentYear: state.currentYear,
        setupComplete: state.setupComplete,
        setCurrentYear,
        updateProfile,
        getMonths,
        getMonth,
        updateMonth,
        cloneMonth,
        removeMonth,
        addSection,
        renameSection,
        removeSection,
        addItem,
        updateItem,
        removeItem,
        updateFund,
        addFund,
        removeFund,
        completeSetup,
        exportData,
        importData,
        resetData,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget(): BudgetContextValue {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
