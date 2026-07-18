# Web Dark Theme Implementation Patterns

## Contents

- [1. Token structure](#1-token-structure)
- [2. Initial theme bootstrap](#2-initial-theme-bootstrap)
- [3. Theme manager](#3-theme-manager)
- [4. CSS-only and modern CSS options](#4-css-only-and-modern-css-options)
- [5. Motion-safe transitions](#5-motion-safe-transitions)
- [6. Elevation patterns](#6-elevation-patterns)
- [7. Native controls and component states](#7-native-controls-and-component-states)
- [8. Theme-aware assets](#8-theme-aware-assets)
- [9. Automated contrast checks](#9-automated-contrast-checks)
- [10. Failure modes](#10-failure-modes)

## 1. Token structure

Use primitives only to define semantic roles. Components consume semantic or exceptional component tokens.

```css
:root {
  /* Primitives */
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-600: #475569;
  --gray-900: #0f172a;
  --twilight-950: #0c1222;
  --twilight-900: #151b2e;
  --twilight-850: #1a1f3a;
  --ocean-300: #7dd3fc;
  --ocean-400: #38bdf8;
  --ocean-600: #0284c7;
  --ocean-700: #0369a1;
  --ocean-800: #075985;
}

:root,
:root[data-theme-resolved='light'] {
  color-scheme: light;
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --background: #ffffff;
  --surface-base: #ffffff;
  --surface-raised: var(--gray-50);
  --border-default: #e2e8f0;
  --action-primary: var(--ocean-700);
  --action-primary-hover: var(--ocean-800);
  --button-on-primary: #ffffff;
  --focus-ring: var(--ocean-600);
  --shadow-raised: 0 4px 12px rgb(15 23 42 / 14%);
}

:root[data-theme-resolved='dark'] {
  color-scheme: dark;
  --text-primary: var(--gray-50);
  --text-secondary: var(--gray-300);
  --background: var(--twilight-950);
  --surface-base: var(--twilight-950);
  --surface-raised: var(--twilight-900);
  --border-default: rgb(255 255 255 / 12%);
  --action-primary: var(--ocean-400);
  --action-primary-hover: var(--ocean-300);
  --button-on-primary: var(--gray-900);
  --focus-ring: #38bdf8;
  --shadow-raised: 0 6px 18px rgb(0 0 0 / 45%);
}

body {
  background: var(--background);
  color: var(--text-primary);
}

.card {
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-raised);
}

.button-primary {
  background: var(--action-primary);
  color: var(--button-on-primary);
}

.button-primary:hover {
  background: var(--action-primary-hover);
}

:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}
```

The sample's `--button-on-primary` values were selected by computation. Rerun the bundled contrast script after changing any accent; do not infer black or white from a color name.

## 2. Initial theme bootstrap

Set the resolved appearance before styles render. Place this script in `<head>` before blocking stylesheets. If Content Security Policy prohibits inline scripts, use a nonce/hash, render the attributes on the server from a cookie, or load an allowed blocking bootstrap file.

```html
<script>
  (() => {
    const key = 'app-theme-preference';
    const valid = new Set(['system', 'light', 'dark']);
    let preference = 'system';

    try {
      const saved = localStorage.getItem(key);
      if (saved && valid.has(saved)) preference = saved;
    } catch {
      // Storage can be unavailable. Continue with System.
    }

    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = preference === 'system'
      ? (systemDark ? 'dark' : 'light')
      : preference;

    const root = document.documentElement;
    root.dataset.themePreference = preference;
    root.dataset.themeResolved = resolved;
  })();
</script>
```

Do not store only `resolved`. A stored `dark` value cannot distinguish an explicit Dark choice from System that happened to be dark at save time.

## 3. Theme manager

Use a single source of truth and react to system changes only while preference is System.

```ts
type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = Exclude<ThemePreference, 'system'>;

const STORAGE_KEY = 'app-theme-preference';
const media = window.matchMedia('(prefers-color-scheme: dark)');

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isThemePreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  return media.matches ? 'dark' : 'light';
}

function applyTheme(preference: ThemePreference, persist = true): void {
  const root = document.documentElement;
  const resolved = resolveTheme(preference);

  root.dataset.themePreference = preference;
  root.dataset.themeResolved = resolved;

  if (!persist) return;

  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The active page still updates even when persistence is unavailable.
  }
}

function setTheme(preference: ThemePreference): void {
  applyTheme(preference);
}

media.addEventListener('change', () => {
  const preference = readPreference();
  if (preference === 'system') applyTheme('system', false);
});

applyTheme(readPreference(), false);
```

For older browsers, support `media.addListener` only if the project's browser matrix requires it.

Use a labelled control:

```html
<label for="theme-preference">Appearance</label>
<select id="theme-preference" name="theme-preference">
  <option value="system">System</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
```

```ts
const select = document.querySelector<HTMLSelectElement>('#theme-preference');

if (select) {
  select.value = readPreference();
  select.addEventListener('change', () => {
    if (isThemePreference(select.value)) setTheme(select.value);
  });
}
```

## 4. CSS-only and modern CSS options

For a site that follows the system with no manual override:

```css
:root {
  color-scheme: light dark;
  --background: #ffffff;
  --text-primary: #0f172a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0c1222;
    --text-primary: #f8fafc;
  }
}
```

`light-dark()` can simplify paired values in supported browsers:

```css
:root {
  color-scheme: light dark;
}

.card {
  color: light-dark(#0f172a, #f8fafc);
  background: light-dark(#ffffff, #151b2e);
  border-color: light-dark(#e2e8f0, rgb(255 255 255 / 12%));
}
```

Check the project's browser support requirements before adopting `light-dark()` or `color-mix()`. Keep token fallbacks when required.

## 5. Motion-safe transitions

Do not animate the first paint. Before adding any theme transition, inventory existing component transitions, pseudo-elements, shadows, filters, gradients, images, and overlay roots.

### Default for legacy or complex products: atomic switching

Use an atomic switch when the product is legacy, partially tokenized, media-heavy, composed from several stylesheets or libraries, or already contains different color-transition durations. Temporarily suspend transitions for the switch itself, then restore normal component interaction motion after two frames.

```css
:root[data-theme-switching='true'],
:root[data-theme-switching='true'] *,
:root[data-theme-switching='true'] *::before,
:root[data-theme-switching='true'] *::after {
  transition: none !important;
}
```

```ts
let switchFrame: number | null = null;
let releaseFrame: number | null = null;
let switchGeneration = 0;

function applyThemeAtomically(preference: ThemePreference): void {
  const root = document.documentElement;
  const generation = ++switchGeneration;

  if (switchFrame !== null) window.cancelAnimationFrame(switchFrame);
  if (releaseFrame !== null) window.cancelAnimationFrame(releaseFrame);
  root.dataset.themeSwitching = 'true';

  // Flush the no-transition state before changing resolved theme tokens.
  void root.clientWidth;
  applyTheme(preference);

  switchFrame = window.requestAnimationFrame(() => {
    if (generation !== switchGeneration) return;
    switchFrame = null;
    releaseFrame = window.requestAnimationFrame(() => {
      if (generation === switchGeneration) {
        delete root.dataset.themeSwitching;
      }
      releaseFrame = null;
    });
  });
}
```

The forced layout is intentional and occurs only on an explicit theme change. Test rapid repeated switching and confirm the switching attribute is always removed.

### Optional for small, fully token-controlled products: scoped animation

Animate only when a small, explicit set of elements owns all theme-sensitive visual properties and uses coordinated duration and easing. Add an animation flag only for a user-triggered change.

```css
body,
.card,
.button-primary {
  transition: none;
}

@media (prefers-reduced-motion: no-preference) {
  :root[data-theme-animating='true'] body,
  :root[data-theme-animating='true'] .card,
  :root[data-theme-animating='true'] .button-primary {
    transition:
      color 220ms ease,
      background-color 220ms ease,
      border-color 220ms ease,
      box-shadow 220ms ease;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wave,
  .wave-layer,
  .cloud,
  .cloud-layer,
  .glow-pulse,
  .theme-ambient-animation {
    animation: none;
    transition: none;
  }
}
```

```ts
let themeTransitionTimer: number | null = null;

function applyThemeWithScopedTransition(preference: ThemePreference): void {
  const root = document.documentElement;
  if (themeTransitionTimer !== null) window.clearTimeout(themeTransitionTimer);
  root.dataset.themeAnimating = 'true';
  applyTheme(preference);

  themeTransitionTimer = window.setTimeout(() => {
    delete root.dataset.themeAnimating;
    themeTransitionTimer = null;
  }, 260);
}
```

Do not use `transition: all`. It can animate layout, transforms, filters, and other properties that should change immediately.

Do not combine the scoped example with unrelated component transitions without testing. A 150 ms background, 220 ms text color, and 300 ms shadow or pseudo-element can produce a smeared afterimage even when every individual transition is technically valid and Reduce Motion is respected.

## 6. Elevation patterns

### Generic role-based dark elevation

```css
:root[data-theme-resolved='dark'] {
  --surface-0: #121212;
  --surface-1: #1e1e1e;
  --surface-2: #232323;
  --surface-3: #282828;
  --surface-4: #2d2d2d;
}

.page { background: var(--surface-0); }
.card { background: var(--surface-1); }
.menu { background: var(--surface-2); }
.dialog { background: var(--surface-4); }
```

These values approximate a neutral Material 2-style stack. Verify all text pairs and do not label the table as Material 3.

### Material 2-style computed overlay

```css
:root[data-theme-resolved='dark'] {
  --surface-base: #121212;
  --surface-1dp: color-mix(in srgb, white 5%, var(--surface-base));
  --surface-2dp: color-mix(in srgb, white 7%, var(--surface-base));
  --surface-3dp: color-mix(in srgb, white 8%, var(--surface-base));
  --surface-4dp: color-mix(in srgb, white 9%, var(--surface-base));
  --surface-6dp: color-mix(in srgb, white 11%, var(--surface-base));
}
```

Provide fixed fallbacks before these declarations when supporting browsers without `color-mix()`.

For Material 3, use its `surfaceContainer*` roles or the platform's tonal-elevation APIs rather than this white-overlay scale.

## 7. Native controls and component states

```css
:root {
  accent-color: var(--action-primary);
}

input,
select,
textarea,
button {
  color: var(--text-primary);
  background-color: var(--surface-base);
  border-color: var(--border-default);
}

::placeholder {
  color: var(--text-placeholder);
  opacity: 1;
}

::selection {
  color: var(--selection-text);
  background: var(--selection-bg);
}

input:disabled,
button:disabled {
  color: var(--text-disabled);
  border-color: var(--border-disabled);
  cursor: not-allowed;
}
```

Define and verify all referenced tokens. Do not lower placeholder contrast below normal-text requirements when the placeholder communicates necessary instructions.

## 8. Theme-aware assets

When appearance always follows the system, `<picture>` media queries are efficient:

```html
<picture>
  <source srcset="hero-dark.avif" media="(prefers-color-scheme: dark)">
  <img src="hero-light.avif" alt="Product dashboard overview">
</picture>
```

This does not follow an app-specific override. When manual overrides exist, select assets from the resolved theme through the application state, framework component, or theme-aware asset map.

For CSS backgrounds:

```css
:root[data-theme-resolved='light'] { --hero-image: url('/hero-light.avif'); }
:root[data-theme-resolved='dark'] { --hero-image: url('/hero-dark.avif'); }
.hero { background-image: var(--hero-image); }
```

## 9. Automated contrast checks

Check one pair:

```bash
node <skill-dir>/scripts/contrast-ratio.mjs '#f8fafc' '#0c1222'
```

Check alpha-composited content:

```bash
node <skill-dir>/scripts/contrast-ratio.mjs 'rgb(255 255 255 / 60%)' '#121212'
```

Batch file shape:

```json
[
  { "label": "primary text / base", "foreground": "#f8fafc", "background": "#0c1222", "require": "aa-normal" },
  { "label": "focus ring / surface", "foreground": "#38bdf8", "background": "#151b2e", "require": "non-text" }
]
```

```bash
node <skill-dir>/scripts/contrast-ratio.mjs --file color-pairs.json --format json
```

Each batch pair may set its own `require`. Pass `--require aa-normal` to override every pair with one CI criterion. The process exits with status `2` when a required pair fails. Use the script's unrounded ratio for pass/fail; display precision is informational only.

The bundled sample palette has an executable matrix:

```bash
node <skill-dir>/scripts/contrast-ratio.mjs --file <skill-dir>/references/color-pairs.example.json
```

Run the bundled regression suite after editing the calculator:

```bash
node <skill-dir>/scripts/test-contrast-ratio.mjs
```

## 10. Failure modes

- Storing only the resolved mode loses the difference between System and explicit Dark.
- Listening to system changes after an explicit choice overrides user intent.
- A time/weather job that removes `theme-light` or `theme-dark` overrides user intent.
- `<picture media="prefers-color-scheme">` follows the OS, not an app override.
- Inline bootstrap without CSP handling can be blocked.
- Uncaught storage access can stop bootstrap in restricted contexts.
- Global transitions can animate layout and trigger discomfort.
- Hard-coded contrast comments become stale after one token changes.
- Using Material 2 white overlays while naming the system Material 3 creates incorrect platform documentation.
