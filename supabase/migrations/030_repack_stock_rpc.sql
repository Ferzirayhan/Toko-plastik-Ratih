CREATE OR REPLACE FUNCTION repack_stock_atomic(
  p_source_product_id INTEGER,
  p_target_product_id INTEGER,
  p_source_qty NUMERIC(12,3),
  p_target_qty NUMERIC(12,3),
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_product products%ROWTYPE;
  v_target_product products%ROWTYPE;
  v_source_stock_before NUMERIC(12,3);
  v_target_stock_before NUMERIC(12,3);
BEGIN
  -- Verify user
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID harus disertakan';
  END IF;

  -- Lock products for update
  SELECT *
  INTO v_source_product
  FROM products
  WHERE id = p_source_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk sumber tidak ditemukan';
  END IF;

  SELECT *
  INTO v_target_product
  FROM products
  WHERE id = p_target_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk tujuan tidak ditemukan';
  END IF;

  v_source_stock_before := COALESCE(v_source_product.stok, 0);
  v_target_stock_before := COALESCE(v_target_product.stok, 0);

  IF v_source_stock_before < p_source_qty THEN
    RAISE EXCEPTION 'Stok produk sumber tidak mencukupi';
  END IF;

  -- Update stok
  UPDATE products
  SET stok = v_source_stock_before - p_source_qty
  WHERE id = p_source_product_id;

  UPDATE products
  SET stok = v_target_stock_before + p_target_qty
  WHERE id = p_target_product_id;

  -- Insert stock adjustments (keluar untuk sumber, masuk untuk tujuan)
  INSERT INTO stock_adjustments (
    product_id,
    user_id,
    jenis,
    jumlah_sebelum,
    jumlah_perubahan,
    jumlah_sesudah,
    keterangan
  )
  VALUES (
    p_source_product_id,
    p_user_id,
    'keluar',
    v_source_stock_before,
    -p_source_qty,
    v_source_stock_before - p_source_qty,
    'Pecah stok ke ' || v_target_product.nama
  );

  INSERT INTO stock_adjustments (
    product_id,
    user_id,
    jenis,
    jumlah_sebelum,
    jumlah_perubahan,
    jumlah_sesudah,
    keterangan
  )
  VALUES (
    p_target_product_id,
    p_user_id,
    'masuk',
    v_target_stock_before,
    p_target_qty,
    v_target_stock_before + p_target_qty,
    'Hasil pecah stok dari ' || v_source_product.nama
  );

  RETURN jsonb_build_object(
    'success', true,
    'source_stock', v_source_stock_before - p_source_qty,
    'target_stock', v_target_stock_before + p_target_qty
  );
END;
$$;
