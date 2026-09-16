# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev`: run the server with `tsx watch` (TypeScript runs directly, with no build step)
- `npm test`: run all tests once (Vitest). `npm run test:watch` for watch mode
- `npm run test:unit`: mocked-Prisma tests only (fast, no Docker)
- `npm run test:int`: `*.int.test.ts` against a real Postgres started by Testcontainers (**Docker must be running**)
- Single test file: `npx vitest run src/modules/auth/__tests__/auth.routes.test.ts`
- Single test by name: `npx vitest run -t "returns 401 for expired token"`
- Type-check: `npx tsc --noEmit`. There is no linter configured.
- `npm run migrate`: `prisma migrate dev` (needs a reachable Postgres at `DATABASE_URL`). `npm install` runs `prisma generate` automatically, but Prisma 7's `migrate dev` does **not**. After a schema change, run `npx prisma generate`.

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
- **Auth:** short-lived JWT access tokens plus rotating refresh tokens.
  - `src/lib/jwt.ts` signs access tokens with HS256 and `sub` set to the user id, and verification only accepts HS256. They're returned in the JSON body.
  - Refresh tokens are random strings sent in an httpOnly, SameSite=Strict cookie with `Path=/auth` (`refresh-cookie.ts`). Only their SHA-256 hash is stored, in `refresh_tokens`.
  - `refresh-token.service.ts` rotates the token on every `POST /auth/refresh`. Tokens from one login share a `family_id`. Presenting an already-revoked token revokes the whole family (reuse detection). Concurrent refreshes are settled by a conditional `updateMany ... where revokedAt: null` inside a transaction.
  - `POST /auth/logout` needs no access token, revokes the cookie's token family and always returns 204. `POST /auth/logout-all` needs an access token and revokes all of the user's refresh tokens. Access tokens already issued stay valid until they expire.
  - The `authenticate` middleware sets `req.user = { id }`; its type is declared in `src/types/express.d.ts`. Protect a route with `router.get(path, authenticate, handler)`.
  - Login returns the same 401 for an unknown email and a wrong password, and compares against a dummy hash to keep timing equal.
- Routes are mounted in `src/routes/index.ts` (`/health`, `/users`, `/auth`).

## Conventions

- **Feature modules:** `src/modules/<feature>/` with one responsibility per file: `*.routes.ts`, `*.controller.ts` (HTTP only), `*.service.ts` (business logic), `*.schema.ts` (zod schemas + inferred types). Modules are plain exported objects (`export const userService = { ... }`). There's no repository layer: services call `prisma` directly. Shared infrastructure lives in `src/lib`, `src/middleware`, `src/errors`.
- **Database naming:** tables are plural snake_case and columns are snake_case. Prisma models keep camelCase fields and use `@map` / `@@map`. Migration names describe the change (e.g. `create_users_table`).
- **Tests:** they live in `__tests__/` next to the code and exercise routes through supertest. `vitest.config.ts` defines two projects, `unit` and `int`.
  - **Unit** (`*.test.ts`): Prisma is mocked with `vi.hoisted` + `vi.mock("…/lib/prisma.ts")`, then the app is loaded with `await import(".../app.ts")` after the mock is set up.
  - **Integration** (`*.int.test.ts`): `src/test/int-global-setup.ts` starts one Postgres container and runs `prisma migrate deploy` on it. `src/test/int-setup.ts` points `DATABASE_URL` at it (via `inject`) and runs `TRUNCATE users CASCADE` before each test. These files run one at a time. Shared helpers (`signupAndLogin`, `refresh`, `logout`, …) live in `src/test/auth-helpers.ts`. Use them for anything that depends on transactions, constraints or concurrency.
  - `vitest.config.ts` sets test values for `JWT_SECRET`, `DATABASE_URL` (a dummy for unit tests) and `LOG_LEVEL=silent`. Run `LOG_LEVEL=debug npm test` to see request logs.
