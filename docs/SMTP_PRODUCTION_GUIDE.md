# SMTP configuration guide for production (IQLead)

Step-by-step guide to configure SMTP so IQLead can send email in production. Covers **generic SMTP** (Gmail, Outlook, etc.) and **Hostinger** specifically.

---

## 1. Choose provider: Generic SMTP vs Hostinger

### Generic SMTP (Gmail, Outlook, SendGrid, etc.)

Use your provider’s host and port. Examples:

| Provider        | SMTP_HOST           | SMTP_PORT | Notes                          |
|----------------|---------------------|-----------|--------------------------------|
| Gmail          | `smtp.gmail.com`    | 587       | Use App Password, not account password |
| Outlook/365    | `smtp.office365.com`| 587       | App password if 2FA enabled    |
| SendGrid       | `smtp.sendgrid.net` | 587       | Use API key as password        |
| Mailgun        | From dashboard      | 587 or 465| From Mailgun SMTP settings     |

### Hostinger

Use Hostinger’s SMTP for domains hosted with them:

| Variable     | Value                  |
|-------------|------------------------|
| SMTP_HOST   | `smtp.hostinger.com`   |
| SMTP_PORT   | `465` (SSL) or `587` (TLS) |

- **Username**: full email (e.g. `you@yourdomain.com`).
- **Password**: mailbox password from Hostinger (hPanel → Email Accounts → password for that address).

---

## 2. Backend environment variables (production)

On the **production server** where the IQLead backend runs, set:

### 2.1 SMTP server (shared for all users)

| Variable     | Example                    | Description                          |
|-------------|----------------------------|--------------------------------------|
| `SMTP_HOST` | `smtp.hostinger.com`       | SMTP server hostname                  |
| `SMTP_PORT` | `587` or `465`             | Port (587 = STARTTLS, 465 = SSL)      |

- No `SMTP_HOST` → backend cannot send mail (per-user credentials alone are not enough).
- These are **server-level**; individual users still set their own **email + password** in the app.

### 2.2 Encryption key for stored passwords (required)

User SMTP passwords are encrypted in the database. The key **must** be set in production:

| Variable        | Format              | Description                                      |
|-----------------|---------------------|--------------------------------------------------|
| `SMTP_CRED_KEY` | 32 bytes, base64 or hex | AES-256 key used to encrypt/decrypt SMTP passwords |

**Generate a secure 32-byte key (one-time):**

```bash
# Base64 (recommended) – copy the single line of output
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or hex
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Add `SMTP_CRED_KEY` to your production env (e.g. Render, Railway, `.env` on the server).
- **Do not** commit this value to git or share it.
- If you change the key, existing stored SMTP passwords cannot be decrypted; users must re-enter them.

**Example `.env` – Generic SMTP (e.g. Gmail):**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_CRED_KEY=<paste key from: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
```

**Example `.env` – Hostinger:**

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_CRED_KEY=<paste key from: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
```

Use **one** of the above (either generic or Hostinger). `SMTP_CRED_KEY` is required for both; generate it once and keep it secret.

---

## 3. Database (production)

Ensure the `users` table has the SMTP columns. If you already ran migrations, skip this.

Run on your **production MySQL** (only the lines for columns you don’t have yet):

```sql
ALTER TABLE users ADD COLUMN smtp_user VARCHAR(180) NULL;
ALTER TABLE users ADD COLUMN smtp_pass_enc TEXT NULL;
ALTER TABLE users ADD COLUMN smtp_pass_iv VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN smtp_pass_tag VARCHAR(64) NULL;
```

(If you get “Duplicate column”, that column already exists.)

---

## 4. Where users set SMTP credentials

### Option A – Users set their own (recommended)

1. User logs in → **Settings → Integrations**.
2. In the **Email** card: enter **SMTP username (From email)** and **SMTP password**.
3. Click **Save email credentials**.

- Stored per user; used when that user sends email from IQLead.

### Option B – Admin sets for a user

1. Admin/Super Admin logs in → **Dashboard → Users**.
2. Find the user → click **SMTP**.
3. In the popup: enter **SMTP user (email)** and **Mailbox password / app password**.
4. Click **Save**.

- Same storage; useful for onboarding or shared mailboxes.

---

## 5. Passwords to use (Gmail / Outlook / Hostinger)

- **Gmail**: Do **not** use the normal account password. Create an [App Password](https://support.google.com/accounts/answer/185833) (2FA must be on) and use that as the SMTP password.
- **Outlook / Microsoft 365**: Use the account password, or an app password if 2FA is enabled.
- **Hostinger**: Use the mailbox password from the control panel (or the account password for that email). No app password required unless they document it.

---

## 6. Deploy and restart

1. Set `SMTP_HOST`, `SMTP_PORT`, and `SMTP_CRED_KEY` in production.
2. Deploy the latest backend and restart the process.
3. Ensure the app is served over **HTTPS** so credentials are not sent in clear text.

---

## 7. Test sending

1. Log in as a user and go to **Settings → Integrations**.
2. Save that user’s **SMTP username** and **SMTP password** (e.g. Gmail app password).
3. From the app, trigger an action that sends email (e.g. lead email or any “Send email” feature or call the API (see **Test SMTP via API** below).
4. Check:
   - Recipient inbox (and spam).
   - `email_logs` table: row with `status = 'SENT'` and optional `provider_message_id`.

If send fails:

- Backend logs: look for nodemailer or SMTP errors.
- Confirm `SMTP_HOST` and `SMTP_PORT` (and firewall) allow outbound SMTP.
- Confirm the user’s credentials are correct and, for Gmail, that an app password is used.

---

## 8. Test SMTP via API

The backend exposes **POST `/api/mails/send`**. It uses the **logged-in user’s** stored SMTP credentials (from Settings → Integrations or Users → SMTP).

### Request

- **Method:** `POST`
- **URL:** `https://your-api-host/api/mails/send` (or `http://localhost:4000/api/mails/send` locally)
- **Headers:** `Authorization: Bearer <your_jwt_token>`
- **Body (JSON):**

| Field    | Type   | Required | Description                |
|----------|--------|----------|----------------------------|
| `to`     | string | Yes      | Recipient email address    |
| `subject`| string | No       | Email subject              |
| `body`   | string | No       | Plain-text body            |
| `leadId` | number | No       | Optional lead ID for logs  |

### cURL example

1. Get a JWT: log in via **POST `/api/auth/login`** with `email` and `password`, copy `data.token` from the response.
2. Send a test email:

```bash
curl -X POST "http://localhost:4000/api/mails/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"to":"recipient@example.com","subject":"IQLead test","body":"This is a test email from IQLead SMTP."}'
```

**Success (200):**
```json
{"success":true,"data":{"id":123,"sent":true}}
```

**Failure – SMTP not configured (400):**
```json
{"success":false,"message":"SMTP is not configured for this user. Set your mailbox password in Users → SMTP."}
```

**Failure – send error (500):**
```json
{"success":false,"message":"...nodemailer/SMTP error..."}
```

### One-liner (after login)

Replace `YOUR_JWT_TOKEN` and the recipient:

```bash
curl -X POST "http://localhost:4000/api/mails/send" -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"to\":\"recipient@example.com\",\"subject\":\"Test\",\"body\":\"Hello from IQLead\"}"
```

The user whose JWT you use must have SMTP credentials set (Integrations or Admin → Users → SMTP for that user).

---

## 9. Checklist (production)

- [ ] `SMTP_HOST` and `SMTP_PORT` set on the production server.
- [ ] `SMTP_CRED_KEY` set (32 bytes, base64 or hex), kept secret.
- [ ] `users` table has `smtp_user`, `smtp_pass_enc`, `smtp_pass_iv`, `smtp_pass_tag`.
- [ ] App is served over HTTPS.
- [ ] Each sending user has credentials set (Integrations or Users → SMTP).
- [ ] Test send performed and visible in `email_logs` and recipient inbox.

---

## 10. .env reference (backend)

In `backend/.env` you need:

| Variable       | Generic SMTP example      | Hostinger example           | Required |
|----------------|---------------------------|-----------------------------|----------|
| SMTP_HOST      | `smtp.gmail.com`          | `smtp.hostinger.com`        | Yes      |
| SMTP_PORT      | `587`                     | `465` or `587`              | Yes      |
| SMTP_CRED_KEY  | 32-byte base64/hex key    | Same                        | Yes      |

- **Generic SMTP**: set `SMTP_HOST` and `SMTP_PORT` for your provider (Gmail, Outlook, etc.).
- **Hostinger**: set `SMTP_HOST=smtp.hostinger.com` and `SMTP_PORT=465` (or 587).
- **SMTP_CRED_KEY**: generate once with  
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`  
  and paste the output. Do **not** commit the real key.
