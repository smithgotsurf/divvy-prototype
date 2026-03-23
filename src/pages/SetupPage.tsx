import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBudget } from "../context/BudgetContext";
import { TEMPLATES } from "../data";
import type { Template, Earner, TemplateSection, TemplateFund } from "../types";
import { totalIncome } from "../shared/helpers";

interface SetupItem {
  name: string;
  budget: number;
  notes: string;
}

interface SetupSection {
  name: string;
  items: SetupItem[];
}

const STEPS = ["Start", "Earners", "Budget Items", "Funds"];

export default function SetupPage() {
  const { completeSetup } = useBudget();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);

  const [earnerCount, setEarnerCount] = useState(1);
  const [earners, setEarners] = useState<Earner[]>([
    { name: "", income: 0 },
    { name: "", income: 0 },
  ]);
  const [useSplit, setUseSplit] = useState(false);

  const [sections, setSections] = useState<SetupSection[]>([
    { name: "Bills", items: [{ name: "", budget: 0, notes: "" }] },
  ]);

  const [funds, setFunds] = useState<TemplateFund[]>([{ name: "", opening: 0, minBal: 0 }]);

  const income = totalIncome(earners.slice(0, earnerCount));

  const applyTemplate = (t: Template) => {
    setEarnerCount(t.earnerCount);
    setEarners([...t.earners]);
    setUseSplit(t.useSplit);
    setSections(
      t.sections.map((s) => ({
        name: s.name,
        items: s.items.map((item) => ({ ...item })),
      })),
    );
    setFunds([...t.funds]);
    setStep(1);
  };

  // Apply template from URL params on initial mount only
  useEffect(() => {
    const key = searchParams.get("template");
    if (key && TEMPLATES[key]) {
      applyTemplate(TEMPLATES[key]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateEarner = (i: number, field: string, value: string) => {
    const next = [...earners];
    next[i] = { ...next[i], [field]: field === "income" ? parseFloat(value) || 0 : value };
    setEarners(next);
  };

  const updateSectionName = (si: number, name: string) => {
    const next = [...sections];
    next[si] = { ...next[si], name };
    setSections(next);
  };

  const updateSectionItem = (si: number, ii: number, field: string, value: string) => {
    const next = [...sections];
    const items = [...next[si].items];
    items[ii] = { ...items[ii], [field]: field === "budget" ? parseFloat(value) || 0 : value };
    next[si] = { ...next[si], items };
    setSections(next);
  };

  const addItemToSection = (si: number) => {
    const next = [...sections];
    next[si] = { ...next[si], items: [...next[si].items, { name: "", budget: 0, notes: "" }] };
    setSections(next);
  };

  const removeItemFromSection = (si: number, ii: number) => {
    const next = [...sections];
    next[si] = { ...next[si], items: next[si].items.filter((_, j) => j !== ii) };
    setSections(next);
  };

  const addSection = () => {
    setSections([
      ...sections,
      { name: "New Section", items: [{ name: "", budget: 0, notes: "" }] },
    ]);
  };

  const removeSection = (si: number) => {
    setSections(sections.filter((_, i) => i !== si));
  };

  const updateFund = (i: number, field: string, value: string) => {
    const next = [...funds];
    next[i] = {
      ...next[i],
      [field]: ["opening", "minBal"].includes(field) ? parseFloat(value) || 0 : value,
    };
    setFunds(next);
  };

  const finish = () => {
    const profile = {
      earners: earners.slice(0, earnerCount).filter((e) => e.name),
      useSplit: earnerCount === 2 && useSplit,
    };
    const validSections: TemplateSection[] = sections
      .map((s) => ({
        name: s.name,
        items: s.items.filter((item) => item.name),
      }))
      .filter((s) => s.items.length > 0);
    const validFunds: TemplateFund[] = funds.filter((f) => f.name);
    completeSetup(profile, validSections, validFunds);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-base-200">
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-4">Set Up Divvy</h2>
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${i <= step ? "bg-primary text-primary-content" : "border border-base-300 text-secondary"}`}
          >
            {s}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="card bg-base-100 shadow-sm p-6">
          <h3>Choose a starting point</h3>
          <div className="flex flex-col gap-3">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                className="card bg-base-100 border border-base-300 p-4 cursor-pointer hover:border-primary text-left"
                onClick={() => applyTemplate(t)}
              >
                <h4 className="font-bold">{t.label}</h4>
                <p className="text-sm text-secondary">{t.description}</p>
              </button>
            ))}
            <button
              className="card bg-base-100 border border-base-300 p-4 cursor-pointer hover:border-primary text-left"
              onClick={() => setStep(1)}
            >
              <h4 className="font-bold">Start blank</h4>
              <p className="text-sm text-secondary">Set up everything from scratch</p>
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card bg-base-100 shadow-sm p-6">
          <h3 className="mb-4">How many earners?</h3>
          <div className="join mb-6">
            <button
              className={`btn join-item${earnerCount === 1 ? " btn-active" : ""}`}
              onClick={() => setEarnerCount(1)}
            >
              1
            </button>
            <button
              className={`btn join-item${earnerCount === 2 ? " btn-active" : ""}`}
              onClick={() => setEarnerCount(2)}
            >
              2
            </button>
          </div>
          {[0, 1].slice(0, earnerCount).map((i) => (
            <div key={i} className="mb-4 pb-4 border-b border-base-300 last:border-0 last:pb-0 last:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium w-20">Name</label>
                <input
                  className="input input-bordered flex-1"
                  value={earners[i].name}
                  onChange={(e) => updateEarner(i, "name", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-20">Income</label>
                <input
                  className="input input-bordered w-32"
                  type="number"
                  value={earners[i].income || ""}
                  onChange={(e) => updateEarner(i, "income", e.target.value)}
                />
                <span className="text-xs text-secondary">/ month</span>
              </div>
            </div>
          ))}
          {earnerCount === 2 && (
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={useSplit}
                onChange={(e) => setUseSplit(e.target.checked)}
              />
              <span className="text-sm">Use proportional split for bills</span>
            </label>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="card bg-base-100 shadow-sm p-6">
          <h3>Budget Items</h3>
          <p className="text-sm text-secondary mb-4">
            Organize your budget into sections. You can always add more later.
          </p>
          {sections.map((s, si) => (
            <div key={si} className="mb-6 p-4 border border-base-300 rounded-sm">
              <div className="flex items-center gap-2 mb-3">
                <input
                  className="input input-bordered flex-1"
                  value={s.name}
                  onChange={(e) => updateSectionName(si, e.target.value)}
                  placeholder="Section name"
                />
                {sections.length > 1 && (
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => {
                      if (confirm(`Remove "${s.name}" and all its items?`)) removeSection(si);
                    }}
                    title="Remove section"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-base-content/50 uppercase">
                <span className="flex-1">Name</span>
                <span className="w-28 text-right">Amount</span>
                <span className="w-14 text-right">%</span>
                <span className="w-6"></span>
              </div>
              {s.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-2 mb-2">
                  <input
                    className="input input-bordered flex-1"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateSectionItem(si, ii, "name", e.target.value)}
                  />
                  <input
                    className="input input-bordered w-28"
                    type="number"
                    placeholder="Amount"
                    value={item.budget || ""}
                    onChange={(e) => updateSectionItem(si, ii, "budget", e.target.value)}
                  />
                  <span className="text-sm text-secondary w-14 text-right font-mono">
                    {item.budget && income > 0
                      ? `${Math.round((item.budget / income) * 10000) / 100}%`
                      : ""}
                  </span>
                  <button
                    className="btn btn-ghost btn-xs text-error w-6"
                    onClick={() => {
                      if (confirm(`Remove "${item.name || "this item"}"?`))
                        removeItemFromSection(si, ii);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm mt-2 w-fit" onClick={() => addItemToSection(si)}>
                + Add Item
              </button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm mt-4 w-fit" onClick={addSection}>
            + Add Section
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card bg-base-100 shadow-sm p-6">
          <h3>Funds to Track</h3>
          <p className="text-sm text-secondary mb-4">
            Track account balances alongside your budget.
          </p>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-base-content/50 uppercase">
            <span className="flex-1">Name</span>
            <span className="w-28 text-right">Opening</span>
            <span className="w-28 text-right">Min</span>
            <span className="w-6"></span>
          </div>
          {funds.map((f, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input
                className="input input-bordered flex-1"
                placeholder="Fund name"
                value={f.name}
                onChange={(e) => updateFund(i, "name", e.target.value)}
              />
              <input
                className="input input-bordered w-28"
                type="number"
                placeholder="Opening"
                value={f.opening || ""}
                onChange={(e) => updateFund(i, "opening", e.target.value)}
              />
              <input
                className="input input-bordered w-28"
                type="number"
                placeholder="Min"
                value={f.minBal || ""}
                onChange={(e) => updateFund(i, "minBal", e.target.value)}
              />
              <button
                className="btn btn-ghost btn-xs text-error w-6"
                onClick={() => setFunds(funds.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="btn btn-ghost btn-sm mt-2 w-fit"
            onClick={() => setFunds([...funds, { name: "", opening: 0, minBal: 0 }])}
          >
            + Add Fund
          </button>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step > 0 && step < 3 && (
          <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
            Next
          </button>
        )}
        {step === 3 && (
          <button className="btn btn-primary" onClick={finish}>
            Start Budgeting
          </button>
        )}
      </div>
    </div>
    </div>
  );
}
