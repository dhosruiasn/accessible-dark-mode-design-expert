# Dark Mode Design Foundations

## Contents

- [1. Context and product decision](#1-context-and-product-decision)
- [2. Token architecture](#2-token-architecture)
- [3. Surfaces and elevation](#3-surfaces-and-elevation)
- [4. Brand and semantic color](#4-brand-and-semantic-color)
- [5. Contrast, typography, and icons](#5-contrast-typography-and-icons)
- [6. Images and media](#6-images-and-media)
- [7. Components and states](#7-components-and-states)
- [8. Platform guidance](#8-platform-guidance)
- [9. Conflicting advice resolved](#9-conflicting-advice-resolved)
- [10. Source notes](#10-source-notes)

## 1. Context and product decision

Dark mode is contextually useful, not universally superior.

Use it to reduce emitted light in dim settings, help media or visual content dominate, support people who prefer a dark appearance, and potentially reduce OLED power use when the rendered screen actually contains many dark pixels.

Do not claim that it always reduces eye strain, improves sleep, increases accessibility, or saves a fixed percentage of battery. Bright environments, long-form reading, display technology, brightness, content, and individual visual needs can reverse the outcome.

Prefer user choice. A forced dark-only interface is appropriate only in rare product contexts such as immersive media. Light and dark appearances must preserve equivalent information, functionality, and interaction.

## 2. Token architecture

Use three layers:

1. Primitives describe physical color, for example `gray-950` or `blue-300`.
2. Semantic tokens describe purpose, for example `surface-base` or `text-secondary`.
3. Component tokens describe justified exceptions, for example `button-primary-bg`.

Recommended semantic inventory:

| Category | Roles |
| --- | --- |
| Surfaces | `background`, `surface-base`, `surface-raised`, `surface-overlay`, `scrim` |
| Text | `text-primary`, `text-secondary`, `text-tertiary`, `text-disabled`, `text-on-accent` |
| Icons | `icon-primary`, `icon-secondary`, `icon-disabled`, `icon-on-accent` |
| Borders | `border-subtle`, `border-default`, `border-strong`, `divider`, `focus-ring` |
| Actions | `accent-primary`, `accent-secondary`, `link`, `visited-link` |
| Status | `success`, `warning`, `danger`, `info`, each with surface/content/border variants |
| States | `hover-overlay`, `focus-overlay`, `pressed-overlay`, `dragged-overlay`, `selected` |

Never invert the light theme wholesale. Light and dark semantic roles may map approximately one-to-one, but their physical palette steps can differ. FourZeroThree's case study begins with paired scales and then adjusts individual buttons, alerts, and surfaces after component testing.

Create a contrast matrix across every semantic foreground, surface, elevation, and state. Do not test only `text-primary` on the page background.

## 3. Surfaces and elevation

### Dark gray and true black

`#121212` is a common Material 2 dark-surface baseline, not a universal requirement. Near-black surfaces usually provide more room for visible hierarchy, borders, and shadows than `#000000`, while reducing pure-white-on-black glare.

True black can be appropriate for OLED-focused wearables or immersive media. Test scrolling artifacts, asset boundaries, halation, focus, and elevated surfaces on actual target devices.

A dark base may include a subtle brand tint. Material 2 demonstrates an 8% Primary overlay on `#121212` producing `#1F1B24`. Recalculate every resulting contrast pair rather than assuming the recipe remains accessible with another hue.

### Material 2 elevation

Material 2 lightens dark surfaces with a translucent white `On Surface` overlay as elevation increases:

| Elevation | White overlay |
| ---: | ---: |
| 0dp | 0% |
| 1dp | 5% |
| 2dp | 7% |
| 3dp | 8% |
| 4dp | 9% |
| 6dp | 11% |
| 8dp | 12% |
| 12dp | 14% |
| 16dp | 15% |
| 24dp | 16% |

Apply this overlay only to neutral Surface containers, not containers already using Primary or Secondary color. Retain dark cast shadows where needed. A bright glow is not a valid substitute for cast-shadow elevation.

Material 2 documents 15.8:1 as a minimum contrast constraint between white text and the base surface. It reserves enough headroom for normal text to remain at least 4.5:1 after the surface becomes lighter at 24dp. Treat this as Material 2 system guidance, not as the measured ratio for `#FFFFFF` against every dark base and not as a universal target for every text role.

### Material 3 elevation

Material 3 has separate shadow and tonal elevation. Its tonal overlay comes from the Primary color slot, and its expanded color scheme includes roles such as `surface`, `surfaceDim`, `surfaceBright`, and `surfaceContainerLowest` through `surfaceContainerHighest`.

Do not copy the Material 2 white-overlay table into a Material 3 specification. Use the framework's Material 3 color scheme and surface APIs, or define an equivalent role-based tonal system for non-Android products.

### Apple base and elevated backgrounds

iOS and iPadOS use dimmer base backgrounds for receding interfaces and brighter elevated backgrounds for foreground UI such as modal sheets and popovers. Prefer system background colors because the system changes these roles in multitasking and multiwindow contexts.

## 4. Brand and semantic color

Highly saturated colors can appear intense or vibratory on dark surfaces. Increase lightness and reduce saturation when necessary, but do not apply one mechanical percentage to every hue.

Material 2 suggests exploring lighter 200–50 tones for dark themes; its baseline Primary uses a 200 tone. Treat this as Material 2 guidance, not a universal palette algorithm.

Reserve fully saturated brand color for one or two high-value elements if necessary. Large areas should remain darker and calmer so the brand accent retains prominence.

Create independent dark variants for:

- Primary and Secondary actions
- Links and visited links
- Success, Warning, Danger, and Info
- Selected and Focus states
- Charts and data series

For every colored container, choose `on-*` foreground color from measured contrast. Do not simply reverse white to black or black to white.

Never rely on color alone. Add text, iconography, shape, pattern, or another perceivable difference for meaning and state.

Material 2's dark Error `#CF6679`, 12% white disabled container, and 38% white disabled content are system-specific baselines. Validate actual product colors and do not present these values as WCAG requirements.

## 5. Contrast, typography, and icons

### WCAG thresholds

| Content | AA | AAA |
| --- | ---: | ---: |
| Normal text | 4.5:1 | 7:1 |
| Large text | 3:1 | 4.5:1 |

Large text means at least 18pt (24 CSS px) regular or 14pt (about 18.67 CSS px) bold. CJK fonts need an equivalent large-print size appropriate to the typeface.

Meaningful UI component boundaries, focus indicators, and graphical objects need 3:1 non-text contrast where WCAG 1.4.11 applies. Inactive controls are exempt but should remain identifiable.

Never round 4.499:1 to a passing 4.5:1. Use the bundled script with actual composited colors.

### Text hierarchy

Material 2 provides these white-opacity starting points on its dark surface:

| Role | White opacity |
| --- | ---: |
| High emphasis | 87% |
| Medium emphasis and hint | 60% |
| Disabled | 38% |

These are not automatic pass values on arbitrary backgrounds. Prefer semantic or system label colors over scattered alpha literals.

Pure white may be valid for some `on-*` roles or calculations, but hard-coded pure white across all body copy often creates excessive glare and destroys hierarchy.

### Weight and layout

Light text may appear optically heavier on a dark surface, yet genuinely thin fonts can become faint. Resolve this through optical QA rather than a blanket weight adjustment.

- Prefer Regular or Medium for body text unless the typeface proves otherwise.
- Increase size or weight for small text.
- Adjust line height, paragraph spacing, and line length for long-form reading.
- Allow theme-specific type tokens only when testing demonstrates a real need.

### Icons, borders, and focus

Use dynamic semantic colors for icons and strokes. Supply theme-specific icon art if details disappear. Test focus rings against every surface and colored control; a small hue shift alone is not sufficient.

## 6. Images and media

| Asset | Treatment |
| --- | --- |
| Transparent PNG | Check dark details and antialiased edges; provide a dark variant or bounded neutral container |
| Product photo | Evaluate highlight dominance; test a slight brightness reduction rather than applying one globally |
| White-background image | Slightly dim the white field if it glows in the dark context |
| SVG | Drive fill and stroke from semantic tokens; avoid embedded single-theme colors |
| Illustration | Rework dark regions, thin lines, backgrounds, and shadows if information disappears |
| Chart | Re-test every series, grid, tooltip, selection, and state |
| Screenshot | Add a clear radius, border, or appropriate shadow when a light screen floats on a dark page |
| Logo | Supply approved light- and dark-background versions when one asset is insufficient |
| Video | Check poster, first frame, controls, captions, flashes, and large luminance jumps |

Never invert all images with CSS. On Apple platforms, use Asset Catalog variants and SF Symbols where appropriate.

## 7. Components and states

Cover each applicable state:

- Default
- Hover
- Focus and Focus-visible
- Pressed or Active
- Selected or Checked
- Dragged
- Disabled
- Loading
- Read-only
- Error, Success, and Warning

Inspect container, content, icon, border, overlay, elevation, cursor, and motion in every state.

Inputs need separate treatment for label, value, placeholder, caret, selection, autofill, error, read-only, and disabled. Browser-native controls should receive the correct `color-scheme`.

Material 2 Surface containers inherit state-overlay color from their text or icon. Primary containers use white state overlays. These are Material conventions, not universal web rules.

## 8. Platform guidance

### Web

Offer `system | light | dark`, persist the preference rather than only the resolved mode, resolve it before first paint, and listen for system changes only while System is selected.

### Apple

Prefer semantic/system colors, system labels, system views, SF Symbols, and Asset Catalog variants. Test Dark with Increase Contrast and Reduce Transparency separately and together. On macOS, neutral translucent custom components may pick up desktop tinting; avoid this for colors that communicate state or brand.

Apple's current guidance has no extra tvOS dark-mode rule and states that visionOS and watchOS do not support a distinct Dark Mode setting.

### Material

Identify whether the product uses Material 2 or Material 3 before applying elevation and color-role guidance. Do not mix their tables or terminology.

## 9. Conflicting advice resolved

| Question | Resolution |
| --- | --- |
| Should the app provide a switch? | Web commonly benefits from System/Light/Dark. Native Apple apps should normally follow the system without another redundant preference. |
| Is pure white forbidden? | No. Avoid using it indiscriminately for body copy; it can remain valid for selected `on-*` roles and system calculations. |
| Should dark mode use shadows? | Retain dark cast shadows when meaningful, but do not rely on them alone. Use surface tone as the primary depth cue. |
| Can glow be used? | Use restrained glow as decoration or focus emphasis, never as the elevation model. |
| Should text be lighter or heavier? | Test the actual typeface optically. Avoid both halation-induced heaviness and genuinely faint thin strokes. |
| Must the base be `#121212`? | No. It is a useful baseline. Brand-tinted alternatives are valid after complete contrast and device testing. |

## 10. Source notes

- [Apple Human Interface Guidelines: Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) is authoritative for Apple behavior.
- [Material Design 2: Dark theme](https://m2.material.io/design/color/dark-theme.html) supplies the white-overlay elevation model and Material 2 baseline values.
- [Android Developers: Material 3](https://developer.android.com/develop/ui/compose/designsystems/material3) documents tonal elevation and current Material 3 roles.
- [W3C WCAG contrast minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) and [non-text contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast) define normative accessibility requirements.
- [OZCHAMP: Dark Mode Web Design](https://www.ozchamp.com/insights/dark-mode-web-design), [UX Design Institute: Dark Mode Design Practical Guide](https://www.uxdesigninstitute.com/blog/dark-mode-design-practical-guide/), and [FourZeroThree: Scalable, Accessible Dark Mode](https://www.fourzerothree.in/p/scalable-accessible-dark-mode) provide useful heuristics and case-study techniques. Treat unsourced adoption, health, battery, and cost numbers as contextual claims rather than universal evidence.
