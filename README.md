# FinSight 📈
A role-based, AI-powered portfolio analytics and trading simulator designed for students and guardians. 

## 🏗️ Architecture
FinSight operates as a monorepo with four distinct microservices:
1. **Frontend (`:5173`)**: React + Vite (UI, Charts, Dashboards).
2. **Node Backend (`:3000`)**: Express.js (Auth, Guardian-Student links, Postgres DB ops).
3. **Python Core (`:8000`)**: FastAPI (Portfolio Math, MPT Analysis, OpenAI Summaries).
4. **News Service (`:8001`)**: FastAPI (RSS Scraping, FinBERT Sentiment AI).

---

## ⚙️ Prerequisites
* **Node.js** (v18+)
* **Python** (v3.12+)
* **PostgreSQL** (Running on port 5432)

---

## 🚀 1. Installation
To install all dependencies for all four services at once, simply run the setup script from the root directory:

**Windows:**
Double-click `setup.bat` or run:
```bash
.\setup.bat
```

**Mac/Linux**
```bash
cd frontend && npm install && cd ..
cd backend-node && npm install && cd ..
cd backend-python && pip install -r requirements.txt && cd ..
cd news-service && pip install -r requirements.txt && cd ..
```

## 2. Environment Variables
Create a single file named .env in the ROOT of the project (deshaw-main/.env). Do not put .env files inside the individual service folders.
```bash
# --- General ---
ENVIRONMENT=development
JWT_SECRET=your_super_secret_jwt_key_here

# --- Database (Node.js) ---
PGUSER=postgres
PGPASSWORD=YourPostgresPassword
PGHOST=localhost
PGPORT=5432
PGDATABASE=finsight

# --- Database (Python) ---
DATABASE_URL=postgresql://postgres:YourPostgresPassword@localhost:5432/finsight

# --- AI & External APIs ---
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
NEWSAPI_KEY=your-news-api-key
```

## 3. Database Setup
1. Ensure PostgreSQL is running on port 5432.

2. Create a database named `finsight`.

3. Run migrations (recommended):

```bash
npm run migrate --prefix backend-node
```

This applies `database/migrations/001_...` through `004_...` automatically and uses the same `PG*` variables from your root `.env`.

## 4. First-run data sync (required for charts/AI)
After the services are running, open `http://localhost:8000/docs` and run these once:

1. `POST /companies/sync`
2. `POST /financials/sync-all/now`
3. `POST /prices/update-all`

## 5. Running the App
To start all four servers simultaneously, run the root orchestrator from the deshaw-main folder:

```Bash
npm run dev
```
(Note: This requires a root package.json configured with the concurrently package).

Expected Output:

Frontend running at http://localhost:5173

Node API running at http://localhost:3000

Python Core running at http://localhost:8000/docs

News Service running at http://localhost:8001/docs

## Troubleshooting checklist
- **Migrations fail**: verify `.env` has `PGUSER/PGPASSWORD/PGHOST/PGPORT/PGDATABASE` and the `finsight` DB exists.
- **Python can’t connect to DB**: verify `.env` has `DATABASE_URL=postgresql://.../finsight`.
- **News service install is slow**: `torch` + `transformers` can take time on first install.
