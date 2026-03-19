import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getDashboardStats } from '../../api/reports'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { cn } from '../../utils/cn'
import { Badge } from '../ui/Badge'

interface MenuItem {
  label: string
  path: string
  icon: string
  adminOnly?: boolean
}

const menuItems: MenuItem[] = [
  { label: 'Kasir', path: '/pos', icon: 'point_of_sale' },
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Produk', path: '/produk', icon: 'package_2', adminOnly: true },
  { label: 'Stok', path: '/stok', icon: 'inventory_2', adminOnly: true },
  { label: 'Laporan', path: '/laporan', icon: 'history', adminOnly: true },
  { label: 'Pengaturan', path: '/pengaturan', icon: 'settings', adminOnly: true },
]

export function Sidebar() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const logout = useAuthStore((state) => state.logout)
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const [lowStockCount, setLowStockCount] = useState<number>(0)

  useEffect(() => {
    void (async () => {
      try {
        const stats = await getDashboardStats()
        setLowStockCount(stats.jumlahProdukStokMenipis)
      } catch {
        setLowStockCount(0)
      }
    })()
  }, [])

  const visibleMenus = useMemo(
    () => menuItems.filter((item) => (item.adminOnly ? isAdmin : true)),
    [isAdmin],
  )

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-[#eef1f1] bg-white pb-5 pt-5 transition-all duration-200',
        sidebarCollapsed ? 'w-16 px-2' : 'w-[220px] px-4',
      )}
    >
      <div className={cn('flex items-start justify-between', sidebarCollapsed ? 'px-1' : 'px-3')}>
        <div className={cn(sidebarCollapsed && 'hidden')}>
          <p className="text-[14px] font-extrabold leading-none text-[#0a7c72]">
            Toko Plastik Ratih
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8b9895]">
            Management System
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#52627d] transition-colors hover:bg-[#f7f9f9]"
          aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          <span className="material-symbols-outlined text-[20px]">
            {sidebarCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>

      {sidebarCollapsed ? (
        <div className="mt-3 flex justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f8f6] text-[#0a7c72]">
            <span className="material-symbols-outlined text-[18px]">storefront</span>
          </div>
        </div>
      ) : null}

      <nav className="mt-8 flex-1 space-y-1">
        {visibleMenus.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-[14px] text-[15px] transition-colors duration-200',
                sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
                isActive
                  ? 'bg-[#e7f8f6] font-semibold text-[#0a7c72]'
                  : 'font-medium text-[#52627d] hover:bg-[#f7f9f9]',
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed ? <span>{item.label}</span> : null}
                {!sidebarCollapsed && item.path === '/stok' && lowStockCount > 0 ? (
                  <Badge className="ml-auto" variant="warning">
                    {lowStockCount}
                  </Badge>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#eef1f1] pt-4">
        {!sidebarCollapsed ? (
          <div className="px-4 py-2">
            <p className="text-sm font-bold text-on-surface">{user?.nama ?? 'Pengguna'}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-outline">
              {user?.role ?? 'Tanpa role'}
            </p>
          </div>
        ) : (
          <div className="flex justify-center px-1 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f8f6] text-[#0a7c72]">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className={cn(
            'mt-2 flex w-full items-center rounded-[14px] text-[#df3d2f] transition-colors duration-200 hover:bg-[#fff1ed]',
            sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
          )}
          title={sidebarCollapsed ? 'Keluar' : undefined}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          {!sidebarCollapsed ? <span className="font-medium">Keluar</span> : null}
        </button>
      </div>
    </aside>
  )
}
