# FloodGuard Smart Location Production 1.4

- Backend fixed: https://floodguard-rescue-backend.onrender.com
- Address alone is sufficient: automatic address -> coordinates geocoding before SOS.
- Device GPS remains optional/preferred when available.
- Each SOS sends `address`, `location`, and `location_source`.
- Rescue Control can geocode address-only cases as a fallback.
- Upload all files to the root of the `floodguard-user` GitHub repo; Render Static Site auto-deploys.
