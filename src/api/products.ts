import { supabase } from '../lib/supabase'
import type {
  Category,
  Database,
  Product,
  ProductWithCategory,
  StokStatus,
} from '../types/database'

export interface ProductFilters {
  search?: string
  categoryId?: number
  isActive?: boolean
  stokStatus?: StokStatus
}

export interface ProductPageFilters extends ProductFilters {
  page?: number
  pageSize?: number
  sortBy?: 'nama' | 'harga_jual' | 'harga_beli' | 'stok' | 'created_at'
  sortDirection?: 'asc' | 'desc'
}

export interface ProductPageResult {
  data: ProductWithCategory[]
  count: number
}

export async function getCategories(includeInactive = false): Promise<Category[]> {
  let query = supabase.from('categories').select('*').order('nama', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<ProductWithCategory[]> {
  let query = supabase
    .from('products_with_category')
    .select('*')
    .order('nama', { ascending: true })

  if (filters.search) {
    query = query.ilike('nama', `%${filters.search}%`)
  }

  if (typeof filters.categoryId === 'number') {
    query = query.eq('category_id', filters.categoryId)
  }

  if (typeof filters.isActive === 'boolean') {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters.stokStatus) {
    query = query.eq('stok_status', filters.stokStatus)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getProductsPage(
  filters: ProductPageFilters = {},
): Promise<ProductPageResult> {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products_with_category')
    .select('*', { count: 'exact' })
    .order(filters.sortBy ?? 'updated_at', {
      ascending: (filters.sortDirection ?? 'desc') === 'asc',
      nullsFirst: false,
    })
    .range(from, to)

  if (filters.search) {
    query = query.or(
      `nama.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`,
    )
  }

  if (typeof filters.categoryId === 'number') {
    query = query.eq('category_id', filters.categoryId)
  }

  if (typeof filters.isActive === 'boolean') {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters.stokStatus) {
    query = query.eq('stok_status', filters.stokStatus)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: data ?? [],
    count: count ?? 0,
  }
}

export async function getProductByBarcode(
  barcode: string,
): Promise<ProductWithCategory | null> {
  const { data, error } = await supabase
    .from('products_with_category')
    .select('*')
    .eq('barcode', barcode)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getActiveCategories(): Promise<Category[]> {
  return getCategories(false)
}

export async function createCategory(
  payload: Database['public']['Tables']['categories']['Insert'],
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateCategory(
  id: number,
  payload: Database['public']['Tables']['categories']['Update'],
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteCategory(id: number): Promise<Category> {
  const { count, error: productError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (productError) {
    throw new Error(productError.message)
  }

  if ((count ?? 0) > 0) {
    throw new Error('Kategori masih dipakai produk. Pindahkan atau nonaktifkan produknya dulu.')
  }

  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createProduct(
  payload: Database['public']['Tables']['products']['Insert'],
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateProduct(
  id: number,
  payload: Database['public']['Tables']['products']['Update'],
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function uploadProductPhoto(file: File): Promise<string> {
  const fileExtension = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`
  const filePath = `products/${fileName}`

  const { error } = await supabase.storage.from('products').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from('products').getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteProduct(id: number): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getProductStats() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getActiveCategories(),
  ])

  return {
    totalProducts: products.length,
    totalCategories: categories.length,
    lowStockProducts: products.filter((item) => item.stok_status === 'menipis').length,
    inactiveProducts: products.filter((item) => item.is_active === false).length,
  }
}
