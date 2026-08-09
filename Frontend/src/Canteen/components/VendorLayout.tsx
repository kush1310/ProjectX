import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  UtensilsCrossed,
  History,
  BarChart3,
  Tag,
  Wallet,
  Store,
  MessageSquare,
  HelpCircle,
  Star,
  LogOut,
  ChevronLeft,
  X,
  Menu,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Bell
} from "lucide-react";

import { logout } from "../../utils/authStore";
import LogoutConfirmModal from "./LogoutConfirmModal";
import api from "@/utils/api";
import { toast } from "@/utils/toast";

const VendorLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useIdleTimeout(); // OWASP: auto-logout after 15min inactivity
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Vendor Canteen State
  const [canteenId, setCanteenId] = useState<number | null>(null);
  const [canteenName, setCanteenName] = useState<string>("My Canteen");
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isTogglingOpen, setIsTogglingOpen] = useState<boolean>(false);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.classList.toggle('no-scroll', isMobileMenuOpen);
    return () => document.body.classList.remove('no-scroll');
  }, [isMobileMenuOpen]);

  // Fetch Vendor Canteen Status on Mount
  useEffect(() => {
    const fetchCanteenStatus = async () => {
      try {
        const res = await api.get('/canteens/my-canteen');
        if (res.data?.canteen) {
          setCanteenId(res.data.canteen.id);
          setCanteenName(res.data.canteen.name || "My Canteen");
          setIsOpen(res.data.canteen.isOpen ?? true);
        }
      } catch (err) {
        // Fallback for admin or uninitialized vendor
      }
    };
    fetchCanteenStatus();
  }, [location.pathname]);

  const toggleOpenStatus = async () => {
    if (isTogglingOpen) return;
    setIsTogglingOpen(true);
    const prevState = isOpen;
    setIsOpen(!isOpen); // Optimistic update
    try {
      let res;
      try {
        res = await api.patch('/canteens/my-canteen/toggle-open');
      } catch (e) {
        if (canteenId) {
          res = await api.patch(`/canteens/${canteenId}/toggle-open`);
        } else {
          throw e;
        }
      }
      if (res.data?.canteen?.id) setCanteenId(res.data.canteen.id);
      const nextOpen = res.data.isOpen ?? !prevState;
      setIsOpen(nextOpen);
      toast.success(nextOpen ? 'Store is now OPEN' : 'Store is now CLOSED');
    } catch (err: any) {
      setIsOpen(prevState);
      toast.error(err.response?.data?.message || 'Failed to update store status');
    } finally {
      setIsTogglingOpen(false);
    }
  };

  const menuItems = [
    { icon: ClipboardList,  label: "Orders",               path: "/dashboard"       },
    { icon: UtensilsCrossed,label: "Menu",                 path: "/canteen/menu"    },
    { icon: History,        label: "Order History",        path: "/order-history"   },
    { icon: BarChart3,      label: "Reporting",            path: "/vendor/reports"  },
    { icon: Tag,            label: "Offers & Coupons",     path: "/vendor/coupons" },
    { icon: Wallet,         label: "Payout",               path: "/vendor/payout"   },
    { icon: Store,          label: "Outlet Info",          path: "/vendor/profile"  },
    { icon: MessageSquare,  label: "Customer Complaints",  path: "/vendor/complaints"},
    { icon: Star,           label: "Reviews",              path: "/vendor/reviews"  },
    { icon: HelpCircle,     label: "Help Centre",          path: "/help"            },
  ];

  const handleLogout = () => { logout(); navigate("/login"); };

  const NavLink = ({ item, collapsed = false }: { item: typeof menuItems[0]; collapsed?: boolean }) => {
    const isActive = location.pathname === item.path || 
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ag-lift
          ${isActive
            ? "bg-gradient-to-r from-rose-50 to-rose-100/50 text-[#e23744]"
            : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
          } ${collapsed ? "justify-center" : ""}`}
      >
        {/* Active indicator bar */}
        {isActive && !collapsed && (
          <motion.div
            layoutId="vendor-nav-indicator"
            className="absolute left-0 top-2 bottom-2 w-1 bg-[#e23744] rounded-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
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
    <div className="min-h-screen flex bg-neutral-50/50">
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-extrabold text-neutral-900">
              Charusat<span className="text-[#e23744]">Needs</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleOpenStatus}
              disabled={isTogglingOpen}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                isOpen ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              {isOpen ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-red-600" />}
              <span>{isOpen ? 'OPEN' : 'CLOSED'}</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-neutral-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 35, stiffness: 350 }}
              className="md:hidden fixed top-0 right-0 z-50 h-screen w-72 bg-white/95 backdrop-blur-xl border-l border-neutral-100 shadow-2xl flex flex-col"
            >
              {/* Header with profile */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
                <div className="w-10 h-10 bg-gradient-to-br from-[#e23744] to-[#ff6b6b] rounded-xl flex items-center justify-center shadow-md shadow-rose-200/40 shrink-0">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-extrabold text-neutral-900 truncate">{canteenName}</h1>
                  <p className="text-[10px] text-neutral-400 font-medium">— vendor partner —</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 py-3 overflow-y-auto">
                <div className="space-y-1 px-3">
                  {menuItems.map((item, i) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                    >
                      <NavLink item={item} />
                    </motion.div>
                  ))}
                </div>
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-neutral-100">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50/70 transition-all font-bold text-sm"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen flex-col transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '4px 0 30px rgba(0,0,0,0.03)',
        }}
      >
        {/* Toggle Collapse */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-6 transition-all duration-300 ${
            isCollapsed ? "right-1/2 translate-x-1/2" : "right-4"
          } w-8 h-8 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center text-neutral-500 hover:text-[#e23744] transition-colors z-50`}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
        
        {/* Logo */}
        <div className="p-6 pt-16 border-b border-neutral-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#e23744] to-[#ff6b6b] rounded-xl flex items-center justify-center shadow-md shadow-rose-200/40 shrink-0">
              <span className="text-white font-black text-xl">C</span>
            </div>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden min-w-0">
                <h1 className="text-base font-extrabold text-neutral-900 truncate">CharusatNeeds</h1>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">{canteenName}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Global Store Open/Close Control in Sidebar */}
        {!isCollapsed && (
          <div className="px-4 py-3 mx-3 mt-3 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-500 ag-status-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-bold text-neutral-700">{isOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
            </div>
            <button
              onClick={toggleOpenStatus}
              disabled={isTogglingOpen}
              className={`p-1 rounded-lg transition-all ${
                isOpen ? 'text-emerald-600 hover:bg-emerald-100' : 'text-red-600 hover:bg-red-100'
              }`}
              title="Toggle Store Open/Close"
            >
              {isTogglingOpen ? <RefreshCw className="w-4 h-4 animate-spin" /> : isOpen ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => (
              <NavLink key={item.path} item={item} collapsed={isCollapsed} />
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-red-50/70 hover:text-red-600 transition-all ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={`flex-1 min-h-screen transition-all duration-300 pt-16 md:pt-0 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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
