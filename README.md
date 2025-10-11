# 🐉 Dragon Bridge — Rural Mandarin Teacher

Open‑source, offline‑first Mandarin learning for low‑end Android and the web.

Live: https://harmony-cloud-01.github.io/dragon-bridge/

---

## Highlights

- PWA with offline cache and a service worker
- Lite Mode for low‑RAM/CPU devices (no animations/effects, system fonts)
- Dialect selector (Mandarin regional variants + minority extensions)
- SRS (Spaced Repetition) with pluggable storage (SQLite on native via Capacitor, localStorage on web)
- Lessons/audio pipeline: pre‑recorded audio in `public/audio/<dialect>/...` + `public/lessons.json`
- Tone visualization demo (canvas) with basic WebAudio pitch analysis

---

## How To Use

- See docs/how_to_use.md for quick steps on Lessons, SRS, Tone Drills, AI Teacher, and Android packaging.

---

## Install & Run (local)

```bash
git clone https://github.com/Harmony-cloud-01/dragon-bridge.git
cd dragon-bridge
pnpm install
pnpm run dev
```

> **Note:** If `pnpm install` reports `No authorization header` for `npm.jsr.io`, create a JSR token and export it as `JSR_NPM_AUTH_TOKEN` before retrying.

Build static export (Next 15 output: 'export'):

```bash
pnpm run build
```

---

## Development Standards

The project is written in modern TypeScript with [`strict`](tsconfig.json) mode enabled to guarantee type safety across the code base. We organise code into domain‑focused folders (`app`, `components`, `stores`, `utils`, `lib`, `types`) so that UI, business logic, and shared models remain decoupled. Place new shared types inside [`types/`](./types) and keep UI components free from stateful business rules wherever possible.

Key conventions:

- Prefer `type` aliases or interfaces instead of `any`. The ESLint configuration enforces `@typescript-eslint/consistent-type-definitions`.
- Centralise constants in enumerations when values have a constrained domain.
- Keep side effects inside hooks, services, or utility modules rather than components so they can be tested easily.

---

## Tooling, Linting & Formatting

We rely on ESLint + Prettier to maintain consistent style across the repository.

- `pnpm lint` — runs ESLint with the AirBnB + TypeScript + Next.js presets.
- `pnpm format` — formats code, Markdown, JSON, and stylesheets with Prettier.
- `lint-staged` and Husky run these checks automatically on staged files before every commit. When cloning locally, run `pnpm install` once to wire up Husky (`prepare` script).

Configuration lives in:

- [`.eslintrc.cjs`](./.eslintrc.cjs)
- [`.prettierrc.json`](./.prettierrc.json)
- [`lint-staged.config.mjs`](./lint-staged.config.mjs)
- [`.husky/`](./.husky)

---

## Testing Strategy

Automated tests use [Vitest](https://vitest.dev/) with a JSDOM environment.

- `pnpm test` — run the unit test suite once.
- `pnpm test:watch` — run the suite in watch mode during development.
- `pnpm test:coverage` — generate coverage reports (`text`, `html`, and `lcov`).

When adding new modules, please supply focused unit tests for core logic (utilities, stores, API services) and integration tests for complex workflows. Place tests alongside the source in `*.test.ts(x)` files for easier discovery.

End‑to‑end coverage can be added with Playwright or Cypress; see [`docs/how_to_use.md`](./docs/how_to_use.md) for feature walkthroughs that can be converted into scripted scenarios.

---

## Continuous Integration

GitHub Actions validates every pull request through `.github/workflows/ci.yml`:

1. Install dependencies via `pnpm`.
2. Lint the repository.
3. Run the Vitest suite and collect coverage artefacts.

Android and static site deployment workflows continue to live in `.github/workflows/android-release.yml` and `.github/workflows/gh-pages.yml` respectively.

---

## Dependency Management & Security

- Dependabot is enabled via `.github/dependabot.yml` to surface security and version updates for `npm` dependencies.
- Run `pnpm audit` periodically and resolve critical vulnerabilities promptly.
- Secrets should never be committed to the repository. Use environment variables or platform secret managers instead.

---

## Performance & Accessibility

- Lite Mode (auto / manual toggle) reduces effects and uses system fonts
- Respect `prefers-reduced-motion`
- ARIA labels on audio controls; canvas visuals have text equivalents
- Tailwind utility composition helpers (`lib/utils.ts`) prevent duplicate class lists
- Analyse bundle output with tools like `pnpm exec next build --analyze` before shipping large features

---

## Deploy (GitHub Pages)

- Pages is wired via `.github/workflows/gh-pages.yml`
- Push to `main` → builds static export and publishes `out/`
- Base path: `/dragon-bridge` is set in `next.config.mjs`

---

## Android (Capacitor)

Docs: `docs/android-capacitor.md` and `docs/release-build-checklist.md`

Quick start:

```bash
pnpm add -D @capacitor/android @capacitor-community/sqlite
pnpm run cap:add:android
pnpm run build
pnpm run cap:copy
pnpm run android:inject-perms   # RECORD_AUDIO
cd android && ./gradlew assembleDebug
```

- Optional CI release: tag `v*` → `.github/workflows/android-release.yml` builds APK and attaches to the release (debug by default; supports signing via secrets for release APK).

---

## Contributing

1. Create a feature branch from `main`.
2. Install dependencies with `pnpm install` (ensure Husky hooks are enabled via the `prepare` script).
3. Implement changes, keeping logic modular and thoroughly typed.
4. Run `pnpm lint`, `pnpm test`, and `pnpm format`.
5. Open a pull request using the provided template in `.github/pull_request_template.md`.

Issues can be filed using the templates in `.github/ISSUE_TEMPLATE/` to help maintainers triage requests quickly.

---

## Lessons & Audio

- Put audio under `public/audio/<dialectCode>/*.mp3`
- Define entries in `public/lessons.json` (or generate it):
  - `pnpm run lessons:scan` to append missing rows into `scripts/lessons_source.csv`
  - `pnpm run lessons:build` to write `public/lessons.json`
- When offline (or when “Prefer pre‑recorded audio” is enabled), playback will use local audio if present.

---

## Storage

- Web: localStorage fallback
- Native (Android): Capacitor Community SQLite
- Engine is pluggable; SRS + activity logs + profiles mirror into SQLite on native

---

## License

MIT © 2025 HarmonyOnline.org / Harmony-cloud-01

See [LICENSE](./LICENSE) for full terms.
