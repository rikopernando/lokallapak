# REVIEW.md

## Phase 0: Foundation Setup

### What Was Done

Phase 0 is complete. All foundational scaffolding is in place before Phase 1 (admin core) begins.

---

### Files Created / Changed

| File                                  | Change                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                | Full schema: 9 models, 3 enums, geolocation fields, analytics counters, indexes  |
| `prisma/seed.ts`                      | Seeds admin, 8 categories, Lampung Barat (6 kec), Tanjung Pinang (4 kec)         |
| `prisma.config.ts`                    | Prisma v7 CLI config — datasource URL here, not in schema                        |
| `lib/prisma.ts`                       | Singleton PrismaClient with `@prisma/adapter-pg` adapter (Prisma v7 requirement) |
| `lib/supabase.ts`                     | Server-only Supabase admin client (service role key)                             |
| `lib/auth.ts`                         | NextAuth v5 Credentials provider — admin-only JWT auth                           |
| `lib/axios.ts`                        | Axios instance with empty baseURL (works both SSR and client)                    |
| `lib/utils.ts`                        | `cn()`, `formatRupiah()`, `generateSlug()`, `normalizeWhatsApp()`                |
| `lib/whatsapp.ts`                     | `buildWaUrl()` — constructs WA deep link with encoded message                    |
| `app/providers.tsx`                   | `'use client'` wrapper for `QueryClientProvider`                                 |
| `app/layout.tsx`                      | Root layout: Plus Jakarta Sans font, Indonesian `lang="id"`, Providers           |
| `app/globals.css`                     | Brand design tokens (orange primary, green secondary), 44px tap targets          |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth v5 route handler                                                        |
| `middleware.ts`                       | Protects all `/admin/*` routes; redirects unauthenticated to `/admin/login`      |
| `next.config.ts`                      | Supabase Storage remote image patterns, `qualities: [70]` default                |
| `.env.example`                        | All required env vars documented                                                 |
| `.prettierrc`                         | Single quotes, 100 char width, tailwindcss plugin                                |
| `commitlint.config.js`                | Conventional Commits, 100 char header limit                                      |
| `.lintstagedrc.js`                    | ESLint --fix + Prettier on staged files                                          |
| `.husky/pre-commit`                   | Runs lint-staged                                                                 |
| `.husky/commit-msg`                   | Runs commitlint                                                                  |
| `CLAUDE.md`                           | Project guidance for Claude Code (commands, architecture, conventions)           |

---

### Key Discovery: Prisma v7 Breaking Changes

Prisma 7.4.1 has significant breaking changes from v6:

1. **Schema datasource**: No `url` field allowed — it's been removed from `schema.prisma`. Only `provider` remains.
2. **Connection URL**: CLI reads from `prisma.config.ts`. Runtime uses `@prisma/adapter-pg` adapter.
3. **PrismaClient**: Must always be constructed with `{ adapter }` (no auto-reading of `DATABASE_URL`).
4. **Generated client path**: Output is `app/generated/prisma/` with the main export in `client.ts` — import path is `@/app/generated/prisma/client`.

---

### Next Steps (Phase 1: Admin Core)

- Set up DB (Supabase or local Postgres) and create `.env.local`
- Run `yarn prisma migrate dev --name init && yarn prisma db seed`
- Build admin layout: sidebar + `/admin/login` page
- Build ad management: list (pending queue), approve/reject flow, CRUD
- Build category and location read endpoints
