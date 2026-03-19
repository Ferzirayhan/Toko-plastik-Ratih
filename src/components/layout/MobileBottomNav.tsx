import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../utils/cn'

interface MobileNavItem {
  path: string
  label: string
  icon: string
  adminOnly?: boolean
}

const baseItems: MobileNavItem[] = [
  { path: '/pos', label: 'Kasir', icon: 'point_of_sale' },
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/produk', label: 'Produk', icon: 'package_2', adminOnly: true },
  { path: '/stok', label: 'Stok', icon: 'inventory_2', adminOnly: true },
  { path: '/laporan', label: 'Laporan', icon: 'history', adminOnly: true },
  { path: '/pengaturan', label: 'Setelan', icon: 'settings', adminOnly: true },
]

export function MobileBottomNav() {
  const isAdmin = useAuthStore((state) => state.isAdmin)

  const visibleItems = baseItems.filter((item) => (item.adminOnly ? isAdmin : true)).slice(0, 5)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.55rem)] pt-2 md:hidden">
      <div className="mx-auto max-w-[460px] rounded-[24px] border border-white/80 bg-white/96 p-2 shadow-[0_-10px_28px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="grid grid-cols-5 gap-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex min-h-[54px] flex-col items-center justify-center rounded-[16px] px-1 py-1.5 text-[10px] font-extrabold transition-all',
                isActive
                  ? 'bg-[#e7f8f6] text-[#0a7c72] shadow-[0_8px_18px_rgba(10,124,114,0.10)]'
                  : 'text-[#6f7b79]',
              )
            }
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            <span className="mt-1 truncate text-[9px]">{item.label}</span>
          </NavLink>
        ))}
        </div>
      </div>
    </nav>
  )
}
