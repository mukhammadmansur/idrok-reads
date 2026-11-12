# WBooks — interactive stories for small readers

An Uzbek-language frontend MVP for ages 6–10. The current application retains its Iqro branding; the private GitHub repository is `mukhammadmaqsud/iqro_kids_reads`.

## Run locally

Node.js 22.12+ or 24 LTS and npm are required. This environment was validated with Node 24.22.1.

```sh
git clone https://github.com/mukhammadmaqsud/iqro_kids_reads.git
cd iqro_kids_reads
npm ci
npm run dev -- --port 5173
```

Access to the private repository requires GitHub authorization. In the existing cloud checkout, use `/workspace/iqro_kids_reads` and skip the clone step. A separate worktree is unnecessary.

The repository has no required environment variables, external API services, or database. `.env.example` documents this; copying it to `.env` is optional. Never put real credentials in the template or any `VITE_*` variable, which becomes public browser code. Authenticate to GitHub through `gh auth login`, never through a password or token stored in this project.

## What works

- Searchable, filterable library with three original eight-page stories and original SVG cover illustrations.
- Immediate, persisted themes across the whole application: shell, library, details, quizzes, rewards, parent view, and **one reader engine** for ClassicBook, ForestBook, IceBook, and HoloBook.
- World cards select the environment in place without opening a story. Full forest, enchanted snow-garden and cyberpunk spaceport scenery surrounds the interface; HoloBook uses live transparent glass with a blurred view through the book. ClassicBook has a soft reading-nook backdrop and warm paper. Scenery crossfades slowly; quiet particles, illustration motion and entrance animations respect reduced motion.
- Previous/next pages, arrow keys, held mouse/finger dragging in every world, larger text, and reduced-motion support. HoloBook reveals the next page as luminous content on glass rather than folding paper.
- ClassicBook turns a curved, two-sided paper leaf with moving shadows in 1.25 seconds. The leaf follows a held mouse or finger; a short drag returns it to its place. A small hand demonstrates dragging once per browser. Page corners, buttons, arrow keys, and horizontal swipes share the same renderer; progress updates after the leaf settles.
- A stable book size across every page, including large-text mode; hidden measurement copies reserve enough room without exposing duplicated content.
- Reading progress, resume, idempotent completion, badges, and milestones, with visible next-book and replay actions before the video.
- Click-to-load YouTube videos configured with ordinary links in `src/data/videos.ts`, with a direct YouTube fallback. Three temporary films are clearly marked as demo viewing rather than original story recaps. The earlier animation/local-video model remains supported.
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

Pages use structured text, title, caption, and optional illustration blocks across two leaves. Each story has an illustrated opening and scenes at every main dialogue and key action. Images sit before or after the relevant passage across either leaf; a few connected dialogue pages share a scene for continuity. Story text is split across leaves exactly once, checked against the current simplified copy. More scene artwork and editorial review remain future content work. Videos currently link to temporary third-party YouTube films. They are labeled as demo material; original story videos are not yet produced. Third-party availability and embedding permissions can change. Only three stories are published, so 5/10/20-story milestones remain future goals.

See [generated asset provenance](docs/ASSETS.md) and [architecture and audit](docs/PROJECT.md) for the module map, decisions, and next production phase.

For the first private GitHub push, see [the safe push procedure](docs/FIRST_PUSH.md). It preserves the current branch and `origin`, refuses an existing destination, and verifies privacy and the uploaded commit.

For the latest flow review, fixed-size reader checks, animation consistency and video limitations, see [reading comfort review](docs/READING_COMFORT.md).
