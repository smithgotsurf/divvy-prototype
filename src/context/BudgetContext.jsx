import { createContext, useContext, useState, useCallback } from "react";
import { STORAGE_KEY, EMPTY_STATE, makeMonth, makeSection, makeItem, makeFund } from "../data";
import { totalIncome, splitRatios, fundClosing } from "../shared/helpers";

const BudgetContext = createContext();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function BudgetProvider({ children }) {
  const [state, setState] = useState(() => load() || EMPTY_STATE);

  const persist = useCallback((next) => {
    setState(next);
    save(next);
  }, []);

  // Update a function that takes previous state and returns next state
  const update = useCallback((fn) => {
    setState(prev => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  // --- Profile ---
  const updateProfile = useCallback((profile) => {
    update(prev => ({ ...prev, profile }));
  }, [update]);

  // --- Year/Month ---
  const setCurrentYear = useCallback((year) => {
    update(prev => ({ ...prev, currentYear: year }));
  }, [update]);

  const getMonths = useCallback((year) => {
    return state.years[year]?.months || [];
  }, [state]);

  const getMonth = useCallback((year, month) => {
    return getMonths(year).find(m => m.month === month) || null;
  }, [getMonths]);

  const updateMonth = useCallback((year, monthIndex, updater) => {
    update(prev => {
      const yearData = prev.years[year] || { months: [] };
      const months = yearData.months.map(m =>
        m.month === monthIndex ? (typeof updater === "function" ? updater(m) : { ...m, ...updater }) : m
      );
      return { ...prev, years: { ...prev.years, [year]: { ...yearData, months } } };
    });
  }, [update]);

  // Clone previous month to create next month
  const cloneMonth = useCallback((year, fromMonthIndex) => {
    update(prev => {
      const yearData = prev.years[year] || { months: [] };
      const source = yearData.months.find(m => m.month === fromMonthIndex);
      if (!source) return prev;

      let nextMonth = fromMonthIndex + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = year + 1;
      }

      // Check if target month already exists
      const targetYearData = prev.years[nextYear] || { months: [] };
      if (targetYearData.months.find(m => m.month === nextMonth)) return prev;

      // Clone sections (keep budget + earner splits, zero out actuals)
      const newSections = source.sections.map(s => ({
        ...s,
        id: crypto.randomUUID(),
        items: s.items.map(item => ({
          ...item,
          id: crypto.randomUUID(),
          actual: 0,
        })),
      }));

      // Clone funds (opening = previous closing, zero transfers)
      const newFunds = source.funds.map(f => ({
        ...f,
        id: crypto.randomUUID(),
        opening: fundClosing(f),
        transfersIn: 0,
        transfersOut: 0,
      }));

      const newMonth = {
        id: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`,
        year: nextYear,
        month: nextMonth,
        earners: source.earners.map(e => ({ ...e })),
        sections: newSections,
        funds: newFunds,
      };

      const updatedTargetYear = {
        ...targetYearData,
        months: [...targetYearData.months, newMonth].sort((a, b) => a.month - b.month),
      };

      const nextState = {
        ...prev,
        years: { ...prev.years, [nextYear]: updatedTargetYear },
        currentYear: nextYear,
      };

      return nextState;
    });
  }, [update]);

  // --- Remove a month ---
  const removeMonth = useCallback((year, monthIndex) => {
    update(prev => {
      const yearData = prev.years[year];
      if (!yearData) return prev;
      const months = yearData.months.filter(m => m.month !== monthIndex);
      return { ...prev, years: { ...prev.years, [year]: { ...yearData, months } } };
    });
  }, [update]);

  // --- Section CRUD within a month ---
  const addSection = useCallback((year, monthIndex, name) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      sections: [...m.sections, makeSection(name || "New Section")],
    }));
  }, [updateMonth]);

  const renameSection = useCallback((year, monthIndex, sectionId, name) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      sections: m.sections.map(s => s.id === sectionId ? { ...s, name } : s),
    }));
  }, [updateMonth]);

  const removeSection = useCallback((year, monthIndex, sectionId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      sections: m.sections.filter(s => s.id !== sectionId),
    }));
  }, [updateMonth]);

  // --- Item CRUD within a section ---
  const addItem = useCallback((year, monthIndex, sectionId, data) => {
    const item = data
      ? makeItem(data.name, data.budget, data.earner1, data.earner2, data.actual, data.notes)
      : makeItem("New Item");
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      sections: m.sections.map(s =>
        s.id === sectionId ? { ...s, items: [...s.items, item] } : s
      ),
    }));
  }, [updateMonth]);

  const updateItem = useCallback((year, monthIndex, sectionId, itemId, updates) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      sections: m.sections.map(s =>
        s.id === sectionId
          ? { ...s, items: s.items.map(item => item.id === itemId ? { ...item, ...updates } : item) }
          : s
      ),
    }));
  }, [updateMonth]);

  const removeItem = useCallback((year, monthIndex, sectionId, itemId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      sections: m.sections.map(s =>
        s.id === sectionId
          ? { ...s, items: s.items.filter(item => item.id !== itemId) }
          : s
      ),
    }));
  }, [updateMonth]);

  // --- Fund CRUD within a month ---
  const updateFund = useCallback((year, monthIndex, fundId, updates) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: m.funds.map(f => f.id === fundId ? { ...f, ...updates } : f),
    }));
  }, [updateMonth]);

  const addFund = useCallback((year, monthIndex, data) => {
    const f = data
      ? makeFund(data.name, data.opening, data.minBal, data.notes)
      : makeFund("New Fund", 0, 0);
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: [...m.funds, f],
    }));
  }, [updateMonth]);

  const removeFund = useCallback((year, monthIndex, fundId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: m.funds.filter(f => f.id !== fundId),
    }));
  }, [updateMonth]);

  // --- Setup ---
  const completeSetup = useCallback((profile, sections, funds) => {
    const ratios = splitRatios(profile.earners);

    const initSections = sections.map(s => ({
      name: s.name,
      items: s.items.map(item => {
        const e1 = Math.round(item.budget * (ratios[0] || 1));
        const e2 = item.budget - e1;
        return makeItem(item.name, item.budget, e1, e2, 0, item.notes || "");
      }),
    }));

    const initFunds = funds.map(f =>
      makeFund(f.name, f.opening || 0, f.minBal || 0)
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstMonth = makeMonth(year, month, profile.earners, initSections, initFunds);

    const newState = {
      profile,
      years: { [year]: { months: [firstMonth] } },
      currentYear: year,
      setupComplete: true,
    };

    persist(newState);
  }, [persist]);

  // Export/Import
  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importData = useCallback((jsonString) => {
    const parsed = JSON.parse(jsonString);
    if (!parsed.profile || !parsed.years || parsed.setupComplete === undefined) {
      throw new Error("Invalid Divvy budget file");
    }

    // Migrate old format (bills + allocations) to sections
    for (const yearKey of Object.keys(parsed.years)) {
      const yearData = parsed.years[yearKey];
      for (const m of yearData.months) {
        if (m.bills && m.allocations && !m.sections) {
          const income = totalIncome(m.earners);
          m.sections = [
            {
              id: crypto.randomUUID(),
              name: "Bills",
              items: m.bills.map(b => ({
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
              items: m.allocations.map(a => ({
                id: crypto.randomUUID(),
                name: a.name,
                budget: a.budget || Math.round((a.pct || 0) * income / 100),
                actual: a.actual || 0,
                earner1: a.earner1 || 0,
                earner2: a.earner2 || 0,
                notes: "",
              })),
            },
          ];
          delete m.bills;
          delete m.allocations;
        }
      }
    }

    persist(parsed);
  }, [persist]);

  // Reset to empty state
  const resetData = useCallback(() => {
    persist(EMPTY_STATE);
  }, [persist]);

  return (
    <BudgetContext.Provider value={{
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
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  return useContext(BudgetContext);
}
