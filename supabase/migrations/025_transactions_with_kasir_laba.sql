CREATE OR REPLACE VIEW transactions_with_kasir AS
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
