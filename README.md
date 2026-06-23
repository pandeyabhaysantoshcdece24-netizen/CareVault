# CareVault (CHR-EPS)

CareVault is a clinical record sharing application (CHR-EPS sample) that lets patients securely share access to their health records with verified doctors for configurable time windows. This repository contains a React frontend and an Express + PostgreSQL backend used for authentication, patient/doctor profiles, consultations, prescriptions, and access permissions.

## Project Summary

- Backend: Node.js + Express, PostgreSQL (pg). Located in `backend/`.
- Frontend: React (Vite), located in `frontend/`.
- DB migrations & schema example: `backend/src/Database/migration.sql` (schema snapshot; run your own migrations in your environment).
- Main features:
  - Patients create profiles and grant/revoke doctor access.
  - Doctors create/verify profiles and access patient data when permitted.
  - Access permissions include `status`, `created_at` (granted at), and optional `expires_at`.

## Quickstart (developer)

Prerequisites:
- Node.js 18+ (or latest LTS)
- PostgreSQL server
- Git

Setup (backend):

1. Create a Postgres database and note the connection string (e.g. `postgres://user:pass@localhost:5432/dbname`).
2. In the `backend/` folder create a `.env` (or set env vars):

   - `DATABASE_URL` — full connection string to Postgres
   - `DATABASE_SSL` — `true` or `false` depending on your DB server (default `false`)

3. Install dependencies and run backend:

```bash
cd backend
npm install
npm run dev   # starts with nodemon / node server.js depending on package.json
```

Setup (frontend):

```bash
cd frontend
npm install
npm run dev   # starts Vite dev server (default port in package.json / vite.config.js)
```

Open the app in the browser (frontend dev URL) and ensure the backend `DATABASE_URL` points to your running Postgres instance.

## Database notes

- The repository contains a snapshot schema at `backend/src/Database/migration.sql`. It declares tables used by the app and references a user-defined enum `public.access_status` used by `access_permissions.status`.
- If you see the error `invalid input value for enum access_status: "expired"`, it means your Postgres enum does not include the `expired` label. To fix this on an existing database run:

```sql
ALTER TYPE public.access_status ADD VALUE IF NOT EXISTS 'expired';
```

- The application migration script in the repo also includes a safe `DO $$ BEGIN ... END$$;` block that creates the enum if missing or adds `'expired'` if it is absent. Apply the migration or run the `ALTER TYPE` SQL manually on your DB.

## Key backend endpoints

(Authenticated routes under `/patients`)

- `POST /patients/grant-access` — Grant access to a doctor
  - Payload: `{ doctor_id: <uuid>, expires_at: <ISO timestamp|null> }`
  - Behavior: Inserts or updates an `access_permissions` row. `created_at` and `updated_at` are set to the current timestamp when granting/re-granting, so the "Granted At" value shown in the UI reflects the grant time.

- `DELETE /patients/revoke-access/:doctorId` — Revoke access
  - Path param: `doctorId` (uuid)
  - Behavior: Sets `status = 'expired'` for the active permission; requires that the `access_status` enum includes `'expired'`.

- `GET /patients/access-list` — Returns list of access permissions for the current patient
  - Response rows include `id`, `doctor_id`, `doctor_name`, `status`, `created_at` (granted at), and `expires_at`.

## Frontend notes

- The patient access management UI is implemented at `frontend/src/pages/patient/PatientAccessPage.jsx`.
  - The "Grant Doctor Access" form lets patients search for verified doctors, optionally choose an expiry date, and submit the grant.
  - The Access List displays: Doctor name, Granted At (from DB `created_at`), Expires At, Status, and a Revoke button.
- The frontend API wrappers for these endpoints live in `frontend/src/api/patients.js`.

## Behavior details / gotchas

- "Granted At" displays `created_at` from the `access_permissions` row. The backend uses `CURRENT_TIMESTAMP` when inserting or *re-granting* an access permission, so the UI will show the grant time for new grants or re-grants.
- Revoke sets `status = 'expired'` — ensure your DB enum contains `'expired'` before revoking.

## Troubleshooting

- Enum error: run the `ALTER TYPE` SQL above, or recreate the enum in fresh DB using the included `migration.sql` snapshot.
- API errors: check backend console logs; ensure `DATABASE_URL` is correct and migrations have been applied.

## Contributing

- Fork the repo, create a feature branch, and open a PR. Keep changes small and focused.

## License

MIT
