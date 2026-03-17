### IQLead CRM – Architecture & Workflow Overview

## 1. High-level Architecture

- **Monorepo root**: `IQLead/`
  - **Backend**: `backend/` – Node.js (Express + Sequelize + MySQL)
  - **Frontend**: `frontend/` – Next.js (App Router) + Tailwind CSS

## 2. Backend Structure & Workflows

### 2.1 Key Directories

- `backend/src/app.js` – Express app wiring, routers mounted
- `backend/src/server.js` – Server bootstrap
- `backend/src/config/database.js` – Sequelize connection
- `backend/src/models/` – ORM models
  - `User.js` – users + roles (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `TEAM_LEADER`, `USER`)
  - `Lead.js` – CRM leads (`status`, `valueAmount`, etc.)
  - `LeadAssignment.js` – assignment history
  - `LeadRemark.js` – comments / remarks
  - `ScheduledCall.js` – scheduled calls
  - `ActivityLog.js` – audit activity
  - `SalesTarget.js` – per-user monthly targets
- `backend/src/controllers/`
  - `authController.js` – login & auth logs
  - `leadController.js` – all lead CRUD + import/export + assignments + scheduled calls
  - `userController.js` – user admin (create/reset/force logout/delete)
  - `reportController.js` – performance reports (leads/won/revenue/targets)
  - `activityLogController.js` – activity log + CSV export
- `backend/src/routes/`
  - `authRoutes.js` → `/auth`
  - `leadRoutes.js` → `/leads`
  - `userRoutes.js` → `/users`
  - `dashboardRoutes.js` → `/dashboard`
  - `reportRoutes.js` → `/reports`
  - `activityLogRoutes.js` → `/activity-logs`
  - `index.js` – mounts all routers on `/api` in `app.js`
- `backend/src/middleware/authMiddleware.js`
  - `requireAuth` – JWT + tokenVersion check
  - `requireRole(roles[])` – role-based guard

### 2.2 Core Backend Flows

#### 2.2.1 Authentication & Roles

- **Login**: `POST /auth/login`
  - Validates credentials, issues JWT with `userId` and `tokenVersion`
  - Frontend stores `iqlead_token`, `iqlead_user` in `localStorage`

- **Role usage**:
  - `SUPER_ADMIN` & `ADMIN` – full control, can see all leads, manage users, delete users
  - `MANAGER` – sees all team leads
  - `TEAM_LEADER` – sees self + assigned team
  - `USER` (Relationship Manager) – sees own leads and calls

#### 2.2.2 Leads Listing & Date Filters

- **Endpoint**: `GET /leads`
  - Query params: `page`, `limit`, `status`, `ownerId`, `search`, `poolOnly`, `from`, `to`
  - Date range:
    - `from` / `to` interpreted as local dates
    - Converted to start-of-day / end-of-day window on `createdAt`

#### 2.2.3 Lead Statuses

- Central enum in `leadController.js`:
  - `FRESH`, `ACTIVE`, `SCHEDULED`, `NO REPLY`, `SWITCHED OFF`, `WON`, `LOST`, `DEFERRED`, `WRONG NUMBER`, `QUALIFIED`
- Used consistently across:
  - Backend filters (`where.status`)
  - Dashboard metrics (`WON` leads)
  - Frontend badges & filters

#### 2.2.4 Lead Assignment & Reassignment

- **Assign single lead**: `POST /leads/:id/assign`
- **Bulk assign**: `POST /leads/bulk-assign`
- Core behavior (in `leadController.assignLead`/`bulkAssignLeads`):
  - On reassignment, lead `status` is reset to `"NEW"` (treated as fresh)
  - Owner change + optional status change are logged in lead audit history

#### 2.2.5 Scheduled Calls (Meetings)

- **Model**: `ScheduledCall`
- **Endpoints (approx)**:
  - `GET /leads/:id/scheduled-calls`
  - `POST /leads/:id/scheduled-calls`
  - `GET /leads/scheduled-calls` – calendar + dashboard use
- Visibility:
  - `SUPER_ADMIN`/`ADMIN` – all calls
  - `MANAGER` – team calls
  - `TEAM_LEADER` – self + team
  - `USER` – own calls

#### 2.2.6 Dashboard Data

- **Routes**: `backend/src/routes/dashboardRoutes.js`

- Helper: `resolveVisibleUserIds(currentUser)`
  - `SUPER_ADMIN`/`ADMIN`/`MANAGER` → `null` (no `ownerId` filter = see all)
  - `TEAM_LEADER` → `[self + team]`
  - `USER` → `[self]`

- **Summary**: `GET /dashboard/summary`
  - Considers date range (`from`, `to`) on leads
  - Returns:
    - `newLeads` – count in range
    - `totalRevenue` – sum of `valueAmount` on all visible leads in range
    - `assignedLeadsCount` – all-time count of leads (role-scoped)
    - `wonLeadsCount` – all-time count of `status = "WON"` (role-scoped)
    - `upcomingCallsCount` – count of `ScheduledCall` with `status = "PENDING"` and `scheduledTime >= now` (role-scoped)

- **Leaderboard**: `GET /dashboard/leaderboard`
  - Ignores viewer role for aggregation: shows **all active users**
  - Aggregates `valueAmount` for leads where `status = "WON"`
  - Returns sorted array `[{ userId, name, revenue }]`

- **Latest leads**: `GET /dashboard/latest-leads`
  - Uses `resolveVisibleUserIds`
  - Returns top 5 most recent leads for the viewer’s scope

#### 2.2.7 Users & Admin

- **Service**: `backend/src/services/userService.js`
  - Create / list / reset password / force logout
  - `deleteUserById(requestingUser, userId)`:
    - Checks user exists
    - Prevents self-delete
    - Requires `requestingUser.role === "SUPER_ADMIN"`
    - Calls `user.destroy()`

- **Routes**: `backend/src/routes/userRoutes.js`
  - `DELETE /users/:id` – guarded by `requireRole(["SUPER_ADMIN"])`

#### 2.2.8 Activity Log

- Records key events (login, lead updates, assignments, status changes)
- Exposed via:
  - `GET /activity-logs` (filterable by user, date)
  - `GET /activity-logs/export` (CSV)

## 3. Frontend Structure & Workflows

### 3.1 App Entry & Layout

- `frontend/app/layout.jsx`
  - Global providers, theme, fonts, `globals.css`

- `frontend/app/globals.css`
  - Global background: `body` uses `bg-slate-100` (white-smoke style)
  - `.bg-background` helper: `bg-slate-100 dark:bg-slate-950`

- Shared layout:
  - `frontend/components/layout/DashboardShell.js`
    - Wraps all `/dashboard/*` pages
    - Outer wrapper:
      - Light: `bg-slate-50`
      - Dark: `bg-slate-950`
      - `max-w-[1600px]` for wide containers
    - Includes `Sidebar` + `Topbar`

### 3.2 Layout Components

- `frontend/components/layout/Topbar.js`
  - Sticky boxed header with shadow:
    - `rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900/95`
  - Main nav tabs (Dashboard, Leads, Calendar, etc.)
  - Role label mapping:
    - `USER` → `"Relationship Manager"`
  - Dark mode:
    - Logo uses `dark:brightness-0 dark:invert`
    - Notification dropdown: dark background + hover states
    - Profile dropdown: dark background, border, text colors
  - Mobile responsiveness:
    - Topbar collapses into menu button + logo
    - Horizontal nav hidden on small screens; replaced by sidebar

- `frontend/components/layout/Sidebar.js`
  - Collapsible on mobile
  - Own navigation for dashboards, leads, etc.

- `frontend/components/layout/PublicHeader.js`
  - Used on landing & login pages
  - Wide container (`max-w-[1600px]`) with rounded header box
  - Gradient background wrapper for public pages
  - Dark mode logo inversion

### 3.3 Public Pages

- `frontend/app/landing/page.jsx`
  - Marketing / product overview
  - Gradient background:
    - `bg-gradient-to-b from-[#ffe3d2] via-[#ffeef0] to-[#fdf7ff]`
  - Uses `PublicHeader`
  - `max-w-[1600px]` sections

- `frontend/app/(auth)/login/page.jsx`
  - Similar gradient background as landing
  - Card-style login form with dark-mode friendly:
    - `dark:bg-slate-900/95`
    - Inputs/buttons styled with dark-friendly colors

### 3.4 Dashboard Pages

#### 3.4.1 Main Dashboard

- `frontend/components/dashboard/AdminDashboard.js`
  - Summary cards:
    - Assigned Leads (`summary.assignedLeadsCount`)
    - Won Leads (`summary.wonLeadsCount`)
    - Upcoming Calls (`summary.upcomingCallsCount`)
  - Fetches `/dashboard/summary` with date range
  - Upcoming Calls list:
    - Uses `/leads/scheduled-calls`
    - Title: "Upcoming Calls"
    - Displays relative time: e.g., `In 30 min`, `In 2 hr`, or date for >24h
  - Latest Leads:
    - Fetches `/dashboard/latest-leads`
    - Shows latest 5 only, no "See all" button
  - Revenue Leaderboard:
    - Uses `/dashboard/leaderboard`
    - Shows all active users, including 0 revenue
    - Rank badges:
      - Gold (1st), Silver (2nd), Bronze (3rd), neutral pill for others
    - Name only (no role text)
  - Total Revenue Ring:
    - For `SUPER_ADMIN` / `ADMIN`
    - Uses `GoalRing` with `value = totalRevenue`, `total = totalRevenue || 1`
    - No "100% of target" percentage label

#### 3.4.2 Calendar

- `frontend/app/calendar/page.js`
  - Fetches scheduled calls from `/leads/scheduled-calls`
  - Same role-based visibility as backend
  - Renders in calendar UI (per day/time)

#### 3.4.3 Leads List & Detail

- **List**: `frontend/app/dashboard/leads/page.jsx`
  - Very thin wrapper that renders `LeadListTable`

- **Table component**: `frontend/components/dashboard/LeadListTable.js`
  - Tabs:
    - `My leads`, `All leads`, `Assigned leads`, etc.
  - Default active tab:
    - For `SUPER_ADMIN`/`ADMIN` → `All leads`
  - Data fetching:
    - Uses `/leads` with query params
    - Handles date range from date preference UI
  - **Date preference section** (My leads tab):
    - Quick ranges: Today, Yesterday, Weekly, Monthly, All time
    - Manual `From` / `To` date inputs + Apply
    - Updates `from` / `to` passed to backend
  - **Assigned leads per-column filters** (Admin/Super Admin on "Assigned leads" tab):
    - Extra header row with inputs:
      - Name, Company, Status, Owner, Contact
    - Filters applied client-side on fetched dataset
  - **Limited view styling** (Relationship Manager / Manager / Team Leader):
    - Combined Name column (`firstName` + `lastName`)
    - Removed Last Name & Amount columns
    - Row highlight:
      - Light mode: `border-l-4 border-amber-400 bg-amber-50/70`
      - Dark mode: `dark:bg-slate-800/80 dark:border-emerald-400`
  - Responsiveness:
    - Table wrapped in `overflow-x-auto`
    - Layout adapts to narrow screens

- **Lead detail**: `frontend/app/dashboard/leads/[id]/page.jsx`
  - Shows single lead info + timeline
  - Includes "Schedule call" link/button
  - Uses same card/background conventions

#### 3.4.4 Schedule Call Page

- `frontend/app/dashboard/leads/[id]/schedule-call/page.jsx`
  - Displays form for scheduling a call for the lead
  - On submit:
    - Calls backend (lead’s scheduled call endpoint)
    - On success, redirects to `/calendar` via `useRouter().push("/calendar")`
  - UI:
    - Centered `max-w-2xl` card with `rounded-2xl bg-white p-6 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900/95 sm:p-8`
    - Inputs styled for light/dark mode

#### 3.4.5 Users Management

- `frontend/app/dashboard/users/page.jsx`
  - Fetches user list + roles
  - Role labels:
    - Uses `"Relationship Manager"` label instead of "Sales Executive"
  - Actions per row:
    - Reset password
    - Force logout
    - Delete user (only if not current user)
      - Calls `deleteUser(userId)` from `frontend/services/userService.js`
      - Backend enforces SUPER_ADMIN + self-delete protection
  - Add user form:
    - Role select includes `"Relationship Manager"` option for `USER` role
  - UI:
    - Solid white card background (`bg-white`)
    - Responsive table with `overflow-x-auto`

#### 3.4.6 Activity Log

- `frontend/app/dashboard/activity/page.jsx`
  - Fetches logs and users
  - User filter:
    - Uses shared `Select` component
    - Sized to match "Export log" button (`min-w-[140px]`, padding via `[&>button]` utilities)
  - Client-side pagination:
    - `page` state, `pageSize = 25`
    - Derived `totalPages`, `paginatedLogs`
    - Pagination controls:
      - "Previous" / "Next" buttons
      - "Page X of Y · Showing N of M events"
  - Card background: `bg-white` for clarity

#### 3.4.7 Reports

- `frontend/app/dashboard/reports/page.jsx`
  - Performance tables for leads and revenue
  - Role label:
    - When role is `USER`, shows `"Relationship Manager"`
  - Uses the same `bg-white` container style and responsive layout

## 4. Role-based Visibility Summary

- **SUPER_ADMIN**
  - Sees all leads and calls
  - Full dashboard metrics (all users)
  - Can create, edit, deactivate, and delete users (cannot delete own account)
  - Sees full revenue leaderboard (all users)

- **ADMIN**
  - Similar to SUPER_ADMIN for visibility
  - Cannot delete users (backend enforces SUPER_ADMIN-only delete)

- **MANAGER**
  - Sees all team leads + calls (direct reports + team leaders under them)
  - Dashboard:
    - Summary metrics scoped to team
    - Latest leads from team
    - Upcoming calls for team

- **TEAM_LEADER**
  - Sees own and team’s leads/calls
  - Dashboard metrics scoped to [self + team]

- **USER (Relationship Manager)**
  - Sees only their own leads & scheduled calls
  - Dashboard metrics scoped to self
  - LeadListTable in limited view mode (highlighted rows, fewer columns)

## 5. Mobile Responsiveness & UI Conventions

- **Containers**
  - Most dashboard pages use:
    - `rounded-2xl bg-white p-4 shadow-sm sm:p-6 dark:bg-slate-900/90 dark:border dark:border-slate-800`
  - Outer wrapper provides `bg-slate-50` contrast

- **Tables**
  - Wrapped in `overflow-x-auto` to avoid layout breaking on small screens
  - Minimum widths on columns to keep content readable

- **Topbar & PublicHeader**
  - Use `sticky top-0` for persistent navigation
  - Boxy, shadowed style to visually separate from content
  - Flexbox with `flex-wrap` to avoid horizontal scroll on narrow screens

- **Dark Mode**
  - Backgrounds: `dark:bg-slate-900` / `dark:bg-slate-950`
  - Text: `dark:text-slate-100` / `dark:text-slate-300` for secondary text
  - Highlights (e.g. limited view rows) tuned for good contrast
  - Logo inverted with `dark:invert` and `dark:brightness-0`

## 6. How Pieces Connect (Common Journeys)

### 6.1 User logs in and lands on Dashboard

1. User visits `/login` → `frontend/app/(auth)/login/page.jsx`
2. On submit, frontend calls `POST /api/auth/login`
3. Backend validates credentials, returns JWT + user payload
4. Frontend saves auth data and redirects to `/dashboard`
5. `/dashboard` layout:
   - Uses `DashboardShell` → includes `Topbar` and `Sidebar`
   - Renders `AdminDashboard` (or generic dashboard component)
6. `AdminDashboard` fetches:
   - `/api/dashboard/summary`
   - `/api/dashboard/leaderboard`
   - `/api/dashboard/latest-leads`
   - `/api/leads/scheduled-calls`

### 6.2 Lead assignment & “FRESH” workflow

1. On `/dashboard/leads`, `LeadListTable` is rendered
2. Admin selects a lead and assigns it (single or bulk)
3. Frontend calls backend assignment endpoint
4. In `leadController.assignLead` / `bulkAssignLeads`:
   - `ownerId` changes
   - `status` is reset to `"NEW"` (treated as fresh)
   - Audit logs created for owner + status changes
5. On next fetch, that lead appears as fresh for the new owner

### 6.3 Scheduling a call and seeing it everywhere

1. From lead detail page (`/dashboard/leads/[id]`), user opens schedule call page
2. `ScheduleCall` page submits to backend scheduled call endpoint
3. Backend creates `ScheduledCall` row (with `userId`, `leadId`, `scheduledTime`, `status = "PENDING"`)
4. User is redirected to `/calendar`
   - Calendar fetches `/api/leads/scheduled-calls` and shows the event
5. On dashboard:
   - `/api/dashboard/summary` counts the new future `ScheduledCall` as part of `upcomingCallsCount`
   - `/api/leads/scheduled-calls` used for "Upcoming Calls" list

### 6.4 Revenue leaderboard update

1. When a lead is marked as `WON` (in lead detail / remark flows), `Lead.status` and `Lead.valueAmount` are updated
2. `GET /api/dashboard/leaderboard` aggregates all `WON` leads across all active users
3. Frontend `AdminDashboard` displays ranking (gold/silver/bronze + positions)

---

This document should give new contributors a fast mental model of how the backend, frontend, roles, and dashboards are wired together in IQLead. For deeper details, open the referenced files and follow the flows described above.
