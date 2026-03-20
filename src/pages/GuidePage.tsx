import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../utils/cn'

const kasirGuides = [
  {
    title: 'Mulai transaksi',
    description: 'Cari produk, scan barcode, cek qty, lalu pilih metode pembayaran sebelum simpan.',
  },
  {
    title: 'Kalau salah input',
    description: 'Jangan ubah transaksi diam-diam. Untuk pending payment, batalkan dengan alasan yang jelas lalu buat ulang transaksi yang benar.',
  },
  {
    title: 'Pembayaran non tunai',
    description: 'Transfer dan QRIS harus menunggu konfirmasi dana masuk. Jangan cetak struk lunas sebelum pembayaran benar-benar diterima.',
  },
  {
    title: 'Stok dan kejujuran',
    description: 'Setiap transaksi, pembatalan, dan penyesuaian stok tercatat. Gunakan sistem apa adanya supaya admin bisa cocokkan stok dengan aktivitas kasir.',
  },
]

const adminGuides = [
  {
    title: 'Pantau audit',
    description: 'Buka halaman Audit Aktivitas untuk melihat siapa yang membuat transaksi, membatalkan, mengubah stok, atau memperbarui harga.',
  },
  {
    title: 'Koreksi kesalahan kasir',
    description: 'Kalau ada input salah, minta kasir batalkan transaksi dengan alasan lalu buat ulang. Hindari edit manual transaksi yang sudah tercatat.',
  },
  {
    title: 'Kontrol stok',
    description: 'Gunakan penyesuaian stok hanya saat perlu, sertakan alasan, dan cocokkan berkala dengan stok fisik di toko.',
  },
  {
    title: 'Kontrol harga',
    description: 'Perubahan harga beli dan jual sekarang punya riwayat. Gunakan ini untuk meninjau margin dan memeriksa perubahan yang tidak wajar.',
  },
]

export function GuidePage() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const user = useAuthStore((state) => state.user)

  const guides = useMemo(() => {
    if (user?.role === 'admin') {
      return adminGuides
    }

    return kasirGuides
  }, [user?.role])

  return (
    <main
      className={cn(
        'min-h-screen bg-[#f7f9f9] pt-16 transition-[margin] duration-200 md:pt-0',
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-[220px]',
      )}
    >
      <div className="min-h-screen bg-white md:rounded-l-[24px]">
        <header className="border-b border-[#eef1f1] px-4 py-4 sm:px-6">
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-[#1b1e20]">
            Panduan Aplikasi
          </h1>
          <p className="mt-1 text-sm font-medium text-[#8b9895]">
            {user?.role === 'admin'
              ? 'Panduan operasional admin untuk mengawasi transaksi, stok, dan tim kasir.'
              : 'Panduan kasir untuk memakai aplikasi dengan rapi, cepat, dan aman.'}
          </p>
        </header>

        <div className="space-y-6 bg-[#f7f9f9] px-4 py-4 sm:px-6 sm:py-6">
          <section className="rounded-[20px] bg-[linear-gradient(135deg,#0a7c72,#0f5d56)] p-6 text-white shadow-[0_14px_40px_rgba(10,124,114,0.20)]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70">
              Ringkasan
            </p>
            <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.03em]">
              {user?.role === 'admin'
                ? 'Semua aktivitas penting sekarang bisa ditelusuri lewat sistem.'
                : 'Gunakan aplikasi ini apa adanya, karena transaksi dan perubahan penting tercatat otomatis.'}
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-white/82">
              {user?.role === 'admin'
                ? 'Fokus utama admin adalah menjaga data tetap jujur: transaksi tidak dihapus diam-diam, stok tidak berubah tanpa jejak, dan harga punya histori.'
                : 'Kalau ada salah input, pakai alur pembatalan atau koreksi yang tersedia. Hindari transaksi di luar sistem supaya stok dan laporan tetap cocok.'}
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {guides.map((item) => (
              <article
                key={item.title}
                className="rounded-[20px] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]"
              >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b9895]">
                  Tutorial
                </p>
                <h3 className="mt-2 text-[18px] font-extrabold text-[#1b1e20]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#52627d]">{item.description}</p>
              </article>
            ))}
          </section>

          <section className="rounded-[20px] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[18px] font-extrabold text-[#1b1e20]">Aturan Aman</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[16px] bg-[#f8fbfb] p-4 text-sm text-[#52627d]">
                Jangan mengubah data di luar alur yang tersedia.
              </div>
              <div className="rounded-[16px] bg-[#f8fbfb] p-4 text-sm text-[#52627d]">
                Selalu isi alasan saat ada pembatalan atau koreksi penting.
              </div>
              <div className="rounded-[16px] bg-[#f8fbfb] p-4 text-sm text-[#52627d]">
                Gunakan laporan dan audit untuk mencocokkan aktivitas dengan kondisi toko nyata.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
