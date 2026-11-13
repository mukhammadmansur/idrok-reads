# Parent accounts and server-backed progress

This phase adds real parent registration/login and child progress persistence without changing the reader or making quizzes mandatory. It does not deploy a public service.

## Local setup

Use Node.js 24+ (validated on 24.22.1), then `npm ci` and `npm run dev`. This starts Vite on 5173 and the API on 3001. On Windows use `npm.cmd` if PowerShell blocks `npm.ps1`. Open the frontend, choose **Ota-onalar uchun**, register a parent email/password, and create a child first name/avatar. Passwords must be 12–128 characters; a child needs no credentials. Each account supports six child profiles. Sign-in and sign-up have separate routes (`#/account/login`, `#/account/register`), explanatory cards, and matching-password confirmation during registration.

No external provider, API key, or initial admin credential is needed. `.env.example` contains only optional non-secret defaults:

| Setting | Default | Purpose |
| --- | --- | --- |
| `API_PORT` | `3001` | Node HTTP port and Vite API proxy target; `PORT` is a server-only fallback |
| `HOST` | `127.0.0.1` | API listen address |
| `WBOOKS_DB_PATH` | `./data/wbooks.db` | Persistent SQLite file; directory is created automatically |
| `GOOGLE_CLIENT_ID` | empty | Optional public Web Client ID; [setup](GOOGLE_SIGN_IN.md) |
| `WBOOKS_REGISTER_LIMIT` | `10` | Registration attempts per socket IP/hour; browser test server uses 200 |
| `WBOOKS_COOKIE_SECURE` | `0` | Use `1` behind HTTPS; `NODE_ENV=production` also enables Secure |

Restart the development runner after changing port/database settings. `npm run build` followed by `npm start` serves the built app and API together on 3001. `vite preview` alone is insufficient. Keep `/api` on the same browser origin as the frontend, including behind a reverse proxy, and preserve the original Host and Origin headers.

Two devices must reach the **same server and database**. Two independent laptop checkouts do not synchronize with each other. The local default binds loopback; internet hosting and LAN exposure are not configured by this change. Do not expose an HTTP development server with real credentials.

## API and storage

All JSON writes require `Content-Type: application/json`, `X-WBooks-Client: web`, and a matching Origin/Host. There is no permissive CORS policy. API responses use `Cache-Control: no-store`; request bodies are limited to 32 KiB.

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/api/auth/options` | Optional Google Client ID and a short-lived, browser-bound nonce |
| POST | `/api/auth/google` | Verified Google ID token; explicit `link:true` requires an unlocked parent |
| GET | `/api/parent/status` | Whether parent controls are unlocked and PIN/password/Google are available |
| POST | `/api/parent/unlock` | `{method,secret}`; verify PIN or account password |
| POST | `/api/parent/lock` | `{}`; lock this session’s parent controls |
| POST | `/api/parent/pin` | `{pin}`; set/change a six-digit PIN, requires unlocked parent |
| GET | `/api/parent/overview` | Whole-family metrics, daily activity and latest events, requires unlocked parent |
| POST | `/api/children/:id/activity` | `{streamId,storyId,phase}`; server-timed reader interval |
| GET | `/api/health` | Process health |
| GET | `/api/session` | Current parent, child list and session's selected child; anonymous view when signed out |
| POST | `/api/auth/register` | `{email,password}`; creates parent and cookie session |
| POST | `/api/auth/login` | `{email,password}`; creates a new cookie session |
| POST | `/api/auth/logout` | `{}`; revokes current session and expires its cookie |
| POST | `/api/children` | `{name,avatar}`; creates an owned child and selects it |
| POST | `/api/children/:id/select` | `{}`; selects an owned child in this session |
| GET | `/api/children/:id/progress` | Owned child's progress and revision |
| POST | `/api/children/:id/events` | `{events:[...]}`; atomically validates/applies up to 50 events |

Every child operation checks the authenticated parent. Other parents' child IDs return 404; unauthenticated child requests return 401. Selecting a child on one device does not change another device's session selection. There is no admin bypass. Creating or switching a child requires unlocked parent controls. Reading progress and quiz APIs remain authenticated family-session operations; the PIN is not a separate child identity.

SQLite stores parent email/password hash, optional PIN hash, Google subject links when enabled, child first name/avatar, session token hashes, selected child, reading/quiz records, event receipts, activity intervals/daily totals/logs and rate-limit buckets. An additive v2 migration preserves v1 users, passwords, children, sessions and progress; existing sessions start with parent controls locked. Passwords use salted scrypt; session cookies contain cryptographically random tokens, with only their hashes in SQLite. Cookies are HttpOnly, SameSite=Lax, scoped to `/api`, and expire after seven days. Logout revokes the current session only. If the server cannot acknowledge logout, the UI reports the failure instead of claiming revocation.

Registration/login have persistent IP-based limits (10 registrations/hour and 20 login attempts/15 minutes). The server uses the socket address, not an untrusted forwarded IP. Behind one reverse proxy, users therefore share that proxy's rate bucket; configure trusted proxy-aware limiting before a larger public rollout.

`server/catalog.json` is authoritative for story page counts and quiz answer/option counts. A test ensures it matches `src/data/stories.ts`. Update both together when publishing content. Browser answer keys are visible for supportive immediate feedback; quiz secrecy/anti-cheating is not claimed.

## Event synchronization

Reading events contain story ID, page index and completion; theme events contain a known theme; quiz events contain answer indices. Unknown properties, client scores and client timestamps are rejected. Completion must reference the final page. Book quizzes require a completed reading record, while general questions remain available immediately. The server grades answers, sets timestamps, keeps best scores and increments attempts once per accepted quiz event. Replaying does not replace the first completion date or remove a badge.

Each event has a unique ID. A receipt keyed by child and ID makes retries idempotent; reusing an ID with a different payload returns 409. One invalid event rolls back the entire batch. The last successfully applied reading event determines the resume page; offline devices are not ordered by their clocks. Completion and best quiz scores survive later lower progress/scores.

The browser hydrates the selected child before recording changes. Generation and revision guards keep stale requests from overwriting another profile or newer accepted results. Pending events are persisted under `wbooks.pending.v1:<parentId>:<childId>` and retried on focus, reconnect or explicit retry. Memory/disk queues are merged by ID to preserve events from multiple tabs. The UI shows saved/saving/offline/error states based on server responses. A write outage can be recovered after reload; this is not an offline-installed PWA guarantee. If browser storage is unavailable, pending events remain in memory only and the UI warns about storage failure.

Guest progress stays under `iqro.progress.v1` and never silently joins an account. The parent may explicitly copy guest reading into the selected child. Guest quiz scores are not transferred because their original answer submissions are unavailable. An expired session returns to the separate guest profile; pending account events remain scoped for a later login to that same account. Passwords and session tokens never enter localStorage. Local queues contain reading/answer data and should be considered accessible on a shared browser/device.

## Operations and launch limits

- Keep `data/`, `.env`, SQLite files/sidecars and backups private and out of Git. The server serves only `dist/`; never place a database or backup there.
- Use a persistent local disk for the single Node instance. An ephemeral filesystem loses accounts when replaced. Multiple application instances cannot each use a separate SQLite file and claim shared progress.
- Use HTTPS and Secure cookies before sending real credentials over a network. Reverse proxy `/api` and the frontend on one origin. Restrict filesystem access and configure protected backups and retention.
- SQLite uses WAL. For a simple consistent backup, gracefully stop the server, confirm all processes using the database have closed, then copy the closed database to protected storage. Do not copy only the main database file while writes are active; use SQLite's backup mechanism for online backups. Validate restoration into a separate test instance before relying on backups.
- Password-account emails are login identifiers; ownership of the mailbox is not verified. Google accounts require a verified email claim and a valid provider signature. Email verification for password accounts, password reset/change flows and account deletion UI are not implemented. Do not promise recovery emails. A shared browser/family session is not a separate child account.
- Database ownership and grading are enforced; proof of actual reading, encrypted-at-rest storage, public abuse hardening, multi-instance operation and a full privacy/compliance workflow are outside this MVP.

## Verification

`npm test` runs 15 frontend unit tests and 17 HTTP/SQLite integration tests, including password/session hashes, revocation, cross-parent denial, sibling separation, server grading, idempotency, atomic rollback, persistent restart, write-origin checks, limits and private-file serving. Browser tests add independent-device resume, sibling switching, offline/reload retry, explicit guest transfer, mobile form accessibility, quiz retry, session expiry and two-tab queues. The broader reader/theme/accessibility suite remains in `tests/`.

Playwright uses a separate in-memory API on port 3101; keep frontend port 5173 free to avoid accidentally reusing another development server. Integration persistence tests use temporary databases. The isolated browser server raises only its registration fixture limit; deployed/default limits are not weakened. Committed fixtures use `.invalid` email addresses and test-only passphrases. Screenshots show synthetic preview data, never real family accounts.

## Parent protection and monitoring

Successful password or Google authentication opens parent controls for 30 minutes. Visiting child-mode pages locks them; returning requires the saved six-digit PIN, the account password, or Google reauthentication for Google-only accounts. The gate protects both `#/parent` and signed-in account settings, and the server rejects overview, profile-management and PIN-setting operations while locked. Reloads and direct URLs do not remove the gate. Five failed PIN/password unlocks per parent in 15 minutes produce a rate limit, shared across that parent's sessions. A successful unlock clears its failed-attempt bucket. PINs use salted scrypt and never enter localStorage. Changing a PIN also locks parent access in other sessions. Forgotten PINs can be replaced after password confirmation; Google-only accounts can reauthenticate with their linked Google identity.

The dashboard shows all children at once and lets a parent inspect one without changing the child's currently selected reading profile. It includes completed/in-progress books, best quiz accuracy (clearly labeled), attempt counts, actual latest attempt scores, last synchronized activity, a seven-day active-time chart, and per-book progress. No invented online indicator or estimated reading time is used as measured time. New accepted reading/quiz events create history once; replayed event receipts do not duplicate history.

Active reading uses a fresh reader stream, 15-second heartbeats and a final stop. The browser pauses hidden tabs and after 90 seconds without interaction; returning/interaction restarts a stream. The server calculates elapsed intervals itself, rejects gaps over 45 seconds, and does not accept a client duration. Overlapping streams for one child are credited only once. Daily totals split at midnight in Asia/Tashkent. Offline/failed requests cannot manufacture historical duration, and pre-update books retain their original progress with zero historical tracked time. These are engagement measurements from the app, not proof of attention or anti-cheating guarantees. Time in quizzes/video is not included in the reading-time metric.

Family summaries refresh every 15 seconds while the parent page is visible and on focus, with manual retry and the last refresh timestamp. Unsynchronized child work appears after it reaches the shared server. First names replace the old nickname label; existing stored names are left intact.
