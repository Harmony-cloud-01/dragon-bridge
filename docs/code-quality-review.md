# Code Quality Review

## Quick Fix Applied
- Updated the `lint` and Jest scripts to use `pnpm exec` so the workspace always resolves the locally pinned toolchain instead of any globally installed fallback binaries. This avoids the ESLint 9 mismatch that currently appears when dependencies are absent in fresh environments.【F:package.json†L9-L25】

## Additional Recommendations

### Tighten the TypeScript Compiler Contract
- `allowJs` and `skipLibCheck` are both enabled in `tsconfig.json`. Disabling them will surface broken ambient types and unchecked JavaScript sources earlier in CI, which aligns with the strict-type guarantees documented in the README.【F:tsconfig.json†L4-L8】【F:README.md†L45-L63】

### Add an Explicit Type-Check Script to Automation
- `noEmit` is already set, so wiring a dedicated `pnpm exec tsc --noEmit` script (and adding it to CI) would give fast feedback on structural typing errors that ESLint may not catch. Consider extending `.github/workflows/ci.yml` to call the type-check step after the install phase.【F:tsconfig.json†L8-L13】【F:.github/workflows/ci.yml†L31-L41】

### Broaden Unit Test Coverage
- At the moment, the only Jest suite targets the `cn` helper. Expanding coverage to critical hooks, stores, and lesson processing utilities will protect more of the behaviour described in the README’s highlights section.【F:lib/utils.test.ts†L1-L13】【F:README.md†L9-L17】

### Enforce Formatting in CI
- The `ci` npm script currently runs lint and tests but omits a formatting check. Adding a `pnpm exec prettier --check` (or a reusable `format:check` script) to the workflow prevents style regressions that slip past local pre-commit hooks.【F:package.json†L21-L26】【F:.github/workflows/ci.yml†L31-L41】

### Capture Package Manager Expectations
- To reduce onboarding friction, add a `packageManager` field (for example, `"pnpm@9"`) and optionally `engines.pnpm`/`engines.node` so contributors know which versions are required before running the helper script mentioned in the README.【F:package.json†L1-L27】【F:README.md†L188-L192】
