# Loading performance improvements — 22 October 2026

## Main cause and resulting behaviour

Previously the public layout waited for a browser-only query-parameter boundary and the temple catalogue API before mounting the entire website. The first HTML response contained a loading message, with no hero heading or photo. Both hosting services also use Render Free, which sleeps after inactivity.

The SRMS public identity now lets the landing page render immediately in the initial server HTML. Only a tiny query observer waits for browser URL parameters. Other temple portals still resolve their own identity; they are not labelled as SRMS while loading. Ownership and active-temple validation remain server-enforced.

Sevas and events start loading in parallel with the catalogue instead of waiting for its result. If the API is unavailable, static mandir content remains visible and business actions continue to require the backend.

## Asset and request changes

- Archive photo originals totalled 2,456,112 bytes. Equivalent WebP assets total 517,222 bytes, a 79% reduction of these source assets. This is not a claim that the entire page is 79% smaller: Next previously optimized some images dynamically.
- The hero and archive photos use pre-encoded WebP assets, avoiding runtime image resizing/encoding on the small frontend instance. The hero is preloaded in initial HTML.
- Gallery thumbnails are separate 120 × 90 assets. Initially, one full gallery image is mounted instead of seven. Neighbouring photos load as the gallery approaches the viewport. Rotation remains every three seconds while in view, with explicit pause/play controls.
- Fonts use variable weight ranges with swap behaviour.
- Public photo responses have a one-day browser cache policy. Explicit-date Panchang responses cache for an hour in browsers and up to a day in shared caches; a bounded 64-day server cache avoids repeat astronomy calculations. Requests without an explicit date have a one-minute policy so midnight remains safe.
- Public catalogue GETs no longer attach a user's bearer token, avoiding unnecessary cross-origin preflight. Personal bookings, receipts and all protected requests still attach their token and use `no-store`.
- Panchang dates use a hydration-safe clock so a statically generated homepage does not retain its build date.

## Verification

- Production build, TypeScript and targeted ESLint passed.
- `node --experimental-strip-types scripts/check-public-request-auth.mjs` verified that catalogue reads are anonymous while private booking/receipt requests retain authentication and `no-store`.
- Before: live initial HTML was 12,106 bytes and did not contain `home-heading`. After: local production HTML contained the hero, gallery and real photo URL before JavaScript or API completion.
- Stopped only the local API and opened a fresh production preview: the full public homepage remained visible. The local API was restored after the check; the deployed backend was not stopped.
- Browser inspection confirmed seven full gallery image elements before versus one on the new initial homepage. Offscreen rotation is suspended.
- Verified Demo/SRMS portal switching and no browser hydration errors.
- Checked the actual image/Panchang cache headers. The pre-encoded hero is 56,282 bytes.
- Baseline single warm HTTP samples: homepage response 647 ms, catalogue 1,059 ms and Panchang 214 ms. These are diagnostic samples, not mobile Core Web Vitals or a Lighthouse score. Removing the catalogue from the rendering path is independent of its response time.

## Live deployment verification

Frontend commit `a7e2ad7` deployed successfully on Render (`dep-dbd30enavr4c73996gig`). Live HTTPS checks returned 200, with the hero heading and WebP URL in initial HTML, a 56,282-byte hero, and the intended image/Panchang cache headers. A single warm homepage response sample was 467 ms; this is not a full-page load measurement. Browser checks confirmed lazy image loading, automatic gallery rotation when visible, populated Panchang, and no captured console errors. The existing SRMS devotee sign-in also succeeded in the local production build.

## Hosting limit

[Render Free services sleep after 15 idle minutes and can take about a minute to restart](https://render.com/docs/free#spinning-down-on-idle). The backend is no longer required to display the landing page, but a sleeping frontend must still wake before it can return HTML. Reliable first-visit latency requires always-on hosting for the frontend and backend. Render lists $7/month per entry paid web service, approximately $14/month for these two services before taxes and usage charges. No billing plan has been changed.

Regenerate the assets after replacing source photos with `node scripts/optimize-mandir-images.mjs` from `frontend`. Publish new filenames when replacing cached public photos to invalidate their browser cache immediately.
