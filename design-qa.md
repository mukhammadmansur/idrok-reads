# Picture-book composition QA — 2026-11-12

## Source target and evidence

The founder supplied the previous HoloBook screenshot plus collages/close-ups of printed children's books. They explicitly requested inspiration rather than copying: large illustrations, natural pages and a clear starting point for reading. The references are visible in the conversation but are not mounted as local files. Original generated visual sources for this adaptation are public/art/picture-cloud-opening.webp (627×627), corresponding moon/sea scenes, and public/worlds/holo-city.webp.

- [Before/after comparison](docs/visual-review/picturebook-comparison.webp).
- [Source illustration and focused rendered spread](docs/visual-review/picturebook-art-layout.webp).
- [ClassicBook](docs/visual-review/picturebook-classic.webp), [HoloBook](docs/visual-review/picturebook-holo.webp), [mobile reading](docs/visual-review/picturebook-mobile.webp).
- Raw captures: /tmp/iqro-picturebook-review/.

The old and new application captures show the same story (Bulutlar kemasi), page one and theme at 1440×1050 CSS pixels, DPR 1. A temporary snapshot of the prior commit supplied the old view on port 4181; the new view uses port 4173. Mobile is 390×1000, DPR 1. No device/browser frame is included. The full comparison scales both views proportionally to equal widths. A second combined input places the 627 px source illustration beside the actual book crop so art quality and body text can be inspected clearly. Both boards were opened and reviewed together. This is an original adaptation of picture-book principles, not a pixel clone of the supplied printed books.

## Findings and fixes

- P1: automatic sentence splitting created competing reading blocks and could split a quotation at the spine. Every page now contains one complete passage in one reading area; narration and picture change sides between scenes. Tests verify the exact full passage, once, on all 24 pages.
- P1: small repeated covers, chapter chips and rounded dark text panels made the book look like a dashboard. They are removed from the reading leaves. The opening is a natural "Bir bor ekan..." with a large original scene. HoloBook retains glass, with narration written directly on a darker glass leaf.
- P2: weak illustration scale and missing scenes. Twelve original watercolor/gouache scenes replace the small openings and fill missing moments. All published pages are illustrated. Images render about 354 px high on desktop and 224 px on mobile, with paper blending or a soft glass vignette.
- P2: unwanted alien in the futuristic environment. Image Gen removed it and reconstructed the deck, preserving the neon city and spacecraft. Both card and scenery use the new holo-city.webp filename.
- P2: scenery movement was too subtle. Active environments now pan/zoom on a 16-second alternating cycle; inactive layers pause. City light breathes slowly. Browser tests observe the transform actually changing and then verify reduced motion disables it.
- Regression tests that assumed text always belonged to the right leaf were updated to target the narration leaf. Navigation behavior and expected progress were not weakened.

The final full and focused comparison found no remaining actionable P0/P1/P2 issue in this scope. The existing brief hand demonstration remains once per browser. Minor illustration-edge refinement can be future polish.

## Required fidelity surfaces

Typography: Georgia at 26 px / 1.7 desktop and 21 px / 1.65 mobile supports print-like reading; large type remains available. Holo uses system sans at 25 px with a serif opening heading. Paragraphs wrap in one column, with complete quotations and no competing reading order.

Layout: two physical leaves retain the existing turning engine and stable measured height. Large art, calm whitespace and a single narration block follow the reference principles. Caption/chapter UI no longer competes with story content. Tests check no clipping at 320, 390 and 1440 px, including large text.

Colors: Classic/Forest/Ice retain their paper materials. Holo keeps transparent glass and readable white narration on a darker leaf. Automated WCAG A/AA checks pass for the tested themes and completion states.

Images: original generated raster art, not reference-book copies or code-drawn substitutes. New 627×627 WebP files are sharp at the intended render size. Paper blending and the holographic edge mask were inspected at focused and full sizes. Discovery covers remain outside the reading content.

Copy: simplified Uzbek passages, character names, quiz answers and story IDs are preserved. Each passage appears exactly once. Hidden measurement copies stay inert and aria-hidden; only live narration announces the page.

## Validation and limits

Build, lint and 12 unit tests passed. Browser coverage is 48 scenarios: 42 passed in the complete run; the six right-leaf-dependent selectors were corrected and all six passed on the focused rerun. Application code did not change after that full run. Coverage includes every page's full passage and loaded large art, stable dimensions, large type, material consistency, keyboard/touch/held drag, reduced motion, moving backgrounds, quizzes and completion/replay/media integration. Responsive checks also cover 768 and 1024 px. Final captures reported no uncaught page errors.

No deployment or hosted preview is claimed. Actual executor Chromium rendered the local Vite application. The optional managed preview relay remains unavailable. YouTube retains its previously documented external-network verification limit; this update does not alter video integration.

## Implementation checklist

- [x] Alien removed from production artwork and selection mapping.
- [x] Clearly moving backgrounds with reduced-motion support.
- [x] One complete reading passage, never split between leaves.
- [x] Large original illustrations and simplified book composition.
- [x] Stable dimensions, physical turns, hologram reveal and saved progress retained.
- [x] Combined visual comparisons opened and reviewed.

final result: passed
