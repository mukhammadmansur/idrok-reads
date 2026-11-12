# Iqro — interactive stories for small readers

An Uzbek-language frontend MVP for ages 6–10. The working name follows this repository's Iqro identity.

## Run locally

Node.js 22.12+ or 24 LTS and npm are required. This environment was validated with Node 24.22.1.

```sh
cd /workspace/iqro_kids_reads
npm ci
npm run dev -- --port 5173
```

The repository has no required environment variables, external API services, or database. Use the existing checkout; a separate worktree is unnecessary.

## What works

- Searchable, filterable library with three original eight-page stories and original SVG cover illustrations.
- Story details and theme choice; **one reader engine** for ClassicBook, ForestBook, IceBook, and HoloBook.
- Previous/next pages, arrow keys, swipe, larger text, and reduced-motion support.
- Reading progress, resume, idempotent completion, badges, and milestones.
- 32-second illustrated recap animations with play/pause/replay controls. The media model also supports curated video and an error fallback.
- A **separate Savol-javob section**: questions about completed books or general questions available immediately. No forced quiz after reading.
- Supportive answer feedback, best score persistence, and explicit retries.
- A parent-oriented view of this browser's profile and actual reading/quiz activity.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright uses `/usr/bin/chromium` by default. On another machine set `CHROMIUM_PATH` to an installed Chromium executable. It starts Vite automatically unless a server is already running. Automated accessibility checks use axe-core. Unit tests validate content and persistence; browser tests exercise reading, replay, recap, independent quizzes, rewards, failure states, keyboard/touch navigation, responsive layouts, and accessibility.

Use `npm run format` for source formatting. `npm run build` creates static files in `dist/`; the hash router requires no server rewrites.

## Data boundary

This is a single-device demo. Progress is stored in `localStorage` under `iqro.progress.v1`; blocked storage displays a warning and corrupt records are handled defensively. No child names, emails, or other personal data are collected. Dates are displayed in Asia/Tashkent.

There is no login, secure parent gate, account isolation, cross-device sync, API, or database yet. The parent view intentionally identifies itself as local demo data. Client-side records and reward checks are not a security boundary. They must move behind authenticated, authorized server mutations before shared accounts or real private family data are introduced.

Current art supplies one reusable illustration per story; per-page bespoke artwork and editorial review are content work still to do. Recaps use curated illustrations and text rather than produced video files. Only three stories are published, so 5/10/20-story milestones remain future goals.

See [architecture and audit](docs/PROJECT.md) for the module map, decisions, and next production phase.
