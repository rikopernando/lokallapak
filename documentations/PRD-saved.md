    ╭────────────────────────────────────────────────────────────────────────────────────────────────────╮
     │ LokalLapak MVP — Implementation Plan                                                               │
     │                                                                                                    │
     │ Context                                                                                            │
     │                                                                                                    │
     │ Build the LokalLapak hyper-local ad directory app from scratch on top of the existing bare Next.js │
     │  16 + React 19 + TypeScript + Tailwind CSS v4 scaffold. The PRD defines a platform where local     │
     │ Indonesian UMKM sellers can list products/services at the Kecamatan/Desa level, with buyers        │
     │ contacting them via WhatsApp. Admin manually verifies all listings. No buyer login required.       │
     │                                                                                                    │
     │ ---                                                                                                │
     │ PRD Improvements & Gaps Addressed                                                                  │
     │                                                                                                    │
     │ Before implementation, the following gaps in the PRD must be resolved:                             │
     │                                                                                                    │
     │ #: 1                                                                                               │
     │ Gap: Admin auth mechanism not defined                                                              │
     │ Decision: NextAuth v5 with Credentials provider. Email + bcrypt password in AdminUser DB table.    │
     │ Single                                                                                             │
     │   admin seeded via prisma/seed.ts.                                                                 │
     │ ────────────────────────────────────────                                                           │
     │ #: 2                                                                                               │
     │ Gap: Category system not defined                                                                   │
     │ Decision: Pre-seed 8 categories: Makanan & Minuman, Fashion, Elektronik, Pertanian, Jasa,          │
     │ Kesehatan,                                                                                         │
     │   Pendidikan, Furnitur                                                                             │
     │ ────────────────────────────────────────                                                           │
     │ #: 3                                                                                               │
     │ Gap: Seller submission flow unclear                                                                │
     │ Decision: Phase 1 = Admin enters everything (Option A). No public submission form. Simplifies MVP  │
     │   significantly.                                                                                   │
     │ ────────────────────────────────────────                                                           │
     │ #: 4                                                                                               │
     │ Gap: Package duration discrepancy                                                                  │
     │ Decision: Align on: Free Trial = 7 days, Basic = 30 days, Premium = 30 days                        │
     │ ────────────────────────────────────────                                                           │
     │ #: 5                                                                                               │
     │ Gap: Image limits undefined                                                                        │
     │ Decision: Max 5 images per ad, max 2MB each, formats: JPEG/PNG/WebP                                │
     │ ────────────────────────────────────────                                                           │
     │ #: 6                                                                                               │
     │ Gap: Banner vs Premium ad relationship                                                             │
     │ Decision: Separate: Premium = sort priority in listings. Banners = independently managed carousel  │
     │ images                                                                                             │
     │   in admin.                                                                                        │
     │ ────────────────────────────────────────                                                           │
     │ #: 7                                                                                               │
     │ Gap: SEO meta tags not defined                                                                     │
     │ Decision: Each /iklan/[slug] generates: title, description, OG image, JSON-LD structured data      │
     │ ────────────────────────────────────────                                                           │
     │ #: 8                                                                                               │
     │ Gap: Expired ad experience undefined                                                               │
     │ Decision: Show detail page with "Iklan tidak aktif" banner, hide WhatsApp button                   │
     │ ────────────────────────────────────────                                                           │
     │ #: 9                                                                                               │
     │ Gap: WhatsApp number format                                                                        │
     │ Decision: Enforce 628xxxxxxxxxx format in seller form; auto-strip 0/+62 prefix                     │
     │ ────────────────────────────────────────                                                           │
     │ #: 10                                                                                              │
     │ Gap: Pagination not defined                                                                        │
     │ Decision: Cursor-based "Load More" pagination (no page numbers)                                    │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Additional Requirements (from prompt.md)                                                           │
     │                                                                                                    │
     │ 1. Geolocation detection: On first visit, request browser geolocation → reverse-geocode to nearest │
     │  Kecamatan/Desa → auto-select in filter and show nearby listings first. Fallback: manual dropdown  │
     │ selection.                                                                                         │
     │ 2. Performance-first PWA: Images must use next/image with aggressive compression (quality=70,      │
     │ sizes prop, WebP format). Minimize animations — no decorative transitions. Target rural users with │
     │  limited bandwidth and mobile data quotas.                                                         │
     │ 3. TypeScript strictness: All components must have explicit prop types (no implicit props). No any │
     │  type. Use proper type definitions throughout (type/interface, Prisma-generated types).            │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Tech Stack (Final)                                                                                 │
     │                                                                                                    │
     │ - Framework: Next.js 16 App Router (fullstack)                                                     │
     │ - Database: PostgreSQL + Prisma ORM                                                                │
     │ - Auth: NextAuth v5 (Credentials provider, admin only)                                             │
     │ - Storage: Supabase Storage (ad images, banner images)                                             │
     │ - Carousel: embla-carousel-react                                                                   │
     │ - Forms: react-hook-form + Zod                                                                     │
     │ - UI: Tailwind CSS v4 + lucide-react + clsx/tailwind-merge                                         │
     │ - Date utils: date-fns                                                                             │
     │ - Geolocation: Browser Geolocation API + reverse geocoding via free BPS/Nominatim API              │
     │ - Data fetching (client): TanStack React Query v5 + Axios                                          │
     │ - State: React Query (server state) + React hooks (UI state). No global state library needed.      │
     │ - Font: Plus Jakarta Sans (designed for Southeast Asian readability, excellent mobile legibility)  │
     │ - Deployment: Vercel + Vercel Cron                                                                 │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Database Schema (Prisma)                                                                           │
     │                                                                                                    │
     │ File: prisma/schema.prisma                                                                         │
     │                                                                                                    │
     │ Key models and relationships:                                                                      │
     │                                                                                                    │
     │ Kabupaten → Kecamatan[] → Desa[]                                                                   │
     │ Category (seeded: 8 categories)                                                                    │
     │ Seller (name, whatsapp, email?)                                                                    │
     │ Ad → Seller, Category, Kecamatan, Desa?, AdImage[], AdminUser?                                     │
     │   Enums: AdStatus (PENDING|ACTIVE|REJECTED|EXPIRED), PackageType (FREE_TRIAL|BASIC|PREMIUM)        │
     │   Fields: slug (SEO), sortPriority (1=PREMIUM,2=BASIC,3=FREE), viewCount, waClickCount             │
     │   Lifecycle: activatedAt, expiresAt, rejectedNote                                                  │
     │ AdImage → Ad (order field; 0 = cover)                                                              │
     │ Banner (imageUrl, linkUrl, altText, order, status, startsAt, endsAt)                               │
     │ AdminUser (email unique, passwordHash, name)                                                       │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Folder Structure                                                                                   │
     │                                                                                                    │
     │ app/                                                                                               │
     │ ├── (public)/           # Route group: public layout (Navbar + Footer)                             │
     │ │   ├── layout.tsx                                                                                 │
     │ │   ├── page.tsx                    # Homepage (ISR)                                               │
     │ │   ├── iklan/[slug]/page.tsx       # Ad detail (SSR + SEO)                                        │
     │ │   └── kategori/[slug]/page.tsx    # Category listing (ISR)                                       │
     │ ├── (admin)/            # Route group: admin layout (Sidebar + session guard)                      │
     │ │   ├── layout.tsx                                                                                 │
     │ │   └── admin/                                                                                     │
     │ │       ├── login/page.tsx                                                                         │
     │ │       ├── dashboard/page.tsx                                                                     │
     │ │       ├── iklan/page.tsx + baru/ + [id]/                                                         │
     │ │       ├── seller/page.tsx + baru/ + [id]/                                                        │
     │ │       └── banner/page.tsx + baru/                                                                │
     │ ├── api/                                                                                           │
     │ │   ├── auth/[...nextauth]/route.ts                                                                │
     │ │   ├── ads/route.ts + [id]/route.ts + [id]/track/route.ts                                         │
     │ │   ├── sellers/route.ts + [id]/route.ts                                                           │
     │ │   ├── banners/route.ts + [id]/route.ts                                                           │
     │ │   ├── locations/kecamatan/route.ts + desa/route.ts                                               │
     │ │   ├── upload/route.ts                                                                            │
     │ │   └── cron/expire-ads/route.ts                                                                   │
     │ └── layout.tsx          # Root: global CSS + SessionProvider only                                  │
     │                                                                                                    │
     │ components/ui/          # Button, Badge, Input, Select, Textarea, Modal, Spinner, ImageUploader    │
     │ components/public/      # Navbar, Footer, BannerCarousel, AdCard, AdGrid, AdFilters,               │
     │                         # AdDetail, WhatsAppButton, ImageGallery, CategoryBar                      │
     │ components/admin/       # AdminSidebar, AdStatusBadge, AdApprovalCard, AdForm,                     │
     │                         # SellerForm, BannerForm, StatsCard                                        │
     │                                                                                                    │
     │ lib/                                                                                               │
     │ ├── prisma.ts           # Singleton Prisma client                                                  │
     │ ├── supabase.ts         # Supabase Storage client                                                  │
     │ ├── auth.ts             # NextAuth config                                                          │
     │ ├── utils.ts            # cn(), formatRupiah(), generateSlug()                                     │
     │ ├── whatsapp.ts         # wa.me URL builder + number formatter                                     │
     │ └── validations/        # Zod schemas (ad, seller, banner)                                         │
     │                                                                                                    │
     │ actions/                # Server Actions (preferred for mutations)                                 │
     │ ├── ad.actions.ts       # createAd, updateAd, approveAd, rejectAd, deleteAd                        │
     │ ├── seller.actions.ts                                                                              │
     │ ├── banner.actions.ts                                                                              │
     │ └── upload.actions.ts   # Signed Supabase URL generation                                           │
     │                                                                                                    │
     │ prisma/                                                                                            │
     │ ├── schema.prisma                                                                                  │
     │ ├── seed.ts             # Admin user + locations + categories                                      │
     │ └── migrations/                                                                                    │
     │                                                                                                    │
     │ services/               # Axios-based API clients (typed)                                          │
     │ │   ├── ads.service.ts      # getAds({ filters }), getAdBySlug(slug)                               │
     │ │   ├── locations.service.ts # getKecamatans(), getDesaByKecamatan(id)                             │
     │ │   ├── banners.service.ts                                                                         │
     │ │   └── tracking.service.ts # trackWaClick(adId)                                                   │
     │ hooks/                  # useDebounce, useAdFilters, useImageUpload, useGeolocation                │
     │ types/index.ts                                                                                     │
     │ vercel.json             # Cron: 0 17 * * * → /api/cron/expire-ads                                  │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Implementation Phases                                                                              │
     │                                                                                                    │
     │ Phase 0: Foundation                                                                                │
     │                                                                                                    │
     │ 1. Install deps: prisma @prisma/client next-auth@beta @supabase/supabase-js zod react-hook-form    │
     │ @hookform/resolvers clsx tailwind-merge lucide-react embla-carousel-react date-fns                 │
     │ @tanstack/react-query axios                                                                        │
     │ 2. Create .env.example (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, SUPABASE_*, CRON_SECRET)      │
     │ 3. Write prisma/schema.prisma (full schema with all models, indexes, enums)                        │
     │ 4. Run prisma migrate dev --name init                                                              │
     │ 5. Write prisma/seed.ts — admin user, location data, categories                                    │
     │ 6. Write lib/prisma.ts, lib/supabase.ts, lib/auth.ts, lib/utils.ts, lib/whatsapp.ts                │
     │ 7. Configure next.config.ts — Supabase image domain in images.remotePatterns                       │
     │ 8. Set up React Query QueryClientProvider in app/layout.tsx (client wrapper)                       │
     │ 9. Create Axios instance (lib/axios.ts) with base URL and default headers                          │
     │ 10. Update app/globals.css — brand color tokens (green CTA, warm neutrals) + import Plus Jakarta   │
     │ Sans via next/font/google                                                                          │
     │ 11. Create Supabase bucket ad-images with public read policy                                       │
     │                                                                                                    │
     │ Phase 1: Admin Core                                                                                │
     │                                                                                                    │
     │ 1. Admin login page + NextAuth session guard in (admin)/layout.tsx                                 │
     │ 2. AdminSidebar with navigation + pending count badge                                              │
     │ 3. Admin dashboard with stats cards                                                                │
     │ 4. Seller CRUD (SellerForm + Server Actions)                                                       │
     │ 5. ImageUploader component (multi-image, signed URL flow)                                          │
     │ 6. Ad CRUD (AdForm + Server Actions)                                                               │
     │ 7. Ad approval flow (AdApprovalCard — approve → sets activatedAt, computes expiresAt; reject →     │
     │ modal with note)                                                                                   │
     │ 8. Banner CRUD (BannerForm + Server Actions)                                                       │
     │                                                                                                    │
     │ Phase 2: Public Homepage                                                                           │
     │                                                                                                    │
     │ 1. Public layout (Navbar + Footer)                                                                 │
     │ 2. BannerCarousel (embla-carousel, ISR data, minimal animation)                                    │
     │ 3. useGeolocation hook — browser Geolocation API → reverse geocode via Nominatim (OpenStreetMap) → │
     │  match to nearest Kecamatan in DB → pre-populate filter. Graceful fallback to manual selection.    │
     │ 4. AdFilters (URL search param driven: kecamatan → desa cascade, text search debounced 400ms,      │
     │ category). Pre-populated from geolocation on first visit.                                          │
     │ 5. /api/ads — sorted by sortPriority ASC, activatedAt DESC, cursor pagination,                     │
     │ location/category/search filters                                                                   │
     │ 6. AdCard — next/image with quality={70}, sizes prop, placeholder="blur". No hover animations.     │
     │ 7. AdGrid with "Load More"                                                                         │
     │ 8. CategoryBar horizontal scroll                                                                   │
     │ 9. Homepage assembly (ISR revalidate: 300s)                                                        │
     │                                                                                                    │
     │ Phase 3: Public Ad Detail                                                                          │
     │                                                                                                    │
     │ 1. ImageGallery (thumbnail strip + main viewer, swipeable)                                         │
     │ 2. WhatsAppButton (wa.me URL + POST track before redirect)                                         │
     │ 3. /api/ads/[id]/track endpoint                                                                    │
     │ 4. AdDetail server component with JSON-LD structured data                                          │
     │ 5. /iklan/[slug] SSR page + generateMetadata (title, OG image, description)                        │
     │ 6. Custom not-found.tsx for missing slugs                                                          │
     │ 7. Expired ad: show detail with "Iklan tidak aktif" banner, hide WA button                         │
     │ 8. /kategori/[slug] page                                                                           │
     │                                                                                                    │
     │ Phase 4: Automation & Hardening                                                                    │
     │                                                                                                    │
     │ 1. /api/cron/expire-ads — batch UPDATE where expiresAt < now() AND status = ACTIVE → EXPIRED       │
     │ 2. vercel.json cron config (daily 17:00 UTC = 00:00 WIB)                                           │
     │ 3. revalidatePath calls in Server Actions to invalidate ISR cache after ad mutations               │
     │ 4. Empty states: no ads, no results, no banners                                                    │
     │ 5. Global not-found.tsx                                                                            │
     │ 6. PWA manifest                                                                                    │
     │                                                                                                    │
     │ Phase 5: Polish & Deploy                                                                           │
     │                                                                                                    │
     │ 1. Suspense + skeleton loaders for AdGrid and BannerCarousel                                       │
     │ 2. Error boundaries for API failures                                                               │
     │ 3. Mobile responsiveness audit (test on 360px viewport, simulate slow 3G)                          │
     │ 4. Rate limiting on /api/ads/[id]/track                                                            │
     │ 5. Confirm delete modals in admin                                                                  │
     │ 6. Lighthouse PWA + Performance audit — target score ≥90 on mobile                                 │
     │ 7. Verify all next/image usage has sizes, quality={70}, no layout shift                            │
     │ 8. TypeScript audit: run tsc --noEmit, resolve all any types                                       │
     │ 9. Vercel env vars setup + prisma migrate deploy                                                   │
     │ 10. Smoke test: admin login → create seller → create ad → approve → public listing → geolocation   │
     │ auto-select → WA click                                                                             │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Key Business Logic                                                                                 │
     │                                                                                                    │
     │ Ad Activation (approveAd action):                                                                  │
     │ expiresAt = activatedAt + (FREE_TRIAL: 7 days | BASIC/PREMIUM: 30 days)                            │
     │ sortPriority = (FREE_TRIAL: 3 | BASIC: 2 | PREMIUM: 1)                                             │
     │ status = ACTIVE                                                                                    │
     │                                                                                                    │
     │ Ad Sort Order in listing:                                                                          │
     │ ORDER BY sort_priority ASC, activated_at DESC                                                      │
     │                                                                                                    │
     │ WhatsApp URL template:                                                                             │
     │ https://wa.me/{seller.whatsapp}?text=Halo+{seller.name}%2C+saya+tertarik+dengan+{ad.title}+yang+ad │
     │ a+di+LokalLapak.                                                                                   │
     │                                                                                                    │
     │ SEO Slug format: {title-kebab}-{kecamatan-kebab}-{cuid6}                                           │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Critical Files                                                                                     │
     │                                                                                                    │
     │ - prisma/schema.prisma — entire data model; get right before first migration                       │
     │ - lib/auth.ts — NextAuth config; all admin pages depend on this                                    │
     │ - actions/ad.actions.ts — core business logic (lifecycle, expiresAt computation)                   │
     │ - app/api/ads/route.ts — public listing query with sort priority + filters                         │
     │ - app/(public)/iklan/[slug]/page.tsx — most SEO-critical page; must SSR + generateMetadata         │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Data Fetching Architecture                                                                         │
     │                                                                                                    │
     │ The key insight: Next.js App Router has two rendering environments — Server Components and Client  │
     │ Components. React Query only runs in Client Components.                                            │
     │                                                                                                    │
     │ Server Components (RSC) — default                                                                  │
     │   → Fetch data directly via Prisma or Server Actions                                               │
     │   → No React Query, no Axios needed                                                                │
     │   → Used for: initial page render, SEO-critical content                                            │
     │                                                                                                    │
     │ Client Components — opt-in with "use client"                                                       │
     │   → React Query (useQuery / useInfiniteQuery / useMutation)                                        │
     │   → Axios service layer for HTTP calls                                                             │
     │   → Used for: interactive filters, infinite scroll, WA click tracking, geolocation                 │
     │                                                                                                    │
     │ Where React Query is used:                                                                         │
     │                                                                                                    │
     │ ┌──────────────────────────────────────────────────────────────┬────────────────────────────────── │
     │ ──┐                                                                                                │
     │ │                             Hook                             │              Purpose              │
     │   │                                                                                                │
     │ ├──────────────────────────────────────────────────────────────┼────────────────────────────────── │
     │ ──┤                                                                                                │
     │ │ useInfiniteQuery(adsKeys.list(filters), ads.service.getAds)  │ Ad listing with Load More         │
     │   │                                                                                                │
     │ ├──────────────────────────────────────────────────────────────┼────────────────────────────────── │
     │ ──┤                                                                                                │
     │ │ useQuery(locationsKeys.kecamatans, locations.service.getAll) │ Populate filter dropdown          │
     │   │                                                                                                │
     │ ├──────────────────────────────────────────────────────────────┼────────────────────────────────── │
     │ ──┤                                                                                                │
     │ │ useQuery(locationsKeys.desas(kecamatanId), ...)              │ Cascade desa dropdown             │
     │   │                                                                                                │
     │ ├──────────────────────────────────────────────────────────────┼────────────────────────────────── │
     │ ──┤                                                                                                │
     │ │ useQuery(locationsKeys.nearest(lat, lng), ...)               │ Nearest kecamatan from            │
     │ geolocation │                                                                                      │
     │ ├──────────────────────────────────────────────────────────────┼────────────────────────────────── │
     │ ──┤                                                                                                │
     │ │ useMutation(tracking.service.trackWaClick)                   │ WA button click tracking          │
     │   │                                                                                                │
     │ └──────────────────────────────────────────────────────────────┴────────────────────────────────── │
     │ ──┘                                                                                                │
     │                                                                                                    │
     │ Admin pages: Admin forms use Server Actions (not React Query) — no round-trip needed, CSRF         │
     │ protection built-in. React Query is still used in admin for data-heavy listing tables (ad list     │
     │ with status filter tabs).                                                                          │
     │                                                                                                    │
     │ Axios service layer (services/):** All useQuery/useMutation fetcher functions live in typed        │
     │ service files, not inline in hooks. This separates concerns and enables easy testing.              │
     │                                                                                                    │
     │ No Zustand needed. Filter state → URL search params. UI state (modal open, dropdown focus) →       │
     │ useState. Form state → react-hook-form. No shared cross-component client state that would justify  │
     │ a store.                                                                                           │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Font                                                                                               │
     │                                                                                                    │
     │ Plus Jakarta Sans — recommended for this platform because:                                         │
     │ - Designed specifically for Southeast Asian (including Indonesian) character readability           │
     │ - Clean, modern, high legibility at small sizes on mobile — critical for rural users on small      │
     │ screens                                                                                            │
     │ - Free on Google Fonts, loads via next/font/google (no external request at runtime)                │
     │ - Latin + extended Latin support covers all Indonesian text needs                                  │
     │                                                                                                    │
     │ // app/layout.tsx                                                                                  │
     │ import { Plus_Jakarta_Sans } from 'next/font/google'                                               │
     │                                                                                                    │
     │ const font = Plus_Jakarta_Sans({                                                                   │
     │   subsets: ['latin'],                                                                              │
     │   weight: ['400', '500', '600', '700'],                                                            │
     │   variable: '--font-sans',                                                                         │
     │   display: 'swap',  // prevents FOIT on slow connections                                           │
     │ })                                                                                                 │
     │                                                                                                    │
     │ ---                                                                                                │
     │ TypeScript Standards                                                                               │
     │                                                                                                    │
     │ Applied across the entire codebase:                                                                │
     │ - All component props defined with explicit interface or type (e.g., interface AdCardProps { ...   │
     │ })                                                                                                 │
     │ - No any — use unknown + type guards where runtime type is uncertain                               │
     │ - Use Prisma-generated types (Prisma.AdGetPayload<...>) instead of manual type duplication         │
     │ - API route handlers typed with NextRequest/NextResponse<T>                                        │
     │ - Server Action return types explicitly declared                                                   │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Geolocation Flow                                                                                   │
     │                                                                                                    │
     │ User visits homepage                                                                               │
     │   → useGeolocation hook calls navigator.geolocation.getCurrentPosition()                           │
     │   → On success: lat/lng → POST /api/locations/nearest { lat, lng }                                 │
     │     → Server queries Kecamatan with closest centroid (lat/lng stored per Kecamatan)                │
     │     → Returns { kecamatanId, kecamatanName }                                                       │
     │   → Updates URL search params → AdFilters pre-selects the kecamatan                                │
     │   → AdGrid loads filtered ads automatically                                                        │
     │   → On deny/error: show empty filter with "Pilih lokasi Anda" prompt                               │
     │                                                                                                    │
     │ Note: Kecamatan model needs lat and lng fields (nullable) for centroid matching. Seed data should  │
     │ include approximate coordinates.                                                                   │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Performance Standards                                                                              │
     │                                                                                                    │
     │ - next/image: always set quality={70}, sizes="...", loading="lazy" (except LCP image: priority)    │
     │ - Supabase image URLs: use Supabase image transformation (?width=400&quality=70) for thumbnails    │
     │ - No decorative CSS transitions/animations on public pages                                         │
     │ - BannerCarousel: preload first banner image (priority), lazy-load rest                            │
     │ - Target: Lighthouse mobile performance ≥ 90                                                       │
     │                                                                                                    │
     │ ---                                                                                                │
     │ Verification                                                                                       │
     │                                                                                                    │
     │ 1. Admin flow: Login → Create Seller → Create Ad (upload images) → Approve → Verify status=ACTIVE  │
     │ + expiresAt computed correctly                                                                     │
     │ 2. Public listing: Homepage loads with banner carousel, ads sorted Premium first, filter by        │
     │ kecamatan/desa works, search works                                                                 │
     │ 3. Ad detail: SSR renders with title meta, OG image, WA button tracks click before redirect        │
     │ 4. Cron: Manually trigger GET /api/cron/expire-ads with correct header → verify expired ads change │
     │  status                                                                                            │
     │ 5. Expired ad: Navigate to slug of expired ad → shows page with inactive banner, WA button hidden  │
     │ 6. Mobile: Chrome DevTools mobile viewport — all pages usable without horizontal scroll
