# FoundrySuite Website Security — Server & Hosting Configuration

Client-side protections live in `assets/js/core/security-manager.js` and apply automatically to every page that loads the module. **Headers and cookie flags below must be configured on the web server / CDN / hosting platform** — browsers will not honor most of these if they are only set in JavaScript.

## Required HTTP response headers

Apply on all HTML (and preferably all) responses:

| Header | Recommended value |
| --- | --- |
| `Content-Security-Policy` | See CSP section below |
| `X-Frame-Options` | `SAMEORIGIN` (backup to CSP `frame-ancestors`) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=(), usb=(), bluetooth=(), accelerometer=(), magnetometer=(), gyroscope=(), interest-cohort=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` (HTTPS only) |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` (or `same-origin` if no third-party window needs) |
| `Cross-Origin-Resource-Policy` | `cross-origin` (required so social crawlers can fetch OG images) |
| `X-Permitted-Cross-Domain-Policies` | `none` |

### Content-Security-Policy (marketing site)

Static pages load theme bootstrap from `assets/js/core/theme-init.js` (no inline scripts). Google Fonts CSS still requires `'unsafe-inline'` in `style-src` for any remaining presentational exceptions; prefer CSS classes.

```
default-src 'self';
script-src 'self';
script-src-attr 'none';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
media-src 'self';
connect-src 'self' https://formspree.io;
object-src 'none';
frame-src 'none';
worker-src 'none';
frame-ancestors 'self';
base-uri 'self';
form-action 'self' https://formspree.io;
upgrade-insecure-requests;
```

Tighten further when ready:

1. Prefer `style-src 'self' https://fonts.googleapis.com` after confirming no inline `style` attributes remain.
2. Keep `script-src 'self'` — do not reintroduce inline scripts or event-handler attributes.

`frame-ancestors 'self'` is the primary clickjacking control (meta CSP cannot fully replace HTTP CSP for framing in all browsers — **send CSP as an HTTP header**).

## Apache (`.htaccess`)

This repository ships an updated `.htaccess` under `mod_headers`. After deploying:

1. Confirm `AllowOverride` permits headers.
2. HTTPS redirect and HSTS are enabled — confirm TLS remains correctly configured on the host/CDN.
3. Align CDN/proxy header rules so they do not strip CSP.

## Cookies (future authentication)

When a backend issues session cookies, set:

```
Set-Cookie: session=...; Path=/; Secure; HttpOnly; SameSite=Strict
```

Notes:

- `HttpOnly` **cannot** be set from JavaScript.
- `FoundrySecurity.buildSecureCookieString()` / `setClientCookie()` only help with non-HttpOnly client preferences (theme, etc.).

## Rate limiting / WAF / bot protection

Client throttling in `security-manager.js` is a soft signal only. For production:

- Enable host/CDN rate limits on `POST` (contact forms) and auth endpoints.
- Consider Cloudflare / AWS WAF / similar managed rules.
- Wire CAPTCHA via:

```js
window.FoundrySecurityConfig = {
  captcha: {
    enabled: true,
    provider: 'turnstile',
    verify: async (form) => { /* return true when token valid */ }
  }
};
```

## Checklist for new pages

1. Include:

```html
<script src="assets/js/core/security-manager.js"></script>
<script src="assets/js/core/content-protection.js"></script>
<script src="script.js"></script>
```

2. Keep security `<meta>` tags consistent with homepage (or rely solely on HTTP headers).
3. Prefer `textContent` / `FoundrySecurity.setText` over `innerHTML` for dynamic strings.
4. External `target="_blank"` links receive `rel="noopener noreferrer"` automatically.

## What JS cannot replace

| Control | Must be server/CDN |
| --- | --- |
| HSTS | Yes |
| CSP as enforceable policy | Prefer HTTP header |
| HttpOnly cookies | Yes |
| True IP rate limiting | Yes |
| WAF / bot management | Yes |
| TLS configuration | Yes |
