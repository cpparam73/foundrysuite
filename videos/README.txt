VIDEO ASSETS
============

The live FoundrySuite marketing site does not currently use a video hero background.

This folder is reserved for optional future media. Do not place large unused video
files in the deploy package unless they are referenced by HTML/CSS/JS.

If adding a hero video later:
- Prefer MP4 (H.264) under ~3–5 MB
- Use lazy/deferred loading and a poster image
- Respect prefers-reduced-motion
- Update CSP media-src only if a new host is required (currently 'self')
