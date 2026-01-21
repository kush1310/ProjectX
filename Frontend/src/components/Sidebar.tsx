/**
 * Unified Sidebar Component for all pages
 * 
 * Features:
 * - Collapsible navigation
 * - Fixed logout icon size when collapsed
 * - No green C icon
 * - Responsive (mobile drawer + desktop sidebar)
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/Icons';
import { logout } from '@/utils/authStore';
import LogoutConfirmModal from '@/Canteen/components/LogoutConfirmModal';

// Nav Items
const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Icons.Grid, enabled: true },
  { label: 'Menu Management', path: '/canteen/menu', icon: Icons.Menu, enabled: true },
  { label: 'Order History', path: '/order-history', icon: Icons.History, enabled: true },
  { label: 'Analytics', path: '#', icon: Icons.Chart, enabled: false },
  { label: 'Coupon Management', path: '/vendor/coupons', icon: Icons.Tag, enabled: true },
  { label: 'Recent Reviews', path: '#', icon: Icons.Star, enabled: false },
  { label: 'Help & Support', path: '#', icon: Icons.Help, enabled: false },
  { label: 'Restaurant Details', path: '#', icon: Icons.Settings, enabled: false },
];

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 968);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 968);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when logout modal is open
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showLogoutModal]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex font-sans text-gray-900">
      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isMobileNavOpen || isDesktop) && (
          <>
            {/* Mobile Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 min-[968px]:hidden"
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0, width: isNavCollapsed ? 72 : 260 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-0 left-0 z-50 h-full bg-white flex flex-col shadow-2xl"
            >
              {/* Logo - NO Green C Icon */}
              <div className={`p-5 border-b border-gray-100/80 flex items-center ${isNavCollapsed ? 'justify-center' : 'gap-3'}`}>
                {!isNavCollapsed && (
                  <span className="font-bold text-lg tracking-tight text-gray-900">
                    Charusat<span className="text-emerald-600">Needs</span>
                  </span>
                )}
                {isNavCollapsed && (
                  <span className="font-bold text-lg text-emerald-600">CN</span>
                )}

                {/* Mobile Close Button */}
                {!isDesktop && (
                  <button
                    onClick={() => setIsMobileNavOpen(false)}
                    className="ml-auto p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Icons.X />
                  </button>
                )}
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.enabled ? item.path : '#'}
                      onClick={(e) => {
                        if (!item.enabled) e.preventDefault();
                        setIsMobileNavOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 font-semibold'
                          : item.enabled
                            ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            : 'text-gray-400 cursor-not-allowed opacity-50'
                        } ${isNavCollapsed ? 'justify-center px-3' : ''}`}
                      title={isNavCollapsed ? item.label : undefined}
                    >
                      <span className={`shrink-0 ${isActive ? 'text-emerald-600' : ''}`}>
                        <item.icon />
                      </span>
                      {!isNavCollapsed && <span className="text-sm truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>

              {/* Collapse Toggle - Desktop Only */}
              {isDesktop && (
                <button
                  onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                  className="absolute -right-3 top-24 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 shadow-md transition-all"
                >
                  {isNavCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
                </button>
              )}

              {/* Logout - FIXED: Icon size stays constant */}
              <div className="p-4 border-t border-gray-100/80">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all ${isNavCollapsed ? 'justify-center px-3' : ''}`}
                >
                  {/* Fixed size logout icon - does NOT shrink when collapsed */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  {!isNavCollapsed && <span className="text-sm font-medium">Logout</span>}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-200 min-h-screen ${isNavCollapsed ? 'min-[968px]:ml-[72px]' : 'min-[968px]:ml-[260px]'} w-full bg-gray-50/50`}
      >
        {/* Mobile Menu Button (appears on pages that use this Sidebar) */}
        {!isDesktop && (
          <button 
            onClick={() => setIsMobileNavOpen(true)} 
            className="fixed top-4 left-4 z-30 p-2 bg-white shadow-lg rounded-xl text-gray-600 hover:bg-gray-100"
          >
            <Icons.Menu />
          </button>
        )}
        
        {children}
      </main>

      {/* Logout Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
