// --- Domain types ---

export interface Earner {
  name: string;
  income: number;
}

export interface Item {
  id: string;
  name: string;
  budget: number;
  actual: number;
  earner1: number;
  earner2: number;
  notes: string;
}

export interface Section {
  id: string;
  name: string;
  items: Item[];
}

export interface Fund {
  id: string;
  name: string;
  opening: number;
  transfersIn: number;
  transfersOut: number;
  minBal: number;
  notes: string;
}

export interface Month {
  id: string;
  year: number;
  month: number;
  earners: Earner[];
  sections: Section[];
  funds: Fund[];
}

export interface YearData {
  months: Month[];
}

export interface Profile {
  earners: Earner[];
  useSplit: boolean;
}

export interface BudgetState {
  profile: Profile;
  years: Record<number, YearData>;
  currentYear: number;
  setupComplete: boolean;
}

// --- Template types (setup wizard) ---

export interface TemplateItem {
  name: string;
  budget: number;
  notes: string;
}

export interface TemplateSection {
  name: string;
  items: TemplateItem[];
}

export interface TemplateFund {
  name: string;
  opening: number;
  minBal: number;
}

export interface Template {
  label: string;
  description: string;
  earnerCount: number;
  useSplit: boolean;
  earners: Earner[];
  sections: TemplateSection[];
  funds: TemplateFund[];
}

// --- Component-specific types ---

/** RowModal local editing state — extends Item with transient _pct field */
export interface ItemDraft extends Item {
  _pct: number;
}

// --- Context types ---

export interface BudgetContextValue {
  state: BudgetState;
  profile: Profile;
  currentYear: number;
  setupComplete: boolean;
  setCurrentYear: (year: number) => void;
  updateProfile: (profile: Profile) => void;
  getMonths: (year: number) => Month[];
  getMonth: (year: number, month: number) => Month | null;
  updateMonth: (
    year: number,
    monthIndex: number,
    updater: ((m: Month) => Month) | Partial<Month>,
  ) => void;
  cloneMonth: (year: number, fromMonthIndex: number) => void;
  removeMonth: (year: number, monthIndex: number) => void;
  addSection: (year: number, monthIndex: number, name: string) => void;
  renameSection: (year: number, monthIndex: number, sectionId: string, name: string) => void;
  removeSection: (year: number, monthIndex: number, sectionId: string) => void;
  addItem: (year: number, monthIndex: number, sectionId: string, data?: Partial<Item>) => void;
  updateItem: (
    year: number,
    monthIndex: number,
    sectionId: string,
    itemId: string,
    updates: Partial<Item>,
  ) => void;
  removeItem: (year: number, monthIndex: number, sectionId: string, itemId: string) => void;
  updateFund: (year: number, monthIndex: number, fundId: string, updates: Partial<Fund>) => void;
  addFund: (year: number, monthIndex: number, data?: Partial<Fund>) => void;
  removeFund: (year: number, monthIndex: number, fundId: string) => void;
  completeSetup: (profile: Profile, sections: TemplateSection[], funds: TemplateFund[]) => void;
  exportData: () => string;
  importData: (jsonString: string) => void;
  resetData: () => void;
}
