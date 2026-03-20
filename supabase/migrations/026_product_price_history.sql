CREATE TABLE IF NOT EXISTS product_price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  harga_beli NUMERIC(15,2) NOT NULL,
  harga_jual NUMERIC(15,2) NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product
  ON product_price_history(product_id, created_at DESC);

ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage price history" ON product_price_history;
CREATE POLICY "Admin can manage price history"
  ON product_price_history
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated can read price history" ON product_price_history;
CREATE POLICY "Authenticated can read price history"
  ON product_price_history
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.harga_beli IS DISTINCT FROM NEW.harga_beli)
    OR (OLD.harga_jual IS DISTINCT FROM NEW.harga_jual) THEN
    INSERT INTO product_price_history (
      product_id,
      harga_beli,
      harga_jual,
      changed_by,
      keterangan
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.harga_beli, 0),
      COALESCE(NEW.harga_jual, 0),
      auth.uid(),
      'Update produk'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_price_change ON products;
CREATE TRIGGER trg_record_price_change
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION record_price_change();

INSERT INTO product_price_history (product_id, harga_beli, harga_jual, keterangan)
SELECT
  p.id,
  COALESCE(p.harga_beli, 0),
  COALESCE(p.harga_jual, 0),
  'Data awal migrasi'
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM product_price_history pph
  WHERE pph.product_id = p.id
);
