CREATE OR REPLACE FUNCTION get_top_products(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id INTEGER,
  nama_produk TEXT,
  total_qty BIGINT,
  total_penjualan NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ti.product_id,
    ti.nama_produk,
    SUM(ti.qty)::BIGINT AS total_qty,
    SUM(ti.subtotal)::NUMERIC AS total_penjualan
  FROM transaction_items ti
  INNER JOIN transactions t ON t.id = ti.transaction_id
  WHERE
    t.status = 'selesai'
    AND t.payment_status = 'dibayar'
    AND t.created_at >= p_date_from
    AND t.created_at <= p_date_to
    AND ti.product_id IS NOT NULL
  GROUP BY ti.product_id, ti.nama_produk
  ORDER BY total_qty DESC
  LIMIT p_limit;
$$;
