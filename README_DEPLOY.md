# FloodGuard Adaptive Production 1.1

Production frontend with responsive desktop/mobile UI and a manual display-mode switch.

## Display modes
- Auto: desktop on large screens, mobile on small screens.
- Mobile: mobile UI; on desktop it opens a phone-size preview frame.
- Desktop: desktop UI; on phones it opens a scaled desktop preview frame.

The selection is stored locally in the browser and can be changed from the floating Auto/Mobile/Desktop control.

## Deploy on Render Static Site
- Build Command: `echo static`
- Publish Directory: `.`
- Root Directory: blank

Upload all files in this folder to the root of the `floodguard-user` GitHub repository. Auto-deploy will update the existing Render site.
