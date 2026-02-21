# 📘 UX Strategy Document: LokalLapak

**Konsep:** Hyper-local Trust-based Directory

**Target:** User Mobile (80% traffic diperkirakan dari smartphone)

---

## 1. Prinsip Utama UX (The Core Pillars)

- **Frictionless:** Buyer tidak perlu login untuk melihat barang atau menghubungi seller.
- **Trust-First:** Setiap elemen visual harus memperkuat kesan bahwa platform ini aman dan terverifikasi.
- **Speed:** Halaman harus ringan (penting untuk koneksi internet di pedesaan). Tidak ada animasi dekoratif — setiap millisecond penting.

---

## 2. Struktur Arsitektur Halaman (Homepage)

Halaman utama adalah perpaduan antara _landing page_ edukatif dan _marketplace_ aktif.

### A. Section 1: Hero & Search (Above the Fold)

- **Headline:** "Cari Kebutuhan Lokal, Tanpa Was-was."
- **Sub-headline:** "Direktori barang & jasa di [Nama Kabupaten] yang terverifikasi Admin. Langsung COD, tanpa perantara."
- **Input Group:**
  - _Dropdown Lokasi:_ Otomatis mendeteksi atau pilih "Kecamatan/Desa".
  - _Search Bar:_ "Cari madu murni, jasa tukang, atau bibit pohon..."
- **Visual:** Foto asli (bukan stock photo luar negeri) yang menggambarkan aktivitas UMKM lokal.

### B. Section 2: Trust Bar (The "Value Prop")

Barisan ikon tipis untuk menjawab keraguan user dalam 3 detik:

1. ✅ **Seller Terverifikasi:** Admin mengecek keaslian setiap penjual.
2. 📍 **Radius Dekat:** Semua barang ada di sekitar kecamatan Anda.
3. 💬 **Direct WA:** Transaksi langsung, tanpa potongan biaya aplikasi.

### C. Section 3: Category Bar (Filtering)

Horizontal scrollable pills untuk filter kategori cepat:

- `Semua` | `Makanan` | `Jasa` | `Fashion` | `Elektronik` | `Pertanian` | ...

> Implementasi: bukan tab (yang mengganti seluruh halaman), melainkan filter yang diaplikasikan pada AdGrid di bawahnya — lebih responsif, tidak reload halaman.

### D. Section 4: Product Grid (The Catalog)

- **Layout:** 2 kolom (Mobile) atau 3 kolom (Desktop/Tablet). Maksimal 3 kolom — kartu butuh ruang agar harga dan judul terbaca nyaman.
- **Card Component:**
  - **Image:** Aspek rasio 1:1 (Square), `next/image` dengan `quality={70}`. Foto pertama seller menjadi cover.
  - **Price Tag:** Bold, kontras tinggi. Jika harga null → tampilkan "Harga Nego" dalam warna abu-abu.
  - **Trust Badge:** Label kecil "✓ Terverifikasi" di sudut kiri atas foto (overlay dengan background semi-transparan).
  - **Location Label:** Nama Desa/Kecamatan penjual (ikon pin + teks).
  - **Package Badge:** Label "PREMIUM" di sudut kanan atas untuk iklan paket premium (warna indigo/ungu).
  - **Truncation:** Judul maks 2 baris; deskripsi tidak ditampilkan di card (hanya di detail).

### E. Mobile Navigation

- **Top bar only** — logo kiri, ikon pencarian kanan. Tidak menggunakan bottom tab bar.
- Alasan: Platform ini adalah direktori satu tujuan (cari → hubungi seller). Bottom nav hanya relevan jika ada banyak destinasi berbeda (profil, notifikasi, dll.) yang tidak ada di Phase 1.
- Search ikon di top bar membuka inline search bar (expand animasi minimal).

---

## 3. Struktur Arsitektur Halaman (Detail Page)

Halaman ini adalah penentu apakah Buyer jadi menekan tombol WhatsApp atau tidak.

### Image Gallery

- Foto pertama tampil besar (full-width di mobile, max 480px di desktop).
- Jika ada lebih dari 1 foto: thumbnail strip di bawah gambar utama (tap/klik untuk ganti).
- Swipe horizontal untuk ganti foto di mobile (native touch events via embla-carousel).
- Dots indicator di bawah gambar utama menunjukkan posisi saat ini.
- Tidak ada pinch-to-zoom untuk menjaga performa (bisa ditambah di Phase 2).
- LCP image: gunakan `priority` prop pada foto pertama.

### Visual Hierarchy (urutan dari atas)

1. Image Gallery
2. Judul Iklan + Harga (bold)
3. Lokasi + Kategori badge
4. The "Trust Card" (Seller Info)
5. Deskripsi Lengkap
6. Safety Tips
7. Tombol WhatsApp (di bawah deskripsi, dan sticky di bottom bar)

### The "Trust Card"

Kotak khusus profil Seller, di bawah judul:

- **Isi:** Nama Toko/Seller, Label "✓ Terverifikasi", Label "Seller Sejak [Bulan Tahun]"
- **Style:** Background abu-abu muda, border hijau tipis, rounded-lg.
- Tidak ada foto profil di Phase 1 (seller tidak upload foto profil — too much friction).

### Sticky Action Bar (Mobile)

- Saat user scroll ke bawah, tombol "Hubungi via WhatsApp" tetap menempel di bagian bawah layar (fixed bottom bar).
- Tinggi bar: 64px. Tombol: full-width, hijau WhatsApp (#25D366).
- Bar ini TIDAK muncul jika iklan berstatus EXPIRED atau REJECTED.

### Safety Tips

Teks kecil di bawah tombol WA (atau di dalam sticky bar):
> _"Tips: Selalu lakukan transaksi COD di tempat ramai demi keamanan."_

### Iklan Tidak Aktif (Expired/Rejected)

- Banner kuning/oranye di bagian atas halaman: "Iklan ini sudah tidak aktif dan mungkin tidak tersedia lagi."
- Konten detail tetap ditampilkan (deskripsi, foto — untuk SEO dan referensi buyer).
- Tombol WhatsApp **disembunyikan sepenuhnya** — tidak di-disable, tapi benar-benar tidak render.
- Sticky bar tidak muncul.

---

## 4. Seller Submission Page (Halaman Pasang Iklan)

> **⚠️ PHASE 2 ONLY — Tidak diimplementasikan di Phase 1 MVP.**
>
> Di Phase 1, semua data seller dan iklan dimasukkan oleh Admin secara manual. Seller menghubungi Admin via WhatsApp atau saluran lain untuk mendaftar.

### (Rencana Phase 2)

Ingat, Seller kita adalah UMKM lokal yang mungkin tidak ingin ribet dengan registrasi akun yang panjang.

- **Single Flow Form:** Form satu halaman yang dibagi menjadi beberapa seksi (Informasi Barang, Foto, Lokasi, Paket).
- **The "Free Trial" Highlight:** Di bagian akhir form, tampilkan pilihan paket:
  - **Opsi A:** Coba Gratis 1 Minggu (Terpilih secara default untuk user baru).
  - **Opsi B:** Paket Berbayar (Link ke Admin untuk konfirmasi pembayaran).
- **WhatsApp-based Identity:** Nomor WhatsApp digunakan sebagai identitas unik seller — menghindari sistem login yang rumit. Validasi: "Nomor ini sudah pernah menggunakan paket gratis — silakan pilih paket berbayar."

---

## 5. Admin Dashboard (The Control Tower)

Halaman ini hanya untuk Admin. Fokusnya adalah efisiensi waktu.

- **Pending Queue List:** Daftar iklan masuk yang perlu diverifikasi. Tampilkan foto thumbnail dan judul secara ringkas.
- **One-Click Action:** Tombol [Aktifkan] (langsung tayang, `activatedAt` dan `expiresAt` diset) dan [Tolak] (pop-up alasan penolakan).
- **Ad Expiry Monitor:** Daftar iklan yang akan habis masa aktifnya dalam 7 hari — agar Admin bisa menghubungi Seller untuk menawarkan perpanjangan paket.
- **Stat Cards:** 4 kartu ringkasan: Menunggu Verifikasi / Aktif / Segera Kadaluarsa / Total Seller.

---

## 6. User Journey (Flow Transaksi)

1. **Discovery:** Buyer buka web → geolokasi otomatis mengisi filter lokasi.
2. **Browse:** Buyer scroll AdGrid, filter kategori jika perlu.
3. **Interest:** Buyer klik salah satu AdCard.
4. **Validation (Detail Page):**
   - Melihat galeri foto produk.
   - Melihat status "Seller Terverifikasi" di Trust Card.
   - Membaca deskripsi lengkap.
5. **Action:** Buyer klik tombol **"Hubungi via WhatsApp"** (Sticky Button di Mobile).
6. **Conversion:** Buyer dialihkan ke aplikasi WA dengan pesan otomatis:
   > _"Halo [Nama Seller], saya tertarik dengan [Nama Produk] di LokalLapak. Apakah masih tersedia dan bisa COD?"_

---

## 7. UI Elements & Design System

| Element             | Style Recommendation        | Reason                                                         |
| ------------------- | --------------------------- | -------------------------------------------------------------- |
| **Warna Utama**     | Hijau Emerald               | Memberikan kesan aman, stabil, dan terpercaya.                 |
| **Warna Sekunder**  | Warm neutral (Amber-50)     | Background card yang hangat, tidak dingin/korporat.            |
| **Typography**      | Plus Jakarta Sans           | Designed for SE Asian readability; excellent mobile legibility |
| **Buttons**         | Rounded-lg (Sudut membulat) | Memberikan kesan modern dan ramah (friendly).                  |
| **WhatsApp Button** | Brand Color (#25D366)       | Standar global agar user langsung tahu itu tombol WA.          |
| **Trust Badge**     | Hijau muda + ikon centang   | Warna hijau = aman, terpercaya.                                |
| **Premium Badge**   | Indigo/Ungu                 | Kontras dengan hijau; menunjukkan "level lebih tinggi".        |
| **Border Radius**   | `rounded-lg` (8px)          | Konsisten di semua card, button, dan form field.               |
| **Shadow**          | `shadow-sm` only            | Tidak berlebihan — flat design lebih cepat di-render.          |

---

## 8. Loading States

Penting untuk rural users dengan koneksi lambat — blank screen = aplikasi terasa rusak.

### Skeleton Screens (Preferred over Spinner)

Gunakan **skeleton loader** (gray placeholder blok) — bukan spinner — untuk konten yang sedang dimuat.

| Komponen | Skeleton Design |
|----------|----------------|
| AdCard | Kotak abu-abu 1:1 (image placeholder) + 2 garis teks |
| AdGrid | 6 AdCard skeletons (2 kolom × 3 baris di mobile) |
| BannerCarousel | Kotak abu-abu full-width, tinggi 200px |
| Ad Detail Page | Image block besar + 4 garis teks |

- Warna skeleton: `bg-gray-200` dengan animasi `animate-pulse`.
- Skeleton ditampilkan via **React Suspense** boundaries — tidak perlu loading state manual.

### Button Loading State

Saat form sedang disubmit: tombol menampilkan spinner kecil inline + teks berubah (misal "Menyimpan..."). Tombol disabled selama loading.

---

## 9. Empty States

Jangan biarkan user melihat halaman kosong tanpa panduan.

| Kondisi | Pesan | Aksi |
|---------|-------|------|
| Tidak ada iklan di lokasi dipilih | "Belum ada iklan di area ini. Coba perluas filter lokasi kamu." | Tombol "Lihat Semua Area" |
| Pencarian tidak menemukan hasil | "Tidak ada iklan untuk "[kata kunci]"." | Tombol "Hapus Pencarian" |
| Tidak ada iklan di kategori ini | "Belum ada iklan di kategori ini." | Tombol "Lihat Semua Kategori" |
| Seller belum punya iklan (admin view) | "Seller ini belum memiliki iklan aktif." | — |

**Visual:** Ilustrasi sederhana (SVG inline) + pesan + CTA. Jangan hanya teks kosong.

---

## 10. Error States

### Network / Server Error

- Toast merah di bawah layar: "Terjadi kesalahan. Periksa koneksi Anda dan coba lagi."
- Tombol "Coba Lagi" (retry) di bawah AdGrid jika fetch gagal.
- Jangan tampilkan pesan error teknis (stack trace, error code) ke user.

### Form Submission Error

- Error validasi: teks merah kecil langsung di bawah field yang salah (inline, bukan toast).
- Error server (misal: duplikat slug): toast merah + pesan user-friendly.

### 404 — Iklan Tidak Ditemukan

- Halaman custom (bukan default Next.js 404).
- Pesan: "Iklan tidak ditemukan."
- Sub-pesan: "Iklan mungkin sudah dihapus atau URL tidak valid."
- CTA: Tombol "Kembali ke Beranda".

---

## 11. PWA & Offline State

LokalLapak diklaim sebagai PWA (Progressive Web App). Ini berarti:

### Install Prompt

- Browser akan menawarkan "Tambahkan ke layar utama" secara native (jika manifest.json dan service worker tersedia).
- Tidak ada custom install prompt di Phase 1 — biarkan browser menangani.

### Offline State

- Jika user membuka aplikasi tanpa koneksi: tampilkan halaman offline sederhana.
  - Pesan: "Kamu sedang offline. Periksa koneksi internet kamu."
  - Ikon sinyal terputus.
- Di Phase 1, **tidak ada caching konten iklan** untuk offline (terlalu kompleks untuk MVP). Cukup fallback page yang informatif.
- Service Worker: hanya cache shell statis (CSS, font, icons) — bukan data iklan.

### App Manifest

- `name`: "LokalLapak"
- `short_name`: "LokalLapak"
- `theme_color`: hijau emerald
- `display`: "standalone" (full-screen, tanpa browser chrome)
- `start_url`: "/"

---

## 12. Accessibility Baseline

Platform ini harus dapat digunakan oleh siapa pun, termasuk di kondisi pencahayaan terang (outdoor, di pasar).

| Standar | Ketentuan |
|---------|-----------|
| **Tap target size** | Minimum 44×44px untuk semua tombol dan link interaktif |
| **Color contrast** | Minimum 4.5:1 untuk teks normal, 3:1 untuk teks besar (WCAG AA) |
| **Text di atas gambar** | Selalu gunakan overlay gelap semi-transparan di belakang teks di atas foto |
| **Font size minimum** | 14px untuk teks body; 12px untuk label/meta — tidak lebih kecil |
| **Alt text** | Semua `next/image` harus memiliki `alt` deskriptif (bukan kosong, kecuali dekoratif) |
| **Focus visible** | Semua elemen interaktif harus memiliki outline focus yang terlihat (jangan `outline: none`) |
| **Loading indicators** | Skeleton/spinner harus ada `aria-label="Memuat..."` atau `aria-busy="true"` |

---

## 13. Strategi "Cold Start" (Edukasi Seller)

Karena ada fitur **Paket Gratis 1 Minggu**, UX untuk Seller harus sangat mudah:

1. **Landing Page Seller:** Jelaskan keuntungan (Iklan dilihat tetangga, verifikasi gratis, COD-friendly).
2. **CTA:** "Daftarkan Dagangan Saya" → mengarahkan ke WhatsApp Admin (bukan form di Phase 1).
3. **Social Proof:** Tampilkan jumlah seller yang sudah bergabung di area tersebut.
