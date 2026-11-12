# Theme and story layout QA — 2026-11-12

## Target and scope

The supplied visual targets are the user's cyan futuristic glass/HUD reference, white crystalline Ice Skating border, the existing reader screenshot, and the story-details screenshot. ForestBook's target is the user's explicit bark-and-long-ivy description. These are material and interaction references for an existing reading product, not a request to reproduce dashboard charts or the skating poster's copy.

Source visual truth paths for the generated material assets used in the comparison:

- `public/themes/forest-frame.webp`
- `public/themes/ice-frame.webp`
- `public/themes/holo-frame.webp`

The original user references remain in the conversation. Generated frame assets were separately opened and inspected before integration. They retain transparent centers; they are real raster assets rather than CSS/SVG approximations. Three new story vignettes depict the corresponding airplane-making, ant-rescue, and whale/turtle events.

## Evidence and normalization

- Combined source-material / rendered-page comparison: [material comparison](docs/visual-review/material-comparison.webp).
- Full-page selected theme: [HoloBook details and shell](docs/visual-review/holo-details.webp).
- Focused mobile state: [IceBook page 4](docs/visual-review/ice-mobile.webp).
- Full runtime captures: `/tmp/iqro-theme-review/{forest,ice,holo}-reader-v2.png`, `*-details-v2.png`, and `*-mobile-v2.png`.
- Focused book captures: `/tmp/iqro-theme-review/{forest,ice,holo}-book-focus.png`.
- Browser viewport: 1440 × 1050 desktop and 390 × 1000 mobile; device scale factor 1. No device frame or browser chrome was included.
- Source material files: 1536 × 1024 RGBA, converted to WebP with retained alpha. They intentionally adapt to the book's viewport-dependent aspect ratio. This is material-identity comparison, not a pixel equality claim between a bare frame and a full interface.
- Combined comparison input: a single 1280 px wide browser-rendered board containing each source frame next to its actual cropped book, all on the same story and logical page 4. It was opened and visually reviewed after capture.
- Focused comparisons examined book edges, text insets, inline scene scale, selected-theme controls, and mobile frame clearance. Full-page details captures confirmed that sidebar, canvas, buttons, text and borders change together.

## Comparison history

1. Initial implementation review found two P2 mismatches: portrait cover frames were cropped by inherited `object-fit: cover`, and the mobile material rim covered the small first chapter label. Corrected frame fitting and increased mobile inner top/footer clearance. Post-fix evidence is the `*-details-v2.png` and `*-mobile-v2.png` capture set and the tracked review images above.
2. Automated contrast checks found an IceBook selected-filter text ratio below 4.5:1 and insufficient contrast on the existing completion badge. Darkened the IceBook muted token and bound the completion badge to the active surface/ink palette. Reran checks in all four themes, including completed stories, earned rewards, and populated parent activity: passed.
3. Final visual comparison found no remaining actionable P0/P1/P2 issue in the requested material/layout scope. A nonessential decorative mobile folio can blend into dense frost; the primary page counter and navigation remain clear. This is retained as P3 polish, not hidden or substituted in tests.

## Required fidelity surfaces

- **Typography:** retained calm Georgia story text at 20–25 px with approximately 1.85 line height; HoloBook uses readable system sans at 21–24 px. Large-text mode remains supported. Tiny chapter labels are secondary. No dense dashboard typography was copied into child reading content.
- **Spacing/layout:** one engine renders two structured leaves on desktop and stacks them on mobile. Illustrations are optional blocks among text. Every original story sentence is preserved exactly once across leaves. Frames reserve outer room and do not replace live content. The cover/sidebar arrangement of story details remains intact.
- **Colors/tokens:** ClassicBook, forest/parchment, frost-blue, and navy/cyan have complete persisted application palettes. Selection immediately updates the shell and survives refresh/navigation. Automated WCAG A/AA checks pass for the tested states in each palette.
- **Image quality:** generated wood/ivy, ice-crystal, and glass assets preserve their distinctive edges in the rendered comparison. Transparent story scenes sit among paragraphs instead of filling a mandatory whole leaf. Covers are used only for the opening, not repeated on every page. WebP keeps the six new production images to approximately 1.9 MiB; local assets have no external runtime dependency.
- **Copy/content:** Uzbek labels, original story wording, separate Savol-javob flow, and existing quiz content are retained. No financial charts or irrelevant reference text were introduced. Only two of each story's eight logical pages contain illustrations, with the second picture tied to a specific plot event.

## Interaction/browser verification

Real Chromium rendered the captures and exercised theme controls, navigation, storage/resume, all story pages, paper turns, pointer/touch dragging, one-time instruction, completion, quiz and parent flows. Captures reported no uncaught page errors. Checks: build, lint, 10 unit tests, and 29 browser tests passed. Responsive checks cover 320, 390, 768, 1024 and 1440 px.

The optional `sites-preview` shared relay was unavailable and `terminal.local` returned a domain denial. No shared/live preview or deployment is claimed. Visual verification used the running Vite application directly in executor Chromium at loopback port 4173. The local development service remains running; the tracked screenshots make the result reviewable without a shared relay.

## Follow-up polish

- P3: give the nonessential mobile frost folio more separation from dense decorative crystals. The primary progress counter remains visible and is covered by navigation tests.
- Further art can be added through the existing block model without changing reader logic or making illustrations compulsory.

## Implementation checklist

- [x] Distinct raster material frames for forest, ice and holographic glass.
- [x] Immediate, persisted whole-application theme selection.
- [x] Structured leaves and editorial illustration placement.
- [x] Preserved reading, drag/turn, quiz, reward and parent behavior.
- [x] Post-fix browser captures and combined visual comparison.
- [x] Build, lint, unit, functional, responsive and contrast checks.

final result: passed
