# App Flow — LokalLapak

Maps every user journey, screen transition, dialog, toast, redirect, and cross-module link across the application.

---

## Roles & Entry Points

| Role  | Entry Point    | Auth Required |
| ----- | -------------- | ------------- |
| Buyer | `/`            | No            |
| Admin | `/admin/login` | Yes           |

---

## Buyer Flows

### 1. Homepage Load

```
User visits /
  → Server: fetch initial active ads (ISR) + active banners
  → Render: BannerCarousel + CategoryBar + AdFilters + AdGrid (initial 12 ads)
  → Client: useGeolocation hook triggers
    ├─ Browser asks: "Allow location access?"
    │   ├─ ALLOW → GET /api/locations/nearest { lat, lng }
    │   │         → returns { kecamatanId, kecamatanName }
    │   │         → URL updates: /?kecamatanId={id}
    │   │         → Kecamatan dropdown pre-selects
    │   │         → AdGrid re-fetches with location filter
    │   └─ DENY / ERROR → No change; filter shows "Pilih lokasi Anda" placeholder
```

### 2. Location Filter (Kecamatan → Desa)

```
User selects Kecamatan from dropdown
  → URL updates: /?kecamatanId={id}
  → Desa dropdown resets to "Semua Desa"
  → GET /api/locations/desa?kecamatanId={id} (React Query, cached)
  → Desa dropdown populates
  → AdGrid re-fetches with new kecamatanId

User selects Desa
  → URL updates: /?kecamatanId={id}&desaId={id}
  → AdGrid re-fetches with kecamatanId + desaId

No results
  → EmptyState: "Belum ada iklan di area ini. Coba perluas pencarian Anda."
```

### 3. Text Search

```
User types in search input
  → debounced 400ms
  → URL updates: /?q={text}
  → AdGrid re-fetches (search on title + description)
  → Results update in place (no page reload)

User clears search
  → URL removes ?q param
  → AdGrid resets to unfiltered results
```

### 4. Category Filter

```
User taps category pill in CategoryBar
  → URL updates: /?categoryId={id}
  → AdGrid re-fetches filtered by category
  → Active category pill highlighted

User taps same category again (toggle off)
  → URL removes ?categoryId
  → AdGrid shows all categories
```

### 5. Load More (Pagination)

```
User scrolls to bottom of AdGrid
  → "Muat Lebih Banyak" button visible
User clicks button
  → GET /api/ads?cursor={lastCursor}&... (React Query infinite query)
  → New ads appended below existing grid
  → If no more ads: button hidden, "Semua iklan telah ditampilkan" text shown
```

### 6. Ad Detail

```
User clicks AdCard
  → Navigate to /iklan/{slug}
  → Server: fetch ad by slug (SSR, dynamic rendering)
  → Render: ImageGallery + title + price + category badge + location + description + WhatsAppButton
  → <title>, <meta description>, OG tags, JSON-LD in <head>

Ad is ACTIVE
  → Full detail shown + WhatsApp button visible

Ad is EXPIRED or REJECTED
  → Full detail shown
  → Yellow/orange banner: "Iklan ini sudah tidak aktif dan mungkin tidak tersedia lagi."
  → WhatsApp button HIDDEN

Ad slug not found
  → next/navigation notFound() called
  → Renders /iklan/[slug]/not-found.tsx:
      "Iklan tidak ditemukan" + "Kembali ke Beranda" button → /
```

### 7. WhatsApp Contact

```
User clicks WhatsApp button
  → POST /api/ads/{id}/track { type: "wa_click" } (fire-and-forget, useMutation)
  → Browser opens: https://wa.me/{seller.whatsapp}?text={encoded message}
  → Pre-filled message: "Halo {seller.name}, saya tertarik dengan {ad.title} di LokalLapak. Apakah masih tersedia dan bisa COD?"
  → User continues conversation natively in WhatsApp
```

### 8. Category Browse Page

```
User navigates to /kategori/{slug}
  → Same layout as homepage
  → CategoryBar highlights current category
  → AdGrid pre-filtered by category (ISR, revalidate: 300s)
  → Location filter still functional (combinable with category)
```

---

## Admin Flows

### 9. Admin Login

```
User navigates to /admin/* (any protected route)
  → (admin)/layout.tsx checks session
  → No session → redirect to /admin/login?callbackUrl={original path}

User at /admin/login
  → Enters email + password
  → Submit → NextAuth signIn('credentials', { email, password })
    ├─ SUCCESS → redirect to callbackUrl or /admin/dashboard
    └─ FAIL → inline error: "Email atau password salah."
              Form inputs remain filled (only password clears)
```

### 10. Admin Dashboard

```
User at /admin/dashboard
  → Server fetches stats from DB:
    • Pending ads count (badge also shown in sidebar)
    • Active ads count
    • Ads expiring within 7 days count
    • Total sellers count
  → Renders 4 StatsCards
  → Each card is not clickable (display only)
```

### 11. Create Seller

```
Admin clicks "Tambah Seller" → /admin/seller/baru

Fill form:
  • Nama Toko/Pemilik (required)
  • Nomor WhatsApp (required):
      - Format hint: "Contoh: 081234567890 atau 6281234567890"
      - Auto-normalized on submit: 0xxx → 62xxx, +62xxx → 62xxx
      - Validation: 10–13 digits after 62
  • Email (optional)

Submit → createSeller() Server Action
  ├─ VALIDATION FAIL → inline field errors (Zod), no page change
  └─ SUCCESS → toast "Seller berhasil ditambahkan" (green)
              → redirect /admin/seller/{id}
```

### 12. Edit Seller

```
Admin at /admin/seller/{id}
  → Form pre-filled with current data
  → Admin edits fields
  → Submit → updateSeller() Server Action
    ├─ FAIL → inline errors
    └─ SUCCESS → toast "Perubahan berhasil disimpan" (green)
                → stay on /admin/seller/{id}
```

### 13. Delete Seller

```
Admin clicks "Hapus" on seller page
  → Confirm modal: "Yakin ingin menghapus seller ini?"
    • Deskripsi: "Semua iklan terkait juga akan dihapus."
    • [Batal] [Hapus] (red)
  → [Hapus] clicked → deleteSeller() Server Action
    └─ SUCCESS → toast "Seller berhasil dihapus" (red)
                → redirect /admin/seller
```

### 14. Create Ad

```
Admin at /admin/iklan/baru

Fill form:
  Section 1 — Seller
    • Seller select (searchable dropdown, shows existing sellers)
    • [+ Tambah Seller Baru] → opens inline quick-create or navigates to /admin/seller/baru

  Section 2 — Informasi Iklan
    • Judul (required)
    • Kategori (required, select from 8 categories)
    • Kecamatan (required, dropdown)
    • Desa (optional, cascade from Kecamatan)
    • Deskripsi (required, textarea)
    • Harga (optional, number input; empty = "Harga Nego")
    • Label Harga (optional, e.g. "Per kg", "Mulai dari")

  Section 3 — Paket
    • Paket (radio: Free Trial / Basic / Premium)

  Section 4 — Foto
    • ImageUploader:
        - Drag & drop or browse
        - Max 5 files, 2MB each, JPEG/PNG/WebP only
        - Progress indicator per file
        - Reorder (first = cover)
        - Remove individual images

Image Upload Flow (within ImageUploader):
  User selects files
  → Client validates: size ≤2MB, type allowed
    ├─ INVALID → inline error per file (e.g., "File terlalu besar. Maksimal 2MB.")
    └─ VALID → POST Server Action getSignedUploadUrl(bucket, path)
              → PUT {file} to signed Supabase URL directly from browser
              → On complete: public URL saved in component state
              → Thumbnail preview shows in uploader

Submit ad form → createAd() Server Action
  ├─ VALIDATION FAIL → inline field errors
  └─ SUCCESS → toast "Iklan berhasil dibuat" (green)
              → redirect /admin/iklan/{id}
              → Ad status = PENDING (not yet visible publicly)
```

### 15. Approve Ad

```
Admin at /admin/iklan/{id}
  → AdApprovalCard shows current status: PENDING
  → Admin optionally changes PackageType (dropdown: Free Trial / Basic / Premium)
  → Admin clicks "Aktifkan Iklan" (green button)
    → approveAd() Server Action
    → status = ACTIVE
    → activatedAt = now()
    → expiresAt = now() + (7 or 30 days depending on package)
    → sortPriority = 1/2/3
    → revalidatePath('/'), revalidatePath('/iklan/{slug}')
  └─ SUCCESS → toast "Iklan telah diaktifkan" (green)
              → AdApprovalCard updates: status badge = ACTIVE
              → expiresAt date shown
              → "Aktifkan" button replaced by "Nonaktifkan" (or package change options)
```

### 16. Reject Ad

```
Admin at /admin/iklan/{id}
  → Clicks "Tolak Iklan" (red/outline button)
  → Modal opens:
      Title: "Tolak Iklan"
      Textarea: "Alasan penolakan (wajib diisi)"
      [Batal] [Konfirmasi Penolakan] (red)

  [Batal] → modal closes, no change

  [Konfirmasi Penolakan]
    → rejectAd(id, note) Server Action
    → status = REJECTED, rejectedNote saved
  └─ SUCCESS → modal closes
              → toast "Iklan telah ditolak" (yellow)
              → AdApprovalCard updates: status = REJECTED, rejection note displayed
```

### 17. Ad List (Admin)

```
Admin at /admin/iklan
  → Status filter tabs: [Pending (n)] [Active] [Rejected] [Expired]
  → Active tab highlighted, list shows filtered ads
  → Each row: title, seller name, kecamatan, package, status badge, created date
  → Row click → /admin/iklan/{id}
  → "Tambah Iklan" button → /admin/iklan/baru
```

### 18. Create Banner

```
Admin at /admin/banner/baru

Fill form:
  • Upload Gambar (single image, same size/format constraints as ad images)
  • URL Tujuan (optional, click-through link)
  • Alt Text (required, for accessibility)
  • Tanggal Mulai (optional, date picker)
  • Tanggal Selesai (optional, date picker)
  • Urutan Tampil (number, lower = shown earlier)

Submit → createBanner() Server Action
  └─ SUCCESS → toast "Banner berhasil ditambahkan" (green)
              → redirect /admin/banner
```

### 19. Toggle Banner Status

```
Admin at /admin/banner
  → Each banner row has a toggle switch (ACTIVE ↔ INACTIVE)
  → User clicks toggle → updateBanner({ status }) Server Action (optimistic UI update)
  → Toggle flips immediately
  ├─ SUCCESS → stays flipped
  └─ ERROR → reverts to previous state + toast "Gagal mengubah status banner" (red)
```

### 20. Delete Banner

```
Admin clicks trash icon on banner row
  → Confirm modal: "Yakin ingin menghapus banner ini?"
  → [Hapus] → deleteBanner() Server Action
  └─ SUCCESS → toast "Banner berhasil dihapus" (red)
              → Banner removed from list
```

### 21. Admin Logout

```
Admin clicks "Keluar" in sidebar footer
  → NextAuth signOut()
  → Session cleared
  → Redirect → /admin/login
```

---

## Cross-Module Links

### Admin Sidebar Navigation

```
Dashboard        → /admin/dashboard
Iklan [n pending]→ /admin/iklan (default tab: Pending)
Seller           → /admin/seller
Banner           → /admin/banner
[Keluar]         → signOut → /admin/login
```

### Admin Internal Links

```
/admin/seller         → [row click] → /admin/seller/{id}
/admin/seller/{id}    → [Ad list section, row click] → /admin/iklan/{id}
/admin/iklan/{id}     → [Seller name link] → /admin/seller/{sellerId}
/admin/iklan          → [Tambah Iklan] → /admin/iklan/baru
/admin/seller         → [Tambah Seller] → /admin/seller/baru
/admin/banner         → [Tambah Banner] → /admin/banner/baru
```

### Public Internal Links

```
/ (homepage)         → [AdCard click] → /iklan/{slug}
/ (homepage)         → [CategoryBar tap] → /?categoryId={id} or /kategori/{slug}
/iklan/{slug}        → [Kembali] → /  (browser back)
/iklan/not-found     → [Kembali ke Beranda] → /
/kategori/{slug}     → [AdCard click] → /iklan/{slug}
```

---

## Dialogs

| Dialog        | Trigger                  | Content                                                                    | Actions                                              |
| ------------- | ------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| Reject Ad     | "Tolak Iklan" button     | Title: "Tolak Iklan". Textarea: alasan penolakan (required).               | [Batal] (close) [Konfirmasi Penolakan] (red, submit) |
| Delete Ad     | "Hapus" button on ad     | "Yakin ingin menghapus iklan ini? Tindakan ini tidak dapat dibatalkan."    | [Batal] [Hapus] (red)                                |
| Delete Seller | "Hapus" button on seller | "Yakin ingin menghapus seller ini? Semua iklan terkait juga akan dihapus." | [Batal] [Hapus] (red)                                |
| Delete Banner | Trash icon on banner     | "Yakin ingin menghapus banner ini?"                                        | [Batal] [Hapus] (red)                                |

All dialogs:

- Close on [Batal] click or pressing Escape
- Close on backdrop click (except confirm-delete with destructive action)
- Trap focus when open (accessibility)

---

## Toasts

| Event                 | Toast Color | Message                                                     |
| --------------------- | ----------- | ----------------------------------------------------------- |
| Create seller success | Green       | "Seller berhasil ditambahkan"                               |
| Edit seller success   | Green       | "Perubahan berhasil disimpan"                               |
| Delete seller success | Red         | "Seller berhasil dihapus"                                   |
| Create ad success     | Green       | "Iklan berhasil dibuat"                                     |
| Approve ad success    | Green       | "Iklan telah diaktifkan"                                    |
| Reject ad success     | Yellow      | "Iklan telah ditolak"                                       |
| Delete ad success     | Red         | "Iklan berhasil dihapus"                                    |
| Create banner success | Green       | "Banner berhasil ditambahkan"                               |
| Update banner success | Green       | "Banner berhasil diperbarui"                                |
| Delete banner success | Red         | "Banner berhasil dihapus"                                   |
| Image upload error    | Red         | "Gagal mengunggah gambar. Coba lagi."                       |
| Image too large       | Red         | "File terlalu besar. Maksimal 2MB."                         |
| Image wrong format    | Red         | "Format file tidak didukung. Gunakan JPEG, PNG, atau WebP." |
| Network/server error  | Red         | "Terjadi kesalahan. Periksa koneksi Anda dan coba lagi."    |
| Login failed          | Red         | "Email atau password salah." (inline, not toast)            |

Toast behavior:

- Auto-dismiss after 4 seconds
- Appear at bottom-right on desktop, bottom-center on mobile
- Max 3 toasts visible at once (stack)

---

## Redirects Summary

| From                               | To                                  | Condition          |
| ---------------------------------- | ----------------------------------- | ------------------ |
| `/admin/*` (any)                   | `/admin/login?callbackUrl=...`      | No session         |
| `/admin/login` (post-success)      | `callbackUrl` or `/admin/dashboard` | Login success      |
| `/admin/seller/baru` (post-submit) | `/admin/seller/{newId}`             | Create success     |
| `/admin/seller/{id}` (post-delete) | `/admin/seller`                     | Delete success     |
| `/admin/iklan/baru` (post-submit)  | `/admin/iklan/{newId}`              | Create success     |
| `/admin/iklan/{id}` (post-delete)  | `/admin/iklan`                      | Delete success     |
| `/admin/banner/baru` (post-submit) | `/admin/banner`                     | Create success     |
| `/admin/banner/{id}` (post-delete) | `/admin/banner`                     | Delete success     |
| `/admin/login` (already logged in) | `/admin/dashboard`                  | Active session     |
| `/iklan/{slug}` (not found)        | renders `not-found.tsx`             | Slug doesn't exist |

---

## Empty States

| Screen                      | Condition                          | Message                                                         |
| --------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| AdGrid (homepage)           | No ACTIVE ads in selected location | "Belum ada iklan di area ini. Coba perluas filter lokasi Anda." |
| AdGrid (search)             | Search returns no results          | "Tidak ada iklan yang cocok dengan pencarian "{q}"."            |
| AdGrid (category)           | No ads in category                 | "Belum ada iklan di kategori ini."                              |
| Admin ad list (Pending tab) | No pending ads                     | "Tidak ada iklan yang menunggu verifikasi."                     |
| Admin seller list           | No sellers                         | "Belum ada seller terdaftar. Tambahkan seller pertama."         |
| Admin banner list           | No banners                         | "Belum ada banner. Unggah banner pertama."                      |
| Seller detail (ad list)     | Seller has no ads                  | "Seller ini belum memiliki iklan."                              |
