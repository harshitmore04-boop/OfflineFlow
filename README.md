# OfflineFlow

An offline study workspace and interactive cache-policy simulator built with React, TypeScript and Vite. Save study files in your browser, compare FIFO, LRU and a custom rule-based Smart policy, inspect removal decisions, and replay experiments in the What-If Lab.

This package contains the application source from saved version 23, with GitHub upload instructions and Vercel configuration. The application source is preserved. Email OTP code is included; live delivery still requires Supabase and Brevo configuration.

## Upload to GitHub

1. Extract the ZIP and open the extracted `offlineflow` folder.
2. Create an empty repository named `offlineflow` at https://github.com/new, or open your existing empty repository.
3. Choose **uploading an existing file**, or **Add file > Upload files**.
4. Drag all files and folders **inside** the extracted `offlineflow` folder into the upload area. Keep folders intact. Upload the extracted contents, not the ZIP.
5. Enter a commit message such as `Add OfflineFlow website` and commit the files.
6. Check that `package.json` and `index.html` appear directly in the repository's main file list.

For a nonempty repository, review existing files before replacing them. This package does not include an existing Git history.

## Deploy on Vercel

1. Open https://vercel.com/new.
2. Connect GitHub and allow access to the `offlineflow` repository.
3. Click **Import** beside it.
4. Use the settings below, then click **Deploy**. The included `vercel.json` supplies the build settings.

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | Folder containing `package.json`; normally the repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js version | 22.x |

Vercel provides a `.vercel.app` address after deployment. Use the production URL on your resume after checking the site. A custom domain is optional. Check Vercel's deployment-protection settings if visitors are asked to sign in to Vercel.

Uploading source to GitHub alone does not deploy the website. Vercel builds it from the connected repository; pushes to the configured production branch can deploy updates automatically.

## Connect email OTP

Email OTP is the only sign-in method. Without authentication settings, sign-in stays disabled with a setup-pending message. To activate OTP, configure these public connection values in Vercel's environment variables, then redeploy:

| Variable | Value from Supabase |
| --- | --- |
| `VITE_SUPABASE_URL` | Your project's HTTPS URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key beginning with `sb_publishable_` |

Configure Brevo as the custom SMTP provider inside Supabase, set the Site URL to your new Vercel URL, and use an email template that displays the OTP. This version expects six-digit codes. See [BREVO_EMAIL_OTP_SETUP.md](BREVO_EMAIL_OTP_SETUP.md) for the full setup.

The Brevo SMTP key belongs in Supabase's SMTP settings. Never put secret keys or SMTP passwords in a `VITE_` variable or commit them to GitHub. `.env.example` contains only empty public placeholders.

## Run locally

Install Node.js 22.x, then open a terminal in the folder containing `package.json`:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. Double-clicking `index.html` does not run a TypeScript/React project.

To try the production build and offline app shell:

```bash
npm run build
npm run preview
```

Service workers require HTTPS or localhost. Visit online first and wait for the app's offline-ready status before disconnecting.

## Automated checks

```bash
npm test
npm run build
npm run test:offline
```

The existing checks cover cache policies, file retention, browser storage, simulator controls, login flows and the generated offline worker. Mocked login checks do not verify delivery through your real email account. Check live email delivery and real-device offline behavior after deployment.

## Main files

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Dashboard and simulator interface |
| `src/OfflineFiles.tsx` | Uploaded-file workspace |
| `src/library.ts` | IndexedDB file storage and retention decisions |
| `src/engine.ts` | FIFO, LRU, Smart and What-If logic |
| `src/Login.tsx` | Email OTP authentication entry |
| `src/EmailOtpLogin.tsx` | Email OTP interface |
| `src/emailAuth.ts` | Supabase authentication requests |
| `src/style.css` | Website styling |
| `scripts/create-sw.mjs` | Offline app-shell build step |
| `vercel.json` | Vercel build settings |

See [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) for the implementation details and demonstration workflow.

## Storage behavior

Study files and experiment history stay in the current browser; they are not synced across devices. A new website address has a separate browser-storage area, so re-add original study files on the new address. This source ZIP does not contain documents saved inside your browser.

Smart uses an explicit scoring formula, not a trained machine-learning model. What-If Lab replays a known workload rather than predicting future study requests.

## References

- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/project-configuration/vercel-json
- https://supabase.com/docs/guides/auth/auth-smtp
