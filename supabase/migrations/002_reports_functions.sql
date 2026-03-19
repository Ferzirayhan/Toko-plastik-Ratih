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
  GROUP BY DATE(created_at)
  ORDER BY tanggal
$$ LANGUAGE sql;
