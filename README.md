# Internship Tracker

Track internship applications from first apply to acceptance. Board view, list view, timeline, daily journal, and optional PDF/CSV export.

## Features

- **Board view (Kanban)** — Drag-and-drop columns: Applied → Interviewing → Offer Received → Accepted. Status updates when you move cards.
- **List view** — Table-style list of applications with filters.
- **Journey timeline** — Chronological timeline with an optional plain-language summary of your applications.
- **Post-acceptance (Onboarding mode)** — When an application is Accepted: winner card, onboarding checklist, countdown to start date, and a “Past applications” tab for rejected/withdrawn.
- **Application details** — Company, role/position, stipend (paid/unpaid), address, status, and date applied.
- **Confetti** — Celebration when an application moves to Accepted.
- **Export** — Download journey history as CSV or PDF (PDF can include the generated summary).
- **Auth** — Sign up, sign in (email or Google), forgot/reset password. Protected routes and guest redirects.
- **Real-time** — Socket.io sync so changes appear across tabs/devices.
- **Dashboard & Logs** — Overview and activity logs.

## Tech stack

| Layer     | Stack                                                               |
| --------- | ------------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, React Router 7 |
| UI        | MUI, Lucide icons, @dnd-kit (drag-and-drop), canvas-confetti, jsPDF |
| Auth & DB | Supabase (auth + Postgres)                                          |
| Backend   | Node.js, Express 5, Supabase (service role), Socket.io              |
| Summaries | Google Gemini (optional journal tools and summaries)                |

## Project structure

```
internship-tracker/
├── src/                    # Frontend (Vite + React)
│   ├── components/        # Application cards, Kanban, Modal, etc.
│   ├── config/            # Supabase client
│   ├── functions/         # API calls, auth, journal helpers
│   ├── layout/            # App layout
│   ├── lib/               # Kanban config, export, confetti
│   ├── pages/             # Login, Dashboard, ApplicationList, Logs, etc.
│   ├── routes/            # ProtectedRoute, GuestRoute
│   └── store/             # Zustand (auth, applications, journal)
├── tracktern-api/         # Backend (Express)
│   ├── config/            # Supabase, Gemini
│   ├── controllers/       # application, auth, journal
│   ├── middleware/        # auth, validation
│   └── routes/            # API routes
├── vercel.json            # Frontend SPA rewrites (Vercel)
└── railway.json           # Backend deploy config (Railway)
```

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- [Supabase](https://supabase.com) project
- (Optional) [Google Gemini](https://ai.google.dev) API key for journal tools and summaries

## Environment variables

### Frontend (root `.env`)

Create `.env` in the repo root (do not commit real keys):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001/api
```

For production, set `VITE_API_URL` to your deployed API base URL (e.g. `https://your-api.railway.app/api`).

### Backend (`tracktern-api/.env`)

Create `tracktern-api/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
PORT=3001
GEMINI_API_KEY=your-gemini-key
```

- `FRONTEND_URL` — Used for CORS and auth redirects (e.g. `https://your-app.vercel.app` in production).
- `GEMINI_API_KEY` — Optional; omit or leave empty to disable generated summaries (timeline still works).

## Getting started

1. **Clone and install**

   ```bash
   git clone https://github.com/your-username/internship-tracker.git
   cd internship-tracker
   npm install
   cd tracktern-api && npm install && cd ..
   ```

2. **Configure env**

   - Copy the frontend and backend env vars above into `.env` and `tracktern-api/.env`.
   - Use your Supabase project URL and keys; add `GEMINI_API_KEY` only if you want generated summaries.

3. **Database**

   - In Supabase: create tables for `profiles`, `applications` (and any columns you need, e.g. `position`, `stipend`).
   - If you have migration files under `supabase-migrations/`, run them against your project.

4. **Run locally**

   - Terminal 1 (API):

     ```bash
     cd tracktern-api && npm start
     ```

   - Terminal 2 (frontend):

     ```bash
     npm run dev
     ```

   - Open `http://localhost:5173`. Use `/register` or `/login` to sign up or sign in.

## Scripts

| Command           | Where         | Description              |
| ----------------- | ------------- | ------------------------ |
| `npm run dev`     | Root          | Start Vite dev server    |
| `npm run build`   | Root          | Build frontend for prod  |
| `npm run preview` | Root          | Preview production build |
| `npm run lint`    | Root          | Run ESLint               |
| `npm start`       | tracktern-api | Start Express API        |
| `npm run dev`     | tracktern-api | Start API with nodemon   |

## Deployment

- **Frontend** — Deploy the root app to [Vercel](https://vercel.com) (or any static host). `vercel.json` rewrites all routes to `/` for the SPA. Set `VITE_*` and `VITE_API_URL` in the build env.
- **Backend** — Deploy `tracktern-api` to [Railway](https://railway.app) (or any Node host). `railway.json` defines install and start. Set `SUPABASE_*`, `FRONTEND_URL`, `PORT`, and optionally `GEMINI_API_KEY`.

After deploy, set production `VITE_API_URL` and `FRONTEND_URL` so auth and API calls use the correct origins.

## License

ISC (or set your preferred license).
