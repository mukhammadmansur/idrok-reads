# WBooks — interactive stories for small readers

An Uzbek-language reading MVP for ages 6–10, with parent accounts and server-backed child profiles. The current application retains its Iqro branding; the private GitHub repository is `mukhammadmaqsud/iqro_kids_reads`.

## Run locally

**Node.js 24+** and npm are required for the built-in SQLite backend. Validated with Node 24.22.1.

```sh
git clone https://github.com/mukhammadmaqsud/iqro_kids_reads.git
cd iqro_kids_reads
npm ci
npm run dev -- --port 5173
```

Access to the private repository requires GitHub authorization. In the existing cloud checkout, use `/workspace/iqro_kids_reads` and skip the clone step. A separate worktree is unnecessary.

`npm run dev` starts both Vite (http://localhost:5173) and the account API (127.0.0.1:3001); Vite proxies `/api` to it. SQLite creates `data/wbooks.db` automatically. Keep using the same browser hostname for cookies. No external service, API key, or mandatory environment setting is needed. Copying `.env.example` to `.env` is optional. Never put real credentials in the template or any `VITE_*` variable, which becomes public browser code. Authenticate to GitHub through `gh auth login`, never through a password or token stored in this project.

For Windows PowerShell, the equivalent npm commands are `npm.cmd ci` and `npm.cmd run dev`. To update an existing checkout, stop its server and run `git pull --ff-only origin main`, then those commands. Do not run a second development API on the same port.

To run the built application locally instead of the Vite development server:

```sh
npm run build
npm start
```

Open http://127.0.0.1:3001. This Node process serves both `dist/` and `/api`. A static-only host or `vite preview` alone cannot provide account persistence. Running these commands is local execution, not a production deployment.

## What works

- Searchable, filterable library with three original eight-page stories and original SVG cover illustrations.
- Immediate, persisted themes across the whole application: shell, library, details, quizzes, rewards, parent view, and **one reader engine** for ClassicBook, ForestBook, IceBook, and HoloBook.
- World cards select the environment in place without opening a story. Full forest, enchanted snow-garden and cyberpunk spaceport scenery surrounds the interface; HoloBook uses live transparent glass with a blurred view through the book. ClassicBook has a soft reading-nook backdrop and warm paper. Scenery crossfades and visibly pans/zooms; particles, illustration motion and entrance animations respect reduced motion.
- Previous/next pages, arrow keys, held mouse/finger dragging in every world, larger text, and reduced-motion support. HoloBook reveals the next page as luminous content on glass rather than folding paper.
- ClassicBook turns a curved, two-sided paper leaf with moving shadows in 1.25 seconds. The leaf follows a held mouse or finger; a short drag returns it to its place. A small hand demonstrates dragging once per browser. Page corners, buttons, arrow keys, and horizontal swipes share the same renderer; progress updates after the leaf settles.
- A stable book size across every page, including large-text mode; hidden measurement copies reserve enough room without exposing duplicated content.
- Reading progress, resume, idempotent completion, badges, and milestones, with visible next-book and replay actions before the video.
- Click-to-load YouTube videos configured with ordinary links in `src/data/videos.ts`, with a direct YouTube fallback. Three temporary films are clearly marked as demo viewing rather than original story recaps. The earlier animation/local-video model remains supported.
- A **separate Savol-javob section**: questions about completed books or general questions available immediately. No forced quiz after reading.
- Supportive answer feedback, best score persistence, and explicit retries.
- Parent registration/login, up to six child name/avatar profiles, profile switching, and server-stored reading and quiz results. Use **Ota-onalar uchun → Ro‘yxatdan o‘tish** to begin; children need no email or password.
- Resume on another browser connected to the **same backend**, per-child progress, retryable offline event queues, and an explicit option to copy guest reading into the selected profile.
- A protected parent dashboard comparing all children, with per-child books, best quiz results, attempt history, last activity, and seven days of active reading time.
- Parent password confirmation or an optional six-digit PIN; returning to child reading locks parent controls. PINs are hashed and failed attempts are limited.
- Separate, clearly labeled sign-in/sign-up routes with password confirmation for new accounts. Google Identity Services is implemented but disabled until a Web Client ID and authorized origins are configured; no live Google sign-in is claimed without that setup.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright uses `/usr/bin/chromium` by default. On another machine set `CHROMIUM_PATH` to an installed Chromium executable. Run browser tests with port 5173 free, or set `CI=1` to refuse an existing server: Playwright starts the combined development runner with API port 3101 and an isolated in-memory database. Automated accessibility checks use axe-core. `npm test` includes frontend unit tests and real HTTP/SQLite integration tests. Browser tests cover the reader plus account isolation, multiple browsers, profile switching, outage recovery, expired sessions, and multiple tabs.

Use `npm run format` for source formatting. The hash router requires no frontend route rewrites. See [account architecture and operations](docs/ACCOUNTS.md) for configuration, API contracts, test coverage, and hosting requirements.

## Data boundary

Guest reading stays in `localStorage` under `iqro.progress.v1`. Signed-in data lives in private SQLite: parent email, password hash, child first name/avatar, reading, and quiz results. Only progress events waiting for synchronization are stored in account/child-scoped browser queues; passwords and session tokens are never stored in localStorage. Session cookies are HttpOnly. Dates are displayed in Asia/Tashkent.

The API checks parent ownership on every child operation, grades submitted answer indices, and records its own timestamps. Retried events do not count twice. Guest reading transfers only when explicitly requested; guest quiz scores cannot be imported without answers. Local browser storage is user-editable and is not an access-control boundary. Server validation does not prove a child actually read a page.

**Different installations have different databases.** Actual devices must reach one shared Node backend to share accounts. Public hosting has not been configured or deployed. Before internet use, configure HTTPS with Secure cookies, persistent storage, protected backups, and an account lifecycle/privacy policy. Email verification for password accounts, password recovery and account deletion UI are not implemented. The PIN protects parent controls; children still use a shared family login rather than independent child credentials. Do not treat this MVP as a completed public launch.

`data/`, database sidecars/backups, `.env`, credentials, and generated output are ignored. Never commit or publicly serve the database. See [ACCOUNTS.md](docs/ACCOUNTS.md) before operating it with real family data.

Pages use two physical leaves with one complete reading passage and a large original scene. Dialogue stays together in one block; illustration and narration change sides between pages. All eight pages in each published story are illustrated. Openings use real watercolor scene art rather than small repeated discovery covers. Story text appears exactly once, checked against the current simplified copy. More scene artwork and editorial review remain future content work. Videos currently link to temporary third-party YouTube films. They are labeled as demo material; original story videos are not yet produced. Third-party availability and embedding permissions can change. Only three stories are published, so 5/10/20-story milestones remain future goals.

See [generated asset provenance](docs/ASSETS.md) and [architecture and audit](docs/PROJECT.md) for the module map, decisions, and next production phase.

For the first private GitHub push, see [the safe push procedure](docs/FIRST_PUSH.md). It preserves the current branch and `origin`, refuses an existing destination, and verifies privacy and the uploaded commit.

For the latest flow review, fixed-size reader checks, animation consistency and video limitations, see [reading comfort review](docs/READING_COMFORT.md).

The parent dashboard is under **Ota-onalar uchun**. To add or change its six-digit code, open **Farzandlar va sozlamalar → Ota-onalar himoyasi**. Without a PIN, the account password opens it. Active-time measurement starts with this update; old reading records are preserved without inventing historical minutes. See [Google setup](docs/GOOGLE_SIGN_IN.md) when ready to enable Google.
