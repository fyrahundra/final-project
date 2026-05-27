# Final Project — Local Development

This repository contains the `coursley` SvelteKit application and a small `python_api` service used by the editor runtime. These instructions cover running the app locally (Postgres DB, Svelte dev server, Python runner).

## Prerequisites
- Node.js (v18+) and `pnpm` (or `npm` if preferred)
- Docker (for running a local Postgres instance)
- Python 3.10+ (for the `python_api` service)

If you don't have `pnpm` installed you can install it globally:

```bash
npm install -g pnpm
```

Or enable Corepack (modern Node versions):

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Environment variables

The Svelte app reads configuration from `coursley/.env`. Copy the file and update the `DATABASE_URL` to point to your local Postgres when running locally. Example `.env` values for local development:

```
# coursley/.env (example for local Postgres)
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
NODE_ENV="development"
RTE_AUTOSAVE_INTERVAL_MS="30000"
# Cloudinary (if you use uploads in local testing, set real keys)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

The `python_api` service has optional env vars you can set (defaults are safe for local dev):

- `RUN_TIMEOUT_SECONDS` (default 20)
- `WORKER_CONCURRENCY` (default 4)
- `MAX_QUEUE_LENGTH` (default 16)

## Start a local Postgres with Docker

Run a Postgres container (example credentials used in the repo during development):

```bash
docker run --name db -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=user -e POSTGRES_DB=db -d -p 5432:5432 --rm postgres
```

This creates a DB with user `user`, password `pass`, and database `db`. Make sure `coursley/.env` uses the matching `DATABASE_URL`:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

If you already have Postgres running elsewhere, point `DATABASE_URL` accordingly.

## Install and run the Svelte app (coursley)

1. Install dependencies (from repo root or inside `coursley`):

```bash
cd coursley
pnpm install
```

2. Run the dev server:

```bash
pnpm dev
```

By default SvelteKit serves on `http://localhost:5173`. The editor runtime (`python_api`) expects the Svelte dev client origin at port `5173` by default.

## Install and run the Python API (code runner)

1. Create a virtual environment and install requirements:

```bash
cd ../python_api
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
.venv\\Scripts\\Activate.ps1 # Windows PowerShell
pip install -r requirements.txt
```

2. Run the API with Uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`. The Svelte app is configured to allow CORS from `http://localhost:5173`.

## Notes about the database schema and migrations

- This project uses Drizzle for schema definitions and contains SQL files under `coursley/drizzle/`.
- There is no automated migration runner included here; if you need to apply schema files, run them against your local database using `psql` or a client. Example:

```bash
psql postgresql://user:pass@localhost:5432/db -f coursley/drizzle/0000_curly_lady_bullseye.sql
```

Run SQL files in order to create the required schema, or adapt to your migration tooling.

## Common troubleshooting
- If you get DB connection errors, confirm `DATABASE_URL` is correct and Postgres is reachable on `localhost:5432`.
- If Cloudinary uploads are required for a feature, set the `CLOUDINARY_*` variables in `coursley/.env`.
- If ports conflict, change the Svelte dev port or Python API port and update CORS/allowed origins accordingly.

## Helpful commands summary

```bash
# Start local Postgres
docker run --name db -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=user -e POSTGRES_DB=db -d -p 5432:5432 --rm postgres

# Svelte app
cd coursley
pnpm install
pnpm dev

# Python API
cd python_api
python -m venv .venv
source .venv/bin/activate   # or .venv\\Scripts\\Activate.ps1 on Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

If you'd like, I can also add a simple `Makefile` or npm scripts to orchestrate starting Docker, running migrations, and launching both services together. Tell me if you want that and I will add it.
