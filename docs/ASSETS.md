# Environment artwork and story scenes

These assets were generated with Image Gen for this project on 2026-11-12 and encoded with FFmpeg as WebP (environment quality 86; earlier story scenes quality 88; dialogue scenes quality 87; compression level 6). They are local files with no runtime image API, external service or credentials.

| Production asset | Use | Art direction / context |
| --- | --- | --- |
| `public/worlds/classic.webp` | ClassicBook selection thumbnail | Sunny reading nook, wooden desk and illustrated book. The ClassicBook reading canvas stays calm. |
| `public/worlds/forest.webp` | ForestBook environment and thumbnail | Deep enchanted woodland, real bark, climbing ivy, fireflies and a wooden reading table. |
| `public/worlds/ice-garden.webp` | IceBook environment and thumbnail | Enchanted snow garden: frosted birches, crystal flowers, a translucent ice path and a warmly lit crystal arch. |
| `public/worlds/holo-city.webp` | HoloBook environment and thumbnail | Unoccupied cyberpunk spaceport: neon towers, skybridges, flying exploration ships and an empty glass observation deck. The alien character was removed at the founder’s request. |
| `public/art/moon-paper-plane.webp` | Oyga maktub, logical page 4 | Timo and Lola making a paper airplane. |
| `public/art/cloud-ant-rescue.webp` | Bulutlar kemasi, logical page 6 | A paper boat with a leaf sail rescuing the ant. |
| `public/art/sea-friends.webp` | Dengizning kichik siri, logical page 6 | Nuri and Marvarid waiting safely beside a rock. |

The four environment files total approximately 1 MiB. The active nonclassic environment loads eagerly; selection thumbnails load lazily. HoloBook's transparency, blur, border reflections and text backing are live CSS over the environment, not a baked picture of a book. Reduced motion disables the slow environment animation. An image failure leaves the theme's solid fallback and all reading controls working.

The original authored SVG covers remain in use for discovery and opening illustrations. Each page's scene image and alt text are specified in `src/content/library.json`; contracts live in `src/content/types.ts`. A unit test checks that every referenced image exists in `public/art/`. Do not replace missing scenes with repeated covers.

The earlier decorative frame assets and review captures are retained under `docs/visual-review/archive/` for design history. They are no longer shipped from `public/` or used in the interface.

## Dialogue illustrations

Twelve additional scenes were generated as three 2×2 illustration sheets with consistent characters within each story, cropped into individual local WebP assets with FFmpeg. The generated source sheets remain outside the repository in `/workspace/generated_images/`. The optimized production crops total approximately 1.4 MiB.

| Assets under `public/art/` | Story moments |
| --- | --- |
| `moon-letter.webp`, `moon-tree.webp`, `moon-owl.webp`, `moon-gathering.webp` | Writing the friendship letter, tree attempt, owl's advice and friends gathering around the grounded lantern. |
| `cloud-folding.webp`, `cloud-sail.webp`, `cloud-passenger.webp`, `cloud-goodbye.webp` | Folding with grandfather, leaf-sail advice, first passenger and sunset farewell. |
| `sea-meeting.webp`, `sea-courage.webp`, `sea-lights.webp`, `sea-song.webp` | Meeting Marvarid, encouragement, glowing fish and the grateful goodbye/song. |

All main quoted dialogue pages have illustrations. The gathering and courage scenes span two connected dialogue pages each; descriptive alt text matches the current passage. No story sentence is removed or duplicated. Recap scenes now use corresponding scene artwork when available.

## Replaced ice and hologram backgrounds

The founder rejected the original ice-palace and orbital-observatory pictures. Two new Image Gen environments replace the actual artwork in both cards and full-page scenery; this revision is not a tint of the rejected pictures. Production files use new names so existing browser caches cannot continue showing the old artwork. The previous assets are retained only under `docs/visual-review/archive/worlds/`. New images use FFmpeg WebP quality 87, compression level 6. Their original generated PNGs remain outside the repository in `/workspace/generated_images/`. ClassicBook and ForestBook artwork is unchanged.

## Founder clarification: future means science fiction

The founder clarified that Kelajak means alien civilizations, cyberpunk cities and spaceships, supported by their supplied futuristic image-search reference. `holo-spaceport.webp` is new Image Gen artwork in that direction; the superseded fairy glass garden is now archived outside `public/`. The HoloBook reader remains transparent glass with its existing reveal animation. The new asset name also avoids stale browser images. Ice, Forest and Classic production artwork is unchanged by this clarification.

## Original picture-book scenes

The founder supplied printed picture-book pages as inspiration and explicitly asked not to copy them. Twelve new Image Gen watercolor/gouache scenes use soft ivory vignette edges and expressive characters. Three consistent four-scene sheets were inspected and cropped with FFmpeg into 627×627 WebP files (quality 87, compression 6). They render around 354 px desktop / 224 px mobile. Generated PNG originals remain outside the repository in `/workspace/generated_images/`.

| New files under `public/art/` | Story moments |
| --- | --- |
| `picture-moon-opening.webp`, `picture-moon-lantern.webp`, `picture-moon-gathering.webp`, `picture-moon-owl.webp` | Moon watching, safe ground lantern, reading the letter together, owl’s advice. |
| `picture-cloud-opening.webp`, `picture-cloud-puddle.webp`, `picture-cloud-wind.webp`, `picture-cloud-goodbye.webp` | Zara at the window, first puddle attempt, moving leaf-sail boat, sunset farewell. |
| `picture-sea-opening.webp`, `picture-sea-meeting.webp`, `picture-sea-lights.webp`, `picture-sea-home.webp` | Shallow sea, turtle meeting, glowing fish, returning home. |

`holo-city.webp` is an Image Gen edit removing the alien character from the prior spaceport and reconstructing the empty deck. The city and spacecraft remain. The old character-bearing image is archived at `docs/visual-review/archive/worlds/holo-spaceport-with-alien.webp`. New production filenames avoid stale browser images.
