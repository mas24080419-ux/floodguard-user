# Mobile-only release — 2026-10-20

User explicitly authorized GitHub push / Render deploy, with desktop UI unchanged.

The prepared Android user interface and approved SOS logo are isolated in /mobile/. device-entry.js selects phones using mobile UA or coarse-pointer small screens. Desktop entry pages retain original HTML plus the selector; all pre-existing desktop CSS/JS/data/icons/pages remain unchanged. Direct mobile URLs on desktop return to the canonical desktop route. Admin/scenario routes are excluded from automatic routing.

Desktop and mobile service workers have separate cache names and cleanup prefixes. The root worker bypasses /mobile/ requests. Mobile OAuth returns to the existing canonical path and entry selection preserves query/hash. No backend/environment/database changes or authentication bypass.

Validation: selector/cache unit tests; fixed-time screenshot comparison (maximum 1/255 channel tolerance for gradient rounding) with the previous deployed desktop source at 1024 and 1440 for homepage/login/route/analysis/weather; mobile entry/login/logo at 320/411 and login query at 915; asset completeness and normalized source comparison. Screenshots use isolated API fixtures; they are not production data acceptance evidence. See local web-mobile-only-evidence and web-desktop-parity.txt.

The previous broad UI commit was never pushed/deployed. This final tree restores desktop and adds only mobile runtime, entry selection and cache isolation. Native Android code is unchanged.
