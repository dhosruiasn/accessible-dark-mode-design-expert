# Codex and Claude Code Runtime Compatibility

Use one canonical skill directory and treat Codex and Claude installations as generated copies. Do not edit installed copies directly.

## Shared source model

- The canonical source is the directory from which `scripts/sync-installations.mjs` was first run.
- Codex installs at `${CODEX_HOME}/skills/dark-mode-design-expert` when `CODEX_HOME` is set, otherwise `~/.codex/skills/dark-mode-design-expert`.
- Claude Code installs at `~/.claude/skills/dark-mode-design-expert`.
- Each installed copy receives `.skill-sync.json`. This marker records the canonical path and hashes of managed files.
- Running the synchronizer from either installed copy follows the marker back to the canonical source.
- Unknown files in an installation are preserved. A managed file changed only in an installation causes a conflict instead of being overwritten.
- Repository-only files such as `README.md`, contribution/security guides, `.gitignore`, and `.github/` stay in the canonical repository. `LICENSE` is included in installed copies.

## Runtime behavior

Both runtimes read `SKILL.md`, relative reference links, and bundled scripts. Keep shared instructions compatible with the Agent Skills format.

- Codex uses `agents/openai.yaml` for UI metadata.
- Claude Code ignores `agents/openai.yaml`; leaving it in the shared source is harmless.
- Codex can be invoked with `$dark-mode-design-expert`.
- Claude Code can be invoked with `/dark-mode-design-expert` or trigger from the description.
- In command examples, `<skill-dir>` means the directory containing `SKILL.md`. Claude Code may substitute `${CLAUDE_SKILL_DIR}`. Codex should resolve the installed skill path from its skill catalog.

## Initial adoption

Adopt an existing identical installation once before the first managed sync:

```bash
node <skill-dir>/scripts/sync-installations.mjs --adopt --target codex
node <skill-dir>/scripts/sync-installations.mjs --adopt --target claude
```

Adoption refuses unknown or different files. Do not bypass the conflict by deleting an installation until its local changes have been reviewed.

## Synchronize and verify

Push canonical changes to both installations:

```bash
node <skill-dir>/scripts/sync-installations.mjs --sync
```

Preview without writing:

```bash
node <skill-dir>/scripts/sync-installations.mjs --sync --dry-run
```

Check for missing installations or drift:

```bash
node <skill-dir>/scripts/sync-installations.mjs --check
```

Use `--target codex` or `--target claude` to limit an action. The check command exits `2` for drift; synchronization exits `3` for a protected conflict.

Run the synchronization regression suite after changing the synchronizer:

```bash
node <skill-dir>/scripts/test-sync-installations.mjs
```

## Update procedure

1. Edit only the canonical source.
2. Run the skill's functional tests and synchronization regression test.
3. Run `--sync --dry-run` and review the planned changes.
4. Run `--sync`.
5. Run `--check` and confirm both targets report `OK`.
6. Start a fresh Codex or Claude Code turn when validating discovery behavior.

Claude Code documents personal skills at `~/.claude/skills/<skill-name>/SKILL.md` and project skills at `.claude/skills/<skill-name>/SKILL.md`: <https://code.claude.com/docs/en/slash-commands>.
