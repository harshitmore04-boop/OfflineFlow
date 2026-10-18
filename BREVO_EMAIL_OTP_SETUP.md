# Activate email OTP for OfflineFlow

The website is prepared for Supabase Auth email OTP with Brevo SMTP delivery.
Brevo sends the email; Supabase generates and verifies codes, enforces provider
rate limits and issues authenticated sessions. Brevo alone is not an identity provider.

## 1. Supabase

Create a project. Enable the Email provider and new-user signup. Keep email
confirmation enabled. Set Email OTP expiry to 600 seconds and configure provider
rate limits (including a minimum resend interval of 60 seconds).
Set the Site URL to your new Vercel production URL. This source version expects
six-digit email codes; set the provider OTP length to 6 before enabling login.

Copy only the Project URL and the publishable key (`sb_publishable_...`). Configure
these build variables and rebuild the website:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The connection values are public. Never place a Supabase secret/service-role key,
Brevo API key or SMTP password in a `VITE_` variable or the website source.
Once both public connection values are configured, the real OTP login replaces
the demo login. Until then, the OTP screen says setup pending and cannot send codes.

## 2. Brevo

Create/verify a transactional sender and authenticate your sending domain where
available. Open Brevo's SMTP & API > SMTP page. Copy the SMTP login and generate
an SMTP key. Configure these privately inside Supabase's Custom SMTP settings:

- Host: `smtp-relay.brevo.com`
- Port: `587`
- Username: the SMTP login shown by Brevo
- Password: Brevo SMTP key (not the API key)
- Sender email/name: your verified sender / OfflineFlow

Do not send SMTP credentials in chat, commit them, or add them to client code.

## 3. Email templates

In Supabase Authentication email templates, edit both **Magic Link** and
**Confirm Signup** to display `{{ .Token }}`. This supports existing and new users.
Example subject: Your OfflineFlow sign-in code
Example HTML body:

```html
<h2>Sign in to OfflineFlow</h2>
<p>Your one-time code is:</p>
<p style="font-size:30px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>This code expires in 10 minutes. Do not share it.</p>
<p>If you did not request this email, you can ignore it.</p>
```

The expiry text must match the configured provider expiry.

## 4. Verify live delivery

1. Request a code with a new email address; inspect inbox/spam and Brevo delivery logs.
2. Confirm the email contains a six-digit code rather than only a magic link.
3. Reject a wrong or expired code; accept the correct one.
4. Verify resend limits and that old codes cannot be reused after redemption.
5. Sign out, request a new code, and verify the same account restores its local files.
6. Sign in with another email and verify a separate local library and experiment history.
7. Reopen an unexpired, previously verified session offline and open retained files.

No actual delivery has been verified until the account settings above are connected.

## Storage and access limits

- Sessions are retained in this tab's session storage and checked with the provider
  when reopening online. An unexpired previously verified session can continue
  offline. Expired sessions require internet and a new OTP. Logging out clears
  local session data; online logout also requests server revocation.
- Offline files/experiments are separated by verified Supabase user ID. Browser
  storage remains local, unencrypted app storage, not a security boundary against
  someone controlling the browser/device or its developer tools.
- Old demo files remain in the existing demo database; they are not automatically
  assigned to the first real account. Re-add original files after real sign-in.
- This does not provide cross-device file synchronization.
- This standalone export runs on your own host. Any Vercel deployment-protection
  settings are separate from the application email login.
- Browser storage belongs to an origin. Documents saved on the original hosted
  website do not automatically appear at a new Vercel address; re-add originals.
