# Project audit and implementation map

## Phase 0: repository at intake

The only tracked file was a 17-byte `README.md` at commit `63388af490509eac1bd0b538f7a05baf2ced89e3`. The working tree was clean. There was no application framework, dependency declaration, UI, story data, state management, API, auth, database, test runner, or agent instruction file. There was no working infrastructure to refactor, duplicated code, or known application bug to remove.

KEEP: the repository identity and original README title, now expanded into run documentation. Establishing a small new frontend was necessary because no application existed.

## Product rule precedence

The founder's correction before the master prompt takes precedence over its sequential quiz examples: Savol-javob is an independent destination with completed-book questions and general questions. Finishing a story never forces or automatically opens a quiz. The child can read, finish, view the recap, and return to the library. A completion badge depends on reading completion, not a quiz score.

The provisional product name is Iqro. No billing, social features, leaderboard, chatbot, or content-generation pipeline is included.

## Current stack and boundaries

React 19, TypeScript, Vite, npm lockfile, Lucide icons, CSS tokens, authored local SVG artwork, Vitest, Playwright/Chromium, ESLint, and axe-core.

The route layer is a small hash router: library, story details, reader, completion, independent quiz library/session, rewards, and parent view. Unknown stories and destinations have a recovery action. Everything is client-side; no server credentials or API contract is implied.

Story content is typed structured data, never HTML. The same pages feed one reader; themes control CSS custom properties and environmental details. Themes never own progress or story logic.

Progress functions are immutable and separated from rendering. Versioned storage parsing tolerates malformed data. Completion retains its original timestamp across refresh/replay. Quiz attempts are recorded only by an explicit completed attempt; refreshing results does not record another attempt. The best score is preserved. Local storage remains user-editable, so server-enforced anti-abuse and privacy are not claimed.

## File / module map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Route selection and unknown-route handling |
| `src/main.tsx` | Entry point and render-error boundary |
| `src/components/Shell.tsx` | Desktop sidebar, mobile navigation, skip link, storage warning |
| `src/components/Home.tsx` | Featured story, discovery, search, filters, resume, theme previews |
| `src/components/StoryDetails.tsx` | Story description, theme selection, start/resume/replay |
| `src/components/Reader.tsx` | Shared reader engine, navigation, completion |
| `src/components/Recap.tsx` | Curated illustration animation and video fallback |
| `src/components/Quiz.tsx` | Independent quiz library, answers, feedback, results, retries |
| `src/components/Progress.tsx` | Milestones, story badges, local parent activity |
| `src/components/ui.tsx` | Reusable story card, artwork fallback, empty state, section title |
| `src/data/types.ts` | Story, pages, themes, media, questions, progress contracts |
| `src/data/stories.ts` | Original content, publication status, theme metadata, general questions |
| `src/lib/progress.ts` | Storage validation and pure page/completion/quiz transitions |
| `src/lib/context.tsx` | Local persistence and route subscription |
| `src/styles.css` | Design tokens, components, theme layers, responsive rules, motion |
| `public/art/` | Original lightweight SVG story illustrations |
| `src/lib/progress.test.ts` | State and content validation tests |
| `tests/` | Functional, responsive, failure-state and accessibility browser checks |

## Incremental execution

1. Audited the empty repository; established typed React foundation and reusable content model.
2. Implemented and built the library/details interface and shared visual components.
3. Added one reader and four theme layers, progress/resume, completion, and recap animation.
4. Added independent book/general quizzes and lightweight completion rewards.
5. Added the local parent view; tested core flows, failure recovery, responsive layouts, and accessibility.

## Known limits and next phase

The frontend demonstrates the reading loop. The next production phase is authenticated parent accounts with child-profile ownership, server-side progress/quiz validation, database uniqueness constraints for completions and rewards, and integration tests for unauthorized cross-account access. There is no public endpoint to test for authorization in the current frontend.

Further content work: editorial review, distinct scene illustrations per page, produced recap media/captions, and more stories. Reading duration is an estimate; actual reading time is deliberately not fabricated. Current badges are on-screen achievements, not downloadable signed certificates. The demo supports one local profile; profile IDs and family ownership must be introduced with authentication.

Automated checks are Chromium based. Axe checks help catch accessibility regressions but do not replace testing with children, assistive technology, or an editorial reading-level review.

No deployment or environment publication is performed by this implementation.
