# FoundrySuite Website — Repository Audit Report

**Audit date:** 2026-07-23  
**Scope:** Full static site repository (pre–Version 1.0 freeze)  
**Mode:** Read-only — **nothing was deleted**

---

## Executive verdict

The live production surface (`index.html`, `foundry-platform.html`, `login.html`, `styles.css`, `script.js`, `assets/js/core/*`, `.htaccess`, referenced images) is **coherent and deployable**.

Before freezing **Version 1.0**, remove or relocate **~13+ MB** of unused/obsolete assets and consolidate overlapping markdown so the GitHub repo contains only production-ready files.

| Area | Status |
| --- | --- |
| Duplicate content-identical image files | None found |
| Broken script/CSS imports | None (all page imports resolve) |
| Missing referenced images | None |
| Primary navigation / section anchors | Valid |
| Unused assets / obsolete docs | Yes — see cleanup list |
| Placeholder / stub links | Yes — footer `#` links |

---

## 1. Repository inventory (tracked production tree)

### Live pages
| File | Role |
| --- | --- |
| `index.html` | Marketing homepage |
| `foundry-platform.html` | Platform product page |
| `login.html` | Login UI (auth not wired) |
| `platform.html` | Redirect shim → `foundry-platform.html` |

### Core code
| File | Role | Referenced? |
| --- | --- | --- |
| `styles.css` | Design system | Yes (all pages) |
| `script.js` | Nav, theme, slideshow, form | Yes (all pages) |
| `assets/js/core/security-manager.js` | Security framework | Yes |
| `assets/js/core/content-protection.js` | Content protection | Yes |
| `.htaccess` | www redirect + security headers | Host-dependent |

### Structure
```
/
├── index.html, foundry-platform.html, login.html, platform.html
├── styles.css, script.js, .htaccess, README.md
├── assets/js/core/          ✅ used
├── assets/css/core/         ⚠️ EMPTY (leftover after CSS removal)
├── docs/SECURITY.md         ✅ keep
├── images/{About,Architecture,Branding,Icons,Products,Social,Archieve}
└── videos/
```

**Note:** `v1/` snapshot was already removed earlier; it is **not** present in the working tree.

---

## 2. Duplicate files

### Content-identical duplicates (SHA-256)
**None** among HTML/CSS/JS/images/video (excluding AppleDouble junk).

### Same basename, different paths
| Basename | Paths | Notes |
| --- | --- | --- |
| `readme.txt` | `images/README.txt`, `videos/README.txt` | Different content; not binary dupes |

### macOS AppleDouble junk (not production assets)
| File | Recommendation |
| --- | --- |
| `._README.md` | Safe to delete; add to `.gitignore` |
| `._styles.css` | Safe to delete; add to `.gitignore` |

These are Finder metadata sidecars, not site content.

### Near-duplicate / overlapping documentation
| Files | Issue |
| --- | --- |
| `PRODUCTION_READY.md` + `PRODUCTION_FINAL.md` | Overlapping production checklists (~36% token Jaccard) |
| `FORMSPREE_SETUP.md`, `FORMSPREE_TROUBLESHOOTING.md`, `FORMSPREE_SPAM_FIX.md`, `FORMSPREE_O365_EMAIL_FIX.md`, `O365_FORMSPREE_WHITELIST_FIX.md` | Five operational notes for one integration |

Recommend consolidating into `docs/FORMSPREE.md` + keep `docs/SECURITY.md` + slim `README.md`.

---

## 3. Unused files / assets

### Safe to remove for V1.0 (unused by any HTML/CSS/JS reference)

| Path | Size (approx) | Reason |
| --- | --- | --- |
| `videos/hero.background.mp4` | **~6.0 MB** | Not referenced anywhere; hero no longer uses video |
| `images/Archieve/*` (5 files) | **~180 KB** | Documented archive; zero runtime refs |
| `images/Branding/logo-mark.png` | **~50 KB** | Not referenced |
| `images/Icons/favicon-dark.ico` | ~87 KB | Dark favicons never switched in code |
| `images/Icons/favicon-16x16-dark.png` | ~1 KB | Unused |
| `images/Icons/favicon-32x32-dark.png` | ~2 KB | Unused |
| `images/Icons/apple-touch-icon-dark.png` | ~30 KB | Unused |
| `videos/README.txt` | small | Setup doc for unused video feature |
| `._README.md`, `._styles.css` | small | AppleDouble junk |

**Estimated reclaim:** ~6.3 MB+ (dominated by the unused hero video).

### Keep (referenced)
All of: Orbit light/dark, platform architecture light/dark, product PNGs, About-Us.jpg, BID-hd.svg, logo-light/dark, light favicons, og-image.png, core JS modules.

### Dark icon set — decision
Currently **unused**. Either:
- **Remove** for a lean V1.0, or  
- **Keep** and implement theme-aware favicon swapping later.

### Empty directory
| Path | Recommendation |
| --- | --- |
| `assets/css/core/` | Remove empty folder **or** restore a real shared CSS module later |

---

## 4. Missing references

| Claimed “missing” from naive scan | Actual status |
| --- | --- |
| Image paths used in pages | **All resolve** |
| `styles.css`, `script.js`, security/content-protection scripts | **All resolve** |
| Google Fonts / Formspree absolute URLs | External — expected |

**No broken local image or script imports on live pages.**

### Filename quality issue (not missing, but inconsistent)
| File | Issue |
| --- | --- |
| `images/Architecture/platform-achitecture-dark.png` | Typo: **achitecture** vs `platform-Architecture-light.png` |

Referenced correctly today from `foundry-platform.html`. Recommend rename to `platform-architecture-dark.png` and update the `src` in one change set (do not rename without updating HTML).

---

## 5. Broken / placeholder links

### Primary navigation — OK
| Page | Targets | Result |
| --- | --- | --- |
| `index.html` | `#products`, `#solutions`, `#services`, `#about`, `#contact`, `foundry-platform.html`, `/login.html` | Valid IDs / files |
| `foundry-platform.html` | `/`, section IDs (`#architecture`, `#faq`, …), `/login.html` | Valid |
| `login.html` | `/`, `/#contact` | Valid |

`data-scroll-to` values (`home`, `products`, `solutions`, `services`, `about`, `contact`) all match IDs on `index.html`.

### Placeholder stubs (not 404s, but incomplete for V1.0)
| Location | Href | Issue |
| --- | --- | --- |
| Footer (index + platform) | `#` Privacy Policy | No page |
| Footer | `#` Terms of Service | No page |
| Footer | `#` Twitter / LinkedIn / GitHub | No real profiles |

**Recommendation:** Point to real URLs, or remove/hide until ready. Do not ship `#` social/legal links in a frozen release without a conscious placeholder policy.

### Redirect surface
| Mechanism | Target | Status |
| --- | --- | --- |
| `platform.html` (meta + JS) | `/foundry-platform.html` | Works |
| `.htaccess` `RewriteRule ^platform\.html$` | `/foundry-platform.html` | Works on Apache |

Redundant but harmless. Keep both for non-Apache static hosts, or rely on `.htaccess` alone on Apache.

---

## 6. Unused CSS / JavaScript (heuristic)

### CSS
- ~365 top-level class selectors detected in `styles.css`
- ~87 candidates appear **unused** by current HTML/JS (legacy hero-video, construction/campus/health slide visuals, `feature-card`, holographic overlays, etc.)
- These are **dead weight**, not runtime bugs. Safe long-term cleanup; **do not mass-delete** without a visual QA pass — some may be used by dynamically injected markup or rarely exercised slides.

Notable dead CSS tied to removed features:
- `.hero-video-bg`, `.hero-video-overlay`
- Large blocks for old slide construction/campus/health/agri visuals
- `.feature-card` / unused feature grids

### JavaScript
- `removeSeasonalContent()` still runs and targets `.hero-video-bg` / `.hero-video-overlay` (elements no longer in DOM) — harmless no-op; can simplify later
- Login page correctly no longer references missing `#particles`
- Security + content-protection auto-init; `script.js` re-calls `init()` (idempotent guards) — redundant but safe

### Login page
- Large **inline `<style>`** (~18 KB) duplicates atmosphere/orbit patterns already in `styles.css` — maintainability debt, not a missing import

### Fonts
- Live pages load **Inter + Outfit** (Google Fonts)
- `README.md` still mentions “Source Sans 3” and “video background” — **docs drift**, not a broken import
- No self-hosted font files in repo (by design)

---

## 7. Asset reference verification (production)

| Asset family | Status |
| --- | --- |
| Logos (`logo-light.png`, `logo-dark.png`) | Referenced via `data-logo*` |
| Product images | Referenced on homepage |
| Orbit light/dark | Referenced (theme swap) |
| Platform architecture light/dark | Referenced on platform page |
| OG image | Absolute URL → `images/Social/og-image.png` exists |
| Favicons (light) | Referenced |
| Formspree endpoint | `https://formspree.io/f/mbdrolyg` in contact form |

---

## 8. Folder structure consistency

| Observation | Recommendation |
| --- | --- |
| `images/Archieve` typo (“Archive”) | Rename folder to `Archive` **or** delete contents if retiring archive |
| `assets/css/core/` empty | Remove or populate |
| `assets/js/core/` good pattern | Keep; future shared CSS should mirror this |
| Root-level Formspree/Production markdown clutter | Move under `docs/` |
| `platform.html` at root | Keep as compatibility alias |

---

## 9. Recommended cleanup actions (manual — do not auto-delete)

### Priority A — before V1.0 freeze (high confidence)
1. Delete `videos/hero.background.mp4` (~6 MB unused).
2. Delete entire `images/Archieve/` (unused; already documented as superseded).
3. Delete `images/Branding/logo-mark.png` if no brand guideline need.
4. Delete unused dark favicon set **or** implement theme favicon swap and keep.
5. Delete AppleDouble `._*` files; add `._*` to `.gitignore`.
6. Remove empty `assets/css/core/` **or** add `.gitkeep` only if you plan shared CSS soon.
7. Replace footer `href="#"` legal/social links with real URLs or remove them.
8. Fix README drift (no Source Sans 3 / no hero video claim unless restored).

### Priority B — quality / maintainability
9. Rename `platform-achitecture-dark.png` → `platform-architecture-dark.png` + update HTML.
10. Consolidate Formspree/O365 markdown into `docs/FORMSPREE.md`.
11. Archive or delete `PRODUCTION_READY.md` / `PRODUCTION_FINAL.md` after merging useful bits into README or `docs/RELEASE_V1.md`.
12. Trim dead CSS (hero-video, obsolete slide visuals) after screenshot QA.
13. Move login inline CSS into `styles.css` or `assets/css/login.css`.

### Priority C — optional keep
14. Keep `platform.html` redirect for old bookmarks.
15. Keep `docs/SECURITY.md` (required for hosting).
16. Keep dark Orbit / architecture PNGs (actively used).

---

## 10. Suggested V1.0 production file set

**Must ship**
- `index.html`, `foundry-platform.html`, `login.html`, `platform.html`
- `styles.css`, `script.js`
- `assets/js/core/security-manager.js`, `assets/js/core/content-protection.js`
- `.htaccess`
- `images/About`, `Architecture`, `Branding` (logos + BID), `Icons` (light set), `Products`, `Social`
- `docs/SECURITY.md`, `README.md` (updated)

**Should not ship in a lean freeze**
- Unused video, `Archieve/`, unused `logo-mark`, unused dark favicons (unless roadmap), AppleDouble files, overlapping root markdown sprawl

---

## 11. Audit method notes

- SHA-256 hashing for binary duplicates  
- HTML `src`/`href`/`data-logo*` + JS asset-string scan for references  
- ID / `data-scroll-to` cross-check for navigation  
- CSS unused-class detection is **heuristic** (false positives possible)  

---

## 12. Sign-off checklist for Version 1.0

- [ ] Remove unused video + Archieve + AppleDouble junk  
- [ ] Decide dark favicon set (remove vs implement)  
- [ ] Fix or remove footer `#` placeholders  
- [ ] Update README to match live site  
- [ ] Consolidate ops docs under `docs/`  
- [ ] Smoke-test: home, platform, login, contact Formspree, theme toggle, mobile nav  
- [ ] Confirm `.htaccess` headers on production host  

**Bottom line:** No critical broken imports or missing production images. Cleanup is mostly **unused media (~6 MB video)**, **archive icons**, **doc sprawl**, and **placeholder footer links** before freezing V1.0.
