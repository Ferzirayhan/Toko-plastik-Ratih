-- diskon_produk_persen: diskon tetap per produk (promo/sale), 0 = tidak ada diskon
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS diskon_produk_persen DECIMAL(5,2) DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_diskon_produk'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT check_diskon_produk
      CHECK (diskon_produk_persen >= 0 AND diskon_produk_persen < 100);
  END IF;
END $$;

-- Rebuild view so products_with_category reflects the new column
DROP VIEW IF EXISTS products_with_category;

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
