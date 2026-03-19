GRANT EXECUTE ON FUNCTION create_transaction_atomic(
  JSONB,
  UUID,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  metode_bayar,
  DECIMAL,
  DECIMAL,
  TEXT
) TO authenticated;
