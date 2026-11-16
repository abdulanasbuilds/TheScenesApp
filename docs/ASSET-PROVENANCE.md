# Asset provenance — The Scenes

**Last updated:** 16 November 2026
**Scope:** the fixture frontend (`VITE_DATA_MODE=fixtures`) and the public marketing pages.

This file records where every non-generated image in `public/media/` came from, what licence applies,
and how it was prepared. It exists so the founder, a reviewer or a future agent can audit the media
without guessing.

Rules applied:

- no competitor screenshots, brand marks, icons or wording were copied;
- photography comes only from Wikimedia Commons files that carry CC0 or public-domain terms;
- product screenshots are captured from this application, never from another product;
- generated SVGs are made in-repo and contain no third-party marks;
- fixture imagery is temporary by design: the production reset will replace it with creator uploads.

## Photography

All photos were downloaded from Wikimedia Commons at a 1920 px-wide thumbnail, then centre-cropped and
resized locally with high-quality bicubic sampling and JPEG quality 84.

| File in `public/media/` | Dimensions | Subject | Licence | Author / credit | Source |
| --- | --- | --- | --- | --- | --- |
| `guild-cover.jpg` | 1084×576 | Programmer working at a laptop | CC0 1.0 | Crew (Unsplash) | https://commons.wikimedia.org/wiki/File:Programmer_at_work_(Unsplash).jpg |
| `design-cover.jpg` | 1084×576 | Creative desk with Apple computer | CC0 1.0 | Pixel.la Free Stock Photos | https://commons.wikimedia.org/wiki/File:Creative-apple-desk-office_(24244073051).jpg |
| `data-cover.jpg` | 1084×576 | Africa at night from space | Public domain | NASA GSFC / NOAA NGDC, image by Craig Mayhew and Robert Simmon | https://commons.wikimedia.org/wiki/File:Africa_at_night_(Cropped_From_Entire_Earth_Image).jpg |
| `course-agents-cover.jpg` | 1460×752 | Macro photograph of code on a laptop screen | CC0 1.0 | Marc Mueller (seven11nash, Unsplash) | https://commons.wikimedia.org/wiki/File:Macro_laptop_coding_(Unsplash).jpg |

These files are referenced by `src/data/seed.ts` as community and course covers. The four earlier
generated cover SVGs were removed in the same change.

## Product screenshots

The public landing page shows real screenshots of this application. They were captured on
16 November 2026 from the local fixture build at a 1440×900 viewport with device scale factor 1.5,
which produces 2160×1350 JPEG files.

| File in `public/media/screens/` | Route | Notes |
| --- | --- | --- |
| `creator-overview.jpg` | `/dashboard/creator` | Creator overview with sample performance data |
| `community-home.jpg` | `/c/ai-builders-guild` | Community home and feed |
| `classroom-lesson.jpg` | `/c/ai-builders-guild/classroom/prompt-systems-that-hold-up/les-evals-1` | Lesson viewer; the video panel says "Video hosting is coming soon" |
| `explore.jpg` | `/explore` | Discovery catalogue with filters |

The capture script is local tooling under `.audit/` and is gitignored. Screenshots must be recaptured
whenever visible product copy changes, because they are published as marketing imagery.

## Generated brand marks

The wordmark logos and category icons are hand-written SVG files generated for this project. They do
not reproduce a competitor logo or a licensed typeface outline.

- `guild-logo.svg`, `design-logo.svg`, `data-logo.svg`
- `guild-icon.svg`, `design-icon.svg`, `data-icon.svg`

## Review checklist

1. Confirm the licence line for any new photo before it enters `public/media/`.
2. Record the Commons page, author and licence in the table above.
3. Confirm no real person is shown in a misleading endorsement context.
4. Recheck screenshots for internal or engineering-only wording before publishing them.
5. Keep the source URL available; do not rely on the local file alone.
