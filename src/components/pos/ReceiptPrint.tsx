import { forwardRef } from 'react'
import type { Profile, TransactionItem, Transaction } from '../../types/database'
import { formatRupiah } from '../../utils/currency'
import { formatDateTimeIndonesia } from '../../utils/date'

interface ReceiptPrintProps {
  transaction: Transaction
  items: TransactionItem[]
  settings: Record<string, string>
  cashier: Profile | null
}

export const receiptPrintPageStyle = `
  @page {
    size: 58mm auto;
    margin: 4mm;
  }

  @media print {
    html, body {
      background: #ffffff;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`

function getPaymentMethodLabel(method: Transaction['metode_bayar']) {
  switch (method) {
    case 'tunai':
      return 'Tunai'
    case 'transfer':
      return 'Transfer'
    case 'qris':
      return 'QRIS'
    default:
      return method
  }
}

function getPaymentStatusLabel(status: Transaction['payment_status']) {
  switch (status) {
    case 'dibayar':
      return 'Dibayar'
    case 'menunggu_konfirmasi':
      return 'Menunggu'
    case 'gagal':
      return 'Gagal'
    default:
      return status
  }
}

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(
  function ReceiptPrint({ transaction, items, settings, cashier }, ref) {
    const isCash = transaction.metode_bayar === 'tunai'

    return (
      <div
        ref={ref}
        className="bg-white px-3 py-4 text-black"
        style={{ width: '58mm', fontFamily: '"Courier New", monospace' }}
      >
        <div className="text-center text-[12px] font-bold uppercase tracking-[0.2em]">
          {settings.nama_toko || 'Tara Plastic'}
        </div>
        <div className="mt-1 text-center text-[10px] leading-tight whitespace-pre-line">
          {settings.header_struk || 'Tara Plastic'}
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        <div className="space-y-1 text-[10px] leading-tight">
          <div className="flex items-start justify-between gap-3">
            <span>No</span>
            <span className="text-right font-bold">{transaction.nomor_nota}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span>Tanggal</span>
            <span className="text-right">
              {transaction.created_at ? formatDateTimeIndonesia(transaction.created_at) : '-'}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span>Kasir</span>
            <span className="text-right">{cashier?.nama ?? '-'}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span>Metode</span>
            <span className="text-right">{getPaymentMethodLabel(transaction.metode_bayar)}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span>Status</span>
            <span className="text-right">{getPaymentStatusLabel(transaction.payment_status)}</span>
          </div>
          {transaction.paid_at ? (
            <div className="flex items-start justify-between gap-3">
              <span>Dibayar</span>
              <span className="text-right">{formatDateTimeIndonesia(transaction.paid_at)}</span>
            </div>
          ) : null}
          {transaction.payment_reference ? (
            <div className="flex items-start justify-between gap-3">
              <span>Ref</span>
              <span className="max-w-[28mm] break-words text-right">
                {transaction.payment_reference}
              </span>
            </div>
          ) : null}
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        <div className="space-y-2 text-[10px] leading-tight">
          {items.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="break-words font-bold">{item.nama_produk}</div>
              <div className="flex justify-between gap-3">
                <span>
                  {item.qty} x {formatRupiah(Number(item.harga_satuan))}
                </span>
                <span className="shrink-0">{formatRupiah(Number(item.subtotal))}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-black" />
        <div className="space-y-1 text-[10px] leading-tight">
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
            <span>{isCash ? 'Bayar' : 'Tagihan'}</span>
            <span>
              {formatRupiah(
                Number(isCash ? (transaction.uang_diterima ?? transaction.total ?? 0) : transaction.total),
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span>{isCash ? 'Kembali' : 'Sisa'}</span>
            <span>{formatRupiah(Number(isCash ? (transaction.kembalian ?? 0) : 0))}</span>
          </div>
        </div>
        {transaction.catatan ? (
          <>
            <div className="my-3 border-t border-dashed border-black" />
            <div className="space-y-1 text-[10px] leading-tight">
              <div className="font-bold">Catatan</div>
              <div className="break-words whitespace-pre-line">{transaction.catatan}</div>
            </div>
          </>
        ) : null}
        <div className="my-3 border-t border-dashed border-black" />
        <div className="text-center text-[10px] leading-tight whitespace-pre-line">
          {settings.footer_struk || 'Terima kasih telah berbelanja'}
        </div>
      </div>
    )
  },
)
