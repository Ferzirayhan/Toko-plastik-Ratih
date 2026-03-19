CREATE OR REPLACE FUNCTION get_sales_by_date(date_from DATE, date_to DATE)
RETURNS TABLE(tanggal DATE, total_penjualan DECIMAL, jumlah_transaksi BIGINT)
AS $$
  SELECT
    DATE(created_at) AS tanggal,
    SUM(total) AS total_penjualan,
    COUNT(*) AS jumlah_transaksi
  FROM transactions
  WHERE DATE(created_at) BETWEEN date_from AND date_to
    AND status = 'selesai'
    AND payment_status = 'dibayar'
  GROUP BY DATE(created_at)
  ORDER BY tanggal
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_today_end TIMESTAMPTZ := v_today_start + INTERVAL '1 day';
  v_total_penjualan DECIMAL := 0;
  v_jumlah_transaksi BIGINT := 0;
  v_stok_menipis BIGINT := 0;
  v_produk_terlaris JSONB := NULL;
BEGIN
  SELECT
    COALESCE(SUM(total), 0),
    COUNT(*)
  INTO v_total_penjualan, v_jumlah_transaksi
  FROM transactions
  WHERE created_at >= v_today_start
    AND created_at < v_today_end
    AND status = 'selesai'
    AND payment_status = 'dibayar';

  SELECT COUNT(*)
  INTO v_stok_menipis
  FROM products
  WHERE stok <= stok_minimum
    AND is_active = true;

  SELECT jsonb_build_object(
    'product_id', ranked.product_id,
    'nama', ranked.nama_produk,
    'qty', ranked.total_qty
  )
  INTO v_produk_terlaris
  FROM (
    SELECT
      ti.product_id,
      ti.nama_produk,
      SUM(ti.qty) AS total_qty
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.created_at >= v_today_start
      AND t.created_at < v_today_end
      AND t.status = 'selesai'
      AND t.payment_status = 'dibayar'
    GROUP BY ti.product_id, ti.nama_produk
    ORDER BY SUM(ti.qty) DESC
    LIMIT 1
  ) ranked;

  RETURN jsonb_build_object(
    'total_penjualan_hari_ini', v_total_penjualan,
    'jumlah_transaksi_hari_ini', v_jumlah_transaksi,
    'jumlah_produk_stok_menipis', v_stok_menipis,
    'produk_terlaris_hari_ini', v_produk_terlaris
  );
END;
$$;

INSERT INTO store_settings (key, value)
VALUES
  ('payment_qris_label', 'QRIS Toko Plastik Ratih'),
  ('payment_transfer_label', 'Transfer Bank'),
  ('payment_transfer_account_name', 'Toko Plastik Ratih'),
  ('payment_transfer_account_number', ''),
  ('payment_transfer_bank', ''),
  ('payment_whatsapp_number', ''),
  ('payment_confirmation_note', 'Pastikan dana sudah masuk sebelum struk dicetak.')
ON CONFLICT (key) DO NOTHING;
