## IQLead CRM – Fullstack App (Next.js + Node + MySQL)

IQLead is an **AI‑assisted CRM dashboard** with a **Next.js 14 App Router** frontend and a **Node.js + Express + MySQL** backend.

- **Frontend**: `frontend/` – Next.js 14, Tailwind CSS, React Query, lucide-react icons, light/dark theme.
- **Backend**: `backend/` – Node.js (Express), MySQL (Aiven), REST API.
- **Database**: `database/` – schema and sample data dumps.

---

### 1. Project Structure

- `backend/`
  - `src/controllers/leadController.js` – lead CRUD, filters, dashboard metrics.
  - `src/...` – routes, middleware, models, auth, etc.
  - `.env` – backend config (port, DB, JWT, client URL).
  - `package.json` – backend deps and scripts.

- `frontend/`
  - `app/layout.js` – root layout, global theme provider, favicon, no‑flicker script.
  - `app/page.js` – marketing landing page.
  - `app/(auth)/login/page.jsx` – login screen.
  - `app/dashboard/layout.jsx` – wraps dashboard pages in `DashboardShell`.
  - `app/dashboard/page.jsx` – admin dashboard cards and widgets.
  - `app/dashboard/leads/*` – leads list, detail, import, bulk assign, delete requests, schedule call.
  - `app/dashboard/targets/page.jsx` – monthly revenue targets.
  - `app/dashboard/chats/page.jsx` – internal team chat.
  - `app/calendar/page.js` – calendar events.
  - `app/mails/page.js` – mail inbox preview.
  - `app/dashboard/reports/page.jsx` – performance reports and bar chart.
  - `app/dashboard/settings/*` – profile, notifications, pipelines, integrations.
  - `components/layout/DashboardShell.js` – shell layout (sidebar + topbar + content).
  - `components/layout/Topbar.js` / `Sidebar.js` / `PublicHeader.js` – navigation and headers.
  - `components/dashboard/AdminDashboard.js` – main dashboard metrics.
  - `components/dashboard/LeadListTable.js` – leads table with filters, actions and pagination.
  - `components/providers/QueryProvider.jsx` – React Query setup.
  - `components/ui/Select.jsx` – shared select.
  - `src/context/ThemeContext.tsx` – app‑wide light/dark theme context.
  - `src/components/theme-toggle.tsx` – animated theme toggle button.
  - `app/globals.css` – Tailwind layers, gradients, glass cards, dark text overrides.
  - `tailwind.config.js`, `postcss.config.js`, `next.config.mjs`, `tsconfig.json`.

- `database/`
  - `schema.sql` – MySQL schema (tables, indexes, FKs).
  - `Iqlead (1).sql` – full MySQL dump with sample data.

---

### 2. Backend – Setup & Run

#### 2.1 Install deps

```bash
cd backend
npm install
```

#### 2.2 Configure `.env`

`backend/.env` (example – already present):

```env
NODE_ENV=development
PORT=4000

DB_HOST=mysql-2c5f1b97-adarshshukla2608-a333.f.aivencloud.com
DB_PORT=21891
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=AVNS_trumarl5q-Ab1eXeoWN
DB_SSL=true

JWT_SECRET=super_secret_jwt_key_change_me
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000
```

Change DB values if you use a different MySQL instance and do **not** commit secrets.

#### 2.3 Import schema + seed data

If you have the MySQL client installed:

```bash
cd database

mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p<DB_PASSWORD> --ssl-mode=REQUIRED <DB_NAME> < "Iqlead (1).sql"
```

Or use MySQL Workbench / DBeaver to run `Iqlead (1).sql` against the same database.

#### 2.4 Run backend API

```bash
cd backend
npm run dev   # or: npm start
```

The API is served from `http://localhost:4000`.

Key endpoints (non‑exhaustive):

- `POST /auth/login` – login, returns JWT + user.
- `GET /dashboard/summary` – metrics for the main dashboard.
- `GET /leads` – paginated leads list with filters.
- `GET /targets`, `POST /targets` – revenue targets.
- `GET /reports/performance` – performance stats.
- `GET /notifications` – notification bell.
- `GET /chats/conversations`, `GET /chats/conversations/:id/messages`, `POST /chats/conversations/:id/messages` – team chat.

---

### 3. Frontend – Setup & Run

#### 3.1 Install deps

```bash
cd frontend
npm install
```

#### 3.2 Environment variables

`frontend/.env.local` (already present; adjust to your backend URL):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_TEAM_CHAT=true
NEXT_PUBLIC_ENABLE_REPORTS=true
```

Update `NEXT_PUBLIC_API_BASE_URL` to match your backend base URL in dev and production.

#### 3.3 Dev server

```bash
cd frontend
npm run dev
```

- App: `http://localhost:3000`
- Landing: `/`
- Login: `/login`
- Dashboard: `/dashboard`

#### 3.4 Production build

```bash
cd frontend
npm run build
npm start
```

---

### 4. Theme System & UI Design

- `src/context/ThemeContext.tsx`
  - `theme: "light" | "dark"`.
  - `setTheme(theme)` and `toggleTheme()`.
  - Persists to `localStorage` (`iqlead_theme`).
  - Falls back to `prefers-color-scheme`.
  - Adds/removes `light` / `dark` classes on `<html>`.

- `src/components/theme-toggle.tsx`
  - Uses lucide `Sun` / `Moon` icons.
  - Animated transition.
  - Accessible button (`aria-label`, `aria-pressed`).

- `app/layout.js`
  - Wraps app in `ThemeProvider` and `QueryProvider`.
  - Inline script in `<head>` sets initial theme class to avoid flicker.
  - Sets favicon: `<link rel="icon" href="/IqLogo.svg" type="image/svg+xml" />`.

- `app/globals.css`
  - Warm light gradient and deep slate dark gradient backgrounds.
  - `.bg-background`, `.border-border` utilities.
  - `.glass-card` component for premium cards.
  - Dark overrides for `text-slate-*` to keep text readable.
  - Smooth color transitions on body, cards and inputs.

Most components follow this pattern:

```txt
bg-white dark:bg-slate-900/85
text-slate-900 dark:text-slate-100
border-slate-200 dark:border-slate-800
hover:bg-slate-100 dark:hover:bg-slate-800
```

so light and dark modes remain consistent across pages.

---

### 5. High‑Level Data Flow

1. **Auth**
   - User logs in on `/login`.
   - Frontend posts credentials to `POST /auth/login`.
   - JWT + user stored in `localStorage` (`iqlead_token`, `iqlead_user`).
   - `DashboardShell` checks token and redirects unauthenticated users to `/login`.

2. **Dashboard**
   - `DashboardShell` provides layout (sidebar, topbar, content).
   - `AdminDashboard` calls `/dashboard/summary` for metrics and `/targets` for goals.

3. **Leads**
   - `LeadListTable` fetches from `/leads` with query params (owner, page, search).
   - Row click navigates to `/dashboard/leads/[id]` (lead detail).
   - Export and admin actions call backend endpoints.

4. **Targets**
   - `TargetsPage` (managers/admins) reads and saves targets via `/targets`.

5. **Team chat**
   - `TeamChatPage` lists conversations from `/chats/conversations`.
   - Loads messages from `/chats/conversations/:id/messages`.
   - Sends messages via `POST /chats/conversations/:id/messages`.

6. **Reports**
   - `ReportsPage` fetches `/reports/performance` for per‑user metrics.
   - Uses `recharts` for bar chart and exports CSV/PNG via API + `html2canvas`.

7. **Settings**
   - Settings index links to profile, notifications, pipelines and integrations pages.
   - Profile page calls `/users/me` and `/users/me/change-password`.
   - Other settings are currently frontend‑only but structured to be backed by APIs later.

---

### 6. Deployment

#### 6.1 GitHub

The mono‑repo is pushed to GitHub (e.g. `shuklaAdarsh2608/IQCRM`) with:

- `backend/` – backend app.
- `frontend/` – Next.js app.
- `database/` – SQL assets.

#### 6.2 Vercel (frontend)

1. Connect Vercel project to the GitHub repo, branch `main`.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Next.js**.
4. Build Command: `npm run build` (default).
5. Output Directory: `.next` (default).
6. In Vercel Project Settings → Environment Variables, set:

   ```text
   NEXT_PUBLIC_API_BASE_URL = https://<your-backend-domain>/api
   NEXT_PUBLIC_APP_URL      = https://<your-frontend-domain>
   ```

#### 6.3 Backend hosting

Host `backend/` on your preferred platform (Render, Railway, VPS, etc.) with:

- Same DB env vars as `backend/.env`.
- `PORT` configured for the host.

Update `NEXT_PUBLIC_API_BASE_URL` to point to the deployed backend.

---

This README summarizes how the project is structured, how to run backend and frontend, how data flows between components, and how to deploy both sides safely. 

