# Theme Coverage and Acceptance

Use this reference for implementation, migration, global review, or any request that implies the whole product should support light and dark appearances. This is a completion gate, not optional polish.

## 1. Build a coverage manifest before editing

Do not equate the landing screen with the product. Record every applicable row in a manifest:

| Area | Include |
| --- | --- |
| Entry points | landing, onboarding, signed-in home, deep links, empty start |
| Persistent shell | header, navigation, sidebars, docks, maps, rails, footer |
| Content views | list, grid, detail, category, search, map, editor, upload |
| Overlays | modal, dialog, popover, menu, tooltip, toast, sheet, drawer, scrim |
| Account | profile, settings, support, terms, plans, billing, authentication |
| Data states | representative, empty, loading, skeleton, error, success, disabled |
| Interaction states | hover, focus-visible, pressed, selected, checked, dragged |
| Responsive states | phone, tablet when supported, desktop, overflow and zoom |
| Restricted states | authenticated, role-gated, admin, paid, feature-flagged |
| External islands | iframe, map tiles, payment UI, embeds, browser-native controls |
| Generated content | cards, saved items, imported media, user assets, notifications |

For each row, record:

- Route or reproducible navigation path
- Required account, role, fixture, or feature flag
- Owning component or template
- Surface and content tokens used
- Light and dark verification status
- Desktop and mobile verification status
- States exercised
- Evidence and remaining limitation

Use `verified`, `failed`, `blocked`, or `not applicable`. Never silently omit a row because it requires authentication or uncommon data.

## 2. Run a source inventory

Before writing override CSS, inspect:

- Theme entry points, storage, system listeners, and first-paint behavior
- Stylesheet and CSS-in-JS injection order
- Raw color literals and inline theme-sensitive styles
- SVG `fill` and `stroke`, icon masks, gradients, filters, and blend modes
- Pseudo-elements, shadows, translucent surfaces, and `backdrop-filter`
- Portals or DOM roots mounted outside the main application container
- Iframes, maps, payment widgets, and other third-party surfaces
- Images with white backdrops, transparent dark edges, or embedded UI chrome
- Existing `transition`, animation, and view-transition rules

Run the bundled inventory helper from the target project root:

```bash
node <skill-dir>/scripts/theme-surface-inventory.mjs .
```

Use `--json` for machine-readable output or `--summary-only` for counts. The script reports candidates, not confirmed bugs. Review each candidate in context.

## 3. Preserve visual state ownership

Before recoloring a tab, pill, segmented control, switch, carousel, or animated selection:

1. Identify which element owns the visual state.
2. Identify which element owns movement, clipping, border radius, and shadow.
3. Inspect `::before`, `::after`, transforms, shared layout animation, and overflow ancestors.
4. Recolor the existing owner whenever possible.
5. Do not add a second selected background to the label or item when a moving indicator already owns that fill.

A dark theme may change color, border, and shadow tokens. It should not unintentionally change geometry, stacking, transform behavior, or animation ownership.

After every selected-state change, verify:

- The indicator still moves in the same direction and duration
- Only one element paints the selected fill
- Border radius matches the underlying component
- Shadows are not clipped by the scroll or overflow container
- Focus and selected states remain distinct without relying on color alone

## 4. Choose theme-switch motion deliberately

Inventory existing transitions before adding theme transitions.

Use an atomic switch by default when any of the following is true:

- The product is legacy or only partially tokenized
- Several stylesheets or UI libraries own component transitions
- Surfaces use photos, gradients, filters, blur, shadows, or pseudo-elements
- Existing theme-sensitive durations are not uniform
- The product is media-heavy or has many simultaneous visible surfaces

Consider a scoped animated switch only when:

- Theme-sensitive properties are centrally tokenized
- A small, explicit element list owns the transition
- Durations and easing are coordinated
- First paint is never animated
- Reduce Motion disables the transition
- Rapid repeated switches have been tested

Temporal mismatch is a visual defect. A background changing over 150 ms while its shadow, text, image treatment, or pseudo-element changes over 300 ms can look like ghosting or an afterimage even if there is no rendering bug.

## 5. Verify with a route × appearance × state matrix

For every manifest row, exercise at least:

| Dimension | Required checks |
| --- | --- |
| Appearance | Light, Dark, System |
| Runtime | initial load, Light → Dark, Dark → Light, rapid repeated switching |
| Viewport | desktop and the smallest supported phone width |
| Input | pointer or touch, keyboard focus when applicable |
| Content | representative data plus empty/loading/error when applicable |
| Layer | base page and every overlay opened from it |

Use browser evidence when runnable UI is available. Screenshots alone are insufficient for focus, persistence, runtime switching, clipping, animation, or hidden states.

For runtime switching, verify:

- No wrong-theme flash on load
- No smeared intermediate colors, double exposure, or afterimage
- No layout shift or clipped moving indicator
- No stale switching attribute or class after rapid toggles
- Component hover, focus, and selection motion still works after switching
- Images, maps, native controls, and overlays update with the resolved theme

## 6. Scan for light islands after implementation

In dark mode, inspect computed styles for suspicious large or opaque light surfaces. Treat this as a lead, not proof: images, intentional code samples, payment frames, and brand assets may legitimately remain light.

Review source again for:

- Raw white and near-white backgrounds introduced after token mapping
- Late-loaded legacy rules that override dark tokens
- Inline colors set by runtime code
- Portal roots outside the themed ancestor
- Disabled or placeholder text that became too faint
- Third-party or browser-native controls missing `color-scheme`

Repeat the same check in light mode for unintended dark islands.

## 7. Completion gate

Do not claim “complete,” “global,” “finished,” or equivalent unless:

- Every required manifest row has evidence in both appearances
- Desktop and mobile layouts have been exercised where supported
- All relevant interaction and data states have been checked
- Contrast pairs have measured results, not visual estimates
- State ownership, clipping, and rapid theme switching have passed
- Source-candidate findings are reviewed or explicitly accepted

If a row is blocked by authentication, unavailable data, browser policy, third-party content, or missing permissions:

- Mark the row `blocked`
- Perform static inspection when possible
- Describe what static inspection cannot prove
- Do not present the blocked row as verified
- Narrow the completion claim to the verified scope

The goal is not to create more paperwork. The manifest prevents a polished first screen from masking unfinished product states.
