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

  const { error: rpcError } = await supabase.rpc('adjust_stock_atomic', {
    p_product_id: productId,
    p_jenis: jenis,
    p_jumlah: jumlah,
    p_keterangan: keterangan ?? null,
    p_user_id: user?.id ?? null,
  })

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  const { data: updatedProduct, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
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
