DROP TABLE IF EXISTS holdings;


CREATE TABLE IF NOT EXISTS holdings (
  id              SERIAL PRIMARY KEY,
  user_id         VARCHAR(255) NOT NULL DEFAULT 'default',
  ticker          VARCHAR(20) NOT NULL,
  sector          VARCHAR(50) NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  avg_buy_price   NUMERIC(12, 2) NOT NULL CHECK (avg_buy_price > 0),
  current_price   NUMERIC(12, 2) NOT NULL CHECK (current_price > 0),
  uploaded_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holdings_ticker ON holdings(ticker);

CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);