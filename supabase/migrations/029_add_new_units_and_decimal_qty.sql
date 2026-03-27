DROP VIEW IF EXISTS products_with_category;
DROP VIEW IF EXISTS transactions_with_kasir;

-- Drop generated column so we can alter qty
ALTER TABLE transaction_items DROP COLUMN IF EXISTS laba_kotor;

-- Add new units to satuan_type enum
ALTER TYPE satuan_type ADD VALUE IF NOT EXISTS 'gram';
ALTER TYPE satuan_type ADD VALUE IF NOT EXISTS 'dus';
ALTER TYPE satuan_type ADD VALUE IF NOT EXISTS 'ikat';
ALTER TYPE satuan_type ADD VALUE IF NOT EXISTS 'bal';
ALTER TYPE satuan_type ADD VALUE IF NOT EXISTS 'roll';
ALTER TYPE satuan_type ADD VALUE IF NOT EXISTS 'batang';
ALTER TYPE satuan_type ADD VALUE IF NOT EXISTS 'lembar';

-- Alter columns to numeric(12,3) to support fractional qty (up to 3 decimal places)
ALTER TABLE products ALTER COLUMN stok TYPE NUMERIC(12,3) USING stok::NUMERIC(12,3);
ALTER TABLE products ALTER COLUMN stok_minimum TYPE NUMERIC(12,3) USING stok_minimum::NUMERIC(12,3);

ALTER TABLE transaction_items ALTER COLUMN qty TYPE NUMERIC(12,3) USING qty::NUMERIC(12,3);

ALTER TABLE stock_adjustments ALTER COLUMN jumlah_sebelum TYPE NUMERIC(12,3) USING jumlah_sebelum::NUMERIC(12,3);
ALTER TABLE stock_adjustments ALTER COLUMN jumlah_perubahan TYPE NUMERIC(12,3) USING jumlah_perubahan::NUMERIC(12,3);
ALTER TABLE stock_adjustments ALTER COLUMN jumlah_sesudah TYPE NUMERIC(12,3) USING jumlah_sesudah::NUMERIC(12,3);

-- Restore generated column
ALTER TABLE transaction_items
  ADD COLUMN laba_kotor NUMERIC(15,2)
  GENERATED ALWAYS AS ((harga_satuan - harga_beli) * qty) STORED;

-- Recreate views
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

CREATE VIEW transactions_with_kasir AS
SELECT
  t.*,
  p.nama AS kasir_nama,
  confirmer.nama AS confirmed_by_nama,
  COUNT(ti.id) AS jumlah_item,
  COALESCE(SUM(ti.laba_kotor), 0)::NUMERIC(15,2) AS laba_kotor
FROM transactions t
LEFT JOIN profiles p ON t.kasir_id = p.id
LEFT JOIN profiles confirmer ON t.confirmed_by = confirmer.id
LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
GROUP BY t.id, p.nama, confirmer.nama;
