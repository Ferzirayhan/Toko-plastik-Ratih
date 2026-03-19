import { Outlet } from 'react-router-dom'
import { useUIStore } from '../../stores/uiStore'
import { Sidebar } from './Sidebar'
import { ToastViewport } from '../ui/Toast'

export function AppLayout() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)

  return (
    <div
      className="min-h-screen bg-[#f7f9f9] text-on-surface"
      style={{ ['--app-sidebar-width' as string]: sidebarCollapsed ? '4rem' : '220px' }}
    >
      <ToastViewport />
      <Sidebar />
      <Outlet />
    </div>
  )
}
