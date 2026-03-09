import { createContext, useContext, useState, useCallback } from "react";
import { STORAGE_KEY, EMPTY_STATE, makeMonth, makeBill, makeAllocation, makeFund } from "../data";
import { totalIncome, splitRatios, allocAmount, fundClosing } from "../shared/helpers";

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

      // Clone bills (keep budget + earner splits, zero out actuals)
      const newBills = source.bills.map(b => ({
        ...b,
        id: crypto.randomUUID(),
        actual: 0,
      }));

      // Clone allocations (zero out actuals)
      const newAllocs = source.allocations.map(a => ({
        ...a,
        id: crypto.randomUUID(),
        actual: 0,
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
        bills: newBills,
        allocations: newAllocs,
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

  // --- Bill CRUD within a month ---
  const updateBill = useCallback((year, monthIndex, billId, updates) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      bills: m.bills.map(b => b.id === billId ? { ...b, ...updates } : b),
    }));
  }, [updateMonth]);

  const addBill = useCallback((year, monthIndex) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      bills: [...m.bills, makeBill("New Bill", 0, 0, 0)],
    }));
  }, [updateMonth]);

  const removeBill = useCallback((year, monthIndex, billId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      bills: m.bills.filter(b => b.id !== billId),
    }));
  }, [updateMonth]);

  // --- Allocation CRUD within a month ---
  const updateAllocation = useCallback((year, monthIndex, allocId, updates) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      allocations: m.allocations.map(a => a.id === allocId ? { ...a, ...updates } : a),
    }));
  }, [updateMonth]);

  const addAllocation = useCallback((year, monthIndex) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      allocations: [...m.allocations, makeAllocation("New Allocation", 0, false, 0, 0)],
    }));
  }, [updateMonth]);

  const removeAllocation = useCallback((year, monthIndex, allocId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      allocations: m.allocations.filter(a => a.id !== allocId),
    }));
  }, [updateMonth]);

  // --- Fund CRUD within a month ---
  const updateFund = useCallback((year, monthIndex, fundId, updates) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: m.funds.map(f => f.id === fundId ? { ...f, ...updates } : f),
    }));
  }, [updateMonth]);

  const addFund = useCallback((year, monthIndex) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: [...m.funds, makeFund("New Fund", 0, 0)],
    }));
  }, [updateMonth]);

  const removeFund = useCallback((year, monthIndex, fundId) => {
    updateMonth(year, monthIndex, (m) => ({
      ...m,
      funds: m.funds.filter(f => f.id !== fundId),
    }));
  }, [updateMonth]);

  // --- Setup ---
  const completeSetup = useCallback((profile, bills, allocations, funds) => {
    const income = totalIncome(profile.earners);
    const ratios = splitRatios(profile.earners);

    const initBills = bills.map(b => {
      const e1 = Math.round(b.budget * (ratios[0] || 1));
      const e2 = b.budget - e1;
      return makeBill(b.name, b.budget, e1, e2, 0, b.notes || "", b.autopay || false);
    });

    const initAllocations = allocations.map(a => {
      const amt = allocAmount(a.pct, income);
      const e1 = Math.round(amt * (ratios[0] || 1));
      const e2 = amt - e1;
      return makeAllocation(a.name, a.pct, a.fixed || false, e1, e2);
    });

    const initFunds = funds.map(f =>
      makeFund(f.name, f.opening || 0, f.minBal || 0)
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstMonth = makeMonth(year, month, profile.earners, initBills, initAllocations, initFunds);

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
      updateBill,
      addBill,
      removeBill,
      updateAllocation,
      addAllocation,
      removeAllocation,
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
