import { forwardRef } from 'react'
import type { Profile, TransactionItem, Transaction } from '../../types/database'
import { formatRupiah } from '../../utils/currency'

interface ReceiptPrintProps {
  transaction: Transaction
  items: TransactionItem[]
  settings: Record<string, string>
  cashier: Profile | null
}

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(
  function ReceiptPrint({ transaction, items, settings, cashier }, ref) {
    return (
      <div
        ref={ref}
        className="bg-white p-4 text-black"
        style={{ width: '58mm', fontFamily: 'monospace' }}
      >
        <div className="text-center text-[12px] whitespace-pre-line">
          {settings.header_struk || 'Toko Plastik Ratih'}
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        <div className="space-y-1 text-[11px]">
          <div>No: {transaction.nomor_nota}</div>
          <div>Kasir: {cashier?.nama ?? '-'}</div>
          <div>Bayar: {transaction.metode_bayar.toUpperCase()}</div>
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        <div className="space-y-2 text-[11px]">
          {items.map((item) => (
            <div key={item.id}>
              <div>{item.nama_produk}</div>
              <div className="flex justify-between">
                <span>
                  {item.qty} x {formatRupiah(Number(item.harga_satuan))}
                </span>
                <span>{formatRupiah(Number(item.subtotal))}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(Number(transaction.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>{formatRupiah(Number(transaction.diskon_amount ?? 0))}</span>
          </div>
          <div className="flex justify-between">
            <span>PPN</span>
            <span>{formatRupiah(Number(transaction.ppn_amount ?? 0))}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatRupiah(Number(transaction.total))}</span>
          </div>
          <div className="flex justify-between">
            <span>Bayar</span>
            <span>{formatRupiah(Number(transaction.uang_diterima ?? 0))}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Kembali</span>
            <span>{formatRupiah(Number(transaction.kembalian ?? 0))}</span>
          </div>
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        <div className="text-center text-[10px] whitespace-pre-line">
          {settings.footer_struk || 'Terima kasih telah berbelanja'}
        </div>
      </div>
    )
  },
)
