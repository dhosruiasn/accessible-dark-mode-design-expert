# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-07-19

### Added

- Route/surface/state coverage acceptance guide and source-level theme surface inventory script with automated regression tests

### Changed

- Replaced the repository logo with the contributor-provided crescent moon artwork
- Regenerated the GitHub social preview in the Logo's handcrafted crescent-moon visual style, with separate wide-spaced wavy underlines for each capability label
- Rebranded the dark-mode showcase with the repository Logo and Skill name
- Made atomic switching the default for legacy, media-heavy, multi-stylesheet, and partially tokenized products to prevent transition afterimages
- Added hard completion gates for responsive, authenticated, overlay, generated-content, state-ownership, and blocked verification coverage
- Hardened atomic and scoped transition examples against stale callbacks during rapid repeated switching
- Converted Pickmin production findings—partial surface coverage, duplicate visual-state ownership, and mismatched transition afterimages—into reusable acceptance rules

## [2.0.0] - 2026-07-19

### Added

- Complete Traditional Chinese and English README documentation
- Repository logo, social preview, reproducible dark-mode showcase, and screenshot
- Safe `--migrate-name` workflow for managed Codex and Claude Code installations
- Upstream MIT attribution and derivative-work notice

### Changed

- Renamed the Skill from `dark-mode-design-expert` to `accessible-dark-mode-design-expert` to avoid installation and invocation collisions
- Renamed Codex and Claude Code installation folders and invocation commands
- Excluded repository-only documentation and visual assets from runtime installations

### Migration

- Clone or update the v2 repository, then run `node scripts/sync-installations.mjs --migrate-name`
- Use `$accessible-dark-mode-design-expert` in Codex
- Use `/accessible-dark-mode-design-expert` in Claude Code

## [1.0.0] - 2026-07-19

### Added

- Cross-runtime Dark Mode design, implementation, review, and audit Skill
- Executable WCAG contrast calculator and sample matrix
- Corrected web examples, automatic contrast calculation, and `prefers-reduced-motion` guidance
- Conflict-safe Codex/Claude installation synchronization
- Structure validation, regression tests, GitHub Actions, README, MIT License, contribution guide, and security policy

[Unreleased]: https://github.com/dhosruiasn/accessible-dark-mode-design-expert/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/dhosruiasn/accessible-dark-mode-design-expert/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/dhosruiasn/accessible-dark-mode-design-expert/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/dhosruiasn/accessible-dark-mode-design-expert/releases/tag/v1.0.0
