# B9q — Resized Chrome Designer and readonly Viewer re-open (2026-10-11)

Stacked B-class Draft on B9p #631. Reuses the real App Handler CAS FileStore and the **synthetic** S2C/P2P input in B9l/B9p; no enterprise customer data used.

After native mouse hide + toolbar Save and rejected stale writer, reopen brand-new Designer and Viewer with **390×844 and 768×1024 Chrome viewports**. Check rendering of SVG, consistency of saved congestion hit counters, aria note, no JavaScript errors, and absence of a Save button in the readonly Viewer. Also retain the desktop 1280×820 workflow. Test fixture main container uses viewport-relative width rather than unconditional 1250px so the narrow viewport is not merely an overflow window onto desktop content.

Explicit limit: Playwright Chrome viewport resizing on Linux is NOT physical Windows/macOS/iOS/Android, not a touchscreen or trackpad gesture, not keyboard screen-reader acceptance, not WCAG audit. B9q catches regression in responsive DOM only; no formal §14 39 entries promoted, not deployed/merged. Two markers `B9Q_RESPONSIVE_CHROME_RESULT` required in final CI.
