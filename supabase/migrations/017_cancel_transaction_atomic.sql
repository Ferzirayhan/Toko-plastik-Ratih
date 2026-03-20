CREATE OR REPLACE FUNCTION cancel_transaction_atomic(
  p_transaction_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction transactions%ROWTYPE;
  v_item transaction_items%ROWTYPE;
  v_product products%ROWTYPE;
  v_current_user UUID := auth.uid();
BEGIN
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'User belum terautentikasi';
  END IF;

  SELECT *
  INTO v_transaction
  FROM transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan';
  END IF;

  IF v_transaction.status = 'batal' THEN
    RETURN jsonb_build_object(
      'transaction_id', v_transaction.id,
      'status', v_transaction.status
    );
  END IF;

  IF NOT (is_admin() OR v_transaction.kasir_id = v_current_user) THEN
    RAISE EXCEPTION 'Anda tidak berhak membatalkan transaksi ini';
  END IF;

  FOR v_item IN
    SELECT *
    FROM transaction_items
    WHERE transaction_id = p_transaction_id
    ORDER BY id
  LOOP
    IF v_item.product_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT *
    INTO v_product
    FROM products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk untuk item transaksi tidak ditemukan';
    END IF;

    UPDATE products
    SET stok = COALESCE(stok, 0) + v_item.qty
    WHERE id = v_item.product_id;

    INSERT INTO stock_adjustments (
      product_id,
      user_id,
      jenis,
      jumlah_sebelum,
      jumlah_perubahan,
      jumlah_sesudah,
      keterangan,
      reference_id
    )
    VALUES (
      v_item.product_id,
      v_current_user,
      'masuk',
      COALESCE(v_product.stok, 0),
      v_item.qty,
      COALESCE(v_product.stok, 0) + v_item.qty,
      'Pembatalan transaksi ' || v_transaction.nomor_nota,
      p_transaction_id::TEXT
    );
  END LOOP;

  UPDATE transactions
  SET status = 'batal'
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object(
    'transaction_id', p_transaction_id,
    'status', 'batal'
  );
END;
$$;
