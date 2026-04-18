-- product_discount_tiers: tier diskon berdasarkan qty
CREATE TABLE IF NOT EXISTS product_discount_tiers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_qty DECIMAL(10,3) NOT NULL,
  diskon_persen DECIMAL(5,2) NOT NULL,
  CONSTRAINT check_diskon_persen CHECK (diskon_persen > 0 AND diskon_persen <= 100),
  CONSTRAINT check_min_qty CHECK (min_qty > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_discount_tiers_product_id ON product_discount_tiers(product_id);

ALTER TABLE product_discount_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_manage_discount_tiers" ON product_discount_tiers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- diskon_item_persen: simpan tier diskon yang dipakai per item transaksi
ALTER TABLE transaction_items
  ADD COLUMN IF NOT EXISTS diskon_item_persen DECIMAL(5,2) DEFAULT 0;

-- bulk_update_product_prices: update harga banyak produk sekaligus
CREATE OR REPLACE FUNCTION bulk_update_product_prices(
  p_updates JSONB,
  p_keterangan TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_product_id INTEGER;
  v_harga_beli DECIMAL;
  v_harga_jual DECIMAL;
  v_old_harga_beli DECIMAL;
  v_old_harga_jual DECIMAL;
  v_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Harus login untuk melakukan operasi ini';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_updates)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_harga_beli := NULLIF(v_item->>'harga_beli', '')::DECIMAL;
    v_harga_jual := NULLIF(v_item->>'harga_jual', '')::DECIMAL;

    SELECT harga_beli, harga_jual INTO v_old_harga_beli, v_old_harga_jual
    FROM products WHERE id = v_product_id;

    IF NOT FOUND THEN CONTINUE; END IF;

    UPDATE products
    SET
      harga_beli = COALESCE(v_harga_beli, harga_beli),
      harga_jual = COALESCE(v_harga_jual, harga_jual),
      updated_at = NOW()
    WHERE id = v_product_id;

    INSERT INTO product_price_history (product_id, harga_beli, harga_jual, changed_by, keterangan)
    VALUES (
      v_product_id,
      COALESCE(v_harga_beli, v_old_harga_beli),
      COALESCE(v_harga_jual, v_old_harga_jual),
      COALESCE(p_user_id, auth.uid()),
      p_keterangan
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION bulk_update_product_prices(JSONB, TEXT, UUID) TO authenticated;

-- Update create_transaction_atomic untuk menyimpan diskon_item_persen per item
CREATE OR REPLACE FUNCTION create_transaction_atomic(
  p_items JSONB,
  p_kasir_id UUID,
  p_subtotal DECIMAL,
  p_diskon_persen DECIMAL,
  p_diskon_amount DECIMAL,
  p_ppn_persen DECIMAL,
  p_ppn_amount DECIMAL,
  p_total DECIMAL,
  p_metode_bayar metode_bayar,
  p_uang_diterima DECIMAL,
  p_kembalian DECIMAL,
  p_catatan TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id INTEGER;
  v_nomor_nota TEXT;
  v_product RECORD;
  v_item JSONB;
  v_items JSONB;
  v_current_user UUID := auth.uid();
  v_product_id INTEGER;
  v_qty DECIMAL;
  v_harga_satuan DECIMAL;
  v_subtotal_item DECIMAL;
  v_nama_produk TEXT;
  v_diskon_item_persen DECIMAL;
  v_payment_status payment_status;
  v_paid_at TIMESTAMPTZ;
  v_confirmed_by UUID;
BEGIN
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'User belum terautentikasi';
  END IF;

  IF p_kasir_id IS NULL OR p_kasir_id <> v_current_user THEN
    RAISE EXCEPTION 'Kasir transaksi tidak valid';
  END IF;

  v_items := CASE
    WHEN p_items IS NULL THEN NULL
    WHEN jsonb_typeof(p_items) = 'string' THEN (p_items #>> '{}')::JSONB
    ELSE p_items
  END;

  IF v_items IS NULL OR jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang transaksi tidak boleh kosong';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::INTEGER;
    v_qty := NULLIF(v_item->>'qty', '')::DECIMAL;

    IF v_product_id IS NULL OR v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Item transaksi tidak valid';
    END IF;

    SELECT id, nama, stok, is_active, harga_beli
    INTO v_product
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan', v_product_id;
    END IF;

    IF COALESCE(v_product.is_active, false) = false THEN
      RAISE EXCEPTION 'Produk % sudah tidak aktif', v_product.nama;
    END IF;

    IF COALESCE(v_product.stok, 0) < v_qty THEN
      RAISE EXCEPTION 'Stok untuk % tidak mencukupi', v_product.nama;
    END IF;
  END LOOP;

  v_nomor_nota := generate_nomor_nota();

  IF p_metode_bayar = 'tunai' THEN
    v_payment_status := 'dibayar';
    v_paid_at := NOW();
    v_confirmed_by := p_kasir_id;
  ELSE
    v_payment_status := 'menunggu_konfirmasi';
    v_paid_at := NULL;
    v_confirmed_by := NULL;
  END IF;

  INSERT INTO transactions (
    nomor_nota, kasir_id, subtotal, diskon_persen, diskon_amount,
    ppn_persen, ppn_amount, total, metode_bayar, uang_diterima,
    kembalian, catatan, payment_status, paid_at, confirmed_by
  )
  VALUES (
    v_nomor_nota, p_kasir_id,
    COALESCE(p_subtotal, 0), COALESCE(p_diskon_persen, 0), COALESCE(p_diskon_amount, 0),
    COALESCE(p_ppn_persen, 0), COALESCE(p_ppn_amount, 0), COALESCE(p_total, 0),
    p_metode_bayar,
    CASE WHEN p_metode_bayar = 'tunai' THEN p_uang_diterima ELSE NULL END,
    CASE WHEN p_metode_bayar = 'tunai' THEN p_kembalian ELSE 0 END,
    p_catatan, v_payment_status, v_paid_at, v_confirmed_by
  )
  RETURNING id INTO v_transaction_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::INTEGER;
    v_qty := NULLIF(v_item->>'qty', '')::DECIMAL;
    v_harga_satuan := COALESCE(NULLIF(v_item->>'harga_satuan', '')::DECIMAL, 0);
    v_subtotal_item := COALESCE(NULLIF(v_item->>'subtotal', '')::DECIMAL, 0);
    v_nama_produk := COALESCE(NULLIF(v_item->>'nama_produk', ''), 'Produk');
    v_diskon_item_persen := COALESCE(NULLIF(v_item->>'diskon_item_persen', '')::DECIMAL, 0);

    SELECT id, nama, stok, harga_beli
    INTO v_product
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    INSERT INTO transaction_items (
      transaction_id, product_id, nama_produk, harga_satuan, harga_beli,
      qty, subtotal, diskon_item_persen
    )
    VALUES (
      v_transaction_id, v_product_id, v_nama_produk, v_harga_satuan,
      COALESCE(v_product.harga_beli, 0), v_qty, v_subtotal_item, v_diskon_item_persen
    );

    UPDATE products
    SET stok = COALESCE(stok, 0) - v_qty
    WHERE id = v_product_id;

    INSERT INTO stock_adjustments (
      product_id, user_id, jenis, jumlah_sebelum, jumlah_perubahan, jumlah_sesudah,
      keterangan, reference_id
    )
    VALUES (
      v_product_id, p_kasir_id, 'terjual',
      COALESCE(v_product.stok, 0), -v_qty, COALESCE(v_product.stok, 0) - v_qty,
      'Penjualan ' || v_nomor_nota, v_transaction_id::TEXT
    );
  END LOOP;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'nomor_nota', v_nomor_nota,
    'payment_status', v_payment_status
  );
END;
$$;
