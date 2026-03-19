-- Pengaturan toko
INSERT INTO store_settings (key, value) VALUES
('nama_toko', 'Toko Plastik Ratih'),
('alamat', 'Jl. Pasar Baru No. 12, Bekasi'),
('no_telp', '0812-3456-7890'),
('header_struk', 'Toko Plastik Ratih\nJl. Pasar Baru No. 12, Bekasi\nTelp: 0812-3456-7890'),
('footer_struk', 'Terima kasih telah berbelanja!\nBarang yang sudah dibeli tidak dapat dikembalikan.'),
('ppn_persen', '0'),
('versi_app', '1.0.0');

-- Data kategori dan produk sengaja dikosongkan
-- agar admin bisa mengisi sendiri dari aplikasi.

-- Catatan pembuatan user auth
-- Email: admin@ratih.com | Password: Admin@123
-- Email: kasir1@ratih.com | Password: Kasir@123
-- Setelah user dibuat di dashboard, data profile bisa diinsert manual atau via trigger.
