# Devotee PAN and logout — 25 October 2026

The public header now exposes **Log out** after sign-in, including phone layouts. Logout clears the token, personal query cache, saved identity panel and prefilled donation fields. The mobile navigation also retains its logout action.

Registration and sign-in accept an optional PAN. Existing accounts do not need a PAN to sign in. A PAN entered at sign-in is saved only after credentials and the temple-bound devotee profile have been validated. Existing devotees can add, replace or remove their saved PAN from Profile, donation checkout or seva booking confirmation.

The authenticated `/public/auth/me` response supplies name, email, phone, address and masked PAN for transaction review. Donation inputs prefill contact details. Leaving donation PAN blank uses the authenticated devotee's saved PAN on the server, only for the same temple. A PAN entered directly on the donation form overrides it for that donation without replacing the profile.

## Storage and privacy

- PAN input is normalized to uppercase and checked against the ten-character format on the client and server. This is format validation, not PAN ownership verification, KYC, a tax-exemption guarantee or payment authorization.
- New profile PANs and new public-donation PAN snapshots are encrypted with Fernet. Only masked PANs are returned in profile responses and stored in the public donation's display field. Plain PAN is not placed in a JWT, URL, local storage, analytics or Razorpay checkout metadata.
- `PAN_ENCRYPTION_SECRET`, when configured, supplies a stable encryption secret. Otherwise the existing `JWT_SECRET` is used with domain-separated key derivation. Back up the active secret securely. Before rotating either effective encryption secret, decrypt and re-encrypt all stored PAN ciphertext with the new key; changing it alone makes existing ciphertext unreadable.
- Removing a saved PAN clears the profile, not historical donation snapshots. Legacy admin-entered donation PAN fields are unchanged by this additive migration.
- Auth responses use `Cache-Control: no-store`. Tenant/profile ownership remains server-enforced. Existing payment signature verification is unchanged.

## Migration and checks

Alembic revision `91ab27c40d12` adds nullable encrypted/masked PAN columns to devotees and an encrypted snapshot column to donations. Existing rows, accounts and transaction history remain compatible with older application writers.

- Production frontend build and TypeScript passed; targeted ESLint passed.
- 34 isolated SQLite ecosystem regressions passed, including registration/login with and without PAN, failed-login preservation, encrypted storage, masking, update/removal, authentication and same-temple donation fallback.
- Migration upgrade/downgrade and legacy-row preservation are checked against a temporary local PostgreSQL instance with synthetic data. The Neon console required a new GitHub permission, which was not granted; no production-data clone was created.
- Browser checks used an isolated in-memory API and synthetic identity: PAN sign-in, profile update, donation prefill, visible desktop/mobile logout and clearing personal fields after logout. No payment was created during browser verification.

Run regressions from `backend` with `venv/Scripts/python.exe -m pytest tests/test_ecosystem_regressions.py -q`. To include the PostgreSQL migration check, set `PAN_MIGRATION_TEST_URL` to a disposable localhost PostgreSQL instance and include `tests/test_pan_migration.py`. That test refuses remote database URLs and rolls back its temporary schema.

## Deployed verification

Commit `2c9f3f7` is live on both Render services: backend `dep-dbf305cs728c73du63qg` and frontend `dep-dbf3138n74is73bc4jvg`. Backend startup applied the migration successfully. Live schema includes registration/login PAN and the authenticated profile update route; anonymous PAN updates returned 401 with `no-store`. The existing SRMS devotee account signed in with its unchanged credentials, the header displayed Log out, and Profile displayed Saved transaction details with Add PAN. Clicking live Log out removed profile access and displayed Sign in required. No real account PAN was added or changed. No browser console errors were captured.
