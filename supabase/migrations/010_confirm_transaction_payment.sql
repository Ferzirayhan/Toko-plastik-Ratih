CREATE OR REPLACE FUNCTION confirm_transaction_payment(
  p_transaction_id INTEGER,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction transactions%ROWTYPE;
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
    RAISE EXCEPTION 'Transaksi sudah dibatalkan';
  END IF;

  IF NOT (is_admin() OR v_transaction.kasir_id = v_current_user) THEN
    RAISE EXCEPTION 'Anda tidak berhak mengonfirmasi transaksi ini';
  END IF;

  IF v_transaction.payment_status = 'dibayar' THEN
    RETURN jsonb_build_object(
      'transaction_id', v_transaction.id,
      'payment_status', v_transaction.payment_status
    );
  END IF;

  UPDATE transactions
  SET
    payment_status = 'dibayar',
    paid_at = NOW(),
    confirmed_by = v_current_user,
    payment_reference = NULLIF(p_payment_reference, '')
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object(
    'transaction_id', p_transaction_id,
    'payment_status', 'dibayar'
  );
END;
$$;
