import 'dotenv/config';
import { PrismaClient, AdStatus, PackageType } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function img(seed: string): string {
  return `https://picsum.photos/seed/${seed}/800/600`;
}

async function main() {
  console.log('🌱 Seeding sample data...');

  // ─── Prerequisites ──────────────────────────────────────────────────────────
  const admin = await prisma.adminUser.findFirst();
  if (!admin) throw new Error('Run main seed first: yarn prisma db seed');

  const categories = await prisma.category.findMany();
  const catId = (slug: string) => {
    const found = categories.find((c) => c.slug === slug);
    if (!found) throw new Error(`Category not found: ${slug}`);
    return found.id;
  };

  // ─── Sellers ────────────────────────────────────────────────────────────────
  const sellersData = [
    {
      id: 'seller-001',
      name: 'Pak Budi Santoso',
      whatsapp: '6281234567890',
      email: 'budi@example.com',
    },
    {
      id: 'seller-002',
      name: 'Bu Sari Dewi',
      whatsapp: '6281298765432',
      email: 'sari@example.com',
    },
    { id: 'seller-003', name: 'Mas Deni Kurniawan', whatsapp: '6285612345678' },
    {
      id: 'seller-004',
      name: 'Mbak Rina Wati',
      whatsapp: '6287812345678',
      email: 'rina@example.com',
    },
    { id: 'seller-005', name: 'Pak Joko Prakoso', whatsapp: '6282345678901' },
  ];

  for (const seller of sellersData) {
    await prisma.seller.upsert({ where: { id: seller.id }, update: {}, create: seller });
  }
  console.log(`✅ ${sellersData.length} sellers seeded`);

  // ─── Ads + Images ───────────────────────────────────────────────────────────
  // Using stable subdistrict IDs from seed.ts
  type AdSeed = {
    id: string;
    slug: string;
    title: string;
    description: string;
    price: number | null;
    priceLabel?: string;
    status: AdStatus;
    packageType: PackageType;
    sortPriority: number;
    sellerId: string;
    categorySlug: string;
    subdistrictId: string;
    activatedAt?: Date;
    expiresAt?: Date;
    rejectedAt?: Date;
    rejectedNote?: string;
    approvedById?: string;
    images: string[]; // picsum seed keys
  };

  const ads: AdSeed[] = [
    // ── PREMIUM + ACTIVE (2) ────────────────────────────────────────────────
    {
      id: 'ad-001',
      slug: 'nasi-padang-sederhana-liwa-001',
      title: 'Nasi Padang Sederhana',
      description:
        'Nasi padang dengan lauk pilihan. Tersedia ayam rendang, gulai ayam, dan rendang sapi. Porsi hemat dan mengenyangkan. Buka setiap hari pukul 07.00–21.00 WIB.',
      price: 25000,
      priceLabel: 'Per porsi',
      status: AdStatus.ACTIVE,
      packageType: PackageType.PREMIUM,
      sortPriority: 1,
      sellerId: 'seller-001',
      categorySlug: 'makanan-minuman',
      subdistrictId: 'sub-liwa',
      activatedAt: daysAgo(5),
      expiresAt: daysFromNow(25),
      approvedById: admin.id,
      images: ['nasi-padang-a', 'nasi-padang-b'],
    },
    {
      id: 'ad-002',
      slug: 'kopi-robusta-lampung-balik-bukit-002',
      title: 'Kopi Robusta Lampung Pilihan',
      description:
        'Kopi robusta asli Lampung Barat, dipetik langsung dari kebun sendiri. Tersedia biji mentah dan sudah disangrai. Cita rasa kuat dengan sedikit rasa cokelat alami.',
      price: 150000,
      priceLabel: 'Per kg',
      status: AdStatus.ACTIVE,
      packageType: PackageType.PREMIUM,
      sortPriority: 1,
      sellerId: 'seller-002',
      categorySlug: 'makanan-minuman',
      subdistrictId: 'sub-balik-bukit',
      activatedAt: daysAgo(3),
      expiresAt: daysFromNow(27),
      approvedById: admin.id,
      images: ['kopi-a', 'kopi-b'],
    },

    // ── BASIC + ACTIVE (4) ──────────────────────────────────────────────────
    {
      id: 'ad-003',
      slug: 'baju-batik-lampung-sumber-jaya-003',
      title: 'Jual Baju Batik Lampung',
      description:
        'Berbagai motif batik khas Lampung. Bahan nyaman untuk acara formal maupun casual. Ukuran S, M, L, XL tersedia. Pengiriman ke seluruh wilayah Lampung Barat.',
      price: 85000,
      status: AdStatus.ACTIVE,
      packageType: PackageType.BASIC,
      sortPriority: 2,
      sellerId: 'seller-003',
      categorySlug: 'fashion-pakaian',
      subdistrictId: 'sub-sumber-jaya',
      activatedAt: daysAgo(10),
      expiresAt: daysFromNow(20),
      approvedById: admin.id,
      images: ['batik-a', 'batik-b'],
    },
    {
      id: 'ad-004',
      slug: 'service-hp-elektronik-liwa-004',
      title: 'Service HP & Elektronik',
      description:
        'Terima service HP semua merek, laptop, dan elektronik rumah tangga. Pengerjaan cepat dan bergaransi. Spare part original tersedia. Bisa panggil ke lokasi untuk wilayah Liwa.',
      price: null,
      status: AdStatus.ACTIVE,
      packageType: PackageType.BASIC,
      sortPriority: 2,
      sellerId: 'seller-004',
      categorySlug: 'elektronik',
      subdistrictId: 'sub-liwa',
      activatedAt: daysAgo(8),
      expiresAt: daysFromNow(22),
      approvedById: admin.id,
      images: ['service-hp-a'],
    },
    {
      id: 'ad-005',
      slug: 'sayuran-organik-way-tenong-005',
      title: 'Sayuran Organik Segar',
      description:
        'Sayuran organik tanpa pestisida. Tersedia bayam, kangkung, sawi, tomat, dan cabai. Dipanen pagi hari langsung ke tangan konsumen. Tersedia paket mingguan harga spesial.',
      price: 15000,
      priceLabel: 'Per ikat',
      status: AdStatus.ACTIVE,
      packageType: PackageType.BASIC,
      sortPriority: 2,
      sellerId: 'seller-005',
      categorySlug: 'pertanian-peternakan',
      subdistrictId: 'sub-way-tenong',
      activatedAt: daysAgo(7),
      expiresAt: daysFromNow(23),
      approvedById: admin.id,
      images: ['sayuran-a', 'sayuran-b'],
    },
    {
      id: 'ad-006',
      slug: 'les-privat-matematika-sekincau-006',
      title: 'Les Privat Matematika & IPA',
      description:
        'Guru berpengalaman 5 tahun menawarkan les privat Matematika dan IPA untuk SD, SMP, dan SMA. Metode belajar menyenangkan dan mudah dipahami. Bisa datang ke rumah siswa.',
      price: 150000,
      priceLabel: 'Per sesi',
      status: AdStatus.ACTIVE,
      packageType: PackageType.BASIC,
      sortPriority: 2,
      sellerId: 'seller-001',
      categorySlug: 'pendidikan-les',
      subdistrictId: 'sub-sekincau',
      activatedAt: daysAgo(12),
      expiresAt: daysFromNow(18),
      approvedById: admin.id,
      images: ['les-a'],
    },

    // ── FREE_TRIAL + ACTIVE (4) ─────────────────────────────────────────────
    {
      id: 'ad-007',
      slug: 'kerajinan-bambu-batu-brak-007',
      title: 'Kerajinan Tangan Bambu',
      description:
        'Kerajinan dari bambu pilihan: keranjang, vas bunga, hiasan dinding, dan furnitur mini. Cocok untuk souvenir dan dekorasi rumah. Terima pesanan sesuai keinginan.',
      price: 75000,
      priceLabel: 'Mulai dari',
      status: AdStatus.ACTIVE,
      packageType: PackageType.FREE_TRIAL,
      sortPriority: 3,
      sellerId: 'seller-002',
      categorySlug: 'furnitur-rumah-tangga',
      subdistrictId: 'sub-batu-brak',
      activatedAt: daysAgo(2),
      expiresAt: daysFromNow(5),
      approvedById: admin.id,
      images: ['bambu-a'],
    },
    {
      id: 'ad-008',
      slug: 'jasa-cuci-motor-liwa-008',
      title: 'Jasa Cuci Motor',
      description:
        'Cuci motor bersih dan wangi dalam 30 menit. Menggunakan sabun khusus yang tidak merusak cat. Bisa antar jemput wilayah Liwa kota. Buka setiap hari 08.00–17.00 WIB.',
      price: 20000,
      status: AdStatus.ACTIVE,
      packageType: PackageType.FREE_TRIAL,
      sortPriority: 3,
      sellerId: 'seller-003',
      categorySlug: 'jasa-layanan',
      subdistrictId: 'sub-liwa',
      activatedAt: daysAgo(1),
      expiresAt: daysFromNow(6),
      approvedById: admin.id,
      images: ['cuci-motor-a'],
    },
    {
      id: 'ad-009',
      slug: 'mebel-kayu-jati-liwa-009',
      title: 'Mebel Kayu Jati',
      description:
        'Mebel kayu jati berkualitas tinggi. Tersedia kursi, meja, lemari, dan tempat tidur. Bisa pesan sesuai ukuran dan desain. Pengerjaan 2–4 minggu tergantung kompleksitas.',
      price: null,
      status: AdStatus.ACTIVE,
      packageType: PackageType.FREE_TRIAL,
      sortPriority: 3,
      sellerId: 'seller-004',
      categorySlug: 'furnitur-rumah-tangga',
      subdistrictId: 'sub-liwa',
      activatedAt: daysAgo(3),
      expiresAt: daysFromNow(4),
      approvedById: admin.id,
      images: ['mebel-a', 'mebel-b'],
    },
    {
      id: 'ad-010',
      slug: 'cream-wajah-herbal-sumber-jaya-010',
      title: 'Cream Perawatan Wajah Herbal',
      description:
        'Cream wajah dari bahan herbal alami Lampung. Cocok untuk semua jenis kulit. Membantu mencerahkan dan melembabkan kulit secara alami. Sudah terdaftar BPOM.',
      price: 85000,
      status: AdStatus.ACTIVE,
      packageType: PackageType.FREE_TRIAL,
      sortPriority: 3,
      sellerId: 'seller-005',
      categorySlug: 'kesehatan-kecantikan',
      subdistrictId: 'sub-sumber-jaya',
      activatedAt: daysAgo(4),
      expiresAt: daysFromNow(3),
      approvedById: admin.id,
      images: ['cream-a'],
    },

    // ── PENDING (3) ─────────────────────────────────────────────────────────
    {
      id: 'ad-011',
      slug: 'ayam-kampung-kebun-tebu-011',
      title: 'Jual Ayam Kampung',
      description:
        'Ayam kampung asli dipelihara secara alami. Siap potong maupun hidup. Harga langsung dari peternak. Bisa pesan dalam jumlah banyak untuk acara atau arisan.',
      price: 80000,
      priceLabel: 'Per ekor',
      status: AdStatus.PENDING,
      packageType: PackageType.FREE_TRIAL,
      sortPriority: 3,
      sellerId: 'seller-001',
      categorySlug: 'pertanian-peternakan',
      subdistrictId: 'sub-kebun-tebu',
      images: ['ayam-a'],
    },
    {
      id: 'ad-012',
      slug: 'tas-rajut-handmade-way-tenong-012',
      title: 'Tas Rajut Handmade',
      description:
        'Tas rajut buatan tangan berbagai motif dan warna. Tali bisa dipanjang-pendekkan. Cocok untuk belanja harian maupun fashion. Terima pesanan custom warna dan ukuran.',
      price: 120000,
      priceLabel: 'Mulai dari',
      status: AdStatus.PENDING,
      packageType: PackageType.BASIC,
      sortPriority: 2,
      sellerId: 'seller-002',
      categorySlug: 'fashion-pakaian',
      subdistrictId: 'sub-way-tenong',
      images: ['tas-rajut-a'],
    },
    {
      id: 'ad-013',
      slug: 'catering-hajatan-balik-bukit-013',
      title: 'Jasa Catering Hajatan',
      description:
        'Menerima pesanan catering untuk pernikahan, sunatan, dan syukuran. Menu masakan Padang dan Jawa tersedia. Minimal 50 porsi. Sudah berpengalaman lebih dari 100 acara.',
      price: 35000,
      priceLabel: 'Per porsi',
      status: AdStatus.PENDING,
      packageType: PackageType.PREMIUM,
      sortPriority: 1,
      sellerId: 'seller-003',
      categorySlug: 'jasa-layanan',
      subdistrictId: 'sub-balik-bukit',
      images: ['catering-a', 'catering-b'],
    },

    // ── REJECTED (1) ────────────────────────────────────────────────────────
    {
      id: 'ad-014',
      slug: 'jual-hp-second-liwa-014',
      title: 'Jual HP Second Murah',
      description: 'HP second kondisi baik, baterai masih bagus. Harga bisa nego.',
      price: null,
      status: AdStatus.REJECTED,
      packageType: PackageType.FREE_TRIAL,
      sortPriority: 3,
      sellerId: 'seller-004',
      categorySlug: 'elektronik',
      subdistrictId: 'sub-liwa',
      rejectedAt: daysAgo(1),
      rejectedNote:
        'Deskripsi terlalu singkat. Mohon lengkapi informasi produk (merek, model, kondisi baterai, kelengkapan aksesori).',
      approvedById: admin.id,
      images: [],
    },

    // ── EXPIRED (2) ─────────────────────────────────────────────────────────
    {
      id: 'ad-015',
      slug: 'laptop-second-core-i5-liwa-015',
      title: 'Laptop Second Core i5',
      description:
        'Laptop bekas kondisi mulus. Core i5 generasi 8, RAM 8GB, SSD 256GB. Layar 14 inci, baterai tahan 4 jam. Cocok untuk kerja dan kuliah.',
      price: 4500000,
      status: AdStatus.EXPIRED,
      packageType: PackageType.FREE_TRIAL,
      sortPriority: 3,
      sellerId: 'seller-005',
      categorySlug: 'elektronik',
      subdistrictId: 'sub-liwa',
      activatedAt: daysAgo(40),
      expiresAt: daysAgo(33),
      approvedById: admin.id,
      images: ['laptop-a'],
    },
    {
      id: 'ad-016',
      slug: 'kue-basah-tradisional-sekincau-016',
      title: 'Kue Basah Tradisional',
      description:
        'Berbagai kue basah: klepon, onde-onde, lapis, dan putu. Dibuat setiap pagi dengan bahan segar. Terima pesanan untuk acara minimal 100 buah.',
      price: 2000,
      priceLabel: 'Per buah',
      status: AdStatus.EXPIRED,
      packageType: PackageType.FREE_TRIAL,
      sortPriority: 3,
      sellerId: 'seller-001',
      categorySlug: 'makanan-minuman',
      subdistrictId: 'sub-sekincau',
      activatedAt: daysAgo(38),
      expiresAt: daysAgo(31),
      approvedById: admin.id,
      images: ['kue-a'],
    },
  ];

  let adCount = 0;
  for (const { images, categorySlug, ...adData } of ads) {
    await prisma.ad.upsert({
      where: { id: adData.id },
      update: {},
      create: { ...adData, categoryId: catId(categorySlug) },
    });

    for (let i = 0; i < images.length; i++) {
      await prisma.adImage.upsert({
        where: { id: `img-${images[i]}` },
        update: {},
        create: {
          id: `img-${images[i]}`,
          adId: adData.id,
          url: img(images[i]),
          order: i,
        },
      });
    }
    adCount++;
  }
  console.log(`✅ ${adCount} ads seeded (10 ACTIVE, 3 PENDING, 1 REJECTED, 2 EXPIRED)`);

  // ─── Banners ────────────────────────────────────────────────────────────────
  const bannersData = [
    {
      id: 'banner-001',
      imageUrl: img('banner-promo'),
      altText: 'Promosi Iklan Unggulan LokalLapak',
      order: 0,
    },
    {
      id: 'banner-002',
      imageUrl: img('banner-premium'),
      altText: 'Pasang Iklan Premium — Tampil Paling Atas',
      order: 1,
    },
    {
      id: 'banner-003',
      imageUrl: img('banner-lokal'),
      altText: 'Produk Lokal Berkualitas dari Warga Sekitar',
      order: 2,
    },
  ];

  for (const banner of bannersData) {
    await prisma.banner.upsert({ where: { id: banner.id }, update: {}, create: banner });
  }
  console.log(`✅ ${bannersData.length} banners seeded`);

  console.log('\n🎉 Sample seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Sample seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
