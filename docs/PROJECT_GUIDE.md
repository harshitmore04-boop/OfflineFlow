# OfflineFlow 2.0

OfflineFlow combines a real offline file library with an explainable OS cache-policy simulator. Built with React, TypeScript, Vite, Tailwind CSS, IndexedDB and a generated service worker.

## Run

Use Node.js 22 or newer:

```bash
npm ci
npm run dev
```

The development server supports file storage but does not install the offline app shell. To try actual offline loading, use the HTTPS publication or build and preview locally:

```bash
npm run build
npm run preview
```

Service workers are supported on HTTPS and localhost in compatible browsers.

## Real offline files

Open **Offline Files**. Add actual PDFs, images, notes or other files. The contents are stored in IndexedDB inside the current browser profile, never uploaded to a server.

- Budget in MB (1–1024 MB); capacity measures the sum of retained file contents.
- FIFO, LRU and Smart select unpinned files for replacement.
- A large incoming batch can require multiple evictions.
- Every upload or budget change has a review screen showing proposed removals and reasons. Cancelling changes nothing.
- Pinning is an absolute exclusion from automatic eviction for all three policies. Manual removal remains possible after confirmation.
- User priority affects Smart; offline critical protection is preferential after pinned resources are excluded.
- Auto connectivity uses the browser's online/offline signal. Weak network weighting is a manual model, not a bandwidth measurement.
- Actual offline state overrides the manual connectivity model.
- Open images, text and PDFs locally; download other formats for a suitable device application. PDF viewer support varies by browser.
- Opening/downloading updates recency and frequency. Uploading does not count as an open.
- Evictions remove only app-local copies. Original files on the device are untouched.
- Removed-file records and reasons persist; their content is no longer available until re-added.
- File changes and deletions commit together in one IndexedDB transaction. A stale review from another tab is rejected. Failed writes roll back.
- Optional request for browser persistent-storage protection; browsers may deny it.

The budget excludes app assets, experiment history and metadata. Browser quotas can be lower than a chosen budget. Clearing site data removes the library. Files are not synchronized to another browser/device. Keep original copies.

## Offline shell

The production build generates `dist/sw.js` with the exact static asset list and a version derived from the built entry HTML. Installation caches all assets atomically; a failed cache operation does not report offline readiness. Old shell versions are removed only after the new worker activates. Navigation uses the cached app shell, and cross-origin requests are untouched.

The app displays **App saved for offline use** only after a service-worker message confirms that all expected assets are present. Each later visit rechecks readiness. If app-shell assets were removed, Retry offline setup rebuilds missing assets while online; an offline failure remains visible instead of reporting a stale success. First setup requires an online visit. Private hosting sign-in restrictions and browser service-worker support can affect setup; failed setup has a Retry control. No promise of offline availability is made while status is preparing, failed or unsupported.

### Classroom walkthrough

1. Open the published website online, then choose Offline Files.
2. Wait for **App saved for offline use**.
3. Add a small PDF, image or text document; confirm storage.
4. Pin one important file.
5. Disconnect Wi-Fi, refresh the page and open the retained file.
6. Reconnect and add files approaching the MB budget.
7. Review which files each policy would remove. Pinned files remain excluded.
8. Open the separate simulator, run the same workload under FIFO, LRU and Smart, then explore What-If Lab and Analytics.

## Simulator and experiment history

The cache simulator retains its item-count resource model independently of the real file library. Run, step, autoplay, pause, reset, scenarios, decision inspector, network-sensitive Smart scores, What-If Lab and policy comparisons work as before. The light theme is the default, with a working dark-theme switch.

Current-run state persists in localStorage. Completed runs are archived automatically; Save experiment stores a partial run. Experiment History retains the latest 20 saved runs, with restore, download and removal. File activity retains the latest 200 events.

What-If Lab is retrospective simulation against known remaining resource requests. It does not predict real file demand or remove files from the real library. Comparison uses identical input and current settings; Smart is not universally optimal or machine learning.

## Rule-based Smart score

```text
score = round(100 × (wr × R + wf × F + wp × P))
R = 1 / (1 + logical requests since last access)
F = min(access count / 5, 1)
P = priority / 3
```

| Network | Recency | Frequency | Priority |
| --- | --- | --- | --- |
| Good | 45% | 35% | 20% |
| Weak | 25% | 45% | 30% |
| Offline | 15% | 35% | 50% |

Smart evicts the lowest eligible score. Ties use least recent access, then oldest insertion. Offline excludes critical resources if another unpinned noncritical candidate exists. If every eligible item is critical, eviction still occurs. Pinned files never enter the automatic candidate set.

These are custom mechanisms implemented for this project; no claim of global novelty is made.

## Validation

```bash
npm test
npm run build
npm run test:offline
```

Tests cover core FIFO/LRU/Smart correctness, byte budgets, multi-file evictions, pinned exclusions, insufficient-space errors, IndexedDB blob persistence, transaction rollback and stale-revision rejection. DOM integration tests cover simulator controls, input editing, history restore/delete, file picker activation, upload confirmation, cancellation, pin-protected space errors, eviction, local text preview, downloads, unavailable-record cleanup, exports, theme switching, mobile-menu actions and recovery after remount. All 52 source button definitions were audited for click handlers. Completed workloads disable Next request rather than silently ignoring a click. Readiness tests cover repeated checks, failure, retry and unsupported environments. A service-worker harness verifies precaching, network-free navigation at a repository subpath, missing-cache detection and successful online repair.

**Verification limit:** DOM and service-worker harnesses do not replace full browser/mobile QA. Visual layout, PDF rendering, real offline reload and private-host service-worker behavior still need confirmation on an actual device. No screenshot or real-browser offline pass is claimed.

## Source

- `src/OfflineFiles.tsx`: actual local-file workspace and confirmation/viewer dialogs.
- `src/library.ts`: byte-aware retention planning and transactional IndexedDB storage.
- `src/offline.ts`: service-worker setup and readiness reporting.
- `scripts/create-sw.mjs`: versioned app-shell generation after build.
- `src/engine.ts`: original pure simulator and counterfactual logic.
- `src/history.ts`, `src/ExperimentHistory.tsx`: durable simulator history.
- `src/App.tsx`, `src/style.css`: navigation, themes, responsive interface.

## Startup recovery

The initial HTML displays a loading screen and Repair app loading action even if the application module cannot load. Repair requires an online connection, unregisters only this app worker and removes only offlineflow-shell caches; it never accesses IndexedDB or clears documents. A render-error screen can restart the simulator draft without clearing the file library or saved history. Saved experiments are validated before use, malformed hashes fall back to Dashboard, and offline preparation starts on every app opening. Regression checks cover malformed drafts, history and hashes, plus app-shell-only repair.

## Email OTP authentication

Email OTP is the only entry to the workspace. Supabase verifies codes delivered through Brevo SMTP. There is no guest entry, local password form, mobile simulation or fallback access. Missing authentication configuration keeps sign-in disabled. Files and experiments are scoped to the verified user on this browser. Logout ends the session while retaining stored documents. See `../BREVO_EMAIL_OTP_SETUP.md` for provider configuration.
