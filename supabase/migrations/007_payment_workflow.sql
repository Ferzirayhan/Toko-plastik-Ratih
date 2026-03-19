DROP VIEW IF EXISTS transactions_with_kasir;
DO $setup$
BEGIN
  DROP FUNCTION IF EXISTS create_transaction_atomic(JSONB, UUID, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, metode_bayar, DECIMAL, DECIMAL, TEXT);

  ALTER TYPE metode_bayar RENAME TO metode_bayar_old;

  CREATE TYPE metode_bayar AS ENUM ('tunai', 'transfer', 'qris');
  CREATE TYPE payment_status AS ENUM ('menunggu_konfirmasi', 'dibayar', 'gagal');

  ALTER TABLE transactions
    ALTER COLUMN metode_bayar TYPE metode_bayar
    USING (
      CASE
        WHEN metode_bayar::TEXT = 'debit' THEN 'transfer'::metode_bayar
        ELSE metode_bayar::TEXT::metode_bayar
      END
    );

  ALTER TABLE transactions
    ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'dibayar',
    ADD COLUMN paid_at TIMESTAMPTZ,
    ADD COLUMN confirmed_by UUID REFERENCES profiles(id),
    ADD COLUMN payment_reference TEXT;

  UPDATE transactions
  SET
    payment_status = 'dibayar',
    paid_at = COALESCE(created_at, NOW()),
    confirmed_by = kasir_id
  WHERE payment_status IS DISTINCT FROM 'dibayar';

  DROP TYPE metode_bayar_old;
END
$setup$;
