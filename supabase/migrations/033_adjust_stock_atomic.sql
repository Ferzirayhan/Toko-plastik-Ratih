CREATE OR REPLACE FUNCTION adjust_stock_atomic(
  p_product_id INTEGER,
  p_jenis TEXT,
  p_jumlah NUMERIC(12,3),
  p_keterangan TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_stok_sebelum NUMERIC(12,3);
  v_stok_sesudah NUMERIC(12,3);
  v_jumlah_perubahan NUMERIC(12,3);
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID harus disertakan';
  END IF;

  IF p_jenis NOT IN ('masuk', 'keluar', 'koreksi') THEN
    RAISE EXCEPTION 'Jenis penyesuaian tidak valid: %', p_jenis;
  END IF;

  -- Lock row to prevent concurrent updates
  SELECT *
  INTO v_product
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk tidak ditemukan';
  END IF;

  v_stok_sebelum := COALESCE(v_product.stok, 0);

  IF p_jenis = 'koreksi' THEN
    v_stok_sesudah := GREATEST(0, p_jumlah);
    v_jumlah_perubahan := v_stok_sesudah - v_stok_sebelum;
  ELSIF p_jenis = 'keluar' THEN
    v_jumlah_perubahan := -ABS(p_jumlah);
    v_stok_sesudah := GREATEST(0, v_stok_sebelum + v_jumlah_perubahan);
  ELSE
    v_jumlah_perubahan := ABS(p_jumlah);
    v_stok_sesudah := GREATEST(0, v_stok_sebelum + v_jumlah_perubahan);
  END IF;

  UPDATE products
  SET stok = v_stok_sesudah
  WHERE id = p_product_id;

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
    p_product_id,
    p_user_id,
    p_jenis,
    v_stok_sebelum,
    v_jumlah_perubahan,
    v_stok_sesudah,
    p_keterangan
  );

  RETURN jsonb_build_object(
    'stok_sebelum', v_stok_sebelum,
    'stok_sesudah', v_stok_sesudah,
    'jumlah_perubahan', v_jumlah_perubahan
  );
END;
$$;

GRANT EXECUTE ON FUNCTION adjust_stock_atomic(INTEGER, TEXT, NUMERIC, TEXT, UUID) TO authenticated;
