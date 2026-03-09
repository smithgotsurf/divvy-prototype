import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBudget } from "../context/BudgetContext";

const STEPS = ["Earners", "Bills", "Allocations", "Funds"];

export default function SetupPage() {
  const { completeSetup } = useBudget();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1: Earners
  const [earnerCount, setEarnerCount] = useState(1);
  const [earners, setEarners] = useState([
    { name: "", income: 0 },
    { name: "", income: 0 },
  ]);
  const [useSplit, setUseSplit] = useState(false);

  // Step 2: Bills
  const [bills, setBills] = useState([{ name: "", budget: 0, notes: "", autopay: false }]);

  // Step 3: Allocations
  const [allocations, setAllocations] = useState([{ name: "Grocery", pct: 13, fixed: false }]);

  // Step 4: Funds
  const [funds, setFunds] = useState([{ name: "", opening: 0, minBal: 0 }]);

  const updateEarner = (i, field, value) => {
    const next = [...earners];
    next[i] = { ...next[i], [field]: field === "income" ? (parseFloat(value) || 0) : value };
    setEarners(next);
  };

  const updateBill = (i, field, value) => {
    const next = [...bills];
    next[i] = { ...next[i], [field]: field === "budget" ? (parseFloat(value) || 0) : field === "autopay" ? value : value };
    setBills(next);
  };

  const updateAlloc = (i, field, value) => {
    const next = [...allocations];
    next[i] = { ...next[i], [field]: field === "pct" ? (parseFloat(value) || 0) : field === "fixed" ? value : value };
    setAllocations(next);
  };

  const updateFund = (i, field, value) => {
    const next = [...funds];
    next[i] = { ...next[i], [field]: ["opening", "minBal"].includes(field) ? (parseFloat(value) || 0) : value };
    setFunds(next);
  };

  const finish = () => {
    const profile = {
      earners: earners.slice(0, earnerCount).filter(e => e.name),
      useSplit: earnerCount === 2 && useSplit,
    };
    const validBills = bills.filter(b => b.name);
    const validAllocs = allocations.filter(a => a.name && a.pct > 0);
    const validFunds = funds.filter(f => f.name);
    completeSetup(profile, validBills, validAllocs, validFunds);
    navigate("/");
  };

  return (
    <div className="setup">
      <h2>Set Up Divvy</h2>
      <div className="setup-steps">
        {STEPS.map((s, i) => (
          <span key={s} className={`setup-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>{s}</span>
        ))}
      </div>

      {step === 0 && (
        <div className="setup-panel">
          <h3>How many earners?</h3>
          <div className="setup-toggle">
            <button className={earnerCount === 1 ? "active" : ""} onClick={() => setEarnerCount(1)}>1</button>
            <button className={earnerCount === 2 ? "active" : ""} onClick={() => setEarnerCount(2)}>2</button>
          </div>
          {[0, 1].slice(0, earnerCount).map(i => (
            <div key={i} className="setup-field">
              <label>Name</label>
              <input value={earners[i].name} onChange={(e) => updateEarner(i, "name", e.target.value)} />
              <label>Monthly Income</label>
              <input type="number" value={earners[i].income || ""} onChange={(e) => updateEarner(i, "income", e.target.value)} />
            </div>
          ))}
          {earnerCount === 2 && (
            <label className="setup-check">
              <input type="checkbox" checked={useSplit} onChange={(e) => setUseSplit(e.target.checked)} />
              Use proportional split for bills
            </label>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="setup-panel">
          <h3>Monthly Bills</h3>
          <p className="setup-hint">Add your recurring bills. You can always add more later.</p>
          {bills.map((b, i) => (
            <div key={i} className="setup-row">
              <input placeholder="Bill name" value={b.name} onChange={(e) => updateBill(i, "name", e.target.value)} />
              <input type="number" placeholder="Amount" value={b.budget || ""} onChange={(e) => updateBill(i, "budget", e.target.value)} />
              <input placeholder="Notes" value={b.notes} onChange={(e) => updateBill(i, "notes", e.target.value)} />
              <label className="setup-check-sm">
                <input type="checkbox" checked={b.autopay} onChange={(e) => updateBill(i, "autopay", e.target.checked)} /> Auto
              </label>
              <button className="setup-rm" onClick={() => setBills(bills.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="setup-add" onClick={() => setBills([...bills, { name: "", budget: 0, notes: "", autopay: false }])}>
            + Add Bill
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="setup-panel">
          <h3>Percentage Allocations</h3>
          <p className="setup-hint">These are income-based amounts — like grocery, charity, and savings.</p>
          {allocations.map((a, i) => (
            <div key={i} className="setup-row">
              <input placeholder="Name" value={a.name} onChange={(e) => updateAlloc(i, "name", e.target.value)} />
              <input type="number" placeholder="%" value={a.pct || ""} onChange={(e) => updateAlloc(i, "pct", e.target.value)} />
              <label className="setup-check-sm">
                <input type="checkbox" checked={a.fixed} onChange={(e) => updateAlloc(i, "fixed", e.target.checked)} /> Fixed %
              </label>
              <button className="setup-rm" onClick={() => setAllocations(allocations.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="setup-add" onClick={() => setAllocations([...allocations, { name: "", pct: 0, fixed: false }])}>
            + Add Allocation
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="setup-panel">
          <h3>Funds to Track</h3>
          <p className="setup-hint">Track account balances alongside your budget.</p>
          {funds.map((f, i) => (
            <div key={i} className="setup-row">
              <input placeholder="Fund name" value={f.name} onChange={(e) => updateFund(i, "name", e.target.value)} />
              <input type="number" placeholder="Opening balance" value={f.opening || ""} onChange={(e) => updateFund(i, "opening", e.target.value)} />
              <input type="number" placeholder="Min balance" value={f.minBal || ""} onChange={(e) => updateFund(i, "minBal", e.target.value)} />
              <button className="setup-rm" onClick={() => setFunds(funds.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="setup-add" onClick={() => setFunds([...funds, { name: "", opening: 0, minBal: 0 }])}>
            + Add Fund
          </button>
        </div>
      )}

      <div className="setup-nav">
        {step > 0 && <button className="setup-back" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 3 && <button className="setup-next" onClick={() => setStep(step + 1)}>Next</button>}
        {step === 3 && <button className="setup-finish" onClick={finish}>Start Budgeting</button>}
      </div>
    </div>
  );
}
