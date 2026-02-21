# Engineering Design Document — LokalLapak

---

## 1. Tech Stack

| Layer         | Technology                      | Rationale                                                               |
| ------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router)         | Fullstack in one repo; SSR for SEO; Server Actions for secure mutations |
| Language      | TypeScript (strict)             | Type safety throughout; Prisma generates types from schema              |
| Database      | PostgreSQL                      | Relational; handles location hierarchy and ad lifecycle well            |
| ORM           | Prisma                          | Type-safe queries; auto-generates TypeScript types from schema          |
| Auth          | NextAuth v5 (Credentials)       | Lightweight; no OAuth complexity for single-admin MVP                   |
| Storage       | Supabase Storage                | S3-compatible; image transformation URL support; generous free tier     |
| Data Fetching | TanStack React Query v5 + Axios | Caching, loading states, error handling for client-side interactivity   |
| Forms         | react-hook-form + Zod           | Performant forms; schema-driven validation reused server + client       |
| Styling       | Tailwind CSS v4                 | Utility-first; zero runtime CSS; matches mobile-first approach          |
| Font          | Plus Jakarta Sans               | Designed for SE Asian readability; excellent mobile legibility          |
| Icons         | lucide-react                    | Tree-shakable; consistent design                                        |
| Carousel      | embla-carousel-react            | Lightweight, touch-friendly; no animation bloat                         |
| Dates         | date-fns                        | Modular; only import what's used; handles expiresAt calculation         |
| Deployment    | Vercel                          | Zero-config Next.js; Cron Jobs built-in                                 |

---

## 2. Database Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum AdStatus {
  PENDING
  ACTIVE
  REJECTED
  EXPIRED
}

enum PackageType {
  FREE_TRIAL
  BASIC
  PREMIUM
}

enum BannerStatus {
  ACTIVE
  INACTIVE
}

// ─── Location Hierarchy ───────────────────────────────────────────────────────

model Regency {
  id           String        @id @default(cuid())
  name         String
  subdistricts Subdistrict[]
  createdAt    DateTime      @default(now())

  @@map("regencies")
}

model Subdistrict {
  id        String    @id @default(cuid())
  name      String
  lat       Float?                        // Centroid latitude for geolocation matching
  lng       Float?                        // Centroid longitude for geolocation matching
  regencyId String
  regency   Regency   @relation(fields: [regencyId], references: [id])
  villages  Village[]
  ads       Ad[]
  createdAt DateTime  @default(now())

  @@map("subdistricts")
}

model Village {
  id            String      @id @default(cuid())
  name          String
  subdistrictId String
  subdistrict   Subdistrict @relation(fields: [subdistrictId], references: [id])
  ads           Ad[]
  createdAt     DateTime    @default(now())

  @@map("villages")
}

// ─── Category ─────────────────────────────────────────────────────────────────

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  iconUrl   String?
  ads       Ad[]
  createdAt DateTime @default(now())

  @@map("categories")
}

// ─── Seller ───────────────────────────────────────────────────────────────────

model Seller {
  id          String   @id @default(cuid())
  name        String
  whatsapp    String                        // Stored as 628xxxxxxxxxx
  email       String?
  isVerified  Boolean  @default(false)
  ads         Ad[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("sellers")
}

// ─── Ad ───────────────────────────────────────────────────────────────────────

model Ad {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique         // SEO-friendly: {title}-{subdistrict}-{cuid6}
  description   String      @db.Text
  price         Int?                        // IDR; null = "Harga Nego"
  priceLabel    String?                     // e.g. "Mulai dari", "Per kg"
  status        AdStatus    @default(PENDING)
  packageType   PackageType @default(FREE_TRIAL)
  sortPriority  Int         @default(3)     // PREMIUM=1, BASIC=2, FREE_TRIAL=3

  // Relations
  sellerId      String
  seller        Seller      @relation(fields: [sellerId], references: [id])
  categoryId    String
  category      Category    @relation(fields: [categoryId], references: [id])
  subdistrictId String
  subdistrict   Subdistrict @relation(fields: [subdistrictId], references: [id])
  villageId     String?
  village       Village?    @relation(fields: [villageId], references: [id])
  images        AdImage[]

  // Lifecycle
  activatedAt   DateTime?
  expiresAt     DateTime?
  rejectedAt    DateTime?
  rejectedNote  String?

  // Admin tracking
  approvedById  String?
  approvedBy    AdminUser?  @relation(fields: [approvedById], references: [id])

  // Analytics
  viewCount     Int         @default(0)
  waClickCount  Int         @default(0)

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([status, sortPriority])
  @@index([subdistrictId, villageId, status])
  @@index([expiresAt, status])
  @@index([slug])
  @@map("ads")
}

model AdImage {
  id        String   @id @default(cuid())
  adId      String
  ad        Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)
  url       String                          // Supabase Storage public URL
  order     Int      @default(0)           // 0 = cover/thumbnail
  createdAt DateTime @default(now())

  @@map("ad_images")
}

// ─── Banner ───────────────────────────────────────────────────────────────────

model Banner {
  id        String       @id @default(cuid())
  imageUrl  String
  linkUrl   String?
  altText   String
  order     Int          @default(0)
  status    BannerStatus @default(ACTIVE)
  startsAt  DateTime?
  endsAt    DateTime?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@map("banners")
}

// ─── Admin ────────────────────────────────────────────────────────────────────

model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  approvedAds  Ad[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("admin_users")
}
```

**Schema Design Decisions:**

- `Ad.sortPriority` is a pre-computed integer (1/2/3) enabling `ORDER BY sort_priority ASC` without complex CASE expressions.
- `Subdistrict.lat/lng` stores centroid coordinates for nearest-match geolocation.
- `AdImage.order = 0` is the cover image; avoids a separate nullable `coverImageUrl` column.
- `Ad.price = null` renders as "Harga Nego" in UI.
- `Banner` has `startsAt`/`endsAt` for scheduled campaigns without requiring admin to be online.

---

## 3. Folder & File Structure

```
lokal-lapak/
├── app/
│   ├── (public)/                       # Route group: public layout
│   │   ├── layout.tsx                  # Navbar + Footer shell
│   │   ├── page.tsx                    # Homepage (ISR, revalidate: 300s)
│   │   ├── iklan/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx            # Ad detail (SSR + SEO)
│   │   │       └── not-found.tsx       # Custom 404 for unknown slug
│   │   └── kategori/
│   │       └── [slug]/
│   │           └── page.tsx            # Category listing (ISR)
│   │
│   ├── (admin)/                        # Route group: admin layout
│   │   ├── layout.tsx                  # Session guard + sidebar layout
│   │   └── admin/
│   │       ├── login/page.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── iklan/
│   │       │   ├── page.tsx            # Ad list (status tabs)
│   │       │   ├── baru/page.tsx       # Create ad
│   │       │   └── [id]/page.tsx       # Ad detail + actions
│   │       ├── seller/
│   │       │   ├── page.tsx
│   │       │   ├── baru/page.tsx
│   │       │   └── [id]/page.tsx
│   │       └── banner/
│   │           ├── page.tsx
│   │           └── baru/page.tsx
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── ads/
│   │   │   ├── route.ts                # GET (list), POST (admin create)
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PATCH, DELETE
│   │   │       └── track/route.ts      # POST: increment waClickCount
│   │   ├── sellers/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── banners/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── locations/
│   │   │   ├── subdistrict/route.ts    # GET all subdistricts
│   │   │   ├── village/route.ts        # GET ?subdistrictId=
│   │   │   └── nearest/route.ts        # POST { lat, lng } → nearest subdistrict
│   │   ├── upload/route.ts             # POST → signed Supabase URL
│   │   └── cron/
│   │       └── expire-ads/route.ts     # GET (Vercel Cron, CRON_SECRET protected)
│   │
│   ├── globals.css
│   ├── layout.tsx                      # Root: font + QueryClientProvider
│   ├── not-found.tsx                   # Global 404
│   └── manifest.ts                     # PWA manifest
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── ImageUploader.tsx
│   │
│   ├── public/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── BannerCarousel.tsx
│   │   ├── CategoryBar.tsx
│   │   ├── AdCard.tsx
│   │   ├── AdGrid.tsx
│   │   ├── AdFilters.tsx
│   │   ├── AdDetail.tsx
│   │   ├── WhatsAppButton.tsx
│   │   ├── ImageGallery.tsx
│   │   └── EmptyState.tsx
│   │
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── AdminHeader.tsx
│       ├── AdStatusBadge.tsx
│       ├── AdApprovalCard.tsx
│       ├── AdForm.tsx
│       ├── SellerForm.tsx
│       ├── BannerForm.tsx
│       └── StatsCard.tsx
│
├── actions/
│   ├── ad.actions.ts
│   ├── seller.actions.ts
│   ├── banner.actions.ts
│   └── upload.actions.ts
│
├── services/
│   ├── ads.service.ts
│   ├── locations.service.ts
│   ├── banners.service.ts
│   └── tracking.service.ts
│
├── hooks/
│   ├── useDebounce.ts
│   ├── useAdFilters.ts
│   ├── useGeolocation.ts
│   └── useImageUpload.ts
│
├── lib/
│   ├── prisma.ts
│   ├── supabase.ts
│   ├── auth.ts
│   ├── axios.ts
│   ├── utils.ts
│   ├── whatsapp.ts
│   └── validations/
│       ├── ad.schema.ts
│       ├── seller.schema.ts
│       └── banner.schema.ts
│
├── types/
│   └── index.ts                        # Shared types, Prisma type re-exports
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── public/
│   └── icons/                          # PWA icons (192px, 512px)
│
├── vercel.json
├── next.config.ts
├── .env.example
└── tsconfig.json
```

---

## 4. API Routes

### Public (No Auth)

| Method | Path                         | Purpose                                                                                     |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------- |
| GET    | `/api/ads`                   | List ACTIVE ads. Params: `subdistrictId`, `villageId`, `categoryId`, `q`, `cursor`, `limit` |
| GET    | `/api/ads/[id]`              | Single ad by ID                                                                             |
| POST   | `/api/ads/[id]/track`        | Increment `waClickCount`. Body: `{ type: "wa_click" }`                                      |
| GET    | `/api/banners`               | Active banners within date range                                                            |
| GET    | `/api/locations/subdistrict` | All subdistricts                                                                            |
| GET    | `/api/locations/village`     | Villages for `?subdistrictId=`                                                              |
| POST   | `/api/locations/nearest`     | Body: `{ lat, lng }` → nearest subdistrict                                                  |

### Admin (Session Required)

| Method | Path                | Purpose                             |
| ------ | ------------------- | ----------------------------------- |
| POST   | `/api/ads`          | Create ad                           |
| PATCH  | `/api/ads/[id]`     | Update ad fields                    |
| DELETE | `/api/ads/[id]`     | Delete ad                           |
| POST   | `/api/sellers`      | Create seller                       |
| GET    | `/api/sellers`      | List all sellers                    |
| PATCH  | `/api/sellers/[id]` | Update seller                       |
| DELETE | `/api/sellers/[id]` | Delete seller                       |
| POST   | `/api/banners`      | Create banner                       |
| PATCH  | `/api/banners/[id]` | Update banner (status, order, etc.) |
| DELETE | `/api/banners/[id]` | Delete banner                       |
| POST   | `/api/upload`       | Get signed Supabase upload URL      |

### System

| Method | Path                      | Auth               | Purpose          |
| ------ | ------------------------- | ------------------ | ---------------- |
| GET    | `/api/cron/expire-ads`    | CRON_SECRET header | Expire ads daily |
| ALL    | `/api/auth/[...nextauth]` | NextAuth internal  | Auth handler     |

---

## 5. Server Actions

Preferred over API routes for all admin mutations (form submissions). No round-trip overhead, automatic CSRF protection.

| Function             | File                        | Purpose                                          |
| -------------------- | --------------------------- | ------------------------------------------------ |
| `createSeller`       | `actions/seller.actions.ts` | Create new seller with validated data            |
| `updateSeller`       | `actions/seller.actions.ts` | Update seller fields                             |
| `deleteSeller`       | `actions/seller.actions.ts` | Hard delete seller                               |
| `createAd`           | `actions/ad.actions.ts`     | Create ad (PENDING), generate slug               |
| `updateAd`           | `actions/ad.actions.ts`     | Update ad fields                                 |
| `approveAd`          | `actions/ad.actions.ts`     | Set ACTIVE, compute expiresAt, set sortPriority  |
| `rejectAd`           | `actions/ad.actions.ts`     | Set REJECTED, save rejectedNote                  |
| `deleteAd`           | `actions/ad.actions.ts`     | Hard delete ad + cascade images                  |
| `createBanner`       | `actions/banner.actions.ts` | Create banner                                    |
| `updateBanner`       | `actions/banner.actions.ts` | Update banner (status, order, dates)             |
| `deleteBanner`       | `actions/banner.actions.ts` | Delete banner                                    |
| `getSignedUploadUrl` | `actions/upload.actions.ts` | Return signed URL for browser-to-Supabase upload |

---

## 6. Data Fetching Architecture

### Server vs Client Boundary

```
┌─────────────────────────────────────────────┐
│           Next.js App Router                │
├─────────────────────────┬───────────────────┤
│    Server Components    │  Client Components│
│    (default)            │  ("use client")   │
├─────────────────────────┼───────────────────┤
│ • Fetch via Prisma      │ • React Query     │
│   directly (no API)     │   + Axios service │
│ • No React Query        │   layer           │
│ • SSR/ISR data          │ • Interactive UI  │
│ • Admin page initial    │ • Filters, search │
│   data                  │ • Infinite scroll │
│ • Ad detail (SSR)       │ • WA tracking     │
│ • generateMetadata      │ • Geolocation     │
└─────────────────────────┴───────────────────┘
```

### React Query Usage

| Hook               | Query Key                     | Service Function                                    | Used In          |
| ------------------ | ----------------------------- | --------------------------------------------------- | ---------------- |
| `useInfiniteQuery` | `['ads', filters]`            | `ads.service.getAds(filters)`                       | `AdGrid`         |
| `useQuery`         | `['subdistricts']`            | `locations.service.getSubdistricts()`               | `AdFilters`      |
| `useQuery`         | `['villages', subdistrictId]` | `locations.service.getVillagesBySubdistrict(id)`    | `AdFilters`      |
| `useQuery`         | `['nearest', lat, lng]`       | `locations.service.getNearestSubdistrict(lat, lng)` | `useGeolocation` |
| `useQuery`         | `['banners']`                 | `banners.service.getActiveBanners()`                | `BannerCarousel` |
| `useMutation`      | —                             | `tracking.service.trackWaClick(adId)`               | `WhatsAppButton` |

### State Management

| State Type                 | Solution          | Rationale                                                            |
| -------------------------- | ----------------- | -------------------------------------------------------------------- |
| Server/API data            | React Query       | Caching, loading, error, refetch                                     |
| Filter state               | URL search params | Shareable URLs, no extra state                                       |
| Form state                 | react-hook-form   | Performant, integrates with Zod                                      |
| UI state (modal, dropdown) | `useState`        | Local, simple, no global sharing                                     |
| Global state               | None (not needed) | Filter → URL params; no cross-component shared client state required |

**Why no Zustand:** Filter state lives in URL params (bookmarkable, shareable). Admin form state handled by react-hook-form. No cross-component client state requires a store at MVP scale.

---

## 7. Geolocation Flow

```
1. User opens homepage
2. useGeolocation hook calls navigator.geolocation.getCurrentPosition()
3a. ON SUCCESS:
    lat/lng → POST /api/locations/nearest { lat, lng }
    Server: SELECT subdistrict ORDER BY distance(lat, lng, sub.lat, sub.lng) LIMIT 1
    Returns: { subdistrictId, subdistrictName }
    → Updates URL: ?subdistrictId={id}
    → AdFilters pre-selects the subdistrict
    → AdGrid loads filtered ads
3b. ON DENY/ERROR:
    → Show empty filter with "Pilih lokasi Anda" placeholder
    → User selects manually from dropdown
```

**Distance calculation** (Haversine formula on server):

```typescript
// Using raw SQL or computed in JS after fetching all subdistricts (small dataset)
// For MVP: fetch all subdistricts with lat/lng, compute in JS, return nearest
```

---

## 8. Ad Lifecycle Business Logic

### Activation (`approveAd`)

```typescript
const durationDays = {
  FREE_TRIAL: 7,
  BASIC: 30,
  PREMIUM: 30,
};

const sortPriorityMap = {
  PREMIUM: 1,
  BASIC: 2,
  FREE_TRIAL: 3,
};

await prisma.ad.update({
  where: { id },
  data: {
    status: 'ACTIVE',
    activatedAt: new Date(),
    expiresAt: addDays(new Date(), durationDays[packageType]),
    sortPriority: sortPriorityMap[packageType],
    approvedById: session.user.id,
  },
});

revalidatePath('/');
revalidatePath(`/iklan/${ad.slug}`);
```

### Ad Sort Order

```sql
ORDER BY sort_priority ASC, activated_at DESC
```

Prisma:

```typescript
orderBy: [{ sortPriority: 'asc' }, { activatedAt: 'desc' }];
```

### Cron Expiry (`expire-ads`)

```typescript
// Runs daily at 00:00 WIB (17:00 UTC)
await prisma.ad.updateMany({
  where: {
    status: 'ACTIVE',
    expiresAt: { lt: new Date() },
  },
  data: { status: 'EXPIRED' },
});
```

---

## 9. TypeScript Standards

- **Explicit prop types:** Every component has `interface ComponentNameProps { ... }` before the function definition.
- **No `any`:** Use `unknown` with type guards for runtime-uncertain types. Use `Parameters<typeof fn>` or `ReturnType<typeof fn>` to derive types.
- **Prisma types:** Use `Prisma.AdGetPayload<{ include: { seller: true, images: true } }>` instead of defining manual `Ad` interfaces.
- **API handlers:** Typed with `NextRequest` and `NextResponse<ResponseType>`.
- **Server Actions:** Return type explicitly declared (e.g., `Promise<{ success: boolean; error?: string }>`).
- **Zod + infer:** `type SellerFormValues = z.infer<typeof sellerSchema>` — single source of truth for form types.

---

## 10. Performance Standards

| Rule                        | Implementation                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------- |
| All images via `next/image` | No `<img>` tags for user content                                                    |
| Thumbnail quality           | `quality={70}` on all AdCard images                                                 |
| LCP image                   | `priority` prop on first image in detail gallery and first banner                   |
| Lazy load                   | `loading="lazy"` on all non-LCP images                                              |
| Responsive sizes            | `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`                  |
| Supabase thumbnails         | Append `?width=400&quality=70` to image URLs in AdCard                              |
| No decorative animations    | No `transition`, `animate-*` classes on public pages                                |
| Font loading                | `display: 'swap'` on Plus Jakarta Sans — prevents invisible text on slow connection |
| Target                      | Lighthouse Mobile Performance ≥ 90                                                  |

---

## 11. Security

| Concern              | Mitigation                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Admin route access   | Session guard in `app/(admin)/layout.tsx`; redirect to `/admin/login` if no session                            |
| Supabase service key | Used only in server-side code (`actions/upload.actions.ts`, `lib/supabase.ts`). Never in `NEXT_PUBLIC_*` vars. |
| Cron endpoint        | `Authorization: Bearer {CRON_SECRET}` header required; returns 401 otherwise                                   |
| CSRF on mutations    | Server Actions have built-in CSRF protection from Next.js                                                      |
| Password storage     | bcrypt with salt rounds ≥ 12                                                                                   |
| Image uploads        | Signed URLs generated server-side; client uploads directly to Supabase with time-limited signed URL            |
| SQL injection        | Prisma ORM parameterizes all queries automatically                                                             |

---

## 12. Font

**Plus Jakarta Sans** via `next/font/google`:

```typescript
import { Plus_Jakarta_Sans } from 'next/font/google';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
```

Applied as `className={font.variable}` on `<html>` in root layout.

**Rationale:** Designed for Southeast Asian text rendering. Highly legible at 14–16px on small mobile screens. Free, no external runtime requests (next/font downloads and self-hosts at build time).

---

## 13. Environment Variables

| Variable                        | Where Used                      | Exposed to Client |
| ------------------------------- | ------------------------------- | ----------------- |
| `DATABASE_URL`                  | `lib/prisma.ts`                 | No                |
| `NEXTAUTH_SECRET`               | `lib/auth.ts`                   | No                |
| `NEXTAUTH_URL`                  | NextAuth internal               | No                |
| `NEXT_PUBLIC_SUPABASE_URL`      | `lib/supabase.ts`, `services/`  | Yes (safe)        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side Supabase calls      | Yes (safe)        |
| `SUPABASE_SERVICE_KEY`          | `lib/supabase.ts` (server only) | **No**            |
| `SUPABASE_STORAGE_BUCKET`       | `actions/upload.actions.ts`     | No                |
| `CRON_SECRET`                   | `/api/cron/expire-ads`          | No                |

---

## 14. Vercel Cron

`vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-ads",
      "schedule": "0 17 * * *"
    }
  ]
}
```

`17:00 UTC = 00:00 WIB (Jakarta time)` — ads expire at midnight local time.

Handler verifies:

```typescript
const secret = request.headers.get('authorization')?.replace('Bearer ', '');
if (secret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
