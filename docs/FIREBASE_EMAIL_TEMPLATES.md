# Firebase Email Templates (CulturePass)

Use these templates in Firebase Authentication email templates for:
- Email address verification (confirmation)
- Password reset

And use the backend templates for:
- Welcome email
- Community/group created
- Community/group invitation

---

## 1) Firebase Auth: Email Verification Template

Firebase Console:
- `Authentication` -> `Templates` -> `Email address verification`

Subject:
`Confirm your CulturePass email`

HTML message:

```html
<div style="font-family:Arial,sans-serif;background:#06070F;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#111327;border:1px solid #1B1E36;border-radius:16px;padding:24px;">
    <p style="margin:0;color:#FFC857;font-size:12px;letter-spacing:1px;font-weight:700;text-transform:uppercase;">CulturePass</p>
    <h1 style="margin:10px 0 0;color:#F7F9FF;">Confirm your email</h1>
    <p style="margin:14px 0 0;color:#D8DBE8;line-height:1.6;">
      Welcome to CulturePass. Confirm your email address to secure your account and continue your cultural journey.
    </p>
    <p style="margin:20px 0 0;">
      <a href="%LINK%" style="display:inline-block;padding:12px 18px;background:#FFC857;color:#0F1020;text-decoration:none;border-radius:10px;font-weight:700;">
        Confirm email
      </a>
    </p>
    <p style="margin:20px 0 0;color:#9EA4BC;font-size:12px;line-height:1.5;">
      If you did not create this account, you can ignore this message.
    </p>
  </div>
</div>
```

---

## 2) Firebase Auth: Password Reset Template

Firebase Console:
- `Authentication` -> `Templates` -> `Password reset`

Subject:
`Reset your CulturePass password`

HTML message:

```html
<div style="font-family:Arial,sans-serif;background:#06070F;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#111327;border:1px solid #1B1E36;border-radius:16px;padding:24px;">
    <p style="margin:0;color:#FFC857;font-size:12px;letter-spacing:1px;font-weight:700;text-transform:uppercase;">CulturePass</p>
    <h1 style="margin:10px 0 0;color:#F7F9FF;">Reset your password</h1>
    <p style="margin:14px 0 0;color:#D8DBE8;line-height:1.6;">
      We received a request to reset your password. Use the button below to create a new password.
    </p>
    <p style="margin:20px 0 0;">
      <a href="%LINK%" style="display:inline-block;padding:12px 18px;background:#FFC857;color:#0F1020;text-decoration:none;border-radius:10px;font-weight:700;">
        Reset password
      </a>
    </p>
    <p style="margin:20px 0 0;color:#9EA4BC;font-size:12px;line-height:1.5;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
  </div>
</div>
```

---

## 3) Backend Transactional Templates Added

Implemented in Cloud Functions:
- `functions/src/services/emailTemplates.ts`
  - Welcome email
  - Community created email
  - Community invitation email
  - Shared layout: light **Apple-style** clarity (`#F5F5F7` page, white card, system font stack), **CulturePass** gradient accent bar (coral → gold → purple) and indigo→coral pill CTA
- `functions/src/services/emailQueue.ts`
  - Enqueues email payloads to Firestore collection `mail` (or `EMAIL_QUEUE_COLLECTION`)

Routes integrated:
- Welcome email on first user profile materialization:
  - `functions/src/routes/auth.ts`
- Community created + invitation emails:
  - `functions/src/routes/profiles.ts`
  - `POST /api/communities/:id/invitations`

---

## 4) Required Firebase Setup (for backend emails)

To actually send backend transactional emails, install Firebase Extension:
- **Trigger Email** (`firestore-send-email`)

Expected queue document format is already used by `enqueueTransactionalEmail`.

Recommended:
- Collection: `mail` (default)
- Configure SMTP provider in extension settings
- Set optional env var `EMAIL_QUEUE_COLLECTION` if using a custom collection

