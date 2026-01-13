/**
 * AppSidebar - Shared Navigation Sidebar
 * 
 * Used by both Dashboard (red theme) and Canteen Menu (green theme)
 * Features:
 * - Working navigation links
 * - Active state highlighting
 * - Responsive (mobile drawer + desktop fixed)
 * - Theme color prop (brand/canteen)
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '@/utils/authStore';

// Icons
const Icons = {
  Grid: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  Clipboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  Edit: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  X: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Hamburger: () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

interface AppSidebarProps {
  theme: 'brand' | 'canteen';
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: () => JSX.Element;
  badge?: number;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: Icons.Grid },
  { label: 'Menu Management', path: '/canteen/menu', icon: Icons.Menu },
  { label: 'Orders', path: '#', icon: Icons.Clipboard, badge: 12, disabled: true },
];

const settingsItems: NavItem[] = [
  { label: 'Restaurant Details', path: '#', icon: Icons.Edit, disabled: true },
];

export default function AppSidebar({ theme, isMobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Theme colors
  const colors = {
    brand: {
      icon: 'bg-red-500',
      iconText: 'text-white',
      active: 'bg-red-50 text-red-700 border-red-100',
      activeIcon: 'text-red-600',
      accent: 'text-red-600',
      logoutHover: 'hover:bg-red-50',
    },
    canteen: {
      icon: 'bg-emerald-500',
      iconText: 'text-white',
      active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      activeIcon: 'text-emerald-600',
      accent: 'text-emerald-600',
      logoutHover: 'hover:bg-emerald-50',
    },
  };

  const c = colors[theme];

  const renderNavItem = (item: typeof navItems[0], isActive: boolean) => (
    <Link
      key={item.label}
      to={item.path}
      onClick={(e) => {
        if (item.disabled) e.preventDefault();
        else onMobileClose();
      }}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border ${
        isActive
          ? `${c.active} font-semibold shadow-sm`
          : item.disabled
            ? 'text-gray-400 cursor-not-allowed border-transparent'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={isActive ? c.activeIcon : item.disabled ? 'text-gray-400' : 'text-gray-500'}>
          <item.icon />
        </span>
        <span className="text-sm">{item.label}</span>
      </div>
      {item.badge && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-9 h-9 ${c.icon} rounded-xl flex items-center justify-center ${c.iconText} font-bold text-sm shadow-lg`}>
          C
        </div>
        <span className="font-bold text-lg tracking-tight text-gray-900">
          Charusat<span className={c.accent}>Needs</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return renderNavItem(item, isActive);
        })}

        <div className="pt-5 mt-5 border-t border-gray-100">
          <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Settings
          </p>
          {settingsItems.map((item) => {
            const isActive = location.pathname === item.path;
            return renderNavItem(item, isActive);
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 ${c.logoutHover} transition-all`}
        >
          <Icons.Logout />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 flex-col shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 z-50 h-full w-[85%] max-w-[300px] bg-white flex flex-col shadow-2xl"
            >
              {/* Mobile Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${c.icon} rounded-lg flex items-center justify-center ${c.iconText} font-bold text-sm`}>
                    C
                  </div>
                  <span className="font-bold text-gray-900">CharusatNeeds</span>
                </div>
                <button
                  onClick={onMobileClose}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Icons.X />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return renderNavItem(item, isActive);
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50"
                >
                  <Icons.Logout />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Export hamburger button for header
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
    >
      <Icons.Hamburger />
    </button>
  );
}
