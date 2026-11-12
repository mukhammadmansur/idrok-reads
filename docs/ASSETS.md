# Material frames and story scenes

The material and scene assets below were generated with Image Gen for this project on 2026-11-12, then encoded as WebP with FFmpeg (quality 88, compression level 6). Alpha transparency is retained. No credentials, external asset service, runtime image API, or additional image library is required.

| Production asset | Use | Art direction / editorial context |
| --- | --- | --- |
| `public/themes/forest-frame.webp` | ForestBook frame, theme preview, story detail cover edge | Textured tree bark, moss and long climbing ivy. Transparent center keeps live story text readable. |
| `public/themes/ice-frame.webp` | IceBook frame, preview, cover edge | White fern-like frost and aquamarine ice crystals, based on the user's frozen-border reference. |
| `public/themes/holo-frame.webp` | HoloBook frame, preview, cover edge | Etched cyan glass rim and illuminated technical corners, based on the user's futuristic glass-panel reference. |
| `public/art/moon-paper-plane.webp` | Oyga maktub, logical page 4 | Timo and Lola making a paper airplane, directly supporting this plot moment. |
| `public/art/cloud-ant-rescue.webp` | Bulutlar kemasi, logical page 6 | A folded paper boat with a leaf sail rescuing the ant from a wet stone. |
| `public/art/sea-friends.webp` | Dengizning kichik siri, logical page 6 | Nuri and Marvarid waiting together safely beside a rock. |

Together the six production WebP files are approximately 1.9 MiB. The reader loads the current material and current page's illustrations; theme previews below the fold use lazy image loading. The original authored SVG covers remain in use for discovery and opening illustrations. Editorial placement is specified in `src/data/stories.ts`; reusable block types live in `src/data/types.ts`.

Do not replace missing illustration blocks with repeated covers. A text-only story page is intentional. The reader, progress, paper-turn animation, and comprehension questions remain independent from illustration placement and theme appearance.
