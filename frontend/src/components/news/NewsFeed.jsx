import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom'; // Added to read the URL
import { fetchNewsFeed } from '../../services/news.service';

const SENTIMENT_STYLE = {
  POSITIVE: { bg: '#f0fdf4', color: '#16a34a', label: '▲ Positive' },
  NEGATIVE: { bg: '#fff1f1', color: '#dc2626', label: '▼ Negative' },
  NEUTRAL:  { bg: '#f5f4f0', color: '#6b6860', label: '● Neutral'  },
};

const IMPACT_STYLE = {
  HIGH:   { bg: '#fef3c7', color: '#d97706' },
  MEDIUM: { bg: '#eff4ff', color: '#2563eb' },
  LOW:    { bg: '#f5f4f0', color: '#a8a49c' },
};

function ArticleCard({ article }) {
  const [expanded, setExpanded] = useState(false);
  const sentiment = SENTIMENT_STYLE[article.sentiment_label] || SENTIMENT_STYLE.NEUTRAL;
  const impact    = article.impact_level ? IMPACT_STYLE[article.impact_level] : null;

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 60)  return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 18px', marginBottom: 10,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <a
            href={article.source_url} target="_blank" rel="noreferrer"
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', lineHeight: 1.5 }}
          >
            {article.title}
          </a>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {article.source_name} · {timeAgo(article.published_at)}
            </span>
            {article.tickers.map(t => (
              <span key={t} style={{ padding: '2px 8px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
          {article.sentiment_label && (
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sentiment.bg, color: sentiment.color }}>
              {sentiment.label}
            </span>
          )}
          {impact && (
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: impact.bg, color: impact.color }}>
              {article.impact_level} impact
            </span>
          )}
        </div>
      </div>

      {article.ai_explanation && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: 'var(--accent)',
              fontFamily: 'Syne, sans-serif', padding: 0,
            }}
          >
            {expanded ? '▲ Hide AI analysis' : '▼ Show AI analysis'}
          </button>
          {expanded && (
            <div style={{
              marginTop: 8, padding: '12px 14px', background: 'var(--accent-soft)',
              borderRadius: 8, fontSize: 12, lineHeight: 1.7, color: 'var(--text)',
            }}>
              {article.ai_explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewsFeed({ tickers, companyNames }) {
  const [searchParams] = useSearchParams();
  const urlSymbol = searchParams.get('symbol');

  // Combine prop tickers with URL ticker so both methods work seamlessly
  const activeTickers = tickers?.length > 0 ? tickers : (urlSymbol ? [urlSymbol] : []);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState('fast');
  const [filter, setFilter]     = useState('ALL');

  const load = async (analysisMode = mode) => {
    if (!activeTickers || activeTickers.length === 0) return;
    setLoading(true);
    const data = await fetchNewsFeed({ tickers: activeTickers, companyNames, analysisMode, timeWindowHours: 72 });
    setArticles(data.articles || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeTickers.join(',')]);

  const filtered = filter === 'ALL'
    ? articles
    : articles.filter(a => a.sentiment_label === filter);

  if (!activeTickers || activeTickers.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>Select a stock to see related news.</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)',
                background: filter === f ? 'var(--accent)' : 'var(--surface)',
                color: filter === f ? '#fff' : 'var(--text-soft)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Analysis:</span>
          {['none', 'fast', 'full'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); load(m); }}
              style={{
                padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                background: mode === m ? 'var(--accent-soft)' : 'var(--surface)',
                color: mode === m ? 'var(--accent)' : 'var(--text-soft)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
              }}
            >
              {m}
            </button>
          ))}
          <button
            onClick={() => load()}
            style={{
              padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Syne, sans-serif', color: 'var(--text-soft)',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Fetching news…</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No articles found for the selected filter.</p>
      )}

      {filtered.map(a => <ArticleCard key={a.id} article={a} />)}
    </div>
  );
}