import { supabase } from '../lib/supabase'
import type {
  Product,
  ProductWithCategory,
  StokStatus,
  StockAdjustment,
} from '../types/database'

export interface StockFilters {
  search?: string
  status?: StokStatus
  categoryId?: number
}

export async function getStockList(
  filters: StockFilters = {},
): Promise<ProductWithCategory[]> {
  let query = supabase
    .from('products_with_category')
    .select('*')
    .eq('is_active', true)
    .order('stok', { ascending: true })

  if (filters.search) {
    query = query.ilike('nama', `%${filters.search}%`)
  }

  if (filters.status) {
    query = query.eq('stok_status', filters.status)
  }

  if (typeof filters.categoryId === 'number') {
    query = query.eq('category_id', filters.categoryId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function adjustStock(
  productId: number,
  jenis: 'masuk' | 'keluar' | 'koreksi',
  jumlah: number,
  keterangan?: string,
): Promise<Product> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError) {
    throw new Error(productError.message)
  }

  const stokSebelum = product.stok ?? 0
  const jumlahPerubahan = jenis === 'keluar' ? -Math.abs(jumlah) : Math.abs(jumlah)
  const stokSesudah =
    jenis === 'koreksi' ? Math.max(0, jumlah) : Math.max(0, stokSebelum + jumlahPerubahan)

  const { data: updatedProduct, error: updateError } = await supabase
    .from('products')
    .update({ stok: stokSesudah })
    .eq('id', productId)
    .select('*')
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  const perubahanUntukLog = jenis === 'koreksi' ? stokSesudah - stokSebelum : jumlahPerubahan

  const { error: logError } = await supabase.from('stock_adjustments').insert({
    product_id: productId,
    user_id: user?.id ?? null,
    jenis,
    jumlah_sebelum: stokSebelum,
    jumlah_perubahan: perubahanUntukLog,
    jumlah_sesudah: stokSesudah,
    keterangan: keterangan ?? null,
  })

  if (logError) {
    throw new Error(logError.message)
  }

  return updatedProduct
}

export async function getStockHistory(
  productId: number,
): Promise<StockAdjustment[]> {
  const { data, error } = await supabase
    .from('stock_adjustments')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export interface RepackResult {
  success: boolean
  source_stock: number
  target_stock: number
}

export async function repackStock(
  sourceProductId: number,
  targetProductId: number,
  sourceQty: number,
  targetQty: number,
): Promise<RepackResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  const { data, error } = await supabase.rpc('repack_stock_atomic', {
    p_source_product_id: sourceProductId,
    p_target_product_id: targetProductId,
    p_source_qty: sourceQty,
    p_target_qty: targetQty,
    p_user_id: user?.id ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as RepackResult
}
