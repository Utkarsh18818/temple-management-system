# Mobile layout verification

## Changes

The public header now allows the brand to shrink alongside account, donation and menu actions. On the primary portal, mobile logout is available inside the navigation menu. Secondary portals keep their visible logout action because they use a different navigation layout.

The hero and Panchang stack at tablet widths. Hero and gallery photographs use a 4:3 frame on smaller screens with image cropping rather than stretching. Gallery thumbnails scroll within their own strip and the playback controls wrap with larger touch targets. Mobile body copy, footer text and calendar details have larger text sizes.

Grid children can shrink around long profile values, and public and admin information wraps within its available width. Form fields stay inside their containers. The admin temple selector can shrink, and its mobile navigation scrolls within the dynamic viewport so lower navigation actions remain reachable.

## Verification on 18 November 2026

- Production compilation, TypeScript validation and static page generation passed using `npm run build -- --webpack`.
- Headless Chrome with touch and mobile viewport emulation exercised 32 screen and viewport combinations against the local production build.
- Homepage widths: 320, 360, 390, 430, 768, 1024 and 1440 CSS pixels.
- Additional screens at 360 pixels: public login, registration, donation, sevas, events, festivals, temple directory, account, profile, bookings, donations, receipts and slot booking; admin login, dashboard, temples, devotees, sevas, slots, bookings, donations, payments, events, festivals and audit.
- No checked screen exceeded the document viewport width. Wide admin tables retained their own horizontal scrolling containers. Decorative shapes clipped by their parent were not treated as page overflow.
- No browser runtime errors were reported in that run. Mobile public logout and admin menu/sign-out reachability checks passed.
- Seven final follow-up screen checks passed after the account-navigation adjustment: homepage at 320, 360, 768 and 1440 pixels; donation, a long-named secondary temple portal and admin payments at 320 pixels. Both public portal layouts retained accessible logout controls. The admin navigation was also opened at 844 by 390 pixels in landscape.

Browser checks used intercepted API responses and demonstration fixtures, not production records. They did not create accounts, bookings, donations, payments or refunds. These are layout and navigation checks, not a replacement for payment integration testing or physical-device testing.

Only the frontend needs redeployment for these changes. Existing Render services use manual deployment from `codex/render-deployment`; pushing this branch alone does not establish that the live site has updated.
