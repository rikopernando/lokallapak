# Implementation Planner — LokalLapak MVP

---

## Dependencies

### Install

```bash
yarn add prisma @prisma/client
yarn add next-auth@beta
yarn add @supabase/supabase-js
yarn add zod react-hook-form @hookform/resolvers
yarn add @tanstack/react-query axios
yarn add clsx tailwind-merge
yarn add lucide-react
yarn add embla-carousel-react
yarn add date-fns
yarn add bcryptjs
yarn add -D @types/bcryptjs
```

### Initialize Prisma

```bash
npx prisma init
```

---

## Environment Variables

Create `.env.local` (and `.env.example` as template):

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/lokal_lapak?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="<generate: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>"
SUPABASE_SERVICE_KEY="<service role key — server-only, never expose to client>"
SUPABASE_STORAGE_BUCKET="ad-images"

# Vercel Cron Security
CRON_SECRET="<random string>"
```

---

## Phase 0: Foundation

**Goal:** Everything that must exist before any feature can be built.

### Database

- [ ] Write full `prisma/schema.prisma` (see ENGINEERING-DESIGN-DOC.md for complete schema)
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Write `prisma/seed.ts`:
  - 1 admin user (email + bcrypt-hashed password)
  - Location data: Kabupaten → Kecamatan (with lat/lng centroids) → Desa
  - 8 categories with slugs
- [ ] Run `npx prisma db seed`

### Core Lib Files

- [ ] `lib/prisma.ts` — singleton Prisma client (prevents connection pool exhaustion in dev)
- [ ] `lib/supabase.ts` — Supabase Storage client (server-side, uses SERVICE_KEY)
- [ ] `lib/auth.ts` — NextAuth v5 config (Credentials provider, bcrypt compare)
- [ ] `lib/axios.ts` — Axios instance with base URL and default headers
- [ ] `lib/utils.ts` — `cn()`, `formatRupiah()`, `generateSlug()`, `normalizeWhatsApp()`
- [ ] `lib/whatsapp.ts` — `buildWaUrl(whatsapp, sellerName, adTitle)` helper

### Next.js Config

- [ ] `next.config.ts` — add Supabase domain to `images.remotePatterns`
- [ ] `app/layout.tsx` — import `Plus_Jakarta_Sans` from `next/font/google`, wrap with `QueryClientProvider`
- [ ] `app/globals.css` — brand color tokens, remove default Next.js template styles

### Supabase

- [ ] Create storage bucket `ad-images` with **public read** policy
- [ ] Create storage bucket `banners` with **public read** policy

### Verification (Phase 0)

```bash
npx prisma studio          # verify schema and seed data
yarn dev                   # app starts without errors
```

---

## Phase 1: Admin Core

**Goal:** Admin can log in, manage sellers, create and approve ads, and manage banners.

### Auth

- [ ] `app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- [ ] `app/(admin)/admin/login/page.tsx` — login form (email + password)
- [ ] `app/(admin)/layout.tsx` — session guard: redirect to `/admin/login` if no session

### Admin Shell

- [ ] `components/admin/AdminSidebar.tsx` — nav links: Dashboard / Iklan / Seller / Banner
- [ ] `components/ui/Badge.tsx` — reusable badge (used for pending count in sidebar)
- [ ] `app/(admin)/admin/dashboard/page.tsx` — stats: pending ads, active ads, expiring soon, total sellers

### Seller CRUD

- [ ] `lib/validations/seller.schema.ts` — Zod schema (name, whatsapp, email)
- [ ] `components/admin/SellerForm.tsx` — form with WhatsApp format hint and auto-normalization
- [ ] `actions/seller.actions.ts` — `createSeller()`, `updateSeller()`, `deleteSeller()`
- [ ] `app/(admin)/admin/seller/page.tsx` — seller list table
- [ ] `app/(admin)/admin/seller/baru/page.tsx` — create seller
- [ ] `app/(admin)/admin/seller/[id]/page.tsx` — edit seller + list their ads

### Image Upload

- [ ] `actions/upload.actions.ts` — `getSignedUploadUrl(bucket, path)` → returns signed Supabase URL
- [ ] `components/ui/ImageUploader.tsx` — client component:
  - Select up to 5 files (validate size ≤2MB, type JPEG/PNG/WebP)
  - Call Server Action to get signed URL
  - PUT directly from browser to Supabase Storage
  - Return array of public URLs to parent form

### Ad CRUD

- [ ] `lib/validations/ad.schema.ts` — Zod schema (title, description, price, categoryId, kecamatanId, desaId, packageType, imageUrls)
- [ ] `components/admin/AdForm.tsx` — full form: seller select, title, category, location cascade, description, price, package, image upload
- [ ] `actions/ad.actions.ts`:
  - `createAd()` — creates ad with status PENDING, generates slug
  - `updateAd()` — updates editable fields
  - `approveAd()` — sets status=ACTIVE, activatedAt=now(), expiresAt=now()+duration, sortPriority
  - `rejectAd(note)` — sets status=REJECTED, saves rejectedNote
  - `deleteAd()` — hard delete
- [ ] `components/admin/AdStatusBadge.tsx` — maps AdStatus to colored badge
- [ ] `components/admin/AdApprovalCard.tsx` — approve/reject UI with package type selector and date display
- [ ] `app/(admin)/admin/iklan/page.tsx` — ad list with status filter tabs (Pending / Active / Rejected / Expired)
- [ ] `app/(admin)/admin/iklan/baru/page.tsx` — create ad
- [ ] `app/(admin)/admin/iklan/[id]/page.tsx` — ad detail + approval actions + edit

### Banner CRUD

- [ ] `lib/validations/banner.schema.ts` — Zod schema
- [ ] `components/admin/BannerForm.tsx` — image upload (single), link URL, alt text, dates, order
- [ ] `actions/banner.actions.ts` — `createBanner()`, `updateBanner()`, `deleteBanner()`
- [ ] `app/(admin)/admin/banner/page.tsx` — banner list with status toggle
- [ ] `app/(admin)/admin/banner/baru/page.tsx` — create banner

### Verification (Phase 1)

- [ ] Admin can log in and log out
- [ ] Admin can create a seller with valid WhatsApp number
- [ ] Admin can create an ad (with images uploaded to Supabase)
- [ ] Admin can approve an ad → status changes to ACTIVE, expiresAt is set correctly
- [ ] Admin can reject an ad with a note → status changes to REJECTED
- [ ] Admin can create and toggle banners

---

## Phase 2: Public Homepage

**Goal:** Buyers can browse and filter ads on the homepage.

### Layout

- [ ] `app/(public)/layout.tsx` — public layout shell
- [ ] `components/public/Navbar.tsx` — logo left, mobile-friendly
- [ ] `components/public/Footer.tsx`

### Banners

- [ ] `app/api/banners/route.ts` — GET active banners (status=ACTIVE, within date range)
- [ ] `components/public/BannerCarousel.tsx` — embla-carousel, auto-play, dots, no animation overkill

### Geolocation

- [ ] `app/api/locations/nearest/route.ts` — POST `{ lat, lng }` → returns nearest Kecamatan (by centroid distance)
- [ ] `hooks/useGeolocation.ts` — requests browser geolocation → calls nearest API → returns `{ kecamatanId, kecamatanName }`

### Locations API

- [ ] `app/api/locations/kecamatan/route.ts` — GET all kecamatans
- [ ] `app/api/locations/desa/route.ts` — GET `?kecamatanId=` → desas for that kecamatan

### Services Layer

- [ ] `services/ads.service.ts` — `getAds(filters)` using Axios
- [ ] `services/locations.service.ts` — `getKecamatans()`, `getDesaByKecamatan(id)`, `getNearestKecamatan(lat, lng)`
- [ ] `services/banners.service.ts` — `getActiveBanners()`

### Ad Listing

- [ ] `app/api/ads/route.ts` — GET ads:
  - Filter: status=ACTIVE, kecamatanId, desaId, categoryId, search query
  - Sort: sortPriority ASC, activatedAt DESC
  - Pagination: cursor-based (take + cursor)
- [ ] `components/public/AdCard.tsx` — cover image (`next/image`, `quality={70}`, `sizes`), title, price, location badge, package badge, WA quick-contact
- [ ] `components/public/AdGrid.tsx` — responsive grid (1/2/3 cols), "Muat Lebih Banyak" button
- [ ] `hooks/useAdFilters.ts` — reads/writes URL search params, manages filter state
- [ ] `components/public/AdFilters.tsx` — Kecamatan dropdown → Desa cascade, text search (debounced 400ms), category select. Uses React Query for location data.
- [ ] `components/public/CategoryBar.tsx` — horizontal scroll, category pills, links to filtered view

### Homepage

- [ ] `app/(public)/page.tsx` — ISR (revalidate: 300s):
  - Server: fetch active banners + initial ads
  - Client: AdFilters (interactive), AdGrid with Load More

### Verification (Phase 2)

- [ ] Homepage loads with banner carousel
- [ ] Geolocation prompt appears; if accepted, kecamatan filter auto-fills
- [ ] Changing kecamatan resets desa and reloads ads
- [ ] Text search filters ads in real-time (debounced)
- [ ] Premium ads appear before Basic and Free Trial ads
- [ ] "Muat Lebih Banyak" appends more ads

---

## Phase 3: Public Ad Detail

**Goal:** Buyers can view full ad detail and contact seller via WhatsApp.

### Services

- [ ] `services/tracking.service.ts` — `trackWaClick(adId)` via Axios POST

### Components

- [ ] `components/public/ImageGallery.tsx` — thumbnail strip + main viewer, swipeable on mobile
- [ ] `components/public/WhatsAppButton.tsx` — builds wa.me URL, tracks click before redirect, prominent green CTA
- [ ] `components/public/AdDetail.tsx` — server component: gallery, title, price, category, location, description, seller name, WA button

### API

- [ ] `app/api/ads/[id]/route.ts` — GET single ad by id
- [ ] `app/api/ads/[id]/track/route.ts` — POST `{ type: "wa_click" }` → increments `waClickCount`

### Pages

- [ ] `app/(public)/iklan/[slug]/page.tsx` — SSR:
  - `generateMetadata()`: title, description, OG image (first ad image), OG type
  - JSON-LD structured data (`Product` schema)
  - Fetch ad by slug from DB
  - If not found → `notFound()`
  - If EXPIRED/REJECTED → show detail with "Iklan tidak aktif" banner, hide WA button
- [ ] `app/(public)/iklan/[slug]/not-found.tsx` — custom 404 with back-to-homepage link
- [ ] `app/(public)/kategori/[slug]/page.tsx` — ISR: same as homepage but filtered by category

### Verification (Phase 3)

- [ ] Ad detail page renders with correct meta tags (check via view-source)
- [ ] Image gallery is swipeable on mobile
- [ ] WA button opens correct wa.me URL with pre-filled message
- [ ] WA click is tracked (check `waClickCount` increments in DB)
- [ ] Expired ad shows inactive banner without WA button
- [ ] Unknown slug shows custom 404 page

---

## Phase 4: Automation & Hardening

**Goal:** Ads expire automatically, ISR cache is invalidated on mutations, and error/empty states are handled.

### Cron Job

- [ ] `app/api/cron/expire-ads/route.ts`:
  - Verify `Authorization: Bearer {CRON_SECRET}` header
  - `UPDATE ads SET status='EXPIRED' WHERE status='ACTIVE' AND expires_at < NOW()`
  - Return count of expired ads
- [ ] `vercel.json` — cron schedule: `"0 17 * * *"` (00:00 WIB = 17:00 UTC)

### Cache Revalidation

- [ ] Add `revalidatePath('/')` and `revalidatePath('/iklan/[slug]')` in `approveAd()`, `rejectAd()`, `deleteAd()` Server Actions

### Empty & Error States

- [ ] `components/public/EmptyState.tsx` — "Belum ada iklan di area ini" with illustration
- [ ] `app/not-found.tsx` — global 404 page
- [ ] Error boundary for React Query failures (friendly error + retry button)

### PWA

- [ ] `app/manifest.ts` — name, short_name, theme_color (green), display: standalone, icons
- [ ] Add favicon set (16px, 32px, 192px, 512px)

### Verification (Phase 4)

- [ ] Manually trigger `GET /api/cron/expire-ads` with correct `Authorization` header → check ads expire
- [ ] Trigger without header → expect 401
- [ ] After approving an ad in admin → homepage refreshes within 5 minutes (ISR)
- [ ] Filter with no results → empty state displays

---

## Phase 5: Polish & Deploy

**Goal:** Performance, TypeScript audit, and production deployment.

### Performance

- [ ] Audit all `next/image` usages: `quality`, `sizes`, `priority` on LCP image, `loading="lazy"` on others
- [ ] Add Suspense + skeleton loaders for AdGrid and BannerCarousel
- [ ] Supabase image transformation for thumbnails: append `?width=400&quality=70` to image URLs in AdCard

### TypeScript

- [ ] Run `yarn tsc --noEmit` and fix all errors
- [ ] Audit for any remaining `any` types → replace with proper types

### Admin UX

- [ ] Confirm delete modals for Ad, Seller, Banner (to prevent accidental deletion)
- [ ] Rate limiting on `/api/ads/[id]/track` (simple in-memory or Vercel KV)

### Deployment

- [ ] Set all environment variables in Vercel project settings
- [ ] Run `npx prisma migrate deploy` on production DB
- [ ] Run `npx prisma db seed` for initial admin user + location data + categories

### Smoke Test (Full)

- [ ] Admin login → create seller → create ad with images → approve → verify public listing
- [ ] Public: geolocation auto-select → filter → view ad detail → WA click tracked
- [ ] Cron endpoint works with CRON_SECRET
- [ ] Lighthouse mobile audit: Performance ≥ 90
- [ ] `yarn build` completes without TypeScript errors
