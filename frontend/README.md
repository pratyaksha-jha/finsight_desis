# FinSight Frontend (React + Vite)

This frontend is part of the FinSight monorepo. For **first-time setup**, environment variables, database migrations, and running all services together, follow the root guide:

- See `README.md` in the repo root.

## Run only the frontend

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies API calls via `vite.config.js` to:
- Node backend (`http://localhost:3000`)
- Python core (`http://localhost:8000`)
- News service (`http://localhost:8001`)
