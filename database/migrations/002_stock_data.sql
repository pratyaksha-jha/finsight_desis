CREATE TABLE IF NOT EXISTS companies (
  ticker VARCHAR(20) PRIMARY KEY,
  company_name VARCHAR(255),
  sector VARCHAR(100),
  industry VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS daily_prices (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  open FLOAT,
  high FLOAT,
  low FLOAT,
  close FLOAT,
  volume FLOAT,
  UNIQUE(ticker, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_prices_ticker ON daily_prices(ticker);

CREATE INDEX IF NOT EXISTS idx_daily_prices_date ON daily_prices(date);

CREATE TABLE IF NOT EXISTS historical_reports (
  ticker VARCHAR(20) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  date VARCHAR(20),
  revenue BIGINT,
  gross_profit BIGINT,
  gross_margin FLOAT,
  net_income BIGINT,
  net_margin FLOAT,
  operating_cash_flow BIGINT,
  free_cash_flow BIGINT,
  eps FLOAT,
  PRIMARY KEY (ticker, fiscal_year)
);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  quantity FLOAT NOT NULL,
  avg_buy_price FLOAT,
  sector VARCHAR(100),
  current_price FLOAT,
  current_value FLOAT
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_holdings(user_id);