# Toko Plastik Ratih POS

Aplikasi Point of Sale untuk Toko Plastik Ratih berbasis React, TypeScript, Tailwind CSS, dan Supabase local.

## Stack

- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS v3
- State management: Zustand
- Routing: React Router v6
- Backend: Supabase local
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth email/password
- Storage: Supabase Storage
- Charts: Recharts
- Form: React Hook Form + Zod
- Print: react-to-print
- Export Excel: xlsx

## Prerequisites

- Node.js 18+
- npm 9+
- Docker Desktop atau Colima
- Supabase CLI

## Menjalankan Supabase Local

Jika memakai Colima:

```bash
colima start
```

Masuk ke folder project:

```bash
cd /Users/ezi/Downloads/Html-css\ TPR/toko-plastik-ratih-pos
```

Jalankan Supabase local:

```bash
supabase start
```

Salin `ANON_KEY` dari output:

```bash
supabase status -o env
```

Isi file `.env.local`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Jalankan migration + seed:

```bash
supabase db reset
```

## Menjalankan Frontend

Install dependency jika belum:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Supabase Studio: [http://localhost:54323](http://localhost:54323)

## Default Credentials

Gunakan akun berikut setelah user dibuat di Supabase Auth:

- Admin: `admin@ratih.com` / `Admin@123`
- Kasir: `kasir1@ratih.com` / `Kasir@123`

## Cara Membuat User Admin / Kasir

1. Buka Supabase Studio di [http://localhost:54323](http://localhost:54323)
2. Masuk ke `Authentication > Users`
3. Klik `Add user`
4. Buat akun email/password
5. Salin UUID user tersebut
6. Masuk ke `Table Editor > profiles`
7. Tambahkan row baru:

```sql
INSERT INTO profiles (id, nama, username, role, is_active)
VALUES
('UUID_USER', 'Nama Pengguna', 'username', 'kasir', true);
```

## Storage Bucket Produk

Buat bucket untuk foto produk di Supabase Studio:

1. Buka `Storage`
2. Klik `New bucket`
3. Nama bucket: `products`
4. Public: `true`
5. Allowed MIME types:
   - `image/jpeg`
   - `image/png`
   - `image/webp`

## Urutan Setup yang Disarankan

1. `colima start`
2. `supabase start`
3. Copy `ANON_KEY` ke `.env.local`
4. `supabase db reset`
5. Buka Supabase Studio dan buat user admin + kasir
6. Tambahkan row ke tabel `profiles`
7. `npm run dev`
8. Login ke aplikasi

## Struktur Folder Penting

```text
src/
  api/
  components/
  hooks/
  lib/
  pages/
  stores/
  types/
  utils/
supabase/
  migrations/
  seed.sql
```

## Script Penting

```bash
npm run dev
npm run build
npm run lint
supabase start
supabase db reset
```

## Catatan

- Function laporan `get_sales_by_date` ada di migration `002_reports_functions.sql`, jadi setelah update migration jalankan lagi `supabase db reset`.
- Untuk operasi admin Auth seperti `createUser` atau `updateUserById`, aplikasi client ini sengaja tidak memakai `service_role` demi keamanan. Gunakan Supabase Studio untuk pembuatan user baru.
