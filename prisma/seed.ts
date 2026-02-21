import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@lokallappak.com' },
    update: {},
    create: {
      email: 'admin@lokallappak.com',
      passwordHash,
      name: 'Admin LokalLapak',
    },
  });
  console.log('✅ Admin user created: admin@lokallappak.com');

  // ─── Categories ────────────────────────────────────────────────────────────
  const categories = [
    { name: 'Makanan & Minuman', slug: 'makanan-minuman' },
    { name: 'Fashion & Pakaian', slug: 'fashion-pakaian' },
    { name: 'Elektronik', slug: 'elektronik' },
    { name: 'Pertanian & Peternakan', slug: 'pertanian-peternakan' },
    { name: 'Jasa & Layanan', slug: 'jasa-layanan' },
    { name: 'Kesehatan & Kecantikan', slug: 'kesehatan-kecantikan' },
    { name: 'Pendidikan & Les', slug: 'pendidikan-les' },
    { name: 'Furnitur & Rumah Tangga', slug: 'furnitur-rumah-tangga' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // ─── Location Data ─────────────────────────────────────────────────────────

  // Kabupaten Lampung Barat
  const lampungBarat = await prisma.regency.upsert({
    where: { id: 'regency-lampung-barat' },
    update: {},
    create: {
      id: 'regency-lampung-barat',
      name: 'Kabupaten Lampung Barat',
    },
  });

  const lampungBaratSubdistricts = [
    {
      id: 'sub-liwa',
      name: 'Liwa',
      lat: -4.8333,
      lng: 103.9167,
      villages: ['Pasar Liwa', 'Padang Cahya', 'Sebarus', 'Batu Ngimba', 'Tanjung Raya'],
    },
    {
      id: 'sub-balik-bukit',
      name: 'Balik Bukit',
      lat: -4.85,
      lng: 103.9,
      villages: ['Kubu Perahu', 'Kota Besi', 'Bahway', 'Padang Dalom', 'Gunung Sugih'],
    },
    {
      id: 'sub-sumber-jaya',
      name: 'Sumber Jaya',
      lat: -4.6,
      lng: 103.9833,
      villages: ['Sumber Jaya', 'Way Petai', 'Sukaraja', 'Tugusari', 'Trimulyo'],
    },
    {
      id: 'sub-way-tenong',
      name: 'Way Tenong',
      lat: -5.0167,
      lng: 104.1833,
      villages: ['Mutar Alam', 'Sukanegeri', 'Cahaya Negeri', 'Karang Rejo', 'Sri Mulyo'],
    },
    {
      id: 'sub-batu-brak',
      name: 'Batu Brak',
      lat: -5.0,
      lng: 104.0833,
      villages: ['Kenali', 'Pekon Balak', 'Canggu', 'Sumber Rejo', 'Pampangan'],
    },
    {
      id: 'sub-sekincau',
      name: 'Sekincau',
      lat: -4.9167,
      lng: 104.05,
      villages: ['Sekincau', 'Giham Sukamaju', 'Lombok', 'Cipta Waras', 'Pagar Dewa'],
    },
    {
      id: 'sub-kebun-tebu',
      name: 'Kebun Tebu',
      lat: -4.8,
      lng: 104.1,
      villages: [
        'Purajaya',
        'Sinar Luas',
        'Tribudisyukur',
        'Muara Jaya 1',
        'Muara Jaya 2',
        'Purawiwitan',
        'Budi Makmur',
      ],
    },
  ];

  for (const sub of lampungBaratSubdistricts) {
    const { villages, ...subData } = sub;
    const subdistrict = await prisma.subdistrict.upsert({
      where: { id: subData.id },
      update: {},
      create: { ...subData, regencyId: lampungBarat.id },
    });

    for (const villageName of villages) {
      const villageId = `village-${subdistrict.id}-${villageName.toLowerCase().replace(/\s+/g, '-')}`;
      await prisma.village.upsert({
        where: { id: villageId },
        update: {},
        create: {
          id: villageId,
          name: villageName,
          subdistrictId: subdistrict.id,
        },
      });
    }
  }
  console.log(`✅ Lampung Barat: ${lampungBaratSubdistricts.length} subdistricts seeded`);

  // Kota Tanjung Pinang
  const tanjungPinang = await prisma.regency.upsert({
    where: { id: 'regency-tanjung-pinang' },
    update: {},
    create: {
      id: 'regency-tanjung-pinang',
      name: 'Kota Tanjung Pinang',
    },
  });

  const tanjungPinangSubdistricts = [
    {
      id: 'sub-tpi-kota',
      name: 'Tanjungpinang Kota',
      lat: 0.9167,
      lng: 104.4567,
      villages: ['Kampung Bugis', 'Tanjungpinang Kota', 'Penyengat', 'Senggarang'],
    },
    {
      id: 'sub-tpi-timur',
      name: 'Tanjungpinang Timur',
      lat: 0.9333,
      lng: 104.4833,
      villages: ['Batu IX', 'Mekar Jaya', 'Pinang Kencana', 'Kampung Bulang'],
    },
    {
      id: 'sub-tpi-barat',
      name: 'Tanjungpinang Barat',
      lat: 0.9167,
      lng: 104.42,
      villages: ['Bukit Cermin', 'Kampung Baru', 'Tanjung Unggat', 'Sei Jang'],
    },
    {
      id: 'sub-bukit-bestari',
      name: 'Bukit Bestari',
      lat: 0.95,
      lng: 104.4833,
      villages: ['Dompak', 'Air Raja', 'Pinang Kencana Indah', 'Batu Sembilan'],
    },
  ];

  for (const sub of tanjungPinangSubdistricts) {
    const { villages, ...subData } = sub;
    const subdistrict = await prisma.subdistrict.upsert({
      where: { id: subData.id },
      update: {},
      create: { ...subData, regencyId: tanjungPinang.id },
    });

    for (const villageName of villages) {
      const villageId = `village-${subdistrict.id}-${villageName.toLowerCase().replace(/\s+/g, '-')}`;
      await prisma.village.upsert({
        where: { id: villageId },
        update: {},
        create: {
          id: villageId,
          name: villageName,
          subdistrictId: subdistrict.id,
        },
      });
    }
  }
  console.log(`✅ Tanjung Pinang: ${tanjungPinangSubdistricts.length} subdistricts seeded`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
