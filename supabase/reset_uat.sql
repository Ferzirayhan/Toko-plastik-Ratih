BEGIN;

-- Pertahankan akun default, hapus akun uji lain jika ada.
DELETE FROM public.profiles
WHERE username NOT IN ('admin', 'kasir1');

DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id
  FROM auth.users
  WHERE email NOT IN ('admin@ratih.com', 'kasir1@ratih.com')
);

DELETE FROM auth.users
WHERE email NOT IN ('admin@ratih.com', 'kasir1@ratih.com');

-- Kosongkan data operasional aplikasi.
TRUNCATE TABLE
  public.transaction_items,
  public.stock_adjustments,
  public.transactions
RESTART IDENTITY CASCADE;

TRUNCATE TABLE
  public.products,
  public.categories
RESTART IDENTITY CASCADE;

-- Kembalikan profile default ke kondisi aktif.
UPDATE public.profiles
SET
  nama = CASE
    WHEN username = 'admin' THEN 'Admin'
    WHEN username = 'kasir1' THEN 'Kasir 1'
    ELSE nama
  END,
  role = CASE
    WHEN username = 'admin' THEN 'admin'::public.user_role
    WHEN username = 'kasir1' THEN 'kasir'::public.user_role
    ELSE role
  END,
  is_active = true,
  updated_at = now()
WHERE username IN ('admin', 'kasir1');

-- Reset setting toko ke nilai awal.
TRUNCATE TABLE public.store_settings RESTART IDENTITY;

INSERT INTO public.store_settings (key, value) VALUES
  ('nama_toko', 'Tara Plastic'),
  ('alamat', 'Jl. Pasar Baru No. 12, Bekasi'),
  ('no_telp', '0812-3456-7890'),
  ('header_struk', 'Tara Plastic\nJl. Pasar Baru No. 12, Bekasi\nTelp: 0812-3456-7890'),
  ('footer_struk', 'Terima kasih telah berbelanja!\nBarang yang sudah dibeli tidak dapat dikembalikan.'),
  ('ppn_persen', '0'),
  ('payment_qris_label', 'QRIS Tara Plastic'),
  ('payment_transfer_label', 'Transfer Bank'),
  ('payment_transfer_account_name', 'Tara Plastic'),
  ('payment_transfer_account_number', ''),
  ('payment_transfer_bank', ''),
  ('payment_whatsapp_number', ''),
  ('payment_confirmation_note', 'Pastikan dana sudah masuk sebelum struk dicetak.'),
  ('versi_app', '1.0.0');

COMMIT;
