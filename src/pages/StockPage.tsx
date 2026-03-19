import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { deleteProduct, updateProduct } from '../api/products'
import { adjustStock, getStockHistory, getStockList } from '../api/stock'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { useUIStore } from '../stores/uiStore'
import { useToastStore } from '../stores/toastStore'
import type { ProductWithCategory, StockAdjustment } from '../types/database'
import { cn } from '../utils/cn'

const adjustmentSchema = z.object({
  jenis: z.enum(['masuk', 'keluar', 'koreksi']),
  jumlah: z.coerce.number().int().min(0, 'Jumlah wajib diisi'),
  keterangan: z.string().trim().optional(),
})

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>
type AdjustmentFormInput = z.input<typeof adjustmentSchema>

const stockEditSchema = z.object({
  stok: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  stok_minimum: z.coerce.number().int().min(0, 'Stok minimum tidak boleh negatif'),
  is_active: z.boolean(),
})

type StockEditValues = z.infer<typeof stockEditSchema>
type StockEditInput = z.input<typeof stockEditSchema>

export function StockPage() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const pushToast = useToastStore((state) => state.pushToast)
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'aman' | 'menipis' | 'habis'>('all')
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(null)
  const [history, setHistory] = useState<StockAdjustment[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormInput, unknown, AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      jenis: 'masuk',
      jumlah: 0,
      keterangan: '',
    },
  })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEditForm,
    formState: { errors: editErrors },
  } = useForm<StockEditInput, unknown, StockEditValues>({
    resolver: zodResolver(stockEditSchema),
    defaultValues: {
      stok: 0,
      stok_minimum: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  const loadStock = useCallback(async () => {
    setLoading(true)

    try {
      const result = await getStockList({
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })

      const sortedResult = [...result].sort((left, right) => {
        const priority = { habis: 0, menipis: 1, aman: 2 }
        const leftPriority = priority[left.stok_status ?? 'aman']
        const rightPriority = priority[right.stok_status ?? 'aman']

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority
        }

        return Number(left.stok ?? 0) - Number(right.stok ?? 0)
      })

      setProducts(sortedResult)
    } catch (error) {
      pushToast({
        title: 'Gagal memuat stok',
        description: error instanceof Error ? error.message : 'Data stok belum berhasil dimuat.',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, pushToast, statusFilter])

  useEffect(() => {
    void loadStock()
  }, [loadStock])

  const stockSummary = useMemo(
    () => ({
      total: products.length,
      habis: products.filter((item) => item.stok_status === 'habis').length,
      menipis: products.filter((item) => item.stok_status === 'menipis').length,
    }),
    [products],
  )

  const openAdjustment = (product: ProductWithCategory) => {
    setSelectedProduct(product)
    reset({
      jenis: 'masuk',
      jumlah: 0,
      keterangan: '',
    })
    setAdjustmentOpen(true)
  }

  const openEdit = (product: ProductWithCategory) => {
    setSelectedProduct(product)
    resetEditForm({
      stok: Number(product.stok ?? 0),
      stok_minimum: Number(product.stok_minimum ?? 0),
      is_active: product.is_active ?? true,
    })
    setEditOpen(true)
  }

  const openHistory = async (product: ProductWithCategory) => {
    if (!product.id) {
      return
    }

    setSelectedProduct(product)
    setHistoryOpen(true)
    setHistoryLoading(true)

    try {
      const result = await getStockHistory(product.id)
      setHistory(result)
    } catch (error) {
      pushToast({
        title: 'Gagal memuat histori',
        description: error instanceof Error ? error.message : 'Histori stok belum tersedia.',
        variant: 'error',
      })
    } finally {
      setHistoryLoading(false)
    }
  }

  const onSubmitAdjustment = async (values: AdjustmentFormValues) => {
    if (!selectedProduct?.id) {
      return
    }

    setSubmitting(true)

    try {
      await adjustStock(selectedProduct.id, values.jenis, values.jumlah, values.keterangan)
      await loadStock()
      setAdjustmentOpen(false)
      pushToast({
        title: 'Stok berhasil diperbarui',
        description: `${selectedProduct.nama ?? 'Produk'} sudah diadjust.`,
        variant: 'success',
      })
    } catch (error) {
      pushToast({
        title: 'Adjust stok gagal',
        description: error instanceof Error ? error.message : 'Stok belum berhasil diperbarui.',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitEdit = async (values: StockEditValues) => {
    if (!selectedProduct?.id) {
      return
    }

    setEditSubmitting(true)

    try {
      await updateProduct(selectedProduct.id, {
        stok: values.stok,
        stok_minimum: values.stok_minimum,
        is_active: values.is_active,
      })

      await loadStock()
      setEditOpen(false)
      pushToast({
        title: 'Data stok diperbarui',
        description: `${selectedProduct.nama ?? 'Produk'} berhasil diperbarui.`,
        variant: 'success',
      })
    } catch (error) {
      pushToast({
        title: 'Edit stok gagal',
        description: error instanceof Error ? error.message : 'Perubahan stok belum berhasil disimpan.',
        variant: 'error',
      })
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteStockItem = async () => {
    if (!deleteTarget?.id) {
      return
    }

    setDeleteSubmitting(true)

    try {
      await deleteProduct(deleteTarget.id)
      await loadStock()
      setDeleteTarget(null)
      pushToast({
        title: 'Produk dinonaktifkan',
        description: `${deleteTarget.nama ?? 'Produk'} sudah dihapus dari daftar stok aktif.`,
        variant: 'success',
      })
    } catch (error) {
      pushToast({
        title: 'Gagal menghapus produk',
        description: error instanceof Error ? error.message : 'Produk belum berhasil dinonaktifkan.',
        variant: 'error',
      })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <main
      className={cn(
        'min-h-screen bg-[#f7f9f9] transition-[margin] duration-200',
        sidebarCollapsed ? 'ml-16' : 'ml-[220px]',
      )}
    >
      <div className="min-h-screen rounded-l-[24px] bg-white">
        <header className="flex items-center justify-between border-b border-[#eef1f1] px-6 py-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-[#1b1e20]">
              Manajemen Stok
            </h1>
            <p className="mt-1 text-sm font-medium text-[#8b9895]">
              Pantau ketersediaan barang dan lakukan penyesuaian stok dengan cepat.
            </p>
          </div>
          <div className="rounded-[14px] bg-[#f4fffc] px-4 py-3 text-sm font-bold text-[#0a7c72]">
            Akses admin: CRUD stok aktif
          </div>
        </header>

        <div className="space-y-6 bg-[#f7f9f9] px-6 py-6">
          <section className="grid grid-cols-3 gap-4">
            {[
              ['Total Produk', stockSummary.total],
              ['Stok Menipis', stockSummary.menipis],
              ['Stok Habis', stockSummary.habis],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[18px] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b9895]">
                  {label}
                </p>
                <p className="mt-2 text-[28px] font-extrabold text-[#1b1e20]">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-[20px] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari produk atau SKU..."
                className="h-11 min-w-[240px] rounded-[12px] border-none bg-[#f1f3f5] px-4 text-sm outline-none focus:ring-2 focus:ring-[#0a7c72]/15"
              />
              {[
                ['all', 'Semua Produk'],
                ['menipis', 'Stok Menipis'],
                ['habis', 'Stok Habis'],
                ['aman', 'Stok Aman'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value as typeof statusFilter)}
                  className={statusFilter === value
                    ? 'rounded-full bg-[#0a7c72] px-4 py-2 text-sm font-bold text-white'
                    : 'rounded-full bg-[#eef3f3] px-4 py-2 text-sm font-bold text-[#52627d]'}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
            <div className="border-b border-[#eef1f1] px-5 py-4">
              <h2 className="text-[18px] font-extrabold text-[#1b1e20]">Daftar Inventaris</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#f7f9f9]">
                  <tr>
                    {['Produk', 'Kategori', 'Stok Saat Ini', 'Stok Minimum', 'Status', 'Aksi'].map((heading) => (
                      <th key={heading} className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#97a19f]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <tr key={index} className="border-t border-[#eef1f1]">
                          {Array.from({ length: 6 }).map((__, cellIndex) => (
                            <td key={cellIndex} className="px-5 py-4">
                              <Skeleton className="h-10 w-full rounded-xl" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : products.map((product) => (
                        <tr key={product.id} className="border-t border-[#eef1f1]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {product.foto_url ? (
                                <img src={product.foto_url} alt={product.nama ?? 'Produk'} className="h-12 w-12 rounded-[14px] object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#e7f8f6] text-[#0a7c72]">
                                  <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-[#1b1e20]">{product.nama ?? '-'}</p>
                                <p className="text-xs text-[#8b9895]">SKU: {product.sku ?? '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#52627d]">{product.category_nama ?? '-'}</td>
                          <td className="px-5 py-4 text-sm font-bold text-[#1b1e20]">
                            {product.stok ?? 0} {product.satuan ?? ''}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#52627d]">
                            {product.stok_minimum ?? 0} {product.satuan ?? ''}
                          </td>
                          <td className="px-5 py-4">
                            <span className={product.stok_status === 'habis'
                              ? 'rounded-full bg-[#ffdad6] px-3 py-1 text-[10px] font-extrabold uppercase text-[#ba1a1a]'
                              : product.stok_status === 'menipis'
                                ? 'rounded-full bg-[#ffddb8] px-3 py-1 text-[10px] font-extrabold uppercase text-[#855300]'
                                : 'rounded-full bg-[#ccfaf1] px-3 py-1 text-[10px] font-extrabold uppercase text-[#0a7c72]'}>
                              {product.stok_status ?? 'aman'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openAdjustment(product)}
                                className="rounded-[12px] px-3 py-2 text-sm font-bold text-[#0a7c72] hover:bg-[#e7f8f6]"
                              >
                                Adjust
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(product)}
                                className="rounded-[12px] px-3 py-2 text-sm font-bold text-[#52627d] hover:bg-[#eef3f3]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void openHistory(product)}
                                className="rounded-[12px] px-3 py-2 text-sm font-bold text-[#52627d] hover:bg-[#eef3f3]"
                              >
                                Riwayat
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(product)}
                                className="rounded-[12px] px-3 py-2 text-sm font-bold text-[#ba1a1a] hover:bg-[#fff1ed]"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={adjustmentOpen}
        onClose={() => setAdjustmentOpen(false)}
        size="sm"
        title={`Penyesuaian Stok ${selectedProduct?.nama ?? ''}`}
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmitAdjustment)}>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#52627d]">Jenis</label>
            <select
              className="h-11 w-full rounded-[12px] border-none bg-[#f1f3f5] px-4 text-sm outline-none focus:ring-2 focus:ring-[#0a7c72]/15"
              {...register('jenis')}
            >
              <option value="masuk">Masuk</option>
              <option value="keluar">Keluar</option>
              <option value="koreksi">Koreksi</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#52627d]">Jumlah</label>
            <input
              type="number"
              min={0}
              className="h-11 w-full rounded-[12px] border-none bg-[#f1f3f5] px-4 text-sm outline-none focus:ring-2 focus:ring-[#0a7c72]/15"
              {...register('jumlah')}
            />
            {errors.jumlah ? <p className="text-sm text-[#ba1a1a]">{errors.jumlah.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#52627d]">Keterangan</label>
            <textarea
              rows={3}
              className="w-full rounded-[12px] border-none bg-[#f1f3f5] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0a7c72]/15"
              {...register('keterangan')}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAdjustmentOpen(false)} className="rounded-[12px] px-4 py-2 font-bold text-[#52627d]">
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[12px] bg-[#0a7c72] px-5 py-2 font-bold text-white disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        size="sm"
        title={`Edit Stok ${selectedProduct?.nama ?? ''}`}
        description="Admin bisa mengubah stok saat ini, stok minimum, dan status aktif produk."
      >
        <form className="space-y-4" onSubmit={handleSubmitEdit(onSubmitEdit)}>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#52627d]">Stok Saat Ini</label>
            <input
              type="number"
              min={0}
              className="h-11 w-full rounded-[12px] border-none bg-[#f1f3f5] px-4 text-sm outline-none focus:ring-2 focus:ring-[#0a7c72]/15"
              {...registerEdit('stok')}
            />
            {editErrors.stok ? <p className="text-sm text-[#ba1a1a]">{editErrors.stok.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#52627d]">Stok Minimum</label>
            <input
              type="number"
              min={0}
              className="h-11 w-full rounded-[12px] border-none bg-[#f1f3f5] px-4 text-sm outline-none focus:ring-2 focus:ring-[#0a7c72]/15"
              {...registerEdit('stok_minimum')}
            />
            {editErrors.stok_minimum ? (
              <p className="text-sm text-[#ba1a1a]">{editErrors.stok_minimum.message}</p>
            ) : null}
          </div>

          <label className="flex items-center gap-3 rounded-[12px] bg-[#f7f9f9] px-4 py-3 text-sm font-medium text-[#52627d]">
            <input type="checkbox" className="h-4 w-4 rounded" {...registerEdit('is_active')} />
            Produk aktif dan tampil di stok aktif
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditOpen(false)} className="rounded-[12px] px-4 py-2 font-bold text-[#52627d]">
              Batal
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="rounded-[12px] bg-[#0a7c72] px-5 py-2 font-bold text-white disabled:opacity-60"
            >
              {editSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {historyOpen ? (
        <div className="fixed inset-0 z-[90] bg-[#06231f]/22">
          <button type="button" className="absolute inset-0" onClick={() => setHistoryOpen(false)} aria-label="Tutup riwayat" />
          <aside className="absolute right-0 top-0 z-[91] h-full w-full max-w-[420px] overflow-y-auto bg-white px-6 py-6 shadow-[-20px_0_50px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[24px] font-extrabold tracking-[-0.03em] text-[#1b1e20]">
                  Riwayat Stok
                </h2>
                <p className="mt-1 text-sm text-[#8b9895]">{selectedProduct?.nama ?? '-'}</p>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-full p-2 text-[#74807d] hover:bg-[#f7f9f9]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {historyLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-[16px]" />
                ))
              ) : history.length > 0 ? (
                history.map((item) => (
                  <div key={item.id} className="rounded-[16px] border border-[#eef1f1] bg-[#fbfdfd] p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#eef3f3] px-3 py-1 text-[10px] font-extrabold uppercase text-[#52627d]">
                        {item.jenis}
                      </span>
                      <span className="text-xs text-[#8b9895]">
                        {item.created_at
                          ? format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })
                          : '-'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[#8b9895]">Sebelum</p>
                        <p className="font-bold text-[#1b1e20]">{item.jumlah_sebelum}</p>
                      </div>
                      <div>
                        <p className="text-[#8b9895]">Sesudah</p>
                        <p className="font-bold text-[#1b1e20]">{item.jumlah_sesudah}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[#52627d]">
                      Perubahan: <span className="font-bold">{item.jumlah_perubahan > 0 ? '+' : ''}{item.jumlah_perubahan}</span>
                    </p>
                    <p className="mt-1 text-sm text-[#8b9895]">{item.keterangan ?? 'Tanpa keterangan'}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[16px] bg-[#f8fbfb] px-4 py-8 text-center text-sm text-[#8b9895]">
                  Belum ada histori penyesuaian stok.
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus stok aktif?"
        description={`${deleteTarget?.nama ?? 'Produk'} akan dinonaktifkan dari daftar stok aktif dan katalog kasir.`}
        confirmLabel="Hapus"
        loading={deleteSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteStockItem()}
      />
    </main>
  )
}
