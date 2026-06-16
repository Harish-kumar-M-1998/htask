# Deploy Htask — GitHub + GitHub Actions + Render

End-to-end guide to push this monorepo to GitHub, run CI on every push, and deploy on [Render](https://render.com).

---

## Architecture on Render

| Service | Render type | Purpose |
|---------|-------------|---------|
| `htask-api` | Web Service (Docker) | Express API + Prisma |
| `htask-web` | Static Site | React/Vite frontend |
| `htask-db` | PostgreSQL | Database |
| `htask-redis` | Key Value (Redis) | Cache / search |

```
Browser → htask-web.onrender.com (static)
              ↓ VITE_API_URL
         htask-api.onrender.com/api/v1
              ↓
         PostgreSQL + Redis
```

---

## Part 1 — Push to GitHub

### 1.1 Prerequisites

- [Git](https://git-scm.com/) installed
- [GitHub](https://github.com) account
- Node.js 20+ (for local verification)

### 1.2 Create the repository on GitHub

1. Go to https://github.com/new
2. Repository name: `htask` (or your choice)
3. **Private** recommended (contains business logic)
4. Do **not** add README, .gitignore, or license (this project already has them)
5. Click **Create repository**

### 1.3 Initialize git and push (first time)

From the project root:

```bash
cd /home/harish/Projects/Cursor/Htask

# Initialize repo
git init
git branch -M main

# Verify secrets are NOT committed (.env is in .gitignore)
git status

# Stage everything except ignored files
git add .
git commit -m "Initial commit: Htask monorepo"

# Replace YOUR_USER and YOUR_REPO with your GitHub details
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### 1.3b SSH (optional)

```bash
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### 1.4 What must never be committed

These stay local only (already in `.gitignore`):

- `apps/api/.env`
- `node_modules/`
- `dist/`
- `uploads/`

Use `apps/api/.env.example` as the template for production env vars on Render.

---

## Part 2 — GitHub Actions (CI)

The workflow file is at `.github/workflows/ci.yml`.

### What it does on every push/PR to `main`:

1. Starts PostgreSQL service container
2. `npm ci`
3. Prisma generate + `migrate deploy`
4. Builds `@htask/shared`, `@htask/api`, `@htask/web`
5. Runs lint and tests (if present)

### Enable Actions

1. Push the repo to GitHub (workflow is included in the commit)
2. Open your repo → **Actions** tab
3. CI should run automatically on the first push

### Optional: branch protection

Repo → **Settings** → **Branches** → **Add rule** for `main`:

- Require status check: `build-and-test`
- Require pull request before merging

---

## Part 3 — Deploy on Render

### Option A — Blueprint (recommended)

The repo includes `render.yaml` at the root.

1. Sign up / log in at https://render.com
2. **New** → **Blueprint**
3. Connect your GitHub account and select the `htask` repository
4. Render reads `render.yaml` and creates:
   - `htask-api` (Docker web service)
   - `htask-web` (static site)
   - `htask-db` (PostgreSQL)
   - `htask-redis` (Redis)
5. Click **Apply**

### Option B — Manual setup

If you prefer the dashboard instead of Blueprint, create each resource manually using the settings below.

---

## Part 4 — Configure environment variables on Render

After Blueprint deploy, set these in the Render dashboard (they are marked `sync: false` in `render.yaml`).

### `htask-api` service

| Variable | Example | Notes |
|----------|---------|-------|
| `CORS_ORIGIN` | `https://htask-web.onrender.com` | Your static site URL (no trailing slash) |
| `APP_URL` | `https://htask-web.onrender.com` | Used in email links |
| `SMTP_HOST` | `smtp.gmail.com` | Gmail App Password required |
| `SMTP_PORT` | `587` | |
| `SMTP_USER` | `harishmano98@gmail.com` | |
| `SMTP_PASS` | `16-char-app-password` | **Not** your Gmail login password |
| `SMTP_FROM` | `harishmano98@gmail.com` | |

`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `REDIS_URL` are wired automatically by the Blueprint.

### `htask-web` static site

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://htask-api.onrender.com/api/v1` |

**Important:** `VITE_*` vars are baked in at **build time**. After changing `VITE_API_URL`, trigger **Manual Deploy** on the web service.

---

## Part 5 — First deploy checklist

1. Wait for `htask-db` to become **Available**
2. API deploy runs `prisma migrate deploy` on startup (see `docker/Dockerfile.api`)
3. Seed production data (one time, from your machine or Render shell):

```bash
# With DATABASE_URL pointing to Render Postgres (use External URL from dashboard)
cd apps/api
npx prisma migrate deploy
npm run db:seed
```

Or open **htask-api** → **Shell** on Render and run seed after setting env.

4. Open `https://htask-web.onrender.com`
5. Log in with seeded user: `manager@htask.io` / `Manager@123` (change password after first login)

---

## Part 6 — Custom domains (optional)

### API

Render → `htask-api` → **Settings** → **Custom Domains** → e.g. `api.yourdomain.com`

### Web

Render → `htask-web` → **Custom Domains** → e.g. `app.yourdomain.com`

Update `CORS_ORIGIN`, `APP_URL`, and `VITE_API_URL` to match.

---

## Part 7 — Auto-deploy workflow

```
Local dev → git push main → GitHub Actions CI passes → Render auto-deploys
```

- **CI** validates build on GitHub
- **Render** rebuilds API (Docker) and Web (static) on push to connected branch

To disable auto-deploy: Render service → **Settings** → turn off **Auto-Deploy**.

---

## Part 8 — Render free tier notes

- Services **spin down** after ~15 min idle; first request may take 30–60s
- PostgreSQL free expires after 90 days (export data before then)
- Redis free has memory limits
- File uploads use **local disk** on API (`STORAGE_PROVIDER=local`); for production persistence use S3 and set `STORAGE_PROVIDER=s3`

---

## Part 9 — Troubleshooting

### CI fails on migrations

Ensure `apps/api/prisma/migrations` is committed (not ignored).

### API health check fails

- Check **Logs** on Render for `htask-api`
- Verify `DATABASE_URL` is set and DB is running

### Web shows login but API errors

- Confirm `VITE_API_URL` is `https://YOUR-API.onrender.com/api/v1`
- Redeploy web after changing env vars
- Confirm `CORS_ORIGIN` on API matches web URL exactly

### Email not sending on Render

- Use Gmail **App Password** in `SMTP_PASS`
- Set `APP_URL` to your public web URL

### CORS errors

`CORS_ORIGIN` must match the browser origin (scheme + host + port), e.g. `https://htask-web.onrender.com`

---

## Quick reference commands

```bash
# Local verify before push
npm ci
npm run build

# Push updates
git add .
git commit -m "Your message"
git push

# Production migrations (external DB URL)
cd apps/api && npx prisma migrate deploy
```

---

## Files added for deployment

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | GitHub Actions CI |
| `render.yaml` | Render Blueprint (IaC) |
| `docker/Dockerfile.api` | API container (+ migrate on start) |
| `docker/Dockerfile.web` | Web container (optional; Blueprint uses static site) |
