# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Architecture

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 (via PostCSS plugin)
- **Path alias**: `@/*` maps to `./src/*`
- **Source structure**: All app code lives under `src/`
  - `src/app/` — App Router routes (layouts, pages, API routes)
