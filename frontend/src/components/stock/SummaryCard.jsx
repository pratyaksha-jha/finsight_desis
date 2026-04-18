export default function SummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "18px",
        borderRadius: "14px",
        marginTop: "20px",
        
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      }}
    >
      <h3>AI Investment Summary</h3>

      <p><strong>Period:</strong> {summary.period}</p>
      <p><strong>Impact:</strong> {summary.impact}</p>
      <p><strong>Recommendation:</strong> {summary.recommendation}</p>
      <p><strong>Risk Level:</strong> {summary.risk_level}</p>
      <p><strong>Confidence:</strong> {summary.confidence}</p>

      <div style={{ marginTop: "12px" }}>
        <strong>Summary:</strong>
        <p>{summary.summary}</p>
      </div>

      {summary.portfolio_fit && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0"
          }}
        >
          <h4 style={{ marginBottom: "8px" }}>Portfolio Fit Analysis</h4>
          <p><strong>Fit:</strong> {summary.portfolio_fit.fit_label}</p>
          {summary.portfolio_fit.fit_score !== null && (
            <p><strong>Fit Score:</strong> {summary.portfolio_fit.fit_score}</p>
          )}
          <p>{summary.portfolio_fit.fit_reason}</p>
        </div>
      )}

      <div style={{ marginTop: "14px" }}>
        <strong>Positives:</strong>
        <ul>
          {(summary.positives || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: "14px" }}>
        <strong>Risks:</strong>
        <ul>
          {(summary.risks || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}