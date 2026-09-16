# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev`: run the server with `tsx watch` (TypeScript runs directly, with no build step)
- `npm test`: run all tests once (Vitest). `npm run test:watch` for watch mode
- Single test file: `npx vitest run src/modules/auth/__tests__/auth.routes.test.ts`
- Single test by name: `npx vitest run -t "returns 401 for expired token"`
- Type-check: `npx tsc --noEmit`. There is no linter configured.
- `npm run migrate`: `prisma migrate dev` (needs a reachable Postgres at `DATABASE_URL`). `npm install` runs `prisma generate` automatically.

Note: `tsconfig.json` has `noEmit: true`, so `npm run build` only type-checks and does **not** produce `dist/`. Because of that, `npm start` (`node dist/server.js`) won't work until an emit setup exists.

## Stack

Express 5 (ESM, `"type": "module"`), TypeScript, Prisma 7 with the `@prisma/adapter-pg` driver adapter, PostgreSQL, zod 4, pino/pino-http, bcrypt, jsonwebtoken, Vitest + supertest.

- Relative imports use the `.ts` extension (`import { x } from "./foo.ts"`). This relies on `rewriteRelativeImportExtensions`.
- The Prisma client is generated into `src/generated/prisma` (gitignored). Import from `src/generated/prisma/client.ts`, not `@prisma/client`.
- `erasableSyntaxOnly` is on: no enums, no runtime namespaces, no constructor parameter properties.

## Architecture

- `src/server.ts` starts the HTTP listener and handles graceful shutdown (disconnects Prisma). `src/app.ts` builds the Express app without listening, so tests import `app` directly.
- Middleware order in `app.ts`: `express.json` → `requestLogger` → `routes` → `errorHandler`.
- `src/config.ts` validates `process.env` with zod once at import time. It throws on startup if anything is missing (`DATABASE_URL`, `JWT_SECRET` ≥32 chars). Always read settings through `config`, not `process.env`.
- **Error flow:** services throw `AppError` subclasses (`src/errors/app-error.ts`). Express 5 forwards thrown and rejected errors from async handlers, so controllers need no try/catch. `errorHandler` maps `AppError` to `{ error: message }` with its status code; anything else is logged and returned as a 500. Prisma unique-constraint errors (`P2002`) are caught in the service and turned into `ConflictError`.
- **Validation:** `validateBody(schema)` (`src/middleware/validate.ts`) returns 400 with zod issues and replaces `req.body` with the parsed data, so controllers receive normalized input (e.g. trimmed, lowercased email).
- **Auth:** stateless JWT access tokens only (no refresh tokens or logout).
  - `src/lib/jwt.ts` signs tokens with HS256 and `sub` set to the user id, and verification only accepts HS256.
  - The `authenticate` middleware sets `req.user = { id }`; its type is declared in `src/types/express.d.ts`. Protect a route with `router.get(path, authenticate, handler)`.
  - Login returns the same 401 for an unknown email and a wrong password, and compares against a dummy hash to keep timing equal.
- Routes are mounted in `src/routes/index.ts` (`/health`, `/users`, `/auth`).

## Conventions

- **Feature modules:** `src/modules/<feature>/` with one responsibility per file: `*.routes.ts`, `*.controller.ts` (HTTP only), `*.service.ts` (business logic), `*.schema.ts` (zod schemas + inferred types). Modules are plain exported objects (`export const userService = { ... }`). There's no repository layer: services call `prisma` directly. Shared infrastructure lives in `src/lib`, `src/middleware`, `src/errors`.
- **Database naming:** tables are plural snake_case and columns are snake_case. Prisma models keep camelCase fields and use `@map` / `@@map`. Migration names describe the change (e.g. `create_users_table`).
- **Tests:** they live in `__tests__/` next to the code and exercise routes through supertest.
  - Prisma is mocked with `vi.hoisted` + `vi.mock("…/lib/prisma.ts")`, then the app is loaded with `await import(".../app.ts")` after the mock is set up. Tests never touch a real database.
  - `vitest.config.ts` sets a test `JWT_SECRET` and `LOG_LEVEL=silent`. Run `LOG_LEVEL=debug npm test` to see request logs.
