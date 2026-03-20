CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read audit logs" ON audit_logs;
CREATE POLICY "Admin can read audit logs"
  ON audit_logs
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Authenticated can insert own audit logs" ON audit_logs;
CREATE POLICY "Authenticated can insert own audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE OR REPLACE FUNCTION insert_audit_log(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    description,
    metadata
  )
  VALUES (
    p_user_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_description,
    COALESCE(p_metadata, '{}'::JSONB)
  );
END;
$$;

CREATE OR REPLACE FUNCTION log_transaction_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM insert_audit_log(
      NEW.kasir_id,
      'transaction',
      NEW.id::TEXT,
      'transaction_created',
      'Transaksi ' || NEW.nomor_nota || ' dibuat.',
      jsonb_build_object(
        'nomor_nota', NEW.nomor_nota,
        'total', NEW.total,
        'metode_bayar', NEW.metode_bayar,
        'payment_status', NEW.payment_status
      )
    );
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'batal' THEN
    PERFORM insert_audit_log(
      COALESCE(auth.uid(), NEW.kasir_id),
      'transaction',
      NEW.id::TEXT,
      'transaction_cancelled',
      'Transaksi ' || NEW.nomor_nota || ' dibatalkan.',
      jsonb_build_object(
        'nomor_nota', NEW.nomor_nota,
        'catatan', NEW.catatan,
        'payment_status', NEW.payment_status
      )
    );
  END IF;

  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'dibayar' THEN
    PERFORM insert_audit_log(
      COALESCE(NEW.confirmed_by, auth.uid(), NEW.kasir_id),
      'transaction',
      NEW.id::TEXT,
      'payment_confirmed',
      'Pembayaran ' || NEW.nomor_nota || ' dikonfirmasi.',
      jsonb_build_object(
        'nomor_nota', NEW.nomor_nota,
        'payment_reference', NEW.payment_reference,
        'total', NEW.total
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_transaction_audit ON transactions;
CREATE TRIGGER trg_log_transaction_audit
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_audit();

CREATE OR REPLACE FUNCTION log_stock_adjustment_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM insert_audit_log(
    NEW.user_id,
    'stock',
    COALESCE(NEW.product_id, 0)::TEXT,
    'stock_adjustment',
    'Penyesuaian stok dicatat untuk produk #' || COALESCE(NEW.product_id, 0)::TEXT || '.',
    jsonb_build_object(
      'product_id', NEW.product_id,
      'jenis', NEW.jenis,
      'jumlah_perubahan', NEW.jumlah_perubahan,
      'jumlah_sesudah', NEW.jumlah_sesudah,
      'keterangan', NEW.keterangan,
      'reference_id', NEW.reference_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_stock_adjustment_audit ON stock_adjustments;
CREATE TRIGGER trg_log_stock_adjustment_audit
  AFTER INSERT ON stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION log_stock_adjustment_audit();

CREATE OR REPLACE FUNCTION log_price_history_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM insert_audit_log(
    NEW.changed_by,
    'product',
    NEW.product_id::TEXT,
    'price_updated',
    'Harga produk #' || NEW.product_id::TEXT || ' diperbarui.',
    jsonb_build_object(
      'product_id', NEW.product_id,
      'harga_beli', NEW.harga_beli,
      'harga_jual', NEW.harga_jual,
      'keterangan', NEW.keterangan
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_price_history_audit ON product_price_history;
CREATE TRIGGER trg_log_price_history_audit
  AFTER INSERT ON product_price_history
  FOR EACH ROW
  EXECUTE FUNCTION log_price_history_audit();
