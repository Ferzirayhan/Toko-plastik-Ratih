import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import {
  getDashboardChangeSummary,
  getDashboardNotifications,
  getDashboardStats,
  getLatestTransactions,
  getSalesByCategory,
  getSalesTrend,
} from '../api/reports'
import { CurrencyDisplay } from '../components/ui/CurrencyDisplay'
import { Skeleton } from '../components/ui/Skeleton'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import type {
  DashboardChangeSummary,
  DashboardNotification,
  DashboardStats,
  SalesReport,
} from '../types'
import type { TransactionWithKasir } from '../types/database'
import { cn } from '../utils/cn'

const donutColors = ['#0a7c72', '#a86b00', '#b45f36', '#d9dadc']

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    const amount = value / 1_000_000
    return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}M`
  }

  if (value >= 1_000) {
    const amount = value / 1_000
    return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}K`
  }

  return `${value}`
}

function formatCategoryLabel(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0%'
  }

  return `${Math.round(value)}%`
}

function formatDeltaBadge(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return '0%'
  }

  if (value === 0) {
    return '0%'
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function getDeltaTone(value: number | null) {
  if (value === null || value === 0) {
    return {
      background: '#edeef0',
      color: '#6f7b79',
    }
  }

  if (value > 0) {
    return {
      background: '#dff7f2',
      color: '#0a7c72',
    }
  }

  return {
    background: '#fff1eb',
    color: '#ba5a2b',
  }
}

function notificationToneClasses(tone: DashboardNotification['tone']) {
  if (tone === 'danger') {
    return 'border-[#ffdad6] bg-[#fff5f3]'
  }

  if (tone === 'warning') {
    return 'border-[#ffddb8] bg-[#fff8ef]'
  }

  return 'border-[#dff2ef] bg-[#f4fffc]'
}

function formatTransactionTime(value: string | null) {
  if (!value) {
    return '-'
  }

  return format(parseISO(value), "HH:mm, 'Hari ini'", { locale: localeId })
}

export function DashboardPage() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [changes, setChanges] = useState<DashboardChangeSummary | null>(null)
  const [salesTrend, setSalesTrend] = useState<SalesReport[]>([])
  const [categorySales, setCategorySales] = useState<Array<{ category: string; total: number }>>([])
  const [latestTransactions, setLatestTransactions] = useState<TransactionWithKasir[]>([])
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const notificationRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard(isSilent = false) {
      if (!isSilent && isMounted) {
        setLoading(true)
      }

      try {
        const now = new Date()
        const dateFrom = format(now, 'yyyy-MM-dd')
        const dateTo = format(now, 'yyyy-MM-dd')
        const [
          statsResult,
          changesResult,
          trendResult,
          categoryResult,
          latestResult,
          notificationsResult,
        ] = await Promise.all([
          getDashboardStats(),
          getDashboardChangeSummary(),
          getSalesTrend(7),
          getSalesByCategory(`${dateFrom}T00:00:00`, `${dateTo}T23:59:59`),
          getLatestTransactions(5),
          getDashboardNotifications(),
        ])

        if (!isMounted) {
          return
        }

        setStats(statsResult)
        setChanges(changesResult)
        setSalesTrend(trendResult)
        setCategorySales(categoryResult)
        setLatestTransactions(latestResult)
        setNotifications(notificationsResult)
        setError(null)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat dashboard.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    const intervalId = window.setInterval(() => {
      void loadDashboard(true)
    }, 30_000)

    const channel = supabase
      .channel('dashboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => void loadDashboard(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transaction_items' },
        () => void loadDashboard(true),
      )
      .subscribe()

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showNotifications &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const averageTransaction = useMemo(() => {
    if (!stats || stats.jumlahTransaksiHariIni === 0) {
      return 0
    }

    return stats.totalPenjualanHariIni / stats.jumlahTransaksiHariIni
  }, [stats])

  const donutData = useMemo(() => {
    const total = categorySales.reduce((sum, item) => sum + item.total, 0)

    if (total === 0) {
      return []
    }

    return categorySales.map((item) => ({
      ...item,
      percent: (item.total / total) * 100,
    }))
  }, [categorySales])

  const summaryCards = [
    {
      title: 'Total Penjualan',
      icon: 'payments',
      accent: '#66e5d1',
      badge: formatDeltaBadge(changes?.totalPenjualan.percentage ?? null),
      badgeTone: getDeltaTone(changes?.totalPenjualan.percentage ?? null),
      value: stats ? <CurrencyDisplay value={stats.totalPenjualanHariIni} /> : null,
    },
    {
      title: 'Jumlah Transaksi',
      icon: 'receipt_long',
      accent: '#f8c88b',
      badge: formatDeltaBadge(changes?.jumlahTransaksi.percentage ?? null),
      badgeTone: getDeltaTone(changes?.jumlahTransaksi.percentage ?? null),
      value: stats?.jumlahTransaksiHariIni ?? 0,
    },
    {
      title: 'Produk Terlaris',
      icon: 'inventory_2',
      accent: '#ffd1c0',
      badge: formatDeltaBadge(changes?.produkTerlarisQty.percentage ?? null),
      badgeTone: getDeltaTone(changes?.produkTerlarisQty.percentage ?? null),
      value: stats?.produkTerlarisHariIni ? (
        <div>
          <p className="truncate text-[18px] font-extrabold leading-tight text-[#191c1e]">
            {stats.produkTerlarisHariIni.nama}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#6f7b79]">
            {stats.produkTerlarisHariIni.qty} pcs terjual
          </p>
        </div>
      ) : (
        'Belum ada'
      ),
    },
    {
      title: 'Rata-rata Transaksi',
      icon: 'bar_chart',
      accent: '#d9dadc',
      badge: formatDeltaBadge(changes?.rataRataTransaksi.percentage ?? null),
      badgeTone: getDeltaTone(changes?.rataRataTransaksi.percentage ?? null),
      value: <CurrencyDisplay value={averageTransaction} />,
    },
  ]

  return (
    <main
      className={cn(
        'min-h-screen bg-[#f7f9f9] transition-[margin] duration-200',
        sidebarCollapsed ? 'ml-16' : 'ml-[220px]',
      )}
    >
      <div className="min-h-screen rounded-l-[24px] bg-white">
        <header className="flex items-center justify-between border-b border-[#eef1f1] px-6 py-4">
          <div className="relative w-full max-w-[330px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#98a19f]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari transaksi atau produk..."
              className="h-11 w-full rounded-full border-none bg-[#f1f3f5] pl-12 pr-4 text-sm text-[#191c1e] outline-none focus:ring-2 focus:ring-[#0a7c72]/15"
            />
          </div>

          <div className="ml-6 flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications((current) => !current)}
                className="relative rounded-full p-2 text-[#52627d] transition hover:bg-[#f1f3f5]"
                aria-label="Buka notifikasi dashboard"
              >
                <span className="material-symbols-outlined">notifications</span>
                {notifications.length > 0 ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#d63f2f]" />
                ) : null}
              </button>

              {showNotifications ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[360px] rounded-[20px] border border-[#eef1f1] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#0a7c72]">
                        Notifikasi
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#8b9895]">
                        Ringkasan update toko hari ini.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="rounded-full p-2 text-[#6f7b79] transition hover:bg-[#f1f3f5]"
                      aria-label="Tutup notifikasi"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <Link
                          key={item.id}
                          to={item.href ?? '/dashboard'}
                          onClick={() => setShowNotifications(false)}
                          className={cn(
                            'block rounded-[16px] border px-4 py-3 transition hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
                            notificationToneClasses(item.tone),
                          )}
                        >
                          <p className="text-sm font-bold text-[#191c1e]">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[#52627d]">
                            {item.description}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-[16px] bg-[#f8f9fb] px-4 py-6 text-center text-sm font-medium text-[#8b9895]">
                        Belum ada notifikasi baru.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="h-8 w-px bg-[#eef1f1]" />
            <div className="text-right">
              <p className="text-sm font-bold text-[#191c1e]">{user?.nama ?? 'Admin Toko'}</p>
              <p className="text-[11px] font-medium text-[#8b9895]">Shift Pagi</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a7c72] text-white">
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </div>
          </div>
        </header>

        <div className="space-y-6 bg-[#f7f9f9] px-6 py-6">
          <section className="flex items-end justify-between">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#191c1e]">
                Laporan Dashboard
              </h1>
              <p className="mt-1 text-sm font-medium text-[#7d8987]">
                Analisis performa penjualan hari ini secara real-time.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-[12px] bg-white p-1 shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
              <button className="rounded-[10px] bg-[#f4fffc] px-4 py-2 text-sm font-bold text-[#0a7c72]">
                Hari Ini
              </button>
              <button className="rounded-[10px] px-4 py-2 text-sm font-semibold text-[#7d8987]">
                Minggu Ini
              </button>
              <button className="rounded-[10px] px-4 py-2 text-sm font-semibold text-[#7d8987]">
                Bulan Ini
              </button>
              <button className="flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold text-[#7d8987]">
                <span>Custom</span>
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              </button>
            </div>
          </section>

          {error ? (
            <div className="rounded-[16px] border border-[#ffdad6] bg-[#fff5f3] px-4 py-3 text-sm font-medium text-[#ba1a1a]">
              Gagal memuat dashboard: {error}
            </div>
          ) : null}

          <section className="grid grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[18px] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: `${card.accent}33`, color: '#0a7c72' }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{
                      backgroundColor: card.badgeTone.background,
                      color: card.badgeTone.color,
                    }}
                  >
                    {card.badge}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b9895]">
                    {card.title}
                  </p>
                  <div className="mt-1 min-h-[52px] text-[18px] font-extrabold leading-tight text-[#191c1e]">
                    {loading ? <Skeleton className="h-8 w-32 rounded-xl" /> : card.value}
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-[minmax(0,1fr)_320px] gap-4">
            <article className="rounded-[18px] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#2e3132]">
                  <span className="material-symbols-outlined text-[20px] text-[#0a7c72]">
                    bar_chart
                  </span>
                  Penjualan per Hari (Mingguan)
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium text-[#8b9895]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0a7c72]" />
                  Revenue
                </div>
              </div>

              <div className="mt-5 h-[250px]">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-[16px]" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <XAxis
                        axisLine={false}
                        dataKey="tanggal"
                        tickFormatter={(value) =>
                          format(parseISO(value), 'EEE', { locale: localeId }).toUpperCase()
                        }
                        tickLine={false}
                        tick={{ fill: '#909a98', fontSize: 11, fontWeight: 700 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: 'rgba(10,124,114,0.05)' }}
                        contentStyle={{
                          border: 'none',
                          borderRadius: 12,
                          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        }}
                        formatter={(value) => [`Rp ${formatCompactCurrency(Number(value ?? 0))}`, '']}
                        labelFormatter={(value) =>
                          format(parseISO(String(value)), 'EEEE, dd MMMM yyyy', {
                            locale: localeId,
                          })
                        }
                      />
                      <Bar dataKey="totalPenjualan" radius={[10, 10, 10, 10]} maxBarSize={44}>
                        {salesTrend.map((item, index) => (
                          <Cell
                            key={item.tanggal}
                            fill={index === 2 ? '#0a7c72' : '#dff2ef'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="rounded-[18px] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#2e3132]">
                <span className="material-symbols-outlined text-[20px] text-[#a86b00]">
                  pie_chart
                </span>
                Kategori Produk
              </h2>

              <div className="mt-4 h-[210px]">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-[16px]" />
                ) : donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="48%"
                        dataKey="total"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {donutData.map((entry, index) => (
                          <Cell
                            key={entry.category}
                            fill={donutColors[index % donutColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [<CurrencyDisplay key="value" value={Number(value)} />, '']}
                      />
                      <text
                        x="50%"
                        y="45%"
                        textAnchor="middle"
                        className="fill-[#8b9895] text-[11px] font-extrabold uppercase"
                      >
                        Total
                      </text>
                      <text
                        x="50%"
                        y="54%"
                        textAnchor="middle"
                        className="fill-[#191c1e] text-[20px] font-extrabold"
                      >
                        100%
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[16px] bg-[#f8f9fb] text-sm font-medium text-[#8b9895]">
                    Belum ada penjualan kategori.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {donutData.length > 0 ? (
                  donutData.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: donutColors[index % donutColors.length] }}
                        />
                        <span className="font-medium text-[#52627d]">{item.category}</span>
                      </div>
                      <span className="font-bold text-[#2e3132]">
                        {formatCategoryLabel(item.percent)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[#8b9895]">Data kategori belum tersedia.</div>
                )}
              </div>
            </article>
          </section>

          <section className="rounded-[18px] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-[#eef1f1] px-5 py-4">
              <h2 className="text-[16px] font-extrabold text-[#2e3132]">Transaksi Terbaru</h2>
              <Link to="/laporan" className="text-sm font-bold text-[#0a7c72]">
                Lihat Semua
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#f7f9f9]">
                  <tr>
                    {['No. Transaksi', 'Waktu', 'Total', 'Metode', 'Kasir', 'Status'].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#97a19f]"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-t border-[#eef1f1]">
                        {Array.from({ length: 6 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-5 py-4">
                            <Skeleton className="h-5 w-full rounded-xl" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : latestTransactions.length > 0 ? (
                    latestTransactions.map((item) => (
                      <tr key={item.id} className="border-t border-[#eef1f1]">
                        <td className="px-5 py-4 text-sm font-extrabold text-[#0a7c72]">
                          #{item.nomor_nota ?? '-'}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-[#6f7b79]">
                          {formatTransactionTime(item.created_at)}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-[#2e3132]">
                          <CurrencyDisplay value={Number(item.total ?? 0)} />
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-[#52627d]">
                          {item.metode_bayar?.toUpperCase() ?? '-'}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-[#52627d]">
                          {item.kasir_nama ?? '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#ccfaf1] px-3 py-1 text-[10px] font-extrabold uppercase text-[#0a7c72]">
                            Lunas
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[#eef1f1]">
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-sm font-medium text-[#8b9895]"
                      >
                        Belum ada transaksi terbaru.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
