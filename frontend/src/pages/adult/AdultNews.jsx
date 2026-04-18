import { useState } from 'react';
import NewsFeed from '../../components/news/NewsFeed';
import CompanySelector from '../../components/stock/CompanySelector';
import { useEffect } from 'react';
import { fetchCompanies } from '../../services/stock.service';

export default function AdultNews() {
  const [companies, setCompanies]     = useState([]);
  const [selectedTicker, setSelected] = useState('');

  useEffect(() => { fetchCompanies().then(setCompanies); }, []);

  const selected = companies.find(c => c.ticker === selectedTicker);

  return (
    <div style={{ padding: '28px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Market News</h2>
        <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          Live financial news with FinBERT sentiment analysis and Gemini AI explanations.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <CompanySelector
          companies={companies}
          selectedTicker={selectedTicker}
          onChange={setSelected}
        />
      </div>

      <NewsFeed
        tickers={selectedTicker ? [selectedTicker] : []}
        companyNames={selected ? [selected.company_name] : []}
      />
    </div>
  );
}
