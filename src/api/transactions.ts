import { supabase } from '../lib/supabase'
import type {
  MetodeBayar,
  PaymentStatus,
  StatusTransaksi,
  Transaction,
  TransactionItem,
  TransactionWithKasir,
} from '../types/database'

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  metodeBayar?: MetodeBayar
  paymentStatus?: PaymentStatus
  status?: StatusTransaksi
  kasirId?: string
  search?: string
}

export interface TransactionCartItem {
  productId: number
  namaProduk: string
  hargaSatuan: number
  qty: number
  subtotal: number
}

export interface CreateTransactionInput {
  items: TransactionCartItem[]
  subtotal: number
  diskonPersen?: number
  diskonAmount?: number
  ppnPersen?: number
  ppnAmount?: number
  total: number
  metodeBayar: MetodeBayar
  uangDiterima?: number | null
  kembalian?: number | null
  catatan?: string | null
}

export interface TransactionDetail {
  transaction: Transaction
  items: TransactionItem[]
}

async function getCurrentProfileId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  return user?.id ?? null
}

export async function getTransactions(
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  if (filters.metodeBayar) {
    query = query.eq('metode_bayar', filters.metodeBayar)
  }

  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.kasirId) {
    query = query.eq('kasir_id', filters.kasirId)
  }

  if (filters.search) {
    query = query.ilike('nomor_nota', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getTransactionById(
  id: number,
): Promise<TransactionDetail | null> {
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (transactionError) {
    throw new Error(transactionError.message)
  }

  if (!transaction) {
    return null
  }

  const { data: items, error: itemsError } = await supabase
    .from('transaction_items')
    .select('*')
    .eq('transaction_id', id)
    .order('id', { ascending: true })

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  return {
    transaction,
    items: items ?? [],
  }
}

export async function createTransaction(
  payload: CreateTransactionInput,
): Promise<TransactionDetail> {
  if (payload.items.length === 0) {
    throw new Error('Keranjang transaksi tidak boleh kosong')
  }

  const kasirId = await getCurrentProfileId()
  if (!kasirId) {
    throw new Error('Sesi kasir tidak ditemukan')
  }

  const { data, error } = await supabase.rpc('create_transaction_atomic', {
    p_items: JSON.stringify(
      payload.items.map((item) => ({
        product_id: item.productId,
        nama_produk: item.namaProduk,
        harga_satuan: item.hargaSatuan,
        qty: item.qty,
        subtotal: item.subtotal,
      })),
    ),
    p_kasir_id: kasirId,
    p_subtotal: payload.subtotal,
    p_diskon_persen: payload.diskonPersen ?? 0,
    p_diskon_amount: payload.diskonAmount ?? 0,
    p_ppn_persen: payload.ppnPersen ?? 0,
    p_ppn_amount: payload.ppnAmount ?? 0,
    p_total: payload.total,
    p_metode_bayar: payload.metodeBayar,
    p_uang_diterima: payload.uangDiterima ?? null,
    p_kembalian: payload.kembalian ?? null,
    p_catatan: payload.catatan ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const transactionId = Number(data?.transaction_id ?? 0)

  if (!transactionId) {
    throw new Error('Sistem belum mengembalikan transaksi yang valid')
  }

  const detail = await getTransactionById(transactionId)

  if (!detail) {
    throw new Error('Detail transaksi yang baru dibuat tidak ditemukan')
  }

  return detail
}

export async function getPendingTransactions(): Promise<TransactionWithKasir[]> {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const { data, error } = await supabase
    .from('transactions_with_kasir')
    .select('*')
    .eq('status', 'selesai')
    .eq('payment_status', 'menunggu_konfirmasi')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function confirmTransactionPayment(
  id: number,
  paymentReference?: string | null,
): Promise<TransactionDetail> {
  const { error } = await supabase.rpc('confirm_transaction_payment', {
    p_transaction_id: id,
    p_payment_reference: paymentReference ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const detail = await getTransactionById(id)

  if (!detail) {
    throw new Error('Detail transaksi yang dikonfirmasi tidak ditemukan')
  }

  return detail
}

export async function cancelPendingTransaction(
  id: number,
  reason?: string | null,
): Promise<TransactionDetail> {
  const { error } = await supabase.rpc('cancel_pending_transaction', {
    p_transaction_id: id,
    p_reason: reason ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const detail = await getTransactionById(id)

  if (!detail) {
    throw new Error('Detail transaksi yang dibatalkan tidak ditemukan')
  }

  return detail
}

export async function cancelTransaction(id: number): Promise<Transaction> {
  const detail = await getTransactionById(id)

  if (!detail) {
    throw new Error('Transaksi tidak ditemukan')
  }

  if (detail.transaction.status === 'batal') {
    return detail.transaction
  }

  const currentUserId = await getCurrentProfileId()

  for (const item of detail.items) {
    if (!item.product_id) {
      continue
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', item.product_id)
      .single()

    if (productError) {
      throw new Error(productError.message)
    }

    const stokSebelum = product.stok ?? 0
    const stokSesudah = stokSebelum + item.qty

    const { error: updateStockError } = await supabase
      .from('products')
      .update({ stok: stokSesudah })
      .eq('id', item.product_id)

    if (updateStockError) {
      throw new Error(updateStockError.message)
    }

    const { error: adjustmentError } = await supabase
      .from('stock_adjustments')
      .insert({
        product_id: item.product_id,
        user_id: currentUserId,
        jenis: 'masuk',
        jumlah_sebelum: stokSebelum,
        jumlah_perubahan: item.qty,
        jumlah_sesudah: stokSesudah,
        keterangan: `Pembatalan transaksi ${detail.transaction.nomor_nota}`,
        reference_id: String(detail.transaction.id),
      })

    if (adjustmentError) {
      throw new Error(adjustmentError.message)
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({ status: 'batal' })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
