# FloodGuard Design System 1.0 (v73)

Original CSS, inspired by systems linked in https://github.com/alexpate/awesome-design-systems.
No external component library or copied component source is required.

## Reference choices

| Reference | Applied principle |
| --- | --- |
| GOV.UK / USWDS | Visible keyboard focus, explicit error states, readable public information |
| IBM Carbon | Semantic color tokens, restrained data surfaces, readable tables |
| AWS Cloudscape | Operations hierarchy, active cases, primary/secondary action distinction |
| Fluent / Material | Consistent controls and touch targets, mobile form readability |

## Integration

Production documents opt in with `data-fg-design="1"` on `html` and load
`floodguard-design-system.css?v=73` last in the head. The original stylesheets
remain layout dependencies. This is a compatibility layer, not a completed
replacement of every versioned stylesheet. Archived legacy HTML and generated
`editor-preview/` outputs are excluded. Editor previews built from production
pages inherit their opt-in attribute and link.

The service worker precaches the new CSS and uses network-first refresh for it.
The cache version changes to v73. Remove the root attribute to disable the new
rules for a page; reverting the commit restores the previous integration.

## Tokens and semantics

Brand `#075985`, ink `#142d40`, muted text `#526779`, canvas `#f3f6f9`.
Spacing scale: 4, 8, 12, 16, 24, 32 px. Radii: 12 and 20 px.
Standard controls have a minimum 44 px height; text inputs use 16 px text.
Focus uses a yellow outline with a dark outer ring and a forced-colors fallback.
Reduced-motion preference suppresses animation and transitions.

| Environmental risk | Text | Surface | Required accompanying label |
| --- | --- | --- | --- |
| safe | #166534 | #edf8ef | An toàn |
| watch | #854d0e | #fff8df | Theo dõi |
| warning | #9a3412 | #fff1e8 | Cảnh báo |
| danger | #b91c1c | #fef0f0 | Nguy hiểm |
| critical | #7f1d1d | #fde2e2 | Khẩn cấp |

Use `data-fg-risk` only for an explicit risk value supplied by application logic.
Never infer a level from arbitrary text, map geometry or a class substring.
Existing rescue status classes retain their existing labels and state machine.
Their presentation is aligned, but SOS workflow status is not a flood probability.
Map marker colors and geographic layers are unchanged in this release.

## Review and validation

Open `design-system.html` for sample controls, error states, risk labels and cases.
All sample numbers are marked as illustrative and buttons do not mutate data.

Run a static server on port 4173 and:

```sh
LOCAL_URL=http://127.0.0.1:4173 node tests/design-system.mjs
LOCAL_URL=http://127.0.0.1:4173 node tests/desktop-smoke.mjs
LOCAL_URL=http://127.0.0.1:4173 node tests/mobile-seo-smoke.mjs
```

Review authenticated map drawers and rescue workflows with test accounts before
merging. Full accessibility certification is outside this change; these controls
and tokens support accessibility but do not certify all legacy screens.
