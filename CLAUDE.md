# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager: `yarn` only** (no npm — `package-lock.json` was deleted).

```bash
yarn dev           # Start dev server (localhost:3000)
yarn build         # Production build
yarn lint          # ESLint
yarn format        # Prettier — format all files
yarn format:check  # Prettier — check without writing
yarn tsc --noEmit  # TypeScript type check (no dedicated script — run directly)
```

**Commit message format** (enforced by commitlint + Husky):

```
<type>(<scope>): <subject>

Types: feat | fix | docs | style | refactor | perf | test | chore | ci | revert
Scopes: admin | public | db | auth | api | ui | ad | seller | banner | deps
Rules: subject lowercase, header ≤ 100 chars
```

**Prisma (database):**

```bash
yarn prisma migrate dev --name <name>  # Create and apply a migration
yarn prisma migrate deploy             # Apply migrations in production
yarn prisma db seed                    # Seed admin user, locations, categories
yarn prisma studio                     # Open Prisma visual DB browser
yarn prisma generate                   # Regenerate client after schema changes
```

**Prisma v7 specifics (breaking changes from v6):**

- Import path: `@/app/generated/prisma/client` (not `@prisma/client` or `@/app/generated/prisma`)
- Schema datasource block has no `url` — connection URL is configured in `prisma.config.ts` (CLI) and passed via `@prisma/adapter-pg` at runtime
- `PrismaClient` always requires `{ adapter }` — see `lib/prisma.ts`

No test framework is configured yet.

## Architecture

### Route Groups

The app uses two Next.js route groups with separate layouts:

- **`app/(public)/`** — buyer-facing pages. No auth. Layout: Navbar + Footer.
- **`app/(admin)/`** — admin-only pages. Session guard in layout redirects unauthenticated requests to `/admin/login`. Layout: sidebar navigation.
- **`app/api/`** — API routes for public consumption (ad listing, tracking, locations) and the Vercel cron job.

### Data Fetching Split (Critical)

This project has two distinct data fetching patterns that must not be mixed:

**Server Components (default)** — fetch directly via Prisma. No React Query, no API routes needed.

```typescript
// In a Server Component page
const ads = await prisma.ad.findMany({ where: { status: 'ACTIVE' } });
```

**Client Components (`"use client"`)** — use React Query + Axios service layer.

```typescript
// useInfiniteQuery for ad listing, useQuery for locations/banners, useMutation for WA tracking
import { useInfiniteQuery } from '@tanstack/react-query';
import { ads } from '@/services/ads.service';
```

The `services/` directory holds all Axios-based fetcher functions consumed by React Query hooks. The `hooks/` directory holds custom React hooks for browser-side logic (geolocation detection, filter state, image upload orchestration) — not data fetching directly.

### Mutations: Server Actions over API Routes

Admin form submissions use **Server Actions** in `actions/` (not API routes). They provide CSRF protection and avoid round-trips.

```typescript
// actions/ad.actions.ts
'use server'
export async function approveAd(id: string) { ... }
```

After mutations that affect public ISR pages, call `revalidatePath('/')` and `revalidatePath('/iklan/[slug]')`.

API routes are used only for: public read endpoints, WA click tracking, and the cron job.

### Image Upload Flow

Admin uploads images via a two-step process:

1. Server Action `getSignedUploadUrl()` generates a time-limited signed Supabase URL
2. Client PUTs the file directly to Supabase Storage (browser → Supabase, not through Next.js)
3. The returned public URL is stored in the Ad record

`SUPABASE_SERVICE_KEY` is server-only. Never use it in `NEXT_PUBLIC_*` variables.

### Ad Lifecycle

```
PENDING → ACTIVE → EXPIRED (cron job: /api/cron/expire-ads, daily 17:00 UTC)
        ↓
      REJECTED
```

On approval, `sortPriority` is set (PREMIUM=1, BASIC=2, FREE_TRIAL=3). All public ad queries order by `sortPriority ASC, activatedAt DESC`.

## Key Conventions

**TypeScript:** Strict mode is on. All components must have explicit prop interfaces. No `any` — use `unknown` + type guards. Reuse Prisma-generated types (`Prisma.AdGetPayload<...>`) instead of duplicating type definitions.

**Tailwind CSS v4:** Uses `@import "tailwindcss"` syntax in `globals.css` (not `@tailwind base/components/utilities` from v3).

**Path alias:** `@/*` maps to the project root (e.g., `@/lib/prisma`, `@/components/ui/Button`).

**Images:** All user-content images must use `next/image` with `quality={70}` and a `sizes` prop. Use `priority` only on LCP images (first gallery image, first banner).

**WhatsApp URL template:**

```
https://wa.me/{seller.whatsapp}?text=Halo+{seller.name}%2C+saya+tertarik+dengan+{ad.title}+di+LokalLapak.+Apakah+masih+tersedia+dan+bisa+COD%3F
```

**Seller WhatsApp numbers** are stored as `628xxxxxxxxxx` (no `+`, no `-`). Normalize on input: strip leading `0` → prefix `62`, strip leading `+62` → prefix `62`.

## Documentation

All project documentation lives in `documentations/`:

| File                        | Contents                                                                     |
| --------------------------- | ---------------------------------------------------------------------------- |
| `PRD.md`                    | Product requirements, business model, functional spec                        |
| `ENGINEERING-DESIGN-DOC.md` | Full Prisma schema, API routes, folder structure, data fetching architecture |
| `CODE-STANDARDS.md`         | ESLint/Prettier config, naming conventions, export rules, commit format      |
| `PLANNER.md`                | Phase-by-phase build checklist with exact commands                           |
| `APP-FLOW.md`               | Every user journey, dialog, toast, and redirect                              |
| `UX.md`                     | UI/UX strategy, component specs, design system, accessibility baseline       |

Read `ENGINEERING-DESIGN-DOC.md` first when working on new features — it contains the canonical folder structure and Prisma schema. Read `CODE-STANDARDS.md` when unsure about naming, exports, or commit format.

## Claude Code Rules

1. First think through the problem, read the codebase for relevant files, and read the plan on documentations/PLANNER.md.
2. The plan has a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to `documentations/REVIEW.md` with a summary of the changes you made and any other relevant information. Create the file if it does not exist yet.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY

CRITICAL: When debugging, you MUST trace through the ENTIRE code flow step by step. No assumptions. No shortcuts.
