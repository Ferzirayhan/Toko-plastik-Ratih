DROP POLICY IF EXISTS "Authenticated users can read products" ON products;
DROP POLICY IF EXISTS "Authenticated users can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can manage transaction_items" ON transaction_items;
DROP POLICY IF EXISTS "Authenticated users can manage stock" ON stock_adjustments;
DROP POLICY IF EXISTS "Authenticated users can read settings" ON store_settings;

DROP POLICY IF EXISTS "Profiles can be read by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Profiles can be managed by admin" ON profiles;
DROP POLICY IF EXISTS "Categories can be read by authenticated users" ON categories;
DROP POLICY IF EXISTS "Categories can be managed by admin" ON categories;
DROP POLICY IF EXISTS "Products can be read by authenticated users" ON products;
DROP POLICY IF EXISTS "Products can be managed by admin" ON products;
DROP POLICY IF EXISTS "Transactions can be read by owner or admin" ON transactions;
DROP POLICY IF EXISTS "Transactions can be inserted by authenticated users" ON transactions;
DROP POLICY IF EXISTS "Transactions can be updated by admin" ON transactions;
DROP POLICY IF EXISTS "Transaction items can be read by authenticated users" ON transaction_items;
DROP POLICY IF EXISTS "Transaction items can be inserted by authenticated users" ON transaction_items;
DROP POLICY IF EXISTS "Transaction items can be changed by admin" ON transaction_items;
DROP POLICY IF EXISTS "Stock adjustments can be read by authenticated users" ON stock_adjustments;
DROP POLICY IF EXISTS "Stock adjustments can be inserted by authenticated users" ON stock_adjustments;
DROP POLICY IF EXISTS "Stock adjustments can be changed by admin" ON stock_adjustments;
DROP POLICY IF EXISTS "Store settings can be read by authenticated users" ON store_settings;
DROP POLICY IF EXISTS "Store settings can be inserted by admin" ON store_settings;
DROP POLICY IF EXISTS "Store settings can be updated by admin" ON store_settings;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Profiles can be read by authenticated users"
  ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles can be managed by admin"
  ON profiles
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Categories can be read by authenticated users"
  ON categories
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Categories can be managed by admin"
  ON categories
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Products can be read by authenticated users"
  ON products
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Products can be managed by admin"
  ON products
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Transactions can be read by owner or admin"
  ON transactions
  FOR SELECT
  USING (is_admin() OR kasir_id = auth.uid());

CREATE POLICY "Transactions can be inserted by authenticated users"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Transactions can be updated by admin"
  ON transactions
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Transaction items can be read by authenticated users"
  ON transaction_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Transaction items can be inserted by authenticated users"
  ON transaction_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Transaction items can be changed by admin"
  ON transaction_items
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Stock adjustments can be read by authenticated users"
  ON stock_adjustments
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Stock adjustments can be inserted by authenticated users"
  ON stock_adjustments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Stock adjustments can be changed by admin"
  ON stock_adjustments
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Store settings can be read by authenticated users"
  ON store_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Store settings can be inserted by admin"
  ON store_settings
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Store settings can be updated by admin"
  ON store_settings
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
