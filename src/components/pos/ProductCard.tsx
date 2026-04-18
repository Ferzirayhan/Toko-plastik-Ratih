import type { ProductWithCategory } from '../../types/database'
import { formatRupiah } from '../../utils/currency'
import { cn } from '../../utils/cn'

interface ProductCardProps {
  product: ProductWithCategory
  onAdd: (product: ProductWithCategory) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const stok = Number(product.stok ?? 0)
  const stokMinimum = Number(product.stok_minimum ?? 0)
  const isOutOfStock = stok <= 0
  const isLowStock = stok > 0 && stok <= stokMinimum

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => onAdd(product)}
      className={cn(
        'group flex items-center gap-3 overflow-hidden rounded-[22px] border border-white/70 bg-white p-3 text-left shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition-all duration-200 sm:flex-col sm:items-stretch sm:p-3.5',
        isOutOfStock
          ? 'cursor-not-allowed opacity-50'
          : 'hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(10,124,114,0.10)] active:scale-[0.98]',
      )}
    >
      {product.foto_url ? (
        <img
          src={product.foto_url}
          alt={product.nama ?? 'Produk'}
          className="h-[84px] w-[84px] rounded-[18px] object-cover sm:h-28 sm:w-full sm:rounded-[16px]"
        />
      ) : (
        <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(145deg,_#0a7c72,_#0c5f58)] sm:h-28 sm:w-full sm:rounded-[16px]">
          <span className="material-symbols-outlined text-[34px] text-white/90">
            inventory_2
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1 sm:mt-3 sm:flex-none">
        <div className="flex items-center justify-between gap-2 sm:block">
          <span
            className={cn(
              'rounded-full px-2 py-1 text-[10px] font-extrabold uppercase',
              isOutOfStock
                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                : isLowStock
                  ? 'bg-[#ffddb8] text-[#855300]'
                  : 'bg-[#ccfaf1] text-[#0a7c72]',
            )}
          >
            Stok: {stok}
          </span>
          <span className="hidden text-[11px] font-bold text-[#8b9895] sm:inline">
            {product.sku ?? 'Tanpa SKU'}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-[42px] text-[15px] font-extrabold leading-5 tracking-[-0.02em] text-[#1b1e20]">
          {product.nama ?? 'Produk'}
        </h3>
        <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#8b9895]">
          {product.category_nama ?? 'Tanpa kategori'} • {product.satuan ?? 'pcs'}
        </p>
        {(product.diskon_produk_persen ?? 0) > 0 ? (
          <div className="mt-2 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-[#d63f2f] px-2 py-0.5 text-[10px] font-extrabold text-white">
                -{product.diskon_produk_persen}%
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#a0aaa7] line-through">
              {formatRupiah(Number(product.harga_jual ?? 0))}
            </p>
            <p className="text-[17px] font-extrabold tracking-[-0.02em] text-[#d63f2f]">
              {formatRupiah(Math.round(Number(product.harga_jual ?? 0) * (1 - (product.diskon_produk_persen ?? 0) / 100)))}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[17px] font-extrabold tracking-[-0.02em] text-[#0a7c72]">
            {formatRupiah(Number(product.harga_jual ?? 0))}
          </p>
        )}
      </div>
    </button>
  )
}
