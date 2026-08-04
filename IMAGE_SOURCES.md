# Image Sources

Real photographs from [Unsplash](https://unsplash.com), used under the Unsplash License.
No AI-generated imagery is used on this site.

| Local file | Query | Photographer | Unsplash URL | Used in |
|------------|-------|--------------|--------------|---------|
| `assets/images/hero-business-bay.jpg` | Dubai skyline night | [Robert Bock](https://unsplash.com/@robertbock) | https://unsplash.com/photos/panoramic-photography-of-the-city-during-night-cV4qkkorDFY | `index.html` — hero background |
| `assets/images/dubai-skyline-dusk.jpg` | Dubai skyline night | [Ahmed Aldaie](https://unsplash.com/@ahmedaldaie) | https://unsplash.com/photos/a-city-with-tall-buildings-aKj9uDanF18 | `index.html` — section 01 About, wide figure |

Both are city views. No interior or property photographs are used, so nothing on the
site can be mistaken for a specific unit.

## Fetching more images

```bash
node ~/.claude/skills/visual-assets/scripts/fetch-unsplash-images.js --query "Dubai Business Bay" --count 4 --out assets/images
```

The script writes its own report into `assets/images/` and overwrites it on each run —
copy any attribution you need into this file before running it again.
