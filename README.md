# PAFUL QR

**Generate · Customize · Scan · Share**

A free, privacy-friendly QR code platform. Built with HTML, vanilla
JavaScript and Bootstrap 5 for the UI — no build step, no other framework,
no backend, no account required.

## Features

**Generator**
- **11 QR content types** across Basic, Communication, Business,
  Connectivity, Location and Events: URL, Text, WhatsApp, Phone, SMS,
  Email, vCard, Social profile, Wi-Fi, Location, Calendar Event.
- **Live styling**: solid or gradient color, transparent background, dot
  pattern style, eye (finder pattern) style, error correction level, quiet
  zone.
- **Logo overlay**: upload, resize, pad, round, and toggle a clear
  background behind it.
- **Download**: PNG, JPG, WebP and SVG at 512 / 1024 / 2048px or a custom
  size.
- **Print**, **Web Share**, **copy image to clipboard**, and **copy raw
  content** — each feature-detected with a clear fallback message when a
  browser doesn't support it.
- **QR Readability panel**: real contrast and logo-coverage checks, plus an
  actual client-side decode of the rendered QR code (via jsQR) to confirm
  it round-trips — not a simulated checklist.

**Scan, Bulk, History, Templates**
- **Scan** ([scanner.html](scanner.html)) — camera or image-upload QR
  scanning via jsQR, entirely on-device. Results are shown as text with
  Copy/Share/Open actions; nothing is opened automatically.
- **Bulk QR** ([bulk.html](bulk.html)) — upload a `name,value` CSV, get one
  QR code per row, download them all as a ZIP (JSZip). Free for up to 100
  per batch (`FREE_LIMITS.bulkQrPerBatch`); malformed rows are reported,
  not silently dropped.
- **My QR Codes** ([history.html](history.html)) — QR codes saved from the
  generator, stored in `localStorage` only. Filter by collection,
  re-download, re-open for editing, or delete. Capped at
  `FREE_LIMITS.historyItems` (100).
- **Templates** ([templates.html](templates.html)) — preconfigured presets
  for Business, Restaurant, Church, Event and Personal use cases. Picking
  one preconfigures the type, color and pattern but every field stays
  editable on the generator.
- **Business Card** ([business-card.html](business-card.html)) — a
  dedicated digital business card builder: name/title/company/contact
  fields generate a vCard QR, composited into a shareable card image (plain
  Canvas 2D — no extra image library). Five layout templates (Classic,
  Circuit, Skyline, Split, Banner — `js/business-card.js`) share the same
  data, with live thumbnail previews to pick from; downloadable on its own
  or alongside the QR code.
- **Social Media QR** ([social-media.html](social-media.html)) — pick
  Facebook, Instagram, TikTok, YouTube, LinkedIn, X or WhatsApp, enter a
  profile URL or handle, and get a brand-colored, profile-style QR card
  (platform icon + "Scan to follow/connect/chat on ..." caption) rather
  than a generic QR preview.
- **Donate** ([donate.html](donate.html)) — mobile money donation
  instructions for Paful Multi Services (Telecel Cash, MTN MoMo, AT Money),
  with a one-tap "Copy USSD code" button. Linked from a persistent Donate
  button in the navbar on every page.

**Platform**
- **Offline / installable** — a service worker precaches the app shell
  (including the CDN libraries) so the generator keeps working without a
  connection after the first visit; supporting browsers get an "Install
  App" prompt.
- **Light / dark / system theme**, persisted locally.
- Mobile-first responsive layout, keyboard-accessible controls, SEO
  metadata (Open Graph, Twitter, JSON-LD).

## How QR generation works

Each QR type has a small "builder" in [js/qr-generator.js](js/qr-generator.js)
that turns form field values into the exact string that gets encoded (a
`https://` URL, a `WIFI:T:...;;` string, a `BEGIN:VCARD...END:VCARD` block,
etc.). That string is handed to [qr-code-styling](https://github.com/kozakdenys/qr-code-styling)
(loaded from jsDelivr), which renders the styled QR code live and produces
the PNG/JPG/WebP/SVG exports. [jsQR](https://github.com/cozmo/jsQR) is used
both to decode the rendered image for the readability check and to power
the Scan page. Bulk QR generation reuses the same rendering path per CSV
row and packs the results with [JSZip](https://stuk.github.io/jszip/).

Saved history items, templates, and the generator communicate through a
small `localStorage` handoff (`QRHistory.setPendingLoad` /
`takePendingLoad` in [js/qr-history.js](js/qr-history.js)): choosing "Edit"
on a saved item or "Use this template" stores a snapshot and navigates to
`index.html`, which loads and clears it on arrival — no server session
needed for a multi-page static site.

## Libraries used

| Library | Why |
|---|---|
| [Bootstrap](https://getbootstrap.com/) v5.3.3 (CSS + bundle JS) | UI framework — navbar/offcanvas nav, forms, accordion, cards, toasts, modals, dark mode (`data-bs-theme`). |
| [Bootstrap Icons](https://icons.getbootstrap.com/) v1.11.3 | Icon set used throughout, always paired with a visible text label. |
| [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) v1.5.0 | The original app's `qrcode` library only drew plain square modules. This one genuinely supports dot/eye pattern styles, gradients, logo overlay, and PNG/JPEG/WebP/SVG export — everything the customization panel exposes is something this library actually does. |
| [jsQR](https://github.com/cozmo/jsQR) v1.4.0 | Pure client-side QR decoding for the Readability panel and the Scan page. |
| [JSZip](https://stuk.github.io/jszip/) v3.10.1 | Packs bulk-generated QR codes into a single ZIP for download. |

All five are loaded via `<script>`/`<link>` tags from jsDelivr — no npm
install or build step needed to run the site.

## UI architecture

The visual layer is Bootstrap 5 (grid, forms, navbar/offcanvas, accordion,
cards, toasts, modals) plus one small brand stylesheet,
[css/paful-qr.css](css/paful-qr.css), for what Bootstrap has no component
for (the QR preview box, upload dropzones, the scanner viewport) and brand
color variables that override Bootstrap's own `--bs-primary` etc. — so
buttons, links and focus states are reskinned without fighting Bootstrap's
defaults. Dark mode is Bootstrap's native `data-bs-theme` attribute
([js/theme.js](js/theme.js)), which re-themes every Bootstrap component for
free. Every functional element (`id`s, `name`s, `data-field`/`data-type-form`/
etc.) was kept identical during the redesign — only markup structure and
CSS classes changed, so `app.js` and the other controllers needed almost no
changes (the exceptions: status messages now drive a Bootstrap Toast via
[js/toast.js](js/toast.js), and history delete/clear use a Bootstrap Modal
instead of `window.confirm`).

## Privacy model

All QR content you type — URLs, Wi-Fi passwords, contact details, event
info — is encoded into the QR code entirely in your browser. Camera and
uploaded-image scanning is decoded on-device. Saved QR codes ("My QR
Codes") live only in this browser's `localStorage`. Nothing here is
uploaded to a server.

## Project structure

```
QR/
├── index.html               generator: hero, type picker, design/logo/advanced panels, FAQ
├── scanner.html              camera + image-upload QR scanner
├── bulk.html                 CSV → many QR codes → ZIP
├── history.html               "My QR Codes" — saved/local QR codes
├── templates.html             preconfigured QR presets by category
├── business-card.html          digital business card builder + shareable card image
├── social-media.html           platform-branded profile QR generator
├── donate.html                 mobile money donation info + USSD copy
├── manifest.json              PWA manifest
├── service-worker.js          app-shell cache for offline use
├── css/
│   ├── paful-qr.css            brand layer on top of Bootstrap (tokens, QR preview box, dropzones, scanner viewport)
│   └── print.css               @media print — QR card only
├── js/
│   ├── app.js                   generator page controller + app state
│   ├── qr-generator.js           per-type payload builders
│   ├── qr-customizer.js          qr-code-styling wrapper (render + export)
│   ├── qr-readability.js         contrast/logo/decode checks
│   ├── qr-history.js             My QR Codes CRUD + cross-page handoff
│   ├── qr-scanner.js             camera loop + image decode (jsQR)
│   ├── bulk-generator.js         CSV parsing + ZIP generation
│   ├── templates.js              template preset data
│   ├── sharing.js                download, print, share, clipboard
│   ├── validation.js             URL/email/phone/field validation
│   ├── theme.js                   light/dark/system toggle (Bootstrap data-bs-theme)
│   ├── toast.js                   shared Bootstrap Toast wrapper (Toast.show)
│   ├── storage.js                 safe localStorage read/write
│   ├── config.js                  FREE_LIMITS (single source of truth)
│   ├── utils.js                   shared DOM/format helpers
│   ├── pwa.js                     service worker registration + install prompt
│   ├── history-page.js            history.html controller
│   ├── bulk-page.js               bulk.html controller
│   ├── scanner-page.js            scanner.html controller
│   ├── templates-page.js          templates.html controller
│   ├── business-card.js           Canvas 2D card-image renderer
│   ├── business-card-page.js      business-card.html controller
│   ├── social-media-page.js       social-media.html controller
│   └── donate-page.js             donate.html controller
│   ├── qr-tracking.js           anonymous "QR generated" beacon
│   └── dynamic-content.js       admin-managed FAQ/QR-type fetch-and-replace
├── assets/icons/               favicon.svg, PNG app icons
├── admin/                      Admin Panel (PHP + MySQL) — see its own section below
│   ├── install.php  login.php  logout.php  forgot-password.php  reset-password.php
│   ├── dashboard.php  faq.php  qr-types.php  donate.php
│   ├── administrators.php  roles.php  activity-logs.php  settings.php
│   └── includes/                bootstrap/db/auth/csrf/activity_log/layout
├── api/                         read-only JSON for the public pages + the tracking beacon
├── config/config.php            DB credentials
├── database/schema.sql          full schema + seed data
└── README.md
```

## Running locally

No build step. Serve the folder over HTTP — the Clipboard, Web Share,
Camera and Service Worker APIs all require a secure context, so opening
files directly via `file://` will work for basic generation but not those
features:

- Via XAMPP: start Apache and open `http://localhost/QR/`.
- Or, from this folder: `php -S localhost:8000` and open
  `http://localhost:8000/`.

## Deploying

The public site is still a static site at its core — upload the folder
as-is to any static host over HTTPS (required for camera scanning,
clipboard, and the service worker) and it works with **zero** setup, exactly
as before. The optional Admin Panel (below) needs PHP 8.1+ and MySQL if you
want it; without that, every public page still works from its own
hardcoded content, unchanged.

### Automatic deploy (GitHub Actions)

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) lints the PHP
and then rsyncs the site to the hosting account over SSH on every push to
`main` (or manually from the Actions tab). One-time setup:

1. Generate a dedicated key: `ssh-keygen -t ed25519 -f ~/.ssh/paful_qr_deploy -C github-actions-paful-qr`
   (no passphrase).
2. In cPanel → **SSH Access** → **Manage SSH Keys** → **Import Key**, paste
   `paful_qr_deploy.pub` as the *public* key, then **Manage → Authorize** it.
3. In GitHub → Settings → Secrets and variables → Actions, add:
   `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY` (contents of the private
   `paful_qr_deploy` file), `DEPLOY_PATH` (e.g.
   `/home/pafulmul/qrcodegen.pafulmulti.com`) and, if SSH isn't on 22,
   `SERVER_PORT`.

`config/config.php` is uploaded only if it doesn't exist on the server yet,
so live DB credentials edited there are never overwritten. Nothing on the
server is deleted.

## Modifying free limits

All usage limits live in one place, [js/config.js](js/config.js):

```javascript
const FREE_LIMITS = {
  bulkQrPerBatch: 100,
  historyItems: 100,
};
```

## Known limitations

- Scan history isn't persisted — only the most recent scan result is
  shown (by design, to keep the feature simple; "My QR Codes" already
  covers persisted/organized storage for generated codes).
- Bulk QR uses one fixed default style for the whole batch; per-row
  styling isn't supported.
- No automated test suite — this is a static frontend with no build step;
  verification was done by driving a real Chrome instance (Puppeteer)
  against every page and checking for console errors, plus manual/visual
  review at multiple viewport widths.

## Admin Panel (optional — PHP + MySQL)

A separate, authenticated Admin Panel lives under [admin/](admin/), backed
by MySQL via PDO. It manages: FAQ, QR type visibility, Donate page content/
payment methods, site settings (general/branding/SEO/social), plus its own
administrators, roles & permissions, and activity log. See
[database/schema.sql](database/schema.sql) for the full schema.

**Setup:**
1. Make sure MySQL is running and PHP has `pdo_mysql` enabled.
2. Copy [config/config.php](config/config.php) and adjust the `db` array if
   your MySQL credentials aren't the XAMPP defaults (`root`, no password).
   In production, prefer setting `PAFUL_DB_HOST` / `PAFUL_DB_NAME` /
   `PAFUL_DB_USER` / `PAFUL_DB_PASS` environment variables instead of
   editing the file directly.
3. Visit `/admin/install.php` — it creates the database/tables (from
   `database/schema.sql`) and lets you create the first **Owner** account.
   It refuses to run again once an admin account exists.
4. Log in at `/admin/login.php`.

**How it connects to the public site:** public pages never require the
backend. A few of them (`index.html`'s FAQ + QR type list, `donate.html`'s
payment info) make an additive `fetch()` to a read-only endpoint under
[api/](api/) on load and patch the DOM *only on success* — if the API 404s,
times out, or the DB is down, the page's original hardcoded content simply
stands, with no error shown to the visitor. This was verified by stopping
MySQL entirely and confirming every public page (including the generator
itself) still works normally.

**Roles seeded by install:** Owner (full access), Administrator, Content
Manager, and QR Manager — see `database/schema.sql` for exactly which of
the 18 seeded permissions each one gets. Permissions are enforced
server-side on every `admin/*.php` page (`require_permission()`), not just
hidden from the sidebar.

**"QR Codes Generated" on the dashboard** is a real, legitimately-tracked
number — the public generator sends an anonymous, increment-only beacon
(`api/track-event.php`, no content/IP/identifiers) after a successful
download. Nothing else on the dashboard is fabricated; metrics that aren't
actually tracked yet (detailed analytics, scans) are left out rather than
faked.

**Known limitation:** there's no SMTP configured, so "Forgot password" only
records a request — actually resetting a password requires an Owner to
generate a one-time reset link from the Administrators page and share it
with that admin directly (the underlying token/expiry/hashing is fully
implemented; only the email delivery is missing).

**Deferred to a later phase** (not hidden — just not built yet): Pages/
Homepage/Navigation/Announcements CMS, a Media Library, QR Templates admin,
a Security Center, System Logs viewer, Maintenance mode, and analytics
beyond the one QR-generation counter.

## Future SaaS backend

Dynamic QR codes, scan analytics by location/device, an API, and
subscriptions (e.g. Paystack) would build on the Admin Panel's existing PHP/
MySQL foundation rather than needing a new one — a `qr_codes` +
`qr_scans` table pair (a dynamic QR just encodes a short redirect URL the
backend resolves and logs) and a versioned REST API the existing JS modules
could call instead of (or alongside) `localStorage`. None of that is
implemented now.
