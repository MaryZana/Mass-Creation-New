# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React + TypeScript frontend app for JSON Schema visualization/editing, built with the **Ritm Design System** (`@dpa/*` packages from Wildberries internal npm registry).

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint check
- `npm run lint:fix` — ESLint autofix
- `npm run format` — Prettier format all files
- `npm run format:check` — Prettier check
- `make load-ritm-llm` — Download latest Ritm design system LLM documentation to `llm.txt`
- `npm run ritm:update` — Update all `@dpa/*` Ritm packages to latest versions

## Architecture

- **Feature-Sliced Design (FSD)** structure under `src/`:
  - `src/app/` — App entry point (`index.tsx`), providers, global setup
  - `src/pages/` — Page-level components (e.g., `pages/home/`)
- **Entry point:** `src/app/index.tsx` renders into `#root` via `index.html`
- **Providers:** `src/app/providers.tsx` wraps app in `RtFrame.Root` with Ritm theme configuration
- **State management:** Zustand
- **Path alias:** `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`)

## Ritm Design System

All UI is built with Ritm components (`Rt*` prefix) from `@dpa/*` packages. **Before using any Ritm component, read `llm.txt`** in the project root for API reference and usage patterns.

Key rules:
- Use `RtFrame` for layout/surfaces and `RtText` for typography — no raw CSS color variables
- Ritm packages are sourced from `https://nexus-hosted.wb.ru/repository/npm/` (see `.npmrc`)
- The root `RtFrame.Root` in `providers.tsx` sets scheme, theme, typography, and breakpoint config

## Code Style

- Prettier: semicolons, single quotes, trailing commas, 2-space indent, 80 char width
- ESLint: TypeScript recommended + react-hooks + react-refresh rules + prettier compat
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters` enabled
