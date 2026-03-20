CREATE OR REPLACE FUNCTION get_profit_summary(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ
)
RETURNS TABLE (
  tanggal DATE,
  total_omzet NUMERIC,
  total_hpp NUMERIC,
  total_laba NUMERIC,
  jumlah_transaksi BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(t.created_at AT TIME ZONE 'Asia/Jakarta') AS tanggal,
    SUM(t.total) AS total_omzet,
    SUM(ti_agg.total_hpp) AS total_hpp,
    SUM(t.total) - SUM(ti_agg.total_hpp) AS total_laba,
    COUNT(DISTINCT t.id) AS jumlah_transaksi
  FROM transactions t
  INNER JOIN (
    SELECT
      transaction_id,
      SUM(harga_beli * qty) AS total_hpp
    FROM transaction_items
    GROUP BY transaction_id
  ) ti_agg ON ti_agg.transaction_id = t.id
  WHERE
    t.status = 'selesai'
    AND t.payment_status = 'dibayar'
    AND t.created_at >= p_date_from
    AND t.created_at <= p_date_to
  GROUP BY DATE(t.created_at AT TIME ZONE 'Asia/Jakarta')
  ORDER BY tanggal ASC;
$$;
