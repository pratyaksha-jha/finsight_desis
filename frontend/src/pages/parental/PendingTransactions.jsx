import { useEffect, useState } from 'react';
import TransactionApprovalCard from '../../components/parental/TransactionApprovalCard';
import { useAuth } from '../../hooks/useAuth';

import { approveTrade, getPendingTrades, rejectTrade } from '../../services/parental.service';

export default function PendingTransactions() {
  const { token, user } = useAuth();
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);  // ← increment this to reload

  useEffect(() => {
    if (!token) return;
    let active = true;
    getPendingTrades(token)
      .then(data  => { if (active) setTrades(data); })
      .catch(()   => { if (active) setTrades([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, refresh]);  // ← re-runs when refresh changes

  const reload = () => setRefresh(r => r + 1);

  const handleApprove = async (tradeId, comment) => {
    await approveTrade(token, tradeId, comment);
    reload();
  };

  const handleReject = async (tradeId, comment) => {
    await rejectTrade(token, tradeId, comment);
    reload();
  };

  if (loading) return <p>Loading…</p>;
  if (!trades.length) return <p>No pending trade requests.</p>;

  return (
    <div>
      {trades.map(trade => (
        <TransactionApprovalCard
          key={trade.id}
          trade={trade}
          onApprove={(comment) => handleApprove(trade.id, comment)}
          onReject={(comment)  => handleReject(trade.id, comment)}
        />
      ))}
    </div>
  );
}