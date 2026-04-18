import { useEffect, useState } from 'react';
import NewsFeed from '../../components/news/NewsFeed';
import { fetchCompanies } from '../../services/stock.service';

export default function StudentNews() {
  const [companies, setCompanies]     = useState([]);
  const [selectedTicker, setSelected] = useState('');

  useEffect(() => { fetchCompanies().then(setCompanies); }, []);

  const selected = companies.find(c => c.ticker === selectedTicker);

  return (
    <div style={{ padding: '28px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Market News</h2>
        <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          Stay informed before submitting a trade request. Use news and AI analysis to support your reasoning.
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 6 }}>
          Select a company
        </label>
        <select
          value={selectedTicker}
          onChange={e => setSelected(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Syne, sans-serif', fontSize: 14, minWidth: 280 }}
        >
          <option value="">Choose a company…</option>
          {companies.map(c => (
            <option key={c.ticker} value={c.ticker}>
              {c.company_name} ({c.ticker})
            </option>
          ))}
        </select>
      </div>

      <NewsFeed
        tickers={selectedTicker ? [selectedTicker] : []}
        companyNames={selected ? [selected.company_name] : []}
      />
    </div>
  );
}
