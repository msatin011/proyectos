---
name: PWA Auto-Versioning
description: Automatically increments the PWA Service Worker cache version.
---

# PWA Auto-Versioning Skill

This skill allows the agent to automatically increment the PWA cache version in `service-worker-app.js` and update `index.html` references. This is crucial for ensuring that users receive the latest updates to the PWA immediately effectively bypassing browser caching quirks.

## When to use
- **ALWAYS** run this skill (the script below) whenever you modify **ANY** file within the `pwa/` directory (e.g., `app.js`, `index.html`, `service-worker-app.js`, css files, etc.).
- When the user reports that "changes are not reflecting" or "cache issues".

## How to use

Run the following node script located in this skill's directory:

```bash
node .agent/skills/pwa_versioning/bump_version.js
```

## What it does
1.  Reads `pwa/service-worker-app.js`.
2.  Increments the version number in `const CACHE_NAME = 'proyectos-pwa-vXX'`.
3.  Reads `pwa/index.html`.
4.  Updates the script tag `<script src="app.js?v=XX">` to match the new version.
