import type { CartItem as CartItemType } from '../../types'
import { formatRupiah } from '../../utils/currency'

interface CartItemProps {
  item: CartItemType
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
  onSetQty: (qty: number) => void
}

export function CartItem({ item, onDecrease, onIncrease, onRemove, onSetQty }: CartItemProps) {
  return (
    <div className="flex gap-3 rounded-[20px] border border-white/70 bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      {item.foto_url ? (
        <img
          src={item.foto_url}
          alt={item.nama_produk}
          className="h-16 w-16 rounded-[16px] object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#e7f8f6] text-[#0a7c72]">
          <span className="material-symbols-outlined">shopping_bag</span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[15px] font-extrabold tracking-[-0.02em] text-[#1b1e20]">
              {item.nama_produk}
            </p>
            <p className="mt-1 text-xs font-medium text-[#8b9895]">
              {formatRupiah(item.harga_satuan)}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-1 text-[#a0aaa7] transition-colors hover:bg-[#fff1ed] hover:text-[#d63f2f]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center rounded-[16px] bg-[#f4f6f7] p-1">
            <button
              type="button"
              onClick={onDecrease}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[#0a7c72] transition-colors hover:bg-white"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <input
              type="number"
              step="0.01"
              min={0.01}
              value={item.qty}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val) && val > 0) {
                  onSetQty(val)
                }
              }}
              className="w-14 bg-transparent text-center text-sm font-extrabold text-[#1b1e20] outline-none"
            />
            <span className="mr-1 text-[10px] font-bold text-[#8b9895] uppercase tracking-wider">{item.satuan}</span>
            <button
              type="button"
              onClick={onIncrease}
              disabled={item.qty >= item.stok_tersedia}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[#0a7c72] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          <p className="text-sm font-extrabold text-[#1b1e20]">{formatRupiah(item.subtotal)}</p>
        </div>

        {(item.satuan === 'kg' || item.satuan === 'liter' || item.satuan === 'pack') && (
          <div className="mt-2 flex items-center gap-1.5">
            {[0.25, 0.5, 0.75].map((fraction) => (
              <button
                key={fraction}
                type="button"
                onClick={() => onSetQty(fraction)}
                className="rounded-lg bg-[#e7f8f6] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-[#0a7c72] transition-colors hover:bg-[#0a7c72] hover:text-white"
                disabled={fraction > item.stok_tersedia}
              >
                {fraction}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
