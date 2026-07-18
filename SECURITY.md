# Security Policy

## Supported version

Security fixes target the latest release and the current `main` branch.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting or security-advisory feature. Do not disclose an exploitable issue in a public issue before a fix is available.

Relevant security boundaries include:

- unexpected writes outside the two documented Skill installation directories
- silent overwriting of locally modified managed files
- command injection through color, path, or JSON inputs
- credential, token, precise-location, or private-data exposure
- examples that weaken Content Security Policy or bypass user preferences

The synchronizer preserves unknown files and stops on managed-file conflicts. The contrast calculator does not access the network.
