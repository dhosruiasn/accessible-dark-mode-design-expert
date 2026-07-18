# Contributing

Contributions that improve accuracy, accessibility, platform guidance, examples, or deterministic tooling are welcome.

## Before opening a pull request

1. Keep `SKILL.md` concise, imperative, and under 500 lines.
2. Put detailed or platform-specific material in a directly linked file under `references/`.
3. Do not add handwritten contrast claims. Add or update an executable color pair instead.
4. Distinguish normative standards from design heuristics and prefer primary sources.
5. Preserve the difference between Material 2 and Material 3.
6. Keep System/Light/Dark appearance independent from optional time or weather atmosphere.
7. Do not commit credentials, personal paths, API keys, tokens, or environment files.

Run all checks:

```bash
node scripts/validate-skill.mjs
node scripts/test-contrast-ratio.mjs
node scripts/test-sync-installations.mjs
node scripts/contrast-ratio.mjs --file references/color-pairs.example.json
```

Describe what changed, why it changed, the source supporting it, and any compatibility impact in the pull request.
