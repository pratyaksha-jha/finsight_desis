import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { allocateBudget } from '../../services/parental.service';

export default function BudgetTracker({ student, onUpdate }) {
  const { token } = useAuth();
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const remaining = (student.budget || 0) - (student.budget_used || 0);
  const usedPct = student.budget ? (student.budget_used / student.budget) * 100 : 0;

  const handleSet = async () => {
    setSaving(true);
    await allocateBudget(token, student.id, parseFloat(amount));
    onUpdate?.();
    setSaving(false);
    setAmount('');
  };

  return (
    <div className="budget-tracker">
      <div className="budget-amounts">
        <span>Total: ${Number(student.budget || 0).toFixed(2)}</span>
        <span>Used: ${Number(student.budget_used || 0).toFixed(2)}</span>
        <span>Remaining: ${remaining.toFixed(2)}</span>
      </div>

      <div className="budget-bar">
        <div className="fill" style={{ width: `${Math.min(usedPct, 100)}%` }}/>
      </div>

      <div className="set-budget">
        <input type="number" placeholder="Set new budget"
          value={amount} onChange={e => setAmount(e.target.value)}/>
        <button onClick={handleSet} disabled={saving || !amount}>
          {saving ? 'Saving…' : 'Update Budget'}
        </button>
      </div>
    </div>
  );
}