# Image Sources

Real photographs only. No AI-generated imagery is used on this site.
Attribution for every third-party photo is published on `photo-credits.html` (linked in the
home page footer) — CC BY and CC BY-SA require it. Keep that page in step with this table.

| Local file | Query | Photographer | Unsplash URL | Used in |
|------------|-------|--------------|--------------|---------|
| `assets/images/hero-business-bay.jpg` | Dubai skyline night | [Robert Bock](https://unsplash.com/@robertbock) | https://unsplash.com/photos/panoramic-photography-of-the-city-during-night-cV4qkkorDFY | `index.html` — hero background |
| `assets/images/dubai-skyline-dusk.jpg` | Dubai skyline night | [Ahmed Aldaie](https://unsplash.com/@ahmedaldaie) | https://unsplash.com/photos/a-city-with-tall-buildings-aKj9uDanF18 | `index.html` — section 01 About, wide figure |

Wikimedia Commons, added 1 November 2026 (chosen to differ from any imagery used by other companies' sites):

| Local file | Author | Licence | Source | Used in |
|------------|--------|---------|--------|---------|
| `assets/images/business-bay-canal.jpg` | Iwona Rege | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Dubai_Water_Canal_Business_Bay.jpg | `index.html` — 04 For property owners |
| `assets/images/community-dubai-marina.jpg` | Norlando Pobre | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Dubai_Marina_Skyline.jpg | `index.html` — 06 apartments, Dubai Marina card |
| `assets/images/community-palm-jumeirah.jpg` | kallerna | CC0 | https://commons.wikimedia.org/wiki/File:Palm_Jumeirah_from_Dubai_Marina.jpg | `index.html` — 06 apartments, Palm Jumeirah card |

Own photograph: `assets/images/unit-palm-studio.jpg` (studio, The Palm Tower) and its resized copy
`unit-palm-studio-wide.jpg` used in `index.html` — 05 For guests.

The only interior photograph is of an apartment the company actually operates (the Palm Tower
studio, also shown on `rates.html`). Do not add stock interiors — they could be mistaken for a unit.

## Fetching more images

```bash
node ~/.claude/skills/visual-assets/scripts/fetch-unsplash-images.js --query "Dubai Business Bay" --count 4 --out assets/images
```

The script writes its own report into `assets/images/` and overwrites it on each run —
copy any attribution you need into this file before running it again.
