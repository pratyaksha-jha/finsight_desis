import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const formatLargeNumber = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  return value.toFixed ? value.toFixed(2) : value;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        background: "#ffffff",
        padding: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      }}
    >
      <p style={{ margin: 0, fontWeight: "bold", marginBottom: "8px" , color :"#333"}}>
        Year: {label} 
      </p>
      {payload.map((entry, index) => (
        <p key={index} style={{ margin: "4px 0", color: entry.color }}>
          {entry.name}: {formatLargeNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function FinancialChart({ data }) {
  if (!data || data.length === 0) {
    return <p>No financial trend data available.</p>;
  }

  return (
    <div
      style={{
        width: "100%",
        height: 450,
        marginTop: "20px",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ marginBottom: "16px" }}>5-Year Financial Trends</h3>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 13 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tickFormatter={formatLargeNumber}
            tick={{ fontSize: 13 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />

          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="gross_profit"
            name="Gross Profit"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="net_income"
            name="Net Income"
            stroke="#dc2626"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="operating_cash_flow"
            name="Operating Cash Flow"
            stroke="#7c3aed"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="free_cash_flow"
            name="Free Cash Flow"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="eps"
            name="EPS"
            stroke="#0891b2"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}