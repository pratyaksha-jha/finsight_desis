CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Links to the user
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  target_price NUMERIC NOT NULL,
  last_price NUMERIC DEFAULT 0,
  notes TEXT,
  alert_triggered BOOLEAN DEFAULT FALSE,
  alert_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, symbol) -- Prevents the same user from adding AAPL twice, but allows different users to add AAPL
);

CREATE TABLE IF NOT EXISTS comparison (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Links to the user
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  entry_price NUMERIC,
  target_price NUMERIC,
  stop_loss NUMERIC,
  reason TEXT,
  expected_return_pct NUMERIC,
  downside_risk NUMERIC,
  risk_score NUMERIC,
  sharpe_ratio NUMERIC,
  risk_reward_ratio NUMERIC,
  volatility NUMERIC,
  recommendation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);