# Code Standards — LokalLapak

Developer reference for tooling configuration, naming conventions, and code style rules.

---

## ESLint

Configuration file: `eslint.config.mjs`

- Flat config format using `defineConfig` and `globalIgnores`
- Extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`

---

## Prettier

Configuration file: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`prettier-plugin-tailwindcss` automatically sorts Tailwind class names — do not manually reorder classes.

---

## Git Hooks (Husky)

### Pre-commit (`.husky/pre-commit`)

Runs `lint-staged` on staged files:

- Auto-fixes ESLint issues
- Auto-formats with Prettier
- Blocks commits with unfixable lint errors

### Commit Message (`.husky/commit-msg`)

Validates commit messages with `commitlint`. Blocks commits with invalid messages.

---

## Commit Message Format

**Format:** `<type>(<scope>): <subject>`

```
feat(admin): add ad approval flow
fix(public): fix wa button not firing on ios
chore(deps): upgrade prisma to 5.x
docs(prd): update roadmap section
```

### Allowed Types

| Type       | Use for                              |
| ---------- | ------------------------------------ |
| `feat`     | New feature                          |
| `fix`      | Bug fix                              |
| `docs`     | Documentation only                   |
| `style`    | Formatting, no logic change          |
| `refactor` | Code restructure, no behavior change |
| `perf`     | Performance improvement              |
| `test`     | Test changes                         |
| `chore`    | Build tooling, dependencies          |
| `ci`       | CI configuration                     |
| `revert`   | Revert a previous commit             |

### Valid Scopes for This Project

| Scope    | Use for                       |
| -------- | ----------------------------- |
| `admin`  | Admin dashboard features      |
| `public` | Public buyer-facing features  |
| `db`     | Database schema or migrations |
| `auth`   | Authentication                |
| `api`    | API routes                    |
| `ui`     | Shared UI components          |
| `ad`     | Ad-specific logic             |
| `seller` | Seller-related logic          |
| `banner` | Banner management             |
| `deps`   | Dependency updates            |

### Rules

- Subject must be **lowercase** (no uppercase, PascalCase, or Title Case)
- Header max length: **100 characters**
- Body max line length: **100 characters**
- Type is required; scope is optional but encouraged

---

## Lint-staged

Configuration file: `.lintstagedrc.js`

Runs only on staged files:

```js
{
  '**/*.{ts,tsx,js,jsx}': ['eslint --fix'],
  '**/*.{ts,tsx,js,jsx,json,css,md}': ['prettier --write'],
}
```

---

## Branch Naming

```
feat/<short-description>    # e.g. feat/ad-approval-flow
fix/<short-description>     # e.g. fix/wa-button-ios
chore/<short-description>   # e.g. chore/setup-prisma
docs/<short-description>    # e.g. docs/update-prd
```

---

## Naming Conventions

### Files & Directories

All files and directories use **kebab-case**:

```
components/public/ad-card.tsx
components/admin/ad-approval-card.tsx
services/ads.service.ts
hooks/use-ad-filters.ts
actions/ad.actions.ts
lib/validations/ad.schema.ts
```

### In-code Names

| Entity                | Convention                     | Example                                     |
| --------------------- | ------------------------------ | ------------------------------------------- |
| React component name  | PascalCase                     | `AdCard`, `BannerCarousel`                  |
| Variables & functions | camelCase                      | `getAdBySlug`, `formatRupiah`               |
| Server Actions        | camelCase verb phrases         | `approveAd`, `createSeller`                 |
| Hooks                 | camelCase with `use` prefix    | `useAdFilters`, `useGeolocation`            |
| Types & Interfaces    | PascalCase                     | `AdCardProps`, `SellerFormValues`           |
| Constants             | UPPER_SNAKE_CASE               | `SORT_PRIORITY_MAP`, `WA_MESSAGE_TEMPLATE`  |
| Zod schemas           | camelCase with `Schema` suffix | `adSchema`, `sellerSchema`                  |
| Enum values           | UPPER_SNAKE_CASE               | `AdStatus.ACTIVE`, `PackageType.FREE_TRIAL` |

---

## Export Conventions

| Context                             | Convention         | Reason                                            |
| ----------------------------------- | ------------------ | ------------------------------------------------- |
| React components                    | **Default export** | Required for Next.js pages; flexible import names |
| Utilities, hooks, services, actions | **Named exports**  | Tree-shakeable; explicit imports                  |
| Types & interfaces                  | **Named exports**  | From `types/index.ts` or co-located               |
| Zod schemas                         | **Named exports**  | Reused across server and client                   |

```typescript
// ✅ Component — default export
export default function AdCard({ ad }: AdCardProps) { ... }

// ✅ Utility — named export
export function formatRupiah(amount: number): string { ... }
export function generateSlug(title: string, kecamatan: string): string { ... }

// ✅ Hook — named export
export function useAdFilters() { ... }

// ✅ Server Action — named export
export async function approveAd(id: string) { ... }

// ✅ Types — named export
export type { AdCardProps } from './ad-card'
export interface SellerFormValues { ... }
```

---

## TypeScript Rules

- **Explicit prop types:** Every component declares `interface ComponentNameProps { ... }` before the function.
- **No `any`:** Use `unknown` + type guards for runtime-uncertain types. Use `Parameters<typeof fn>` or `ReturnType<typeof fn>` to derive types.
- **Prisma types:** Use generated types (`Prisma.AdGetPayload<{ include: { seller: true } }>`) — do not duplicate schema into manual interfaces.
- **Server Actions return type:** Always explicitly declared, e.g. `Promise<{ success: boolean; error?: string }>`.
- **Zod infer:** `type SellerFormValues = z.infer<typeof sellerSchema>` — Zod schema is the single source of truth for form types.
- **API route handlers:** Type with `NextRequest` and `NextResponse<T>`.
