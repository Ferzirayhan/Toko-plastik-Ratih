CREATE OR REPLACE VIEW audit_logs_with_user AS
SELECT
  a.*,
  p.nama AS actor_nama,
  p.role AS actor_role
FROM audit_logs a
LEFT JOIN profiles p ON p.id = a.user_id;
