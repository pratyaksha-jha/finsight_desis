CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) CHECK (role IN ('student', 'adult')) NOT NULL,
  budget DECIMAL(10,2) DEFAULT NULL,
  budget_used DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guardian_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) CHECK (status IN ('pending', 'active')) DEFAULT 'pending',
  invite_token VARCHAR(255),
  linked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, guardian_id)
);

CREATE TABLE IF NOT EXISTS trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  action VARCHAR(4) CHECK (action IN ('buy', 'sell')) NOT NULL,
  estimated_price DECIMAL(10,2) NOT NULL,
  reasoning TEXT,
  status VARCHAR(10) CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  parent_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);