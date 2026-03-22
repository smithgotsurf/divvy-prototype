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
    <div className="setup">
      <h2>Set Up Divvy</h2>
      <div className="setup-steps">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`setup-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
          >
            {s}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="setup-panel">
          <h3>Choose a starting point</h3>
          <div className="setup-templates">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button key={key} className="setup-tpl-card" onClick={() => applyTemplate(t)}>
                <h4>{t.label}</h4>
                <p>{t.description}</p>
              </button>
            ))}
            <button className="setup-tpl-card" onClick={() => setStep(1)}>
              <h4>Start blank</h4>
              <p>Set up everything from scratch</p>
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="setup-panel">
          <h3>How many earners?</h3>
          <div className="setup-toggle">
            <button className={earnerCount === 1 ? "active" : ""} onClick={() => setEarnerCount(1)}>
              1
            </button>
            <button className={earnerCount === 2 ? "active" : ""} onClick={() => setEarnerCount(2)}>
              2
            </button>
          </div>
          {[0, 1].slice(0, earnerCount).map((i) => (
            <div key={i} className="setup-field">
              <label>Name</label>
              <input
                value={earners[i].name}
                onChange={(e) => updateEarner(i, "name", e.target.value)}
              />
              <label>Monthly Income</label>
              <input
                type="number"
                value={earners[i].income || ""}
                onChange={(e) => updateEarner(i, "income", e.target.value)}
              />
            </div>
          ))}
          {earnerCount === 2 && (
            <label className="setup-check">
              <input
                type="checkbox"
                checked={useSplit}
                onChange={(e) => setUseSplit(e.target.checked)}
              />
              Use proportional split for bills
            </label>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="setup-panel">
          <h3>Budget Items</h3>
          <p className="setup-hint">
            Organize your budget into sections. You can always add more later.
          </p>
          {sections.map((s, si) => (
            <div key={si} className="setup-section-group">
              <div className="setup-section-hdr">
                <input
                  className="setup-section-name"
                  value={s.name}
                  onChange={(e) => updateSectionName(si, e.target.value)}
                  placeholder="Section name"
                />
                {sections.length > 1 && (
                  <button
                    className="setup-rm"
                    onClick={() => {
                      if (confirm(`Remove "${s.name}" and all its items?`)) removeSection(si);
                    }}
                    title="Remove section"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="setup-row setup-row-hdr">
                <span>Name</span>
                <span className="hdr-num">Amount</span>
                <span className="hdr-num">%</span>
                <span></span>
              </div>
              {s.items.map((item, ii) => (
                <div key={ii} className="setup-row">
                  <input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateSectionItem(si, ii, "name", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.budget || ""}
                    onChange={(e) => updateSectionItem(si, ii, "budget", e.target.value)}
                  />
                  <span className="setup-pct-display">
                    {item.budget && income > 0
                      ? `${Math.round((item.budget / income) * 10000) / 100}%`
                      : ""}
                  </span>
                  <button
                    className="setup-rm"
                    onClick={() => {
                      if (confirm(`Remove "${item.name || "this item"}"?`))
                        removeItemFromSection(si, ii);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="setup-add" onClick={() => addItemToSection(si)}>
                + Add Item
              </button>
            </div>
          ))}
          <button className="setup-add" onClick={addSection} style={{ marginTop: 16 }}>
            + Add Section
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="setup-panel">
          <h3>Funds to Track</h3>
          <p className="setup-hint">Track account balances alongside your budget.</p>
          <div className="setup-row setup-row-hdr">
            <span>Name</span>
            <span className="hdr-num">Opening</span>
            <span className="hdr-num">Min</span>
            <span></span>
          </div>
          {funds.map((f, i) => (
            <div key={i} className="setup-row">
              <input
                placeholder="Fund name"
                value={f.name}
                onChange={(e) => updateFund(i, "name", e.target.value)}
              />
              <input
                type="number"
                placeholder="Opening balance"
                value={f.opening || ""}
                onChange={(e) => updateFund(i, "opening", e.target.value)}
              />
              <input
                type="number"
                placeholder="Min balance"
                value={f.minBal || ""}
                onChange={(e) => updateFund(i, "minBal", e.target.value)}
              />
              <button
                className="setup-rm"
                onClick={() => setFunds(funds.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="setup-add"
            onClick={() => setFunds([...funds, { name: "", opening: 0, minBal: 0 }])}
          >
            + Add Fund
          </button>
        </div>
      )}

      <div className="setup-nav">
        {step > 0 && (
          <button className="setup-back" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step > 0 && step < 3 && (
          <button className="setup-next" onClick={() => setStep(step + 1)}>
            Next
          </button>
        )}
        {step === 3 && (
          <button className="setup-finish" onClick={finish}>
            Start Budgeting
          </button>
        )}
      </div>
    </div>
  );
}
