# Render deployment

The application runs as two free Render web services in Singapore, using the existing Neon database and Razorpay test configuration.

| Component | Public URL | Render service |
| --- | --- | --- |
| Next.js frontend | https://templeos-mandir.onrender.com | srv-dbciqvq9lscs73e1pg90 |
| FastAPI backend | https://templeos-api.onrender.com | srv-dbciqd3rjlhs73dkprkg |

Source: `Utkarsh18818/temple-management-system`, branch `codex/render-deployment`. The existing default branch was preserved. Public Git Repository services use manual deployment; push the branch, then select **Manual Deploy → Deploy latest commit** on each affected service. `render.yaml` records the equivalent configuration for a future Blueprint setup.

## Runtime configuration

- Backend root: `backend`. Build: `pip install -r requirements.txt`.
- Backend start: `python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Python: 3.12.10. bcrypt is pinned to the verified Passlib-compatible 4.0.1 version.
- `APP_ENV=production`; `DATABASE_URL` and Razorpay credentials are stored in Render environment variables. JWT signing uses a separately generated secret. No local environment files are pushed to GitHub.
- `CORS_ORIGINS=https://templeos-mandir.onrender.com`.
- Frontend root: `frontend`. Build: `npm ci && npm run build`.
- Frontend start: `npm run start -- --hostname 0.0.0.0 --port $PORT`. Node: 22.
- `NEXT_PUBLIC_API_URL=https://templeos-api.onrender.com` and `NEXT_PUBLIC_MANDIR_ID=5591a722-1d70-4213-b4db-d2d30d4fe1e5` are set before building. Rebuild the frontend after changing either value.

## Data, payments and free hosting

The deployed app shares current accounts and business records with localhost through the approved existing database. Database migrations run before API startup. No accounts or history are moved between temples.

Receipt PDFs use portable relative paths. Authorized paid receipts are rebuilt on demand if Render's temporary filesystem loses them on restart. Ownership, refunded receipt checks and path restrictions remain enforced.

Razorpay remains in test mode; deployment does not activate real payment collection. Provider webhook delivery needs the Razorpay dashboard webhook to target the deployed `/api/v1/public/payments/webhook` endpoint with the configured secret. No provider webhook configuration was changed during deployment.

Free services sleep when inactive, so the first request can take 50 seconds or more. Background reservation expiry resumes when the backend runs again. An always-running paid service is needed for uninterrupted background processing.

## Verified deployment — 22 October 2026

- Frontend deployment `dep-dbcir0a9lscs73e1phbg` succeeded from `6652bd5`.
- Backend deployment `dep-dbcis96q1p3s73c8afo0` succeeded from `8f48daf`, including the bcrypt compatibility fix. Subsequent source commits add documentation and regression coverage only.
- Public API health returned `healthy` with the database `connected`. CORS preflight allowed the deployed frontend origin.
- Live SRMS devotee sign-in succeeded in the browser. Personal booking history, platform admin sign-in, SRMS payment income summary and staff receipt access passed direct API checks.
- The deployed homepage displayed the real mandir images, current Bareilly Panchang, sevas and events. No browser console errors were reported during this check.
- 33 isolated backend checks passed, including actual password registration/verification and PDF rebuilding after file loss. Frontend production build succeeded on Render.
- No payment, refund, booking creation, account reset or account removal was performed during deployment verification.
