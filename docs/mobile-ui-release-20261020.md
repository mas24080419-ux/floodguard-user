# Mobile UI release — 2026-10-20

Sync the current Android local user interface into the existing FloodGuard static site: extracted feature bundle, compact routing and suggestions, analysis, weather, mobile navigation, language and community presentation. Include the approved SOS/person/wave logo in the homepage, login, favicon and web app manifest.

Preserve existing web-only admin pages, MIKE+ scenario data, navigation entry and scenario bridge. No backend deployment, database/environment changes, auth bypass or production test submissions.

Validation before publish: 30 targeted Node tests; UI suite at six viewport sizes; homepage/login/logo guest fixture checks at 320/411/1440; local HTML and service-worker asset existence; JavaScript syntax and diff checks. Browser fixture screenshots are not real API acceptance evidence. Android-specific native/bridge functions remain native-only.

Cache name: floodguard-user-v91-mobile-logo. The site still requires valid login for protected app functions. Deployment must be verified against the resulting Render commit and live asset bytes.
