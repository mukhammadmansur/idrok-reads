# Project audit and implementation map

## Phase 0: repository at intake

The only tracked file was a 17-byte `README.md` at commit `63388af490509eac1bd0b538f7a05baf2ced89e3`. The working tree was clean. There was no application framework, dependency declaration, UI, story data, state management, API, auth, database, test runner, or agent instruction file. There was no working infrastructure to refactor, duplicated code, or known application bug to remove.

KEEP: the repository identity and original README title, now expanded into run documentation. Establishing a small new frontend was necessary because no application existed.

## Product rule precedence

The founder's correction before the master prompt takes precedence over its sequential quiz examples: Savol-javob is an independent destination with completed-book questions and general questions. Finishing a story never forces or automatically opens a quiz. The child can read, finish, view the recap, and return to the library. A completion badge depends on reading completion, not a quiz score.

The provisional product name is Iqro. No billing, social features, leaderboard, chatbot, or content-generation pipeline is included.

## Current stack and boundaries

React 19, TypeScript, Vite, npm lockfile, Lucide icons, CSS tokens, authored local SVG artwork, Node.js 24+ HTTP/SQLite backend, Vitest, Node integration tests, Playwright/Chromium, ESLint, and axe-core. The backend adds no third-party runtime dependency.

The route layer is a small hash router: library, story details, reader, completion, independent quiz library/session, rewards, parent view, and account. Unknown stories and destinations have a recovery action. A same-origin `/api` provides parent sessions, owned child profiles, and progress events. Node serves the built frontend; Vite proxies the API during development.

Story content is typed structured data, never HTML. Each logical page contains two physical leaves with a complete passage in one reading block and a large illustration. Sentences and dialogue are never automatically split at the spine. Image and narration sides vary between scenes; all current published pages have scene artwork. The same pages feed one reader; themes control CSS custom properties and environmental details. Themes never own progress or story logic. Selecting a world on the home page stays on that page; selecting it on story details also updates the whole application immediately. Both persist the choice in the existing versioned profile. Nonclassic worlds use full environment artwork behind readable surfaces; HoloBook uses translucent leaves and backdrop blur with local text backing.

Progress functions are immutable and separated from rendering. Guest storage remains separate from authenticated data. Account events have durable per-parent/per-child queues and idempotency receipts. SQLite transactions preserve first completion dates and best quiz scores; the server grades answer indices and checks child ownership. Versioned storage parsing tolerates malformed data. Browser refresh does not create another quiz attempt. The reading resume point follows the last successfully synchronized reading event; it is not a distributed ordering of offline client clocks. See [ACCOUNTS.md](ACCOUNTS.md) for guarantees and limits.

## File / module map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Route selection and unknown-route handling |
| `src/main.tsx` | Entry point and render-error boundary |
| `src/components/Shell.tsx` | Desktop sidebar, mobile navigation, skip link, storage warning |
| `src/components/Home.tsx` | Featured story, discovery, search, filters, resume, theme previews |
| `src/components/StoryDetails.tsx` | Story description, theme selection, start/resume/replay |
| `src/components/Reader.tsx` | Shared reader engine, pointer navigation, completion |
| `src/components/PaperTurn.tsx` | Curved physical leaves for ClassicBook, ForestBook and IceBook |
| `src/components/HologramReveal.tsx` | Drag-controlled light reveal on the stationary HoloBook glass |
| `src/components/BookSizing.tsx` | Measure all spreads at the active width/type size to keep book height fixed |
| `src/components/StoryPageContent.tsx` | Shared leaf/block renderer for readable text and optional inline scenes |
| `src/components/ThemeVisual.tsx` | Theme icons, world thumbnails, and shared environment backdrop |
| `src/components/Recap.tsx` | YouTube link player, direct fallback, and legacy local animation/video support |
| `src/data/videos.ts` | Replaceable YouTube demo links, titles and credits |
| `src/lib/youtube.ts` | Strict video-link parsing and controlled iframe URLs |
| `src/components/Quiz.tsx` | Independent quiz library, answers, feedback, results, retries |
| `src/components/Progress.tsx` | Milestones, story badges, selected child's parent activity |
| `src/components/Account.tsx` | Parent login/registration, child picker, guest transfer, sync status |
| `src/components/ui.tsx` | Reusable story card, artwork fallback, empty state, section title |
| `src/data/types.ts` | Story, pages, themes, media, questions, progress contracts |
| `src/data/stories.ts` | Original content, publication status, theme metadata, general questions |
| `src/lib/progress.ts` | Storage validation and pure page/completion/quiz transitions |
| `src/lib/context.tsx` | Session lifecycle, guest persistence, child hydration and event synchronization |
| `src/lib/api.ts` | Typed same-origin account/progress client |
| `src/lib/outbox.ts` | Validated account/child-scoped pending events and optimistic progress |
| `server/store.mjs` | SQLite schema, password/session hashes, ownership, event transactions and grading |
| `server/family.mjs` | Additive v2 migration, parent PIN gate, family monitoring, active-time intervals and Google identities |
| `server/google.mjs` | Google RS256 token verification, audience/issuer/expiry/nonce validation and cached signing keys |
| `src/components/ParentGate.tsx` | Parent verification, six-digit code settings and child-mode locking |
| `src/components/ParentDashboard.tsx` | Whole-family cards, per-child detail, weekly time chart and recent activity |
| `src/components/GoogleButton.tsx` | Official Google button when configured, clear unavailable/retry states otherwise |
| `src/lib/useReadingActivity.ts` | Foreground reader heartbeat with idle/visibility pauses |
| `server/app.mjs` | HTTP API, cookies, write-origin checks, safe built-file serving |
| `server/index.mjs` | Server settings, private database permissions and graceful shutdown |
| `server/catalog.json` | Server-owned story bounds and quiz answer keys, checked against frontend content |
| `scripts/dev.mjs` | Starts and stops the API and Vite together on Linux/Windows |
| `src/account.css` | Responsive account forms, profile picker and sync feedback |
| `src/styles.css` | Base components, responsive rules, and paper motion |
| `src/themes.css` | Persisted application palettes and story leaf layout |
| `src/picturebook.css` | Large illustrated-book composition, intact narration and living scenery motion |
| `src/comfort.css` | Soft scenery crossfades, subtle motion, stable reader geometry and clear start/finish screens |
| `src/worlds.css` | Full environment scenery, material surfaces, world selection and responsive glass |
| `public/worlds/` | Generated WebP environments and matching selection thumbnails |
| `public/art/` | Original SVG covers and generated story scenes |
| `src/lib/progress.test.ts` | State and content validation tests |
| `tests/` | Functional, responsive, failure-state and accessibility browser checks |

## Incremental execution

1. Audited the empty repository; established typed React foundation and reusable content model.
2. Implemented and built the library/details interface and shared visual components.
3. Added one reader and four theme layers, progress/resume, completion, and recap animation.
4. Added independent book/general quizzes and lightweight completion rewards.
5. Added the local parent view; tested core flows, failure recovery, responsive layouts, and accessibility.
6. Added parent accounts, child ownership, SQLite persistence, server grading and retryable synchronization. Kept the independent quiz flow and original guest data. Tested real HTTP authorization and independent browser sessions.
7. Added parent password/PIN verification, distinct login/registration routes, optional Google Identity Services, named children and whole-family monitoring with measured active reading time. The database upgrades existing records additively.

## Known limits and next phase

Parent accounts and server-backed profiles now work against one Node/SQLite instance. Public hosting has not been deployed. A public release still needs HTTPS/Secure cookies, a persistent private database with tested backups, email verification/recovery, account deletion and privacy/retention decisions. Parent controls now require password/PIN verification, expire after 30 minutes, and lock on child-mode entry. Google sign-in is implemented but awaits a configured Web Client ID. SQLite is a single-instance MVP; horizontally scaled writes and advanced conflict resolution are outside this phase.

Further content work: editorial review, more distinct scene illustrations where useful, produced recap media/captions, and more stories. Reading duration is an estimate; actual reading time is deliberately not fabricated. Current badges are on-screen achievements, not downloadable signed certificates. Up to six owned child profiles per account are supported; the account requests each child’s first name and avatar, without requiring surname or birth date.

Automated checks are Chromium based. Axe checks help catch accessibility regressions but do not replace testing with children, assistive technology, or an editorial reading-level review.

No deployment or environment publication is performed by this implementation.
