# Dark Theme Audit and Acceptance Checklist

## Contents

- [1. Audit inputs](#1-audit-inputs)
- [2. Product and preference](#2-product-and-preference)
- [3. Tokens, color, and surfaces](#3-tokens-color-and-surfaces)
- [4. Contrast and typography](#4-contrast-and-typography)
- [5. Components and interaction](#5-components-and-interaction)
- [6. Assets and media](#6-assets-and-media)
- [7. Platform and accessibility settings](#7-platform-and-accessibility-settings)
- [8. Environment, device, and performance](#8-environment-device-and-performance)
- [9. Automated checks](#9-automated-checks)
- [10. Reporting format](#10-reporting-format)

## 1. Audit inputs

Collect before judging the design:

- Target platform and browser/OS matrix
- Existing token definitions and computed styles
- Light, Dark, and System preference behavior
- Component inventory and state stories
- Image, icon, logo, chart, and third-party asset inventory
- Accessibility targets and applicable WCAG conformance level
- Supported display technologies and common lighting contexts
- Product-specific appearance or brand constraints

Do not audit only screenshots when runnable UI or source tokens are available. Screenshots can conceal computed alpha, focus, transitions, runtime switching, and state behavior.

## 2. Product and preference

- [ ] Dark mode is justified by actual product contexts rather than visual fashion alone.
- [ ] Light and dark provide equivalent content, actions, and state information.
- [ ] The product defines `system | light | dark` precedence or documents a justified alternative.
- [ ] First visit respects system preference.
- [ ] An explicit user choice overrides the system.
- [ ] System changes update the UI only while System is selected.
- [ ] Preference persists across reload, navigation, new tabs, login, and logout as specified.
- [ ] Native Apple behavior follows system appearance unless a documented product reason requires otherwise.
- [ ] Atmospheric/time/weather modes are opt-in and do not override explicit Light or Dark.
- [ ] A dark-only interface has a defensible immersive or domain-specific reason.

## 3. Tokens, color, and surfaces

- [ ] No global color or image inversion creates the dark theme.
- [ ] Primitive, semantic, and exceptional component tokens are separated.
- [ ] Components use semantic tokens rather than raw color literals.
- [ ] Background, base surface, raised surface, overlay, and scrim roles are explicit.
- [ ] Primary, secondary, tertiary, and disabled content roles are explicit.
- [ ] Subtle, default, strong, disabled, and focus border roles are explicit.
- [ ] Link, visited link, Primary, Secondary, Success, Warning, Danger, and Info have dark mappings.
- [ ] Higher dark surfaces remain distinguishable from lower surfaces.
- [ ] Neutral elevation overlays are not applied to already-colored Primary/Secondary containers.
- [ ] Large surfaces avoid excessive luminance and saturation.
- [ ] Fully saturated brand color is limited to deliberate focal elements.
- [ ] Brand tint in the dark base has been re-tested rather than assumed safe.
- [ ] Material 2 and Material 3 terminology and elevation models are not mixed.
- [ ] Apple base/elevated background behavior is preserved when using system UI.

## 4. Contrast and typography

- [ ] Every normal-text pair measures at least 4.5:1 for AA.
- [ ] Every large-text pair measures at least 3:1 for AA.
- [ ] AAA targets use 7:1 normal and 4.5:1 large.
- [ ] Large text is identified as 18pt/24px regular or 14pt/about 18.67px bold, not simply “a heading.”
- [ ] Contrast checks use actual composited values, including alpha.
- [ ] Contrast is measured at every surface elevation and interaction state.
- [ ] A value below a threshold is not rounded upward to pass.
- [ ] Meaningful component boundaries, focus indicators, and graphics meet applicable 3:1 non-text contrast.
- [ ] Inactive controls remain identifiable even where WCAG does not require a ratio.
- [ ] Primary, secondary, tertiary, hint, placeholder, and disabled text remain semantically appropriate.
- [ ] Important instructions are not assigned an intentionally weak hint role.
- [ ] Body text is not hard-coded to pure white everywhere.
- [ ] Small text avoids impractically thin strokes.
- [ ] Line height, paragraph spacing, line length, and size support content-heavy use.
- [ ] CJK or other script-specific type size and weight have been assessed with real glyphs.
- [ ] Icons and strokes use theme-aware colors and remain visible.

## 5. Components and interaction

For every applicable component, inspect:

- [ ] Default
- [ ] Hover
- [ ] Focus
- [ ] Focus-visible
- [ ] Pressed/Active
- [ ] Selected/Checked
- [ ] Dragged
- [ ] Disabled
- [ ] Loading
- [ ] Read-only
- [ ] Error
- [ ] Success
- [ ] Warning

Then verify:

- [ ] Container, content, icon, border, overlay, shadow, elevation, and cursor all match the state.
- [ ] Focus remains visible on every neutral, colored, image, and translucent background.
- [ ] Selection, caret, placeholder, browser autofill, and validation states are readable.
- [ ] State is not communicated by color alone.
- [ ] Modals, popovers, menus, tooltips, toasts/snackbars, date pickers, and sheets have clear boundaries.
- [ ] Native controls receive the correct `color-scheme`.
- [ ] Keyboard navigation exposes every action and follows a logical order.
- [ ] Zoom and text resizing do not hide or clip controls.

## 6. Assets and media

- [ ] The logo preserves required details on both light and dark backgrounds.
- [ ] Transparent PNG edges and dark details remain visible.
- [ ] White-background images do not appear as uncontrolled glowing panels.
- [ ] Product-photo brightness was judged per image rather than changed globally.
- [ ] SVG fills and strokes consume semantic colors when appropriate.
- [ ] Illustrations preserve thin lines, shadows, and low-value details.
- [ ] Charts preserve every series, grid, point, tooltip, selection, and state.
- [ ] Screenshots have a clear boundary in the surrounding theme.
- [ ] Video poster, first frame, controls, captions, flashes, and brightness jumps are safe.
- [ ] Third-party embeds and iframes do not introduce unreadable light/dark islands.
- [ ] Theme-specific assets follow explicit app overrides, not only OS media queries.
- [ ] Theme variants avoid unnecessary duplicate download or delayed swapping.

## 7. Platform and accessibility settings

### Web

- [ ] `prefers-color-scheme` is used for System behavior.
- [ ] `color-scheme` is set for native controls.
- [ ] The resolved theme is applied before first paint.
- [ ] Storage failures and Content Security Policy are handled.
- [ ] `prefers-reduced-motion` disables nonessential transitions and atmospheric animation.
- [ ] New CSS functions have fallbacks required by the support matrix.

### Apple

- [ ] Semantic/System Colors are preferred where applicable.
- [ ] System Label colors, controls, SF Symbols, and Asset Catalog variants are used appropriately.
- [ ] Dark + Increase Contrast is tested.
- [ ] Dark + Reduce Transparency is tested.
- [ ] Dark + Increase Contrast + Reduce Transparency is tested.
- [ ] macOS desktop tinting does not corrupt semantic or brand colors.

### Material

- [ ] Material version is identified.
- [ ] Material 2 uses its surface/elevation conventions accurately.
- [ ] Material 3 uses tonal roles/elevation rather than relabelled Material 2 percentages.

## 8. Environment, device, and performance

- [ ] Bright sunlight
- [ ] Normal indoor light
- [ ] Low light
- [ ] Complete darkness
- [ ] Phone
- [ ] Tablet
- [ ] Laptop
- [ ] Desktop
- [ ] LCD
- [ ] OLED
- [ ] Relevant P3 and sRGB profiles
- [ ] Relevant white-point or color-temperature adaptation
- [ ] Touch
- [ ] Pointer
- [ ] Keyboard

Performance acceptance:

- [ ] No wrong-theme flash.
- [ ] No full reload for a theme change.
- [ ] No significant layout shift.
- [ ] No long main-thread stall.
- [ ] No unbounded background timer for atmospheric effects.
- [ ] No large duplicate asset download.
- [ ] Animation remains smooth on representative low-power hardware.
- [ ] Claims about OLED battery savings are tested in the product context or presented only as conditional.

## 9. Automated checks

Use the bundled script for every solid pair:

```bash
node <skill-dir>/scripts/contrast-ratio.mjs '#foreground' '#background'
```

For a batch:

```bash
node <skill-dir>/scripts/contrast-ratio.mjs --file color-pairs.json --format json
```

Automate at least:

- Semantic token pair matrix
- Text on each surface level
- Text/icons on Primary and semantic status containers
- Focus ring against adjacent surfaces
- Borders and graphics where non-text contrast applies
- Default, Hover, Focus, Pressed, Selected, and Error pairs

Automated contrast cannot validate:

- Gradient worst points unless sampled or bounded
- Background-image content changes
- Visual hierarchy and glare
- Asset detail loss
- Whether state relies on color alone
- Motion discomfort
- User-preference behavior

## 10. Reporting format

Report each issue with:

1. Severity: blocker, high, medium, or low.
2. Exact token/component/state.
3. Actual foreground and background, including alpha/composited result.
4. Measured ratio and applicable requirement.
5. User impact.
6. Minimal coherent correction.
7. Verification method.

Separate categories:

- **Standards failure:** measurable WCAG or platform-guideline failure.
- **Behavior failure:** wrong preference, flash, persistence, runtime, or motion behavior.
- **System inconsistency:** raw colors, broken token mapping, mixed Material versions, missing state.
- **Visual refinement:** saturation, atmosphere, hierarchy, or polish that is not itself a conformance failure.

Do not present subjective preference as a standards violation. Do not soften a measurable accessibility failure into optional polish.
