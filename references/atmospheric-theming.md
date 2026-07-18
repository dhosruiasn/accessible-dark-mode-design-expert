# Accessible Atmospheric Themes

## Contents

- [1. Separate appearance from atmosphere](#1-separate-appearance-from-atmosphere)
- [2. Atmospheric token model](#2-atmospheric-token-model)
- [3. Safe time and weather resolution](#3-safe-time-and-weather-resolution)
- [4. Motion and luminance safety](#4-motion-and-luminance-safety)
- [5. Gradient and glass accessibility](#5-gradient-and-glass-accessibility)
- [6. Validation](#6-validation)

## 1. Separate appearance from atmosphere

Treat appearance and atmosphere as two independent preferences:

- Appearance: `system | light | dark`
- Atmosphere: `off | auto | dawn | day | golden | twilight | night | storm`

Appearance controls core surfaces, text, controls, and `color-scheme`. Atmosphere controls optional gradients, illustration, decorative accent, and ambient art.

An atmospheric scheduler must never remove or replace an explicit Light or Dark preference. `auto` must be opt-in. Weather must not silently force Storm or Dark merely because an API reports a thunderstorm.

## 2. Atmospheric token model

Keep decorative palettes separate from semantic accessibility roles.

```css
:root {
  /* Atmospheric primitives */
  --sky-dawn: #fef3c7;
  --sky-morning: #bae6fd;
  --sky-midday: #7dd3fc;
  --sky-golden: #fcd34d;
  --sky-sunset: #fb923c;
  --sky-dusk: #a78bfa;
  --sky-twilight: #6366f1;
  --sky-night: #1e1b4b;
  --ocean-surface: #38bdf8;
  --ocean-shallow: #0ea5e9;
  --ocean-mid: #0284c7;
  --ocean-deep: #0369a1;
  --ocean-abyss: #075985;
  --ocean-trench: #0c4a6e;
  --storm-light: #9ca3af;
  --storm-mid: #6b7280;
  --storm-dark: #4b5563;
  --storm-thunder: #374151;
  --storm-lightning: #fbbf24;
  --bio-cyan: #22d3ee;
  --bio-teal: #2dd4bf;
  --bio-blue: #60a5fa;
  --bio-purple: #a78bfa;
  --bio-glow: rgb(34 211 238 / 40%);
  --atmosphere-haze: rgb(186 230 253 / 30%);
  --atmosphere-fog: rgb(241 245 249 / 60%);
  --atmosphere-mist: rgb(148 163 184 / 40%);
  --sand-light: #fef3c7;
  --sand-warm: #fde68a;
  --sand-golden: #fcd34d;
  --sand-wet: #d4a574;
  --coral-pink: #fb7185;
  --coral-orange: #fb923c;
  --kelp-green: #22c55e;
  --algae-teal: #14b8a6;

  /* Safe defaults when atmosphere is off */
  --gradient-sky: none;
  --gradient-ocean: none;
  --atmosphere-accent: var(--action-primary);
  --atmosphere-art-opacity: 0;
}

:root[data-atmosphere='dawn'] {
  --gradient-sky: linear-gradient(
    180deg,
    var(--sky-night),
    var(--sky-dusk) 20%,
    var(--sky-sunset) 45%,
    var(--sky-golden) 70%,
    var(--sky-dawn)
  );
  --gradient-ocean: linear-gradient(
    180deg,
    var(--ocean-deep),
    var(--ocean-mid) 50%,
    var(--ocean-surface)
  );
  --atmosphere-accent: #b45309;
  --atmosphere-art-opacity: 1;
}

:root[data-atmosphere='day'] {
  --gradient-sky: linear-gradient(
    180deg,
    var(--sky-midday),
    var(--sky-morning) 55%,
    #ffffff
  );
  --gradient-ocean: linear-gradient(
    180deg,
    var(--ocean-abyss),
    var(--ocean-deep) 30%,
    var(--ocean-mid) 60%,
    var(--ocean-shallow)
  );
  --atmosphere-accent: var(--ocean-deep);
  --atmosphere-art-opacity: 1;
}

:root[data-atmosphere='golden'] {
  --gradient-sky: linear-gradient(
    180deg,
    var(--sky-midday),
    var(--sky-golden) 40%,
    var(--sky-sunset) 70%,
    var(--coral-pink)
  );
  --gradient-ocean: linear-gradient(
    180deg,
    var(--ocean-deep),
    #0891b2 50%,
    var(--sand-golden)
  );
  --atmosphere-accent: #9a3412;
  --atmosphere-art-opacity: 1;
}

:root[data-atmosphere='twilight'] {
  --gradient-sky: linear-gradient(
    180deg,
    var(--sky-night),
    var(--sky-twilight) 30%,
    var(--sky-dusk) 60%,
    var(--sky-sunset)
  );
  --gradient-ocean: linear-gradient(
    180deg,
    var(--ocean-trench),
    var(--ocean-abyss) 50%,
    var(--ocean-deep)
  );
  --atmosphere-accent: #c4b5fd;
  --atmosphere-art-opacity: 1;
}

:root[data-atmosphere='night'] {
  --gradient-sky: linear-gradient(
    180deg,
    #020617,
    var(--sky-night) 55%,
    #1e1b4b
  );
  --gradient-ocean: linear-gradient(
    180deg,
    #020617,
    var(--ocean-trench) 50%,
    var(--ocean-abyss)
  );
  --atmosphere-accent: var(--bio-cyan);
  --atmosphere-art-opacity: 1;
}

:root[data-atmosphere='storm'] {
  --gradient-sky: linear-gradient(
    180deg,
    var(--storm-thunder),
    var(--storm-dark) 30%,
    var(--storm-mid) 60%,
    var(--storm-light)
  );
  --gradient-ocean: linear-gradient(
    180deg,
    #1f2937,
    var(--storm-thunder) 40%,
    var(--storm-mid) 80%,
    var(--storm-light)
  );
  --atmosphere-accent: var(--storm-lightning);
  --atmosphere-art-opacity: 1;
}

.atmosphere-art {
  opacity: var(--atmosphere-art-opacity);
}

.sky-layer { background: var(--gradient-sky); }
.ocean-layer { background: var(--gradient-ocean); }
```

Do not reuse `--atmosphere-accent` automatically for text. Create a measured `--text-on-atmosphere` or place content on a stable semantic surface.

## 3. Safe time and weather resolution

Only run automatic resolution after the user selects Atmosphere Auto.

```ts
type Atmosphere =
  | 'off'
  | 'auto'
  | 'dawn'
  | 'day'
  | 'golden'
  | 'twilight'
  | 'night'
  | 'storm';

type ResolvedAtmosphere = Exclude<Atmosphere, 'auto'>;

interface WeatherCondition {
  main: 'Clear' | 'Clouds' | 'Rain' | 'Thunderstorm' | 'Snow' | 'Mist';
  description: string;
}

function atmosphereFromTime(hour: number): ResolvedAtmosphere {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'golden';
  if (hour >= 19 && hour < 21) return 'twilight';
  return 'night';
}

function resolveAtmosphere(
  preference: Atmosphere,
  date: Date,
  weather?: WeatherCondition
): ResolvedAtmosphere {
  if (preference !== 'auto') return preference;

  // Weather changes optional art only because the user opted into Auto.
  if (weather?.main === 'Thunderstorm') return 'storm';

  if (
    weather?.main === 'Clouds'
    && weather.description.toLowerCase().includes('overcast')
  ) {
    const hour = date.getHours();
    return hour >= 19 || hour < 6 ? 'night' : 'twilight';
  }

  return atmosphereFromTime(date.getHours());
}

function applyAtmosphere(resolved: ResolvedAtmosphere): void {
  document.documentElement.dataset.atmosphere = resolved;
  // Do not change data-theme-preference or data-theme-resolved here.
}
```

Persist the user's Atmosphere choice separately from Appearance. Recompute only while Atmosphere is Auto. If periodic refresh is useful, suspend work while the page is hidden and return a cleanup function:

```ts
function startAtmosphereAuto(
  getPreference: () => Atmosphere,
  getWeather: () => WeatherCondition | undefined
): () => void {
  const update = () => {
    if (document.hidden || getPreference() !== 'auto') return;
    applyAtmosphere(resolveAtmosphere('auto', new Date(), getWeather()));
  };

  const onVisibilityChange = () => {
    if (!document.hidden) update();
  };

  update();
  const timer = window.setInterval(update, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
```

Weather integration needs failure and privacy handling:

- Do not request location without clear user intent.
- Fall back to time or Off if the service fails.
- Treat API descriptions as untrusted data.
- Avoid sending precise location when coarse location is sufficient.
- Do not let a third-party request block initial rendering.

## 4. Motion and luminance safety

Define atmospheric animation only when motion is allowed:

```css
.wave-layer {
  position: absolute;
  inset: auto 0 0;
  width: 200%;
  height: var(--wave-height, 100px);
  background: var(--wave-color, var(--ocean-surface));
  opacity: var(--wave-opacity, 0.6);
  animation: none;
}

.cloud-layer {
  position: absolute;
  inset: 0;
  background-image: var(--cloud-pattern);
  opacity: var(--cloud-opacity, 0.5);
  animation: none;
}

.glow-pulse {
  animation: none;
}

.glow-element {
  box-shadow: 0 0 20px var(--bio-glow);
  transition: none;
}

@media (prefers-reduced-motion: no-preference) {
  .wave-layer {
    animation: wave var(--wave-duration, 8s) ease-in-out infinite;
  }

  .cloud-layer {
    animation: cloud-drift var(--cloud-speed, 60s) linear infinite;
  }

  .glow-pulse {
    animation: glow-pulse 4s ease-in-out infinite;
  }

  .glow-element {
    transition: box-shadow 300ms ease;
  }

  .glow-element:hover {
    box-shadow:
      0 0 30px var(--bio-glow),
      0 0 60px rgb(34 211 238 / 20%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wave-layer,
  .cloud-layer,
  .glow-pulse,
  .glow-element,
  .lightning {
    animation: none;
    transition: none;
  }
}

@keyframes wave {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-2%, -6px, 0); }
}

@keyframes cloud-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-20%, 0, 0); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.8; }
}
```

Do not implement lightning as a full-screen flashing animation by default. Prefer a static storm illustration or subtle non-flashing emphasis. Avoid sudden large luminance changes when appearance or atmosphere updates.

## 5. Gradient and glass accessibility

Contrast tools evaluate solid pairs, not every point in a gradient or photograph. Give important content a stable backing surface or scrim.

```css
:root,
:root[data-theme-resolved='light'] {
  --hero-copy-surface: rgb(255 255 255 / 92%);
  --hero-copy-border: #475569;
  --text-on-hero: #0f172a;
  --glass-surface: rgb(255 255 255 / 88%);
  --glass-border: #64748b;
}

:root[data-theme-resolved='dark'] {
  --hero-copy-surface: rgb(12 18 34 / 94%);
  --hero-copy-border: #94a3b8;
  --text-on-hero: #f8fafc;
  --glass-surface: rgb(12 18 34 / 90%);
  --glass-border: #94a3b8;
}

.hero-copy {
  color: var(--text-on-hero);
  background: var(--hero-copy-surface);
  border: 1px solid var(--hero-copy-border);
  border-radius: 1rem;
  padding: 1.25rem;
}

.glass-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

@media (prefers-reduced-transparency: reduce) {
  .glass-card {
    background: var(--surface-raised);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```

The sample uses relatively opaque backings so content is not dependent on an unknown gradient point. Recalculate text, border, and focus pairs after changing the alpha or art. `prefers-reduced-transparency` support is not universal. Keep the opaque fallback usable and test platform-specific Reduce Transparency settings where available.

Never assume a translucent white border is visible at all gradient positions. Test the worst local background or replace translucency with an opaque semantic color.

## 6. Validation

- Confirm Atmosphere Off leaves the base theme visually complete.
- Confirm System/Light/Dark behavior is unchanged by every atmospheric mode.
- Confirm automatic scheduling runs only after opt-in.
- Check text and controls against the darkest and lightest points behind them.
- Check all gradients at multiple viewport sizes; crop and interpolation change local color.
- Test reduced motion, transparency reduction, keyboard focus, zoom, and high contrast.
- Test battery and animation performance on representative mobile devices before making efficiency claims.
- Ensure weather errors, missing location, stale data, and offline use degrade to a stable appearance.
