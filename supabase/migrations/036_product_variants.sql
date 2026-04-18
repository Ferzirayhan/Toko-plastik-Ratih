-- product_group_id: groups variant products together
-- root product: product_group_id IS NULL (standalone) or product_group_id = id (root of a group)
-- variant product: product_group_id = root_product.id
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_group_id INTEGER REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_group_id ON products(product_group_id)
  WHERE product_group_id IS NOT NULL;

-- Rebuild view to include product_group_id
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
