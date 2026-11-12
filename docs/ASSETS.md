# Environment artwork and story scenes

These assets were generated with Image Gen for this project on 2026-11-12 and encoded with FFmpeg as WebP (environment quality 86; story scenes quality 88; compression level 6). They are local files with no runtime image API, external service or credentials.

| Production asset | Use | Art direction / context |
| --- | --- | --- |
| `public/worlds/classic.webp` | ClassicBook selection thumbnail | Sunny reading nook, wooden desk and illustrated book. The ClassicBook reading canvas stays calm. |
| `public/worlds/forest.webp` | ForestBook environment and thumbnail | Deep enchanted woodland, real bark, climbing ivy, fireflies and a wooden reading table. |
| `public/worlds/ice.webp` | IceBook environment and thumbnail | Crystalline palace, icy columns, frozen lake and distant snowy mountains. |
| `public/worlds/holo.webp` | HoloBook environment and thumbnail | Clear glass orbital observatory, curved transparent stairs and a large blue planet visible behind the reading surface. |
| `public/art/moon-paper-plane.webp` | Oyga maktub, logical page 4 | Timo and Lola making a paper airplane. |
| `public/art/cloud-ant-rescue.webp` | Bulutlar kemasi, logical page 6 | A paper boat with a leaf sail rescuing the ant. |
| `public/art/sea-friends.webp` | Dengizning kichik siri, logical page 6 | Nuri and Marvarid waiting safely beside a rock. |

The four environment files total approximately 1 MiB. The active nonclassic environment loads eagerly; selection thumbnails load lazily. HoloBook's transparency, blur, border reflections and text backing are live CSS over the environment, not a baked picture of a book. Reduced motion disables the slow environment animation. An image failure leaves the theme's solid fallback and all reading controls working.

The original authored SVG covers remain in use for discovery and opening illustrations. Editorial placement is specified in `src/data/stories.ts`; block types live in `src/data/types.ts`. Do not replace missing illustration blocks with repeated covers. Text-only pages are intentional.

The earlier decorative frame assets and review captures are retained under `docs/visual-review/archive/` for design history. They are no longer shipped from `public/` or used in the interface.
