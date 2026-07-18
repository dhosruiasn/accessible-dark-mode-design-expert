# Dark Mode Design Expert

A cross-runtime Agent Skill for designing, implementing, reviewing, and auditing accessible light and dark themes. It works with OpenAI Codex and Claude Code, includes corrected web implementation patterns, and verifies contrast with executable tooling instead of handwritten ratios.

繁體中文摘要：這是一套可供 Codex 與 Claude Code 共用的完整 Dark Mode 設計、實作與無障礙稽核 Skill。

## What it covers

- System, Light, and Dark preference behavior
- Semantic tokens, surfaces, hierarchy, typography, imagery, and component states
- WCAG text and non-text contrast with alpha compositing
- Material 2 versus Material 3 elevation behavior
- Apple dark appearance guidance
- Flash-free web initialization and persistent theme switching
- `prefers-reduced-motion`-safe transitions and atmospheric animation
- Optional time, weather, sky, and ocean themes without overriding appearance
- Auditing checklists for web, Apple, Material, devices, and accessibility settings

## Included tools

- `scripts/contrast-ratio.mjs` — dependency-free WCAG contrast calculator
- `scripts/test-contrast-ratio.mjs` — contrast calculator regression suite
- `scripts/validate-skill.mjs` — dependency-free Skill structure validator
- `scripts/sync-installations.mjs` — conflict-safe Codex/Claude installation sync
- `scripts/test-sync-installations.mjs` — installation sync regression suite

Node.js 18 or later is recommended for the bundled scripts.

## Install one shared source

Clone the repository to a stable location:

```bash
git clone https://github.com/dhosruiasn/dark-mode-design-expert.git
cd dark-mode-design-expert
```

Create both user-level installations:

```bash
node scripts/sync-installations.mjs --sync
```

This installs to:

- Codex: `${CODEX_HOME}/skills/dark-mode-design-expert`, or `~/.codex/skills/dark-mode-design-expert`
- Claude Code: `~/.claude/skills/dark-mode-design-expert`

If an identical installation already exists but is not managed, adopt it once:

```bash
node scripts/sync-installations.mjs --adopt --target codex
node scripts/sync-installations.mjs --adopt --target claude
node scripts/sync-installations.mjs --sync
```

The synchronizer preserves unknown files and refuses to overwrite a managed file changed only in an installation.

## Invoke

Codex:

```text
Use $dark-mode-design-expert to audit this interface.
```

Claude Code:

```text
/dark-mode-design-expert Audit this interface.
```

Both runtimes can also trigger the Skill automatically when a request matches its description.

## Contrast calculator

Check one pair:

```bash
node scripts/contrast-ratio.mjs '#f8fafc' '#0c1222' --require aa-normal
```

Check the bundled matrix:

```bash
node scripts/contrast-ratio.mjs --file references/color-pairs.example.json
```

The displayed ratio is rounded for readability. Pass/fail always uses the unrounded value.

## Validate and develop

```bash
node scripts/validate-skill.mjs
node scripts/test-contrast-ratio.mjs
node scripts/test-sync-installations.mjs
node scripts/sync-installations.mjs --sync --dry-run
```

The GitHub Actions workflow runs the same checks on pushes and pull requests.

## Repository layout

```text
SKILL.md                         Core routing and workflow
agents/openai.yaml               Codex UI metadata
references/                     Detailed design and implementation guidance
scripts/                        Validators, calculators, tests, and sync tooling
.github/workflows/validate.yml   Public CI
```

Repository-only documentation and GitHub configuration are not copied by the installation synchronizer. `LICENSE` travels with installed copies.

## Sources

Normative guidance is based on W3C WCAG and current platform documentation. Secondary design articles are treated as heuristics rather than standards. See `SKILL.md` and `references/design-foundations.md` for the complete source list.

## License

MIT — see [LICENSE](LICENSE).
