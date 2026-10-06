# Website editor catalog

Install the pinned development tools with `npm ci` in this directory.
Run `npm test` for all-page DOM checks and draft/publish/restore tests.
Run `npm run build` after changing page markup. The script generates the field catalog and script-free preview pages.
Set `FG_EDITOR_BACKEND_DIR` to the backend checkout to copy the generated catalog there. Deploy matching frontend/backend catalogs together; existing legacy field keys stay compatible.
The editor controls presentation only. Live account/report/voucher data and business rules remain in the application backend.
