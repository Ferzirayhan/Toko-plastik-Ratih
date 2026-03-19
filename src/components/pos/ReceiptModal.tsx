import { useMemo, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { CurrencyDisplay } from '../ui/CurrencyDisplay'
import type { Profile, Transaction, TransactionItem } from '../../types/database'
import { ReceiptPrint } from './ReceiptPrint'
import { buildWhatsAppUrl } from '../../utils/whatsapp'

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  onNewTransaction: () => void
  transaction: Transaction | null
  items: TransactionItem[]
  settings: Record<string, string>
  cashier: Profile | null
}

export function ReceiptModal({
  open,
  onClose,
  onNewTransaction,
  transaction,
  items,
  settings,
  cashier,
}: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: transaction?.nomor_nota ?? 'struk-transaksi',
  })

  const whatsappText = useMemo(() => {
    if (!transaction) {
      return ''
    }

    const lines = [
      settings.nama_toko || 'Toko Plastik Ratih',
      `No. Nota: ${transaction.nomor_nota}`,
      `Kasir: ${cashier?.nama ?? '-'}`,
      '',
      ...items.map(
        (item) =>
          `${item.nama_produk} (${item.qty}x) - ${new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          }).format(Number(item.subtotal))}`,
      ),
      '',
      `Total: ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Number(transaction.total))}`,
      `Bayar: ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Number(transaction.uang_diterima ?? 0))}`,
      `Kembalian: ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Number(transaction.kembalian ?? 0))}`,
    ]

    return lines.join('\n')
  }, [cashier?.nama, items, settings.nama_toko, transaction])

  if (!transaction) {
    return null
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Pembayaran Berhasil!"
      description={`Transaksi ${transaction.nomor_nota}`}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#dff2ef]">
            <span className="material-symbols-outlined text-[42px] text-[#0a7c72]">
              check
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-[#6d7a77]">
            Pembayaran berhasil diproses dan struk siap dicetak.
          </p>
        </div>

        <div className="rounded-[20px] bg-[#f7f9f9] p-5">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#6d7a77]">Metode Bayar</span>
              <span className="font-bold capitalize text-[#1b1e20]">
                {transaction.metode_bayar}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#6d7a77]">Total Belanja</span>
              <CurrencyDisplay className="font-bold text-[#1b1e20]" value={Number(transaction.total)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#6d7a77]">Bayar</span>
              <CurrencyDisplay
                className="font-bold text-[#1b1e20]"
                value={Number(transaction.uang_diterima ?? 0)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#0a7c72]">Kembalian</span>
              <CurrencyDisplay
                className="font-extrabold text-[#0a7c72]"
                value={Number(transaction.kembalian ?? 0)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8b9895]">
            Ringkasan Item
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-[#1b1e20]">
                  {item.nama_produk} ({item.qty}x)
                </span>
                <CurrencyDisplay value={Number(item.subtotal)} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button className="rounded-[14px]" onClick={() => void handlePrint()}>
            Cetak Struk
          </Button>
          <Button
            variant="secondary"
            className="rounded-[14px]"
            onClick={() => window.open(buildWhatsAppUrl(whatsappText), '_blank')}
          >
            Kirim WhatsApp
          </Button>
          <Button variant="ghost" className="rounded-[14px]" onClick={onNewTransaction}>
            Transaksi Baru
          </Button>
        </div>
      </div>

      <div className="hidden">
        <ReceiptPrint
          ref={printRef}
          cashier={cashier}
          items={items}
          settings={settings}
          transaction={transaction}
        />
      </div>
    </Modal>
  )
}
