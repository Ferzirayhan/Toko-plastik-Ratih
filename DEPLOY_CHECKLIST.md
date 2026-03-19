# Checklist Deploy Production

## 1. Siapkan Supabase Cloud

- buat project Supabase baru
- jalankan semua migration ke project cloud
- jalankan seed data awal
- buat bucket storage `products`
- buat user admin pertama
- isi tabel `profiles` untuk admin

## 2. Environment Variables

Isi environment production:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## 3. Verifikasi Data Penting

- `store_settings` terisi
- metode pembayaran non-tunai sudah diatur
- nomor WhatsApp toko sudah diatur
- rekening transfer sudah diatur

## 4. Test Sebelum Go Live

- login admin
- login kasir
- transaksi tunai
- transaksi QRIS pending -> konfirmasi -> cetak struk
- transaksi transfer pending -> konfirmasi -> cetak struk
- pembatalan transaksi pending
- input produk
- adjust stok
- laporan dan export Excel

## 5. Deploy ke Vercel

- import repo GitHub ke Vercel
- isi environment variables
- deploy
- cek PWA manifest dan service worker

## 6. UAT Setelah Deploy

- buka dari desktop
- buka dari HP / tablet
- test install PWA
- test upload foto produk
- test printer browser
