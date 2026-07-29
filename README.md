# FoundrySuite Website

Brand-led marketing site for FoundrySuite — pure HTML, CSS, and JavaScript.

## Structure

- `index.html` — marketing homepage
- `foundry-platform.html` — Foundry Platform product page
- `login.html` — customer login
- `platform.html` — redirect shim to Foundry Platform
- `styles.css` — shared design system
- `assets/css/login.css` — login page styles
- `script.js` — nav, theme, slideshow, form validation & Formspree
- `assets/js/core/` — theme-init, security-manager, content-protection
- `robots.txt` / `sitemap.xml` — crawl guidance
- `docs/SECURITY.md` — server/hosting security configuration
- `.github/SECURITY.md` — vulnerability reporting policy
- `scripts/check-security.sh` — CSP/meta consistency checks
- `docs/ops/` — Formspree / operations notes
- `assets/images/` — brand, product, icon, and social assets

## Local preview

Use a **fixed port (5500)** so the URL does not keep changing:

```bash
./scripts/dev-server.sh
```

- Home: http://127.0.0.1:5500/
- Platform: http://127.0.0.1:5500/foundry-platform.html
- Stop: `./scripts/dev-server.sh stop`
- Restart: `./scripts/dev-server.sh restart`

If you use the Live Server extension in Cursor/VS Code, it is also locked to port **5500** via `.vscode/settings.json`.

You can also open `index.html` directly in a browser (no server required for most pages).

## Contact form

Submissions go through Formspree (`https://formspree.io/f/mbdrolyg`) to `parameswaran.cp@foundrysuite.com`.

## Browser support

Chrome, Firefox, Safari, and Edge (latest).
