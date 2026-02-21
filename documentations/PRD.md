# Product Requirements Document (PRD) — LokalLapak

**Version:** 2.0
**Status:** Approved for MVP Development
**Tech Stack:** Next.js (Fullstack) + PostgreSQL
**Target Market:** Kabupaten, Kecamatan, Desa (Hyper-local Indonesia)

---

## 1. Executive Summary

LokalLapak adalah platform direktori iklan lokal yang mempertemukan penjual (Seller) dan pembeli (Buyer) dalam lingkup geografis kecil (Kecamatan/Desa). Fokus utama adalah:

- **Keamanan** melalui verifikasi admin sebelum iklan ditampilkan
- **Kemudahan kontak** melalui integrasi WhatsApp (tanpa sistem pembayaran internal)
- **Penemuan lokal** melalui filter lokasi hiperlokal dan deteksi geolokasi otomatis
- **Performa ringan** sebagai Mobile-first PWA untuk daerah dengan sinyal terbatas

---

## 2. Model Bisnis

| Nama Paket     | Durasi  | Penempatan           | Harga    | Tujuan                           |
| -------------- | ------- | -------------------- | -------- | -------------------------------- |
| **Free Trial** | 7 Hari  | Standar (bawah)      | Rp 0     | Akuisisi seller baru             |
| **Basic**      | 30 Hari | Standar              | Berbayar | Revenue stream utama             |
| **Premium**    | 30 Hari | Prioritas (di atas)  | Berbayar | Visibility booster untuk seller  |

**Catatan:**
- Iklan **Premium** mendapat prioritas urutan di daftar (selalu muncul di atas Basic dan Free Trial).
- **Banner Carousel** di halaman utama adalah slot iklan terpisah yang dikelola mandiri oleh Admin — bukan bagian dari paket Premium otomatis.
- Pembayaran paket dilakukan secara offline (konfirmasi manual oleh Admin). Integrasi payment gateway direncanakan di Phase 3.

---

## 3. User Personas

- **Seller:** Pelaku UMKM, pedagang rumahan, atau penyedia jasa lokal yang ingin jangkauan lebih luas di areanya.
- **Buyer:** Masyarakat lokal yang mencari barang/jasa terdekat. Tidak perlu login — bebas gesekan (frictionless).
- **Admin:** Pengelola platform yang memverifikasi seller, mengelola iklan, dan mengatur konten banner.

---

## 4. User Stories

### Buyer

| Saya ingin...                                             | Agar...                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| Platform mendeteksi lokasi saya secara otomatis           | Saya langsung melihat iklan yang dekat tanpa perlu filter manual |
| Mencari barang berdasarkan lokasi (Kecamatan/Desa)        | Saya menemukan penjual yang bisa COD atau dekat rumah         |
| Memfilter berdasarkan kategori                            | Saya tidak perlu scroll iklan yang tidak relevan              |
| Menekan tombol WhatsApp di halaman iklan                  | Saya langsung bernegosiasi tanpa perantara sistem             |
| Melihat galeri foto produk                                | Saya bisa menilai kondisi barang sebelum menghubungi seller   |

### Seller

| Saya ingin...                                             | Agar...                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| Mendaftarkan barang/jasa melalui Admin                    | Iklan saya muncul di platform secara resmi dan terpercaya     |
| Memilih paket durasi (Free Trial / Basic / Premium)       | Saya bisa menyesuaikan budget pemasaran                       |
| Iklan saya muncul di posisi teratas                       | Produk saya lebih cepat ditemukan pembeli (paket Premium)     |

### Admin

| Saya ingin...                                             | Agar...                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| Login dengan email dan password yang aman                 | Hanya saya yang bisa mengakses dashboard                      |
| Membuat data seller dan iklan                             | Iklan bisa tayang tanpa seller perlu akses sistem             |
| Memverifikasi iklan (Approve / Reject)                    | Platform bersih dari penipuan (scam)                          |
| Menolak iklan dengan catatan alasan                       | Seller tahu kenapa iklannya ditolak                           |
| Mengelola banner carousel di halaman utama                | Saya bisa mempromosikan konten tertentu secara terpisah       |
| Melihat statistik ringkas                                 | Saya tahu kondisi platform (pending, aktif, akan kadaluarsa)  |

---

## 5. Functional Requirements

### 5.1 Ad Lifecycle

Status iklan mengikuti alur berikut:

```
PENDING → ACTIVE → EXPIRED
        ↓
      REJECTED
```

- **PENDING:** Status awal saat Admin membuat iklan baru. Tidak tampil ke publik.
- **ACTIVE:** Admin meng-approve iklan. `activatedAt` dan `expiresAt` dihitung otomatis berdasarkan paket.
- **EXPIRED:** Sistem (cron job harian) mengubah status iklan yang `expiresAt < now()`. Tidak tampil ke publik.
- **REJECTED:** Admin menolak iklan, disertai catatan alasan. Tidak tampil ke publik.

**Kalkulasi `expiresAt`:**

| Paket      | Durasi      |
| ---------- | ----------- |
| FREE_TRIAL | +7 hari     |
| BASIC      | +30 hari    |
| PREMIUM    | +30 hari    |

### 5.2 Admin Authentication

- Admin login menggunakan email + password (Credentials provider via NextAuth v5).
- Password disimpan sebagai bcrypt hash di tabel `AdminUser` database.
- Sesi disimpan sebagai httpOnly cookie (JWT).
- Tidak ada registrasi publik. Admin dibuat melalui `prisma/seed.ts` atau insert langsung ke database.
- Semua halaman `/admin/*` memerlukan sesi aktif; redirect ke `/admin/login` jika tidak terautentikasi.

### 5.3 Seller & Ad Management (Admin-Entered, Phase 1)

- **Phase 1:** Admin memasukkan semua data seller dan iklan. Tidak ada form submission publik untuk seller.
- **Data Seller:** Nama toko/pemilik, nomor WhatsApp (format `628xxxxxxxxxx`), email (opsional).
- **Data Iklan:** Judul, deskripsi, harga (nullable = "Harga Nego"), kategori, lokasi (Kecamatan + Desa), paket, foto (maks. 5 foto).
- **Upload Foto:** Disimpan di Supabase Storage. Batas per foto: 2MB, format JPEG/PNG/WebP. Foto pertama menjadi thumbnail/cover.
- **Slug SEO:** Auto-generated dari judul + kecamatan + cuid pendek. Contoh: `jual-nasi-padang-kecamatan-blimbing-ab12cd`.

### 5.4 Category System

8 kategori pre-seeded:

| Nama Kategori         | Slug                  |
| --------------------- | --------------------- |
| Makanan & Minuman     | makanan-minuman       |
| Fashion & Pakaian     | fashion-pakaian       |
| Elektronik            | elektronik            |
| Pertanian & Peternakan| pertanian-peternakan  |
| Jasa & Layanan        | jasa-layanan          |
| Kesehatan & Kecantikan| kesehatan-kecantikan  |
| Pendidikan & Les      | pendidikan-les        |
| Furnitur & Rumah Tangga| furnitur-rumah-tangga |

### 5.5 Buyer Experience

- **Geolocation Detection:** Browser Geolocation API mendeteksi posisi buyer → reverse geocode → mencocokkan ke Kecamatan terdekat di database → filter lokasi otomatis terisi. Jika buyer menolak izin, dropdown dipilih manual.
- **Hyper-local Filter:** Dropdown bertingkat Kecamatan → Desa. Perubahan Kecamatan me-reset pilihan Desa.
- **Category Filter:** Bar kategori horizontal, bisa dikombinasikan dengan filter lokasi.
- **Text Search:** Debounced 400ms, mencari pada judul dan deskripsi iklan.
- **Ad Sorting:** Iklan `PREMIUM` selalu muncul di atas `BASIC`, lalu `FREE_TRIAL`. Dalam paket yang sama, diurutkan berdasarkan `activatedAt` terbaru.
- **Pagination:** Cursor-based "Muat Lebih Banyak" (bukan numbered pages).
- **WhatsApp Button:** Tombol hijau di halaman detail iklan. URL: `https://wa.me/{whatsapp}?text={template}`. Template pesan: *"Halo [Nama Seller], saya tertarik dengan [Judul Iklan] di LokalLapak. Apakah masih tersedia dan bisa COD?"*
- **Expired Ad:** Iklan kadaluarsa tetap bisa diakses via URL, namun menampilkan banner "Iklan ini sudah tidak aktif" dan tombol WhatsApp disembunyikan.

### 5.6 WhatsApp Number Format

- Format tersimpan di DB: `628xxxxxxxxxx` (tanpa `+`, tanpa `-`)
- Form Admin otomatis menormalisasi: strip leading `0` → prefix `62`, strip leading `+62` → prefix `62`
- Validasi: 10–13 digit setelah `62`
- Digunakan untuk membangun URL `wa.me`

### 5.7 Banner Management

- Admin mengupload gambar banner (terpisah dari sistem iklan).
- Data banner: gambar, URL tujuan (opsional), alt text, urutan tampil, tanggal mulai/selesai, status (ACTIVE/INACTIVE).
- Banner aktif ditampilkan sebagai carousel di halaman utama.
- Banner tidak terkait langsung dengan iklan manapun (independent promotional content).

### 5.8 Admin Dashboard

- Statistik ringkas: jumlah iklan PENDING, total iklan ACTIVE, iklan yang akan kadaluarsa dalam 7 hari, total seller.
- Manajemen iklan: filter berdasarkan status (tab: Pending / Active / Rejected / Expired).
- Manajemen seller: daftar seller, edit data.
- Manajemen banner: upload, toggle status, atur urutan.

---

## 6. Non-Functional Requirements

### Performance

- **Mobile-first PWA:** Ringan, dapat digunakan di area dengan sinyal terbatas.
- **Image Optimization:** Semua gambar menggunakan `next/image` dengan `quality={70}`, `sizes` prop, format WebP via Supabase image transformation.
- **Minimal Animation:** Tidak ada animasi dekoratif di halaman publik. Prioritas kecepatan render.
- **Target Lighthouse Mobile:** ≥ 90 (Performance, Accessibility, Best Practices, SEO).

### SEO

- Halaman detail iklan (`/iklan/[slug]`) di-render dengan **SSR** untuk terindeks Google.
- Setiap halaman iklan menghasilkan `<title>`, `<meta description>`, Open Graph tags, dan JSON-LD structured data.
- Slug iklan bersifat SEO-friendly dan mengandung kata kunci lokasi.

### TypeScript

- Semua komponen memiliki prop types eksplisit (`interface`/`type`).
- Tidak ada penggunaan tipe `any`. Gunakan `unknown` + type guards bila tipe runtime tidak diketahui.
- Gunakan tipe yang di-generate Prisma (`Prisma.AdGetPayload<...>`) untuk menghindari duplikasi definisi tipe.

### Security

- Admin route dilindungi oleh session guard (middleware + layout check).
- `SUPABASE_SERVICE_KEY` hanya digunakan di sisi server (tidak pernah di-expose ke client).
- Cron job endpoint dilindungi oleh header `Authorization: Bearer {CRON_SECRET}`.

---

## 7. Success Metrics (KPIs)

- **Seller Acquisition:** Jumlah seller baru yang terdaftar per bulan.
- **Click-to-WhatsApp Rate:** Persentase buyer yang mengklik tombol WA dari halaman detail iklan.
- **Ad Retention Rate:** Persentase seller yang memperpanjang paket iklan.
- **Time-to-Active:** Rata-rata waktu dari iklan dibuat (PENDING) hingga diaktifkan (ACTIVE) oleh Admin.

---

## 8. Roadmap

- **Phase 1 (MVP — Saat Ini):** Direktori iklan, filter lokasi + geolokasi, tombol WhatsApp, input data manual oleh Admin.
- **Phase 2 (Seller Dashboard):** Seller bisa mendaftar dan submit iklan sendiri via form publik; Admin tinggal "Approve".
- **Phase 3 (Automatic Payment):** Integrasi payment gateway (Midtrans/Xendit) khusus untuk pembayaran paket iklan — bukan transaksi barang.
