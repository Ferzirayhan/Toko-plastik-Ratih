-- Enum untuk peran user
CREATE TYPE user_role AS ENUM ('admin', 'kasir');

-- Enum untuk satuan produk
CREATE TYPE satuan_type AS ENUM ('pcs', 'lusin', 'kg', 'meter', 'pack');

-- Enum untuk metode pembayaran
CREATE TYPE metode_bayar AS ENUM ('tunai', 'transfer', 'qris', 'debit');

-- Enum untuk status transaksi
CREATE TYPE status_transaksi AS ENUM ('selesai', 'batal');

-- Enum untuk jenis penyesuaian stok
CREATE TYPE jenis_adjustment AS ENUM ('masuk', 'keluar', 'koreksi', 'terjual');

-- Tabel profile untuk memperluas auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nama TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'kasir',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel kategori produk
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel produk
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  category_id INTEGER REFERENCES categories(id),
  satuan satuan_type DEFAULT 'pcs',
  harga_beli DECIMAL(15,2) DEFAULT 0,
  harga_jual DECIMAL(15,2) NOT NULL,
  stok INTEGER DEFAULT 0,
  stok_minimum INTEGER DEFAULT 5,
  foto_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel transaksi
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  nomor_nota TEXT UNIQUE NOT NULL,
  kasir_id UUID REFERENCES profiles(id),
  subtotal DECIMAL(15,2) NOT NULL,
  diskon_persen DECIMAL(5,2) DEFAULT 0,
  diskon_amount DECIMAL(15,2) DEFAULT 0,
  ppn_persen DECIMAL(5,2) DEFAULT 0,
  ppn_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  metode_bayar metode_bayar NOT NULL,
  uang_diterima DECIMAL(15,2),
  kembalian DECIMAL(15,2),
  catatan TEXT,
  status status_transaksi DEFAULT 'selesai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel item transaksi
CREATE TABLE transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  nama_produk TEXT NOT NULL,
  harga_satuan DECIMAL(15,2) NOT NULL,
  qty INTEGER NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL
);

-- Tabel histori penyesuaian stok
CREATE TABLE stock_adjustments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  user_id UUID REFERENCES profiles(id),
  jenis jenis_adjustment NOT NULL,
  jumlah_sebelum INTEGER NOT NULL,
  jumlah_perubahan INTEGER NOT NULL,
  jumlah_sesudah INTEGER NOT NULL,
  keterangan TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel pengaturan toko
CREATE TABLE store_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan RLS di semua tabel utama
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk profile
CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy untuk products
CREATE POLICY "Authenticated users can read products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy untuk categories
CREATE POLICY "Authenticated users can read categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy untuk transactions
CREATE POLICY "Authenticated users can manage transactions"
  ON transactions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy untuk transaction_items
CREATE POLICY "Authenticated users can manage transaction_items"
  ON transaction_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy untuk stock_adjustments
CREATE POLICY "Authenticated users can manage stock"
  ON stock_adjustments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy untuk settings
CREATE POLICY "Authenticated users can read settings"
  ON store_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Fungsi untuk update kolom updated_at otomatis
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger update products.updated_at
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger update profiles.updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger update store_settings.updated_at
CREATE TRIGGER store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fungsi untuk generate nomor nota otomatis
CREATE OR REPLACE FUNCTION generate_nomor_nota()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  counter INTEGER;
  nomor TEXT;
BEGIN
  today := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COUNT(*) + 1 INTO counter
  FROM transactions
  WHERE nomor_nota LIKE 'TRP-' || today || '-%';

  nomor := 'TRP-' || today || '-' || LPAD(counter::TEXT, 3, '0');
  RETURN nomor;
END;
$$ LANGUAGE plpgsql;

-- View produk beserta nama kategori dan status stok
CREATE VIEW products_with_category AS
SELECT
  p.*,
  c.nama AS category_nama,
  CASE
    WHEN p.stok = 0 THEN 'habis'
    WHEN p.stok <= p.stok_minimum THEN 'menipis'
    ELSE 'aman'
  END AS stok_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- View transaksi beserta nama kasir dan jumlah item
CREATE VIEW transactions_with_kasir AS
SELECT
  t.*,
  p.nama AS kasir_nama,
  COUNT(ti.id) AS jumlah_item
FROM transactions t
LEFT JOIN profiles p ON t.kasir_id = p.id
LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
GROUP BY t.id, p.nama;
