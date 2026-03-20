-- Add harga_beli snapshot to transaction items so profit stays historically accurate.
ALTER TABLE transaction_items
  ADD COLUMN IF NOT EXISTS harga_beli NUMERIC(15,2) NOT NULL DEFAULT 0;

UPDATE transaction_items ti
SET harga_beli = COALESCE(p.harga_beli, 0)
FROM products p
WHERE p.id = ti.product_id
  AND ti.harga_beli = 0;

ALTER TABLE transaction_items
  ADD COLUMN IF NOT EXISTS laba_kotor NUMERIC(15,2)
  GENERATED ALWAYS AS ((harga_satuan - harga_beli) * qty) STORED;
