import { useEffect, useState } from 'react';
import { fetchCompanies, fetchFinancials, fetchPrices, fetchSummary } from '../../services/stock.service';
import CompanySelector from '../../components/stock/CompanySelector';
import PriceChart from '../../components/stock/PriceChart';
import FinancialChart from '../../components/stock/FinancialChart';
import SummaryCard from '../../components/stock/SummaryCard';
import { useAuth } from '../../hooks/useAuth';

export default function StockAnalysis() {
  const { user } = useAuth();
  const [companies, setCompanies]       = useState([]);
  const [selectedTicker, setSelected]   = useState('');
  const [financials, setFinancials]     = useState([]);
  const [dailyPrices, setDailyPrices]   = useState([]);
  const [yearlyPrices, setYearlyPrices] = useState([]);
  const [summary, setSummary]           = useState(null);

  useEffect(() => {
    fetchCompanies().then(setCompanies);
  }, []);

  useEffect(() => {
    if (!selectedTicker) return;
    const uid = user?.id || null;
    Promise.all([
      fetchFinancials(selectedTicker),
      fetchPrices(selectedTicker, '1m'),
      fetchPrices(selectedTicker, '1y'),
      fetchSummary(selectedTicker, uid),
    ]).then(([fin, daily, yearly, sum]) => {
      setFinancials(fin.financials || []);
      setDailyPrices(daily.prices || []);
      setYearlyPrices(yearly.prices || []);
      setSummary(sum);
    });
  }, [selectedTicker, user?.id]);

  return (
    <div style={{ padding: '28px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Stock Analysis</h2>
        <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          Select a company to view financial history, price trends, and AI-powered investment insights.
        </p>
      </div>

      <CompanySelector
        companies={companies}
        selectedTicker={selectedTicker}
        onChange={setSelected}
      />

      {!selectedTicker && (
        <p style={{ marginTop: 32, color: 'var(--text-muted)', fontSize: 13 }}>
          Please select a company to view its financial dashboard.
        </p>
      )}

      {selectedTicker && (
        <>
          <div style={{ marginTop: 32 }}>
            <PriceChart data={dailyPrices} title="Daily Stock Price (Last 1 Month)" />
          </div>
          <div style={{ marginTop: 40 }}>
            <PriceChart data={yearlyPrices} title="Price Trend (Last 1 Year)" />
          </div>
          <div style={{ marginTop: 32 }}>
            <FinancialChart data={financials} />
          </div>
          <div style={{ marginTop: 24 }}>
            <SummaryCard summary={summary} />
          </div>
        </>
      )}
    </div>
  );
}
