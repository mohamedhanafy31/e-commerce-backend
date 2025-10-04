# Auth Implementation Notes

## Overview
- Admin and Customer auth use JWT access tokens (HttpOnly cookie `access_token`) and rotating refresh tokens (HttpOnly cookie `refresh_token`).
- CSRF: double-submit cookie `csrf_token` with `x-csrf-token` header for unsafe methods.
- CORS: credentials enabled; allowlist via `ALLOWED_ORIGINS`.

## Endpoints
- POST `/api/v1/admin/login|register`: sets cookies; returns admin JSON for UI.
- POST `/api/v1/admin/refresh-token`: rotates refresh token and sets new cookies.
- POST `/api/v1/admin/logout`: revokes token family and clears cookies.
- POST `/api/v1/auth/login|register`: customer session; cookies set; profile at `/api/v1/auth/profile`.

## Env
- `JWT_SECRET`, `JWT_EXPIRES_HOURS`, `ALLOWED_ORIGINS`, `BCRYPT_ROUNDS`.

## Notes
- Cookies are `SameSite=Lax`; set `secure=true` in production (behind TLS) and `app.set('trust proxy', 1)`.
- Refresh token reuse triggers family revocation.


