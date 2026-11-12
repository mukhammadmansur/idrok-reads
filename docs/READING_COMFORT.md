# Reading comfort and flow review — 2026-11-12

The founder supplied a screenshot of the HoloBook details screen and requested simpler start/finish flows, softer backgrounds, more pleasant motion, stable book dimensions, material consistency during turns, simpler stories and YouTube link playback. This update extends the existing product and preserves story IDs, saved progress, earned badges and the independent Savol-javob section.

## Capture method and findings

Evidence was captured in actual Chromium from the running Vite app at loopback port 4173. Desktop: 1440 × 1050; mobile: 390 × 1000, DPR 1. Baseline capture and measurements were taken before edits during this review. The original supplied screenshot is also a reference. Browser captures were opened and reviewed before accepting them. No deployment or shared hosted preview is claimed.

1. **Choose a book — improved.** The initial screen had a tall cover, a long description, multiple explanatory fragments and repeated opening text below. The new invitation has a smaller cover, short description, four world choices and a clear primary action. Saved reading and completed-book states have distinct messages and actions. [Before/after flow](visual-review/comfort-flow.webp).
2. **Read and turn — corrected.** Baseline HoloBook heights were 482, 523, 523, 523, 611, 482, 523 and 567 px across one story. Both leaves had the same React key, which could leave an extra old leaf in the DOM during updates. Distinct keys now enforce two leaves. Hidden, inert measurement copies reserve one height across the story at the current width and type size. Tests check exactly two live leaves, no content clipping, and no height drift on every page. Final desktop sample: Classic/Forest/Ice 535 px on all eight pages; Holo 577 px on all eight pages. Different themes may use different font metrics; page changes within a theme keep the size stable. [Four final reader worlds](visual-review/comfort-worlds.webp).
3. **Finish and choose what follows — improved.** The earlier video pushed next actions below the fold. Library, replay and rewards actions now appear above the video. Replay starts at page one and retains the earned badge and its original completion date. The completed details screen also offers video and replay explicitly.
4. **Watch a video — integrated, external playback limited.** Normal YouTube links are configured in `src/data/videos.ts`. A click loads a controlled `youtube-nocookie.com` iframe; a direct YouTube link remains available. Films are labeled as temporary demo viewing, not original story recaps. URL parsing, iframe integration, click-to-load behavior and the direct fallback are tested. Actual third-party playback could not be verified: this cloud environment returns HTTP 403 for YouTube and the domain is absent from its network policy. Embedding can also depend on the uploader, region and viewer settings. A network-aborted browser test proves the other completion/replay actions remain usable.

## Appearance and motion

ClassicBook uses a faint warm reading-nook scene, paper depth and a physical turn. Forest scenery is softened and desaturated, retaining woodland identity. Ice keeps bright crystalline surroundings and pale reading surfaces. Holo scenery is darker, softened and less saturated behind transparent glass. Four retained scenery layers crossfade over 1.25 seconds after loading; palette surfaces transition gently. Low-key drifting motes, subtle illustration motion, page-content entrances, cover interaction and a completion-medal entrance add movement. All decorative motion and transitions are disabled under reduced motion.

Physical paper surfaces now share the same material color and leaf boxes in the live book, preview and turning strips. HoloBook continues to reveal content on stationary glass. A dedicated regression check compares live and turning background, padding and story typography, and checks that the book size remains constant during the turn.

## Content and media setup

The three stories use short, concrete Uzbek sentences. Animals are named Tulkixon, Quyonvoy, Boyo‘g‘li bobo, Kitvoy and Toshbaqacha; character references, image alt text, discovery copy and questions are updated together. IDs and quiz answer indices remain stable. Existing illustrated plot scenes remain relevant to the simpler wording.

Change `url`, `title` and `credit` in `src/data/videos.ts` to replace a demo film. Supported HTTPS formats: `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…` and `/embed/…`, with an 11-character video ID. Arbitrary HTML, protocols and unrelated hosts are rejected. No API key or server credentials are needed. The current external demo selection is Big Buck Bunny (Blender Foundation), Pip (Southeastern Guide Dogs) and The Present (Jacob Frey). Live availability and embedding permission remain unverified in this environment.

## Accessibility and validation

Hidden measurement content is both inert and aria-hidden. Live reading content remains the only announced story. Controls retain keyboard/touch operation and accessible labels. A low-contrast secondary replay button was found during visual review and automated checks and corrected using the active ink/surface palette. Screenshots alone do not establish accessibility compliance or suitability for every child; the checks below cover the implemented behavior and automated WCAG A/AA rules.

Final build/lint/unit/browser results are recorded in the root design QA report. Raw accepted evidence is in `/tmp/iqro-comfort-review/`; the tracked comparison boards and [mobile invitation](visual-review/comfort-mobile.webp) make the review reproducible without the temporary directory.
