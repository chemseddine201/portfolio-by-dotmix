# Portfolio — Chemseddine Z.

Personal developer portfolio built with [dotMix](https://github.com/chemseddine201/dotMix) (`@dotmix/runtime`, `@dotmix/router`, and `@dotmix/cli`).

**Live Preview:** [lotec-dev.com](https://lotec-dev.com)

## Stack

- **Framework:** dotMix `0.1.0` (`.tix` components, signals, zero-VDOM direct DOM codegen)
- **Language:** TypeScript
- **Styling:** Scoped component CSS + custom properties

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your contact variables (kept out of source control; injected at build time into `src/data/build-info.ts`):
   ```bash
   cp .env.example .env
   ```

## Scripts

- `npm run dev` — Generate build metadata and start the local development server
- `npm run build` — Build and prerender static output to `dist/`
- `npm run preview` — Preview the production build locally
- `npm run check` — Run `mix check` type and component validation
- `npm run verify` — Run headless browser verification against `dist/`

