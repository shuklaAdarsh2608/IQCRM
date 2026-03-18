# IQLead Email Sending Architecture (Option 1: per-user SMTP)

This document describes how **outbound emails** are sent from inside the app **without redirecting to a mail app**, and how each user can send email **as their own mailbox** (e.g. `xyz@classifyiq.com`, `tas@classifyiq.com`) using **Hostinger SMTP**.

## Overview

- **Goal**: Send emails from the in-app Compose UI, using the logged-in user’s own mailbox identity.
- **Key idea**: The backend authenticates to SMTP using **that user’s SMTP credentials**, so the SMTP server accepts the `From` address as that user.
- **Security**: Each user’s SMTP password is stored **encrypted** in the database (AES-256-GCM).

## Components

### Frontend

- **Compose UI**: `frontend/app/mails/page.js`
  - When user clicks **Send**, it calls the backend API.
  - No `mailto:` redirect is used.

- **Admin UI to configure SMTP**: `frontend/app/dashboard/users/page.jsx`
  - Admin/Super Admin can open a user row and set that user’s SMTP credentials (mailbox password/app-password).

- **API client**: `frontend/services/api` (used throughout)
- **User service helpers**: `frontend/services/userService.js`
  - Provides `setUserSmtp(userId, payload)` and `setMySmtp(payload)`.

### Backend

- **Send mail route**: `backend/src/routes/mailRoutes.js`
  - Endpoint: `POST /mails/send`
  - Auth: `requireAuth`
  - Loads the logged-in user’s encrypted SMTP credentials.
  - Decrypts SMTP password and creates a Nodemailer transport using that user’s SMTP auth.
  - Sends the email via SMTP, logs into `email_logs`.

- **User SMTP credential routes**: `backend/src/routes/userRoutes.js`
  - Endpoint (self): `POST /users/me/smtp`
  - Endpoint (admin): `POST /users/:id/smtp`
  - Auth: `requireAuth` and admin section is protected by `requireRole(["SUPER_ADMIN","ADMIN"])`

- **Controllers**: `backend/src/controllers/userController.js`
  - Persists SMTP creds to DB (encrypted fields).

- **Auth middleware**: `backend/src/middleware/authMiddleware.js`
  - Attaches to `req.user`: `id`, `role`, `email`, `name` (used for mail metadata).

- **Encryption helper**: `backend/src/utils/smtpSecrets.js`
  - AES-256-GCM encryption/decryption using `SMTP_CRED_KEY`.

- **Email log model**: `backend/src/models/EmailLog.js`
  - Tracks send attempts and provider message IDs.

## Data model

### `users` table (SMTP-related fields)

Stored on the `User` model (`backend/src/models/User.js`):

- `smtp_user` (string, nullable)
  - The SMTP login username (usually the mailbox email).
- `smtp_pass_enc` (text, nullable)
  - Encrypted password (base64).
- `smtp_pass_iv` (string, nullable)
  - AES-GCM IV (base64).
- `smtp_pass_tag` (string, nullable)
  - AES-GCM auth tag (base64).

## End-to-end request flow

1. **User opens** Mails → Compose (`frontend/app/mails/page.js`)
2. User fills `to`, `subject`, `body`
3. Frontend calls:
   - `POST /mails/send` with `{ to, subject, body }`
4. Backend `requireAuth` validates token and sets `req.user`
5. Backend loads the user’s SMTP credentials from `users`
6. Backend decrypts SMTP password using `SMTP_CRED_KEY`
7. Backend creates Nodemailer transport using:
   - `host = SMTP_HOST`
   - `port = SMTP_PORT`
   - `auth.user = user.smtpUser || user.email`
   - `auth.pass = decrypted password`
8. Backend sends email with:
   - `from: "User Name <auth.user>"`
   - `replyTo: req.user.email || auth.user`
9. Backend writes `email_logs` with status `SENT` or `FAILED`
10. Frontend shows success/failure toast, stays on same page

## Configuration (environment variables)

Backend `.env` must include:

- `SMTP_HOST` (Hostinger SMTP host)
- `SMTP_PORT` (usually `587` or `465`)
- `SMTP_CRED_KEY`
  - **Required**
  - Must be **32 bytes** encoded as **base64** or **hex**
  - Used to encrypt/decrypt each user’s SMTP password

> Note: With Option 1, `SMTP_USER` / `SMTP_PASS` are **not used for sending user mail**. Each user’s stored credentials are used instead.

## Important operational notes

### Hostinger “send as” behavior

- Hostinger typically requires authentication as the mailbox you’re sending from.
- That’s why Option 1 requires each user’s mailbox password/app-password.

### Security considerations

- SMTP passwords are stored encrypted at rest, but the server can decrypt them to send mail.
- Treat the backend environment variable `SMTP_CRED_KEY` as highly sensitive.
- Consider using “app passwords” (if supported) instead of primary mailbox passwords.

### Failure modes & troubleshooting

- **SMTP not configured for user**
  - `POST /mails/send` returns an error instructing to set SMTP credentials.
  - Fix by setting SMTP in Users page for that user.

- **Wrong password**
  - SMTP send fails; `email_logs.status` becomes `FAILED`.
  - Fix by updating the user’s SMTP password.

- **Provider blocks sending**
  - Verify mailbox exists and credentials are correct.
  - Verify correct `SMTP_HOST`/`SMTP_PORT`.

## Future improvements (optional)

- Add a “Test SMTP” button per user to validate credentials immediately.
- Add a UI indicator `smtpConfigured` in Users list for quick visibility.
- Add rate limiting / audit logs for outbound email actions.

