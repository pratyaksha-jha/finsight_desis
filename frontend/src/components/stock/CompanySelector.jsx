export default function CompanySelector({ companies, selectedTicker, onChange }) {
  return (
    <select 
      value={selectedTicker} 
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: "8px", borderRadius: "8px", fontSize: "16px" }}
    >
      <option value="" disabled>Select a Company...</option>
      {/* The fallback || [] prevents the .map crash */}
      {(companies || []).map((company) => (
        <option key={company.ticker} value={company.ticker}>
          {company.company_name} ({company.ticker})
        </option>
      ))}
    </select>
  );
}