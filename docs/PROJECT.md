# Project audit and implementation map

## Phase 0: repository at intake

The only tracked file was a 17-byte `README.md` at commit `63388af490509eac1bd0b538f7a05baf2ced89e3`. The working tree was clean. There was no application framework, dependency declaration, UI, story data, state management, API, auth, database, test runner, or agent instruction file. There was no working infrastructure to refactor, duplicated code, or known application bug to remove.

KEEP: the repository identity and original README title, now expanded into run documentation. Establishing a small new frontend was necessary because no application existed.

## Product rule precedence

The founder's correction before the master prompt takes precedence over its sequential quiz examples: Savol-javob is an independent destination with completed-book questions and general questions. Finishing a story never forces or automatically opens a quiz. The child can read, finish, view the recap, and return to the library. A completion badge depends on reading completion, not a quiz score.

The product name is IdrokReads (internal package/storage names keep the earlier `iqro` prefix for compatibility). No billing, social features, leaderboard, chatbot, or content-generation pipeline is included.

## Current stack and boundaries

React 19, TypeScript, Vite, npm lockfile, Lucide icons, CSS tokens, authored local SVG artwork, Node.js 24+ HTTP/SQLite backend, Vitest, Node integration tests, Playwright/Chromium, ESLint, and axe-core. The backend adds no third-party runtime dependency.

The route layer uses React Router browser routes with deep links: library, story details, reader, completion, independent quiz library/session, rewards, parent view, and account. Unknown stories and destinations have a recovery action. A same-origin `/api` provides parent sessions, owned child profiles, and progress events. Node serves the built frontend; Vite proxies the API during development.

Story content is typed structured data in `src/content/library.json`, never HTML. Each page holds one complete passage plus one scene illustration with alt text; sentences and dialogue are never split across the spine. The server derives its grading catalog from the same file, so content and answer keys cannot drift. The same pages feed one reader; themes control CSS custom properties and environmental details. Themes never own progress or story logic. Selecting a world on the home page stays on that page; selecting it on story details also updates the whole application immediately. Both persist the choice in the existing versioned profile. Nonclassic worlds use full environment artwork behind readable surfaces; HoloBook uses translucent leaves and backdrop blur with local text backing.

Progress functions are immutable and separated from rendering. Guest storage remains separate from authenticated data. Account events have durable per-parent/per-child queues and idempotency receipts. SQLite transactions preserve first completion dates and best quiz scores; the server grades answer indices and checks child ownership. Versioned storage parsing tolerates malformed data. Browser refresh does not create another quiz attempt. The reading resume point follows the last successfully synchronized reading event; it is not a distributed ordering of offline client clocks. See [ACCOUNTS.md](ACCOUNTS.md) for guarantees and limits.

## File / module map

| Path                                              | Responsibility                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                                    | Entry point, render-error boundary, progress provider and router                                          |
| `src/app/router.tsx`                              | Browser routes: library, story, reader, quiz library/session, rewards, account, parent area and not-found |
| `src/app/RootLayout.tsx`                          | Theme attribute, route focus management, session/profile failure recovery                                 |
| `src/app/layouts/ChildLayout.tsx`                 | Desktop sidebar, mobile navigation, skip link, profile switcher                                           |
| `src/app/RequireProfile.tsx`                      | Sends signed-in parents without a selected child to the account page                                      |
| `src/design-system/`                              | Button, IconButton, Avatar, PageIntro, ProgressBar and Sheet primitives                                   |
| `src/styles/tokens.css`, `src/styles/global.css`  | Design tokens for all four themes and global base styles                                                  |
| `src/features/library/`                           | Library with search and reading-status filters stored in the URL                                          |
| `src/features/story/`                             | Story details, start/resume/replay and reward preview                                                     |
| `src/features/reader/`                            | Book reader (`StoryBook`), page turning, completion and the parent-chosen YouTube video                   |
| `src/features/quiz/`                              | Independent quiz library and quiz sessions                                                                |
| `src/features/rewards/`                           | Badges and milestones                                                                                     |
| `src/features/account/`, `src/features/auth/`     | Sign-in/sign-up, Google button, child profiles, guest import, PIN security                                |
| `src/features/parent/`                            | Parent PIN gate, family dashboard and per-story video management                                          |
| `src/features/theme/`                             | Theme picker sheet and glyphs                                                                             |
| `src/content/library.json`                        | **Single source** for published stories, page text, artwork, alt text and questions                       |
| `src/content/stories.ts`, `themes.ts`, `types.ts` | Typed access to the library, theme metadata, story and progress contracts                                 |
| `src/content/videos.ts`                           | Chooses the parent-saved video; demo films are never shown                                                |
| `src/lib/progress.ts`                             | Storage validation and pure page/completion/quiz transitions                                              |
| `src/lib/context.tsx`                             | Session lifecycle, guest persistence, child hydration and event synchronization                           |
| `src/lib/api.ts`                                  | Typed same-origin account/progress client                                                                 |
| `src/lib/outbox.ts`                               | Validated account/child-scoped pending events and optimistic progress                                     |
| `src/lib/paper-turn.ts`, `usePaperDrag.ts`        | Page-turn timing and pointer drag                                                                         |
| `src/lib/useReadingActivity.ts`                   | Foreground reader heartbeat with idle/visibility pauses                                                   |
| `src/lib/youtube.ts`                              | Strict video-link parsing and controlled iframe URLs                                                      |
| `server/catalog.mjs`                              | Server grading catalog (page counts, answer keys) derived from `src/content/library.json`                 |
| `server/store.mjs`                                | SQLite schema, password/session hashes, ownership, event transactions and grading                         |
| `server/family.mjs`                               | Additive migration, parent PIN gate, family monitoring, active-time intervals and Google identities       |
| `server/google.mjs`                               | Google RS256 token verification, audience/issuer/expiry/nonce validation and cached signing keys          |
| `server/youtube.mjs`                              | Canonical YouTube URL validation for parent-saved videos                                                  |
| `server/app.mjs`                                  | HTTP API, cookies, write-origin checks, safe built-file serving                                           |
| `server/index.mjs`                                | Server settings, private database permissions and graceful shutdown                                       |
| `scripts/dev.mjs`                                 | Starts and stops the API and Vite together on Linux/Windows                                               |
| `public/worlds/`, `public/art/`                   | Environment artwork, original SVG covers and story scenes                                                 |
| `src/**/*.test.ts`, `server/test/`                | Unit and real-HTTP API tests                                                                              |
| `tests/`                                          | Playwright browser checks: navigation, themes, accounts and reader (isolated in-memory server)            |

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
