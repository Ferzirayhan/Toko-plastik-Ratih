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
        'group flex flex-col overflow-hidden rounded-[18px] bg-white p-3 text-left shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition-all duration-200',
        isOutOfStock
          ? 'cursor-not-allowed opacity-50'
          : 'hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(10,124,114,0.10)] active:scale-[0.98]',
      )}
    >
      {product.foto_url ? (
        <img
          src={product.foto_url}
          alt={product.nama ?? 'Produk'}
          className="h-24 w-full rounded-[14px] object-cover"
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center rounded-[14px] bg-[linear-gradient(145deg,_#0a7c72,_#0c5f58)]">
          <span className="material-symbols-outlined text-[34px] text-white/90">
            inventory_2
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
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
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[42px] text-[15px] font-extrabold leading-5 text-[#1b1e20]">
        {product.nama ?? 'Produk'}
      </h3>
      <p className="mt-2 text-[13px] font-medium text-[#8b9895]">
        {product.category_nama ?? 'Tanpa kategori'}
      </p>
      <p className="mt-2 text-[15px] font-extrabold text-[#0a7c72]">
        {formatRupiah(Number(product.harga_jual ?? 0))}
      </p>
    </button>
  )
}
