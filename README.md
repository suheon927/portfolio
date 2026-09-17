# Yi Suheon · Portfolio

Personal portfolio at **[yisuheon.dev](https://yisuheon.dev/)**.

- [한국어](https://yisuheon.dev/ko/)
- [日本語](https://yisuheon.dev/ja/)
- [English](https://yisuheon.dev/en/)

Three released apps, their screenshots and engineering case studies, public implementation samples, team projects, and education. Content is based on the [GitHub portfolio](https://github.com/suheon927/suheon927).

## Edit and build

Node.js 22 or newer. No npm dependencies are required.

```sh
npm run build
npm test
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/ko/`.

- `content/{ko,ja,en}.json`: localized content; keep all three schemas in sync.
- `scripts/build.mjs`: generates the root page, three locale home pages, nine project pages, sitemap, and robots file.
- `assets/styles.css`: responsive styling.
- `assets/site.js`: mobile navigation and accessible native-dialog image previews. Core content, language links, navigation, and images remain usable without JavaScript.
- `assets/screenshots/`: seven unmodified development/review captures with synthetic demo data. [Capture provenance](https://github.com/suheon927/suheon927/blob/main/assets/screenshots/README.md).
- `scripts/check.mjs`: validates translations' structure, routes, local links and fragments, gallery coverage, metadata, and domain preservation.

All language and project pages are pre-rendered HTML. Language changes preserve the selected project. The Korean root page is a convenient entry point with `/ko/` as its canonical URL.

## Publish

Run build and checks, then commit both source and generated output to `main`. GitHub Pages publishes from the repository root. Keep `CNAME` and `.nojekyll` intact.

Technical descriptions reflect reviewed development sources and may include changes not yet present in an App Store build. Screenshot dates and scope are shown on each project page. Bible permission documents and licensed passages are not published in this repository.
