import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  UtensilsCrossed,
  History,
  BarChart3,
  Megaphone,
  Wallet,
  Store,
  HelpCircle,
  LogOut,
  ChevronLeft,
} from "lucide-react";

import { logout } from "../../utils/authStore";
import LogoutConfirmModal from "./LogoutConfirmModal";

const VendorLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Zomato-style menu items
  const menuItems = [
    { icon: ClipboardList, label: "Orders", path: "/dashboard" },
    { icon: UtensilsCrossed, label: "Menu", path: "/canteen/menu" },
    { icon: History, label: "Order history", path: "/order-history" },
    { icon: BarChart3, label: "Insights", path: "/analytics" },
    { icon: Megaphone, label: "Campaigns", path: "/vendor/coupons" },
    { icon: Wallet, label: "Payout", path: "/vendor/payout" },
    { icon: Store, label: "Outlet info", path: "/vendor/profile" },
    { icon: HelpCircle, label: "Help centre", path: "/help" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavLink = ({ item, collapsed = false }: { item: typeof menuItems[0]; collapsed?: boolean }) => {
    const isActive = location.pathname === item.path || 
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
          ${isActive
            ? "bg-[#e23744]/10 text-[#e23744]"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          } ${collapsed ? "justify-center" : ""}`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#e23744]" : ""}`} />
        {!collapsed && (
          <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#e23744] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">CharusatNeeds</h1>
              <p className="text-[10px] text-slate-500">— vendor partner —</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex flex-col gap-1.5 items-center justify-center w-10 h-10"
            aria-label="Toggle menu"
          >
            {/* Animated Hamburger Bars */}
            <motion.span
              animate={{
                rotate: isMobileMenuOpen ? 45 : 0,
                y: isMobileMenuOpen ? 8 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="w-5 h-0.5 bg-slate-600 rounded-full block"
            />
            <motion.span
              animate={{
                opacity: isMobileMenuOpen ? 0 : 1,
                scaleX: isMobileMenuOpen ? 0 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="w-5 h-0.5 bg-slate-600 rounded-full block"
            />
            <motion.span
              animate={{
                rotate: isMobileMenuOpen ? -45 : 0,
                y: isMobileMenuOpen ? -8 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="w-5 h-0.5 bg-slate-600 rounded-full block"
            />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="md:hidden fixed top-0 left-0 z-50 h-screen w-72 bg-white shadow-2xl flex flex-col"
          >
            {/* Logo */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e23744] rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">CharusatNeeds</h1>
                  <p className="text-[10px] text-slate-500">— vendor partner —</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
              <div className="space-y-1 px-3">
                {menuItems.map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}
              </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-200 flex-col transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Toggle Button - Inside Sidebar */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-6 transition-all duration-300 ${
            isCollapsed ? "right-1/2 translate-x-1/2" : "right-4"
          } w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#e23744] transition-colors z-50`}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
        
        {/* Logo Section */}
        <div className="p-6 pt-16 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e23744] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-bold text-slate-900 whitespace-nowrap">
                  CharusatNeeds
                </h1>
                <p className="text-[10px] text-slate-500">— vendor partner —</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => (
              <NavLink key={item.path} item={item} collapsed={isCollapsed} />
            ))}
          </div>
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200
              ${isCollapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={`flex-1 min-h-screen transition-all duration-300 pt-16 md:pt-0 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <LogoutConfirmModal 
        isOpen={showLogoutModal} 
        onConfirm={handleLogout} 
        onCancel={() => setShowLogoutModal(false)} 
      />
    </div>
  );
};

export default VendorLayout;
