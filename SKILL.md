---
name: accessible-dark-mode-design-expert
description: Design, implement, review, and audit accessible light/dark theme systems for websites and apps. Use for dark mode, night mode, theme switching, prefers-color-scheme, color-scheme, design tokens, surface elevation, OLED considerations, contrast audits, theme-aware imagery, complete route/state coverage, transition ghosting or afterimages, Material or Apple dark appearance, reduced-motion-safe transitions, and optional time/weather/sky/ocean atmospheric themes.
---

# Accessible Dark Mode Design Expert

Build dark themes as complete appearance systems, not color inversions. Preserve user control, verify contrast computationally, distinguish platform conventions, and test real content in both appearances.

## Route the task

Read only the references needed for the request:

- For palette, typography, elevation, images, accessibility, Apple, or Material decisions, read [references/design-foundations.md](references/design-foundations.md).
- For CSS, JavaScript, TypeScript, theme initialization, persistence, native form styling, or flash prevention, read [references/web-implementation.md](references/web-implementation.md).
- For an implementation, migration, global review, or any claim that a theme is complete, read [references/coverage-and-acceptance.md](references/coverage-and-acceptance.md). Use [scripts/theme-surface-inventory.mjs](scripts/theme-surface-inventory.mjs) to generate source-level audit candidates; it is an inventory aid, not a pass/fail test.
- For time-of-day, weather, sky, ocean, storm, or other atmospheric themes, read [references/atmospheric-theming.md](references/atmospheric-theming.md) and the foundations reference.
- For a review, audit, acceptance criteria, or pre-launch QA, read [references/audit-checklist.md](references/audit-checklist.md).
- For installing or synchronizing this skill across Codex and Claude Code, read [references/runtime-compatibility.md](references/runtime-compatibility.md).
- For any claimed contrast ratio, run [scripts/contrast-ratio.mjs](scripts/contrast-ratio.mjs). Do not trust comments, design-tool labels, or remembered values.

## Core workflow

1. Inspect the existing project structure, nearby instructions, theme code, design tokens, component states, assets, and uncommitted changes before editing.
2. Identify the platform and product context: web, native Apple, Android Material 2, Android Material 3, cross-platform, content-heavy, media-heavy, OLED-sensitive, or atmospheric.
3. Establish user-preference behavior before selecting colors.
4. Create a route/surface/state coverage manifest before styling. Include persistent shells, overlays and portals, authenticated or role-gated flows, third-party content, desktop/mobile layouts, and generated or empty/loading/error states.
5. Inventory every foreground, background, surface level, border, icon, semantic status, asset, interaction state, raw color, pseudo-element, and theme-sensitive transition. Record stylesheet load order and the element that owns each selected or animated visual state.
6. Define primitive, semantic, and component token layers. Components must consume semantic roles rather than raw colors.
7. Create light and dark mappings deliberately. Never generate the final system by inversion.
8. Verify every adjacent foreground/background pair with the bundled contrast script, including composited alpha colors and elevated surfaces.
9. Implement switching without wrong-theme flash, full reload, preference loss, automatic overrides of an explicit choice, or temporally mismatched transitions.
10. Choose atomic or animated switching only after inspecting existing transitions. Default to an atomic switch for legacy, media-heavy, multi-stylesheet, or partially tokenized products.
11. Verify the actual product across every manifest row, both appearances, accessibility settings, devices, lighting, content, and interaction states. Mark inaccessible or untestable rows explicitly; do not call the theme complete while required rows remain unverified.

## Non-negotiable rules

### Respect preference

- On the web, model preference as `system | light | dark` unless product requirements clearly differ.
- Precedence is explicit user choice over system appearance. An automatic time or weather theme must be separately opted into and must never silently replace an explicit Light or Dark choice.
- In native Apple apps, prefer the systemwide appearance. Add an app-specific appearance setting only when a strong product requirement justifies divergence.
- Support system appearance changes while the product is running.

### Use semantic architecture

- Use three layers: primitives → semantic roles → exceptional component roles.
- Include, at minimum, background/surface/elevated/scrim, primary/secondary/disabled text and icons, subtle/default/strong borders, focus, links, brand actions, and success/warning/danger/info roles.
- Do not require corresponding light and dark semantic roles to share the same physical swatch index.
- Test real components after initial palette mapping; allow deliberate palette-step adjustments.

### Verify contrast, never estimate it

- Use WCAG thresholds as thresholds, without rounding a failing value upward.
- Normal text: at least 4.5:1 for AA and 7:1 for AAA.
- Large text: at least 3:1 for AA and 4.5:1 for AAA. Large means at least 18pt/24 CSS px regular, or 14pt/about 18.67 CSS px bold.
- Meaningful UI boundaries, icons, focus indicators, and graphical objects: target at least 3:1 against adjacent colors where WCAG non-text contrast applies.
- Inactive controls are exempt from WCAG contrast requirements, but they still need to be identifiable and understandable.
- Material 2 documents 15.8:1 as a minimum white-text/base-surface design constraint so body text can retain 4.5:1 at the lightest 24dp elevation. It is not an automatically measured value for arbitrary colors or a universal body-text target.

Run a single check:

```bash
node <skill-dir>/scripts/contrast-ratio.mjs '#f8fafc' '#0c1222'
```

Run a batch check from JSON:

```bash
node <skill-dir>/scripts/contrast-ratio.mjs --file color-pairs.json --format json
```

Treat `<skill-dir>` in command examples as the directory containing this `SKILL.md`. Claude Code may use `${CLAUDE_SKILL_DIR}`; Codex should resolve the installed path from its skill catalog.

### Keep Material 2 and Material 3 distinct

- Material 2 dark surfaces commonly use `#121212` plus white elevation overlays. Retain dark cast shadows; do not use bright glow as the elevation language.
- Material 3 primarily uses named tonal surface roles and tonal elevation. In Android Compose, the tonal overlay comes from the Primary slot and can coexist with shadow elevation.
- Do not label Material 2's white-overlay percentage table as Material 3.
- Treat all baseline values as design-system-specific starting points, not universal web requirements.

### Design for accessibility settings and motion

- Do not communicate state by color alone. Pair status with text, icon, shape, or another perceivable cue.
- Test Increased Contrast and Reduce Transparency on Apple platforms, independently and together.
- Test keyboard focus, browser autofill, selection, caret, placeholder, disabled, loading, and error states.
- Wrap nonessential theme transitions and atmospheric animation in `prefers-reduced-motion: no-preference`, and disable or simplify them under `reduce`.
- Avoid flashes, lightning effects, or large luminance jumps unless the user explicitly enables them and the implementation is safe.

### Handle assets explicitly

- Test logos, transparent PNGs, photos, illustrations, screenshots, charts, SVGs, maps, video posters, captions, and third-party embeds in both appearances.
- Reuse one asset only if it preserves all information in both themes; otherwise provide theme variants.
- Never apply global image inversion.
- Use system symbols and asset catalogs on Apple platforms when appropriate.

## Implementation requirements

- Set `color-scheme` so native controls and browser surfaces can match the active appearance.
- Resolve saved preference before first paint. Account for Content Security Policy and storage failures.
- Listen for system changes only while preference is `system`.
- Persist the preference value, not merely the currently resolved appearance.
- Avoid global `transition: all`; transition only selected color-related properties.
- Do not add theme transitions until existing component transitions have been inventoried. Different durations on backgrounds, shadows, filters, images, and pseudo-elements can create visible afterimages even when each transition is individually motion-safe.
- Preserve interaction-state ownership. If a moving indicator, slider, or pseudo-element owns the selected fill, recolor that owner instead of adding a second selected background that breaks geometry or motion.
- Use feature detection or fallbacks for newer CSS such as `light-dark()` and `color-mix()` when project browser support requires it.
- Keep contrast comments out of source unless generated and tested. Prefer automated checks in tests or build tooling.

## Audit procedure

1. Build and retain the route/surface/state coverage manifest. Include every entry point, overlay root, responsive variant, privileged flow, and third-party island.
2. Extract actual colors from computed styles or design tokens; include alpha compositing and image-backed surfaces.
3. Generate a matrix across semantic foregrounds, every surface level, and every interaction state.
4. Run the bundled script on all pairs.
5. Inspect hierarchy, glare, halation, saturation, borders, state ownership, clipping, and asset loss visually; contrast math alone cannot assess comfort or meaning.
6. Test Light, Dark, and System; rapid Light → Dark → Light runtime changes; bright, normal, dim, and dark environments; LCD and OLED; mobile and desktop.
7. For web work, run the project locally and verify the complete flow in a browser when possible. If browser, authentication, or data access blocks a required row, report it as unverified and use static inspection only as partial evidence.
8. Report findings by severity with exact tokens/components and measured ratios. Separate standards failures, coverage gaps, and subjective refinements.

## Output expectations

- Match the user's language.
- State assumptions and the target platform.
- Separate required accessibility fixes from optional visual polish.
- Give token-level or component-level changes, not vague advice.
- When implementing, preserve existing patterns and make the minimum coherent change.
- When only reviewing or diagnosing, do not edit files unless asked.

## Sources of authority

Prefer primary standards and platform documentation for normative claims:

- [W3C WCAG contrast minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [W3C non-text contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast)
- [Apple Human Interface Guidelines: Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- [Material Design 2: Dark theme](https://m2.material.io/design/color/dark-theme.html)
- [Android Developers: Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)

Use secondary design articles for heuristics and examples, not to override current standards or platform guidance.
