import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Sparkles,
  Copy,
  Check,
  Clock,
  Zap,
  Gift,
  ShieldCheck,
  ShoppingBag,
  Percent,
  DollarSign,
  Info,
  ChevronRight,
  Truck,
  RotateCcw,
  BadgePercent,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Building2,
  AlertCircle
} from 'lucide-react';
import { getActiveCoupons, Coupon, CouponType, fetchCanteens, Canteen } from '../utils/canteenStore';
import { useCouponWebSocket } from '@/hooks/useCouponWebSocket';
import { toast } from '@/utils/toast';

export default function CustomerOffers() {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'ALL' | CouponType>('ALL');
  const [selectedCanteenId, setSelectedCanteenId] = useState<number | 'ALL'>('ALL');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsData, canteensData] = await Promise.all([
        getActiveCoupons(),
        fetchCanteens()
      ]);
      setCoupons(couponsData || []);
      setCanteens(canteensData || []);
    } catch (err) {
      toast.error('Failed to load active offers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time WebSocket listener
  useCouponWebSocket({
    onCreated: loadData,
    onUpdated: loadData,
    onDeleted: loadData,
    onToggled: loadData,
    onArchived: loadData,
    onRestored: loadData,
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApplyInCart = (code: string) => {
    handleCopyCode(code);
    navigate('/cart');
  };

  // Filter coupons based on selected type and canteen
  const filteredCoupons = coupons.filter(coupon => {
    const matchesCategory = activeCategory === 'ALL' || coupon.couponType === activeCategory;
    const matchesCanteen = selectedCanteenId === 'ALL' || !coupon.canteenId || coupon.canteenId === selectedCanteenId;
    return matchesCategory && matchesCanteen;
  });

  const categories: { label: string; value: 'ALL' | CouponType }[] = [
    { label: 'All Deals', value: 'ALL' },
    { label: 'General Offers', value: 'GENERAL' },
    { label: 'Buy 1 Get 1 (BOGO)', value: 'BOGO' },
    { label: 'Dish Specials', value: 'ITEM_SPECIFIC' },
    { label: 'Combo Savings', value: 'COMBO' },
    { label: 'New Dishes', value: 'NEW_DISH' },
    { label: 'Rush Hour', value: 'RUSH_HOUR' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* ── HERO BANNER WITH WIDE CAMPUS CANTEEN IMAGE ── */}
      <div className="relative text-white pt-8 pb-14 px-4 sm:px-6 overflow-hidden">
        {/* Background Wide Campus Canteen Image */}
        <img 
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&auto=format&fit=crop&q=80" 
          alt="Campus Canteen"
          className="absolute inset-0 w-full h-full object-cover brightness-75 scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#e23744]/95 via-[#ea580c]/90 to-slate-950/80" />

        {/* Background glow graphics */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Back Button (Left Arrow) */}
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all active:scale-95 group"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                Live Campus Promotions & Discounts
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Offers, Coupons & System Info
              </h1>
              <p className="text-white/90 text-sm sm:text-base mt-2 font-medium leading-relaxed">
                Save on every order across CHARUSAT campus canteens. Unlock live promo codes, daily flash deals, and student perks!
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto bg-white/15 backdrop-blur-xl border border-white/20 p-4 rounded-2xl">
              <div className="p-3 bg-white text-[#e23744] rounded-xl shadow-md">
                <BadgePercent className="w-8 h-8" />
              </div>
              <div>
                <span className="text-2xl font-black text-white">{coupons.length}</span>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Active Coupons Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 space-y-10">
        {/* ── SYSTEM HIGHLIGHT PERKS (INFO CARDS) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Truck,
              title: 'Free Campus Delivery',
              desc: '₹0 delivery fee on all student orders',
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            },
            {
              icon: Zap,
              title: 'Instant Order Tracking',
              desc: 'Live status updates from canteen kitchen',
              color: 'text-amber-600 bg-amber-50 border-amber-100',
            },
            {
              icon: ShieldCheck,
              title: '100% Encrypted Pay',
              desc: 'Razorpay UPI, Cards & Cash on Pickup',
              color: 'text-blue-600 bg-blue-50 border-blue-100',
            },
            {
              icon: Gift,
              title: 'Exclusive Coupons',
              desc: 'Direct promo deals created by canteens',
              color: 'text-rose-600 bg-rose-50 border-rose-100',
            },
          ].map((perk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-start gap-3 hover:shadow-md transition-all"
            >
              <div className={`p-2.5 rounded-xl border ${perk.color}`}>
                <perk.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{perk.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{perk.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── SECTION 1: LIVE COUPONS & OFFERS ── */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#e23744]" />
                <h2 className="text-xl font-bold text-slate-900">Available Promo Codes</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time active coupons created by vendors. Tap to copy code or apply directly to cart.
              </p>
            </div>

            {/* Canteen Filter Dropdown */}
            {canteens.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCanteenId}
                  onChange={(e) => setSelectedCanteenId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#e23744] transition-all"
                >
                  <option value="ALL">All Canteens</option>
                  {canteens.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.value
                    ? 'bg-[#e23744] text-white shadow-md shadow-rose-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Coupons List / Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No active coupons in this category</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Check back soon! Canteen owners publish new discount codes frequently throughout the day.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredCoupons.map((coupon) => {
                const isCopied = copiedCode === coupon.couponCode;
                const canteenName = canteens.find(c => c.id === coupon.canteenId)?.name;

                return (
                  <motion.div
                    key={coupon.id || coupon.couponCode}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-white to-rose-50/20 border border-slate-200 hover:border-rose-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Tag Badges */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-rose-100 text-[#e23744] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {coupon.couponType.replace('_', ' ')}
                          </span>
                          {canteenName && (
                            <span className="text-xs text-slate-500 font-semibold truncate">
                              • {canteenName}
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-lg mt-1 tracking-tight">
                          {coupon.couponCode}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-[#e23744]">
                          {coupon.discountType === 'PERCENTAGE'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} OFF`}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium mb-4 line-clamp-2 leading-relaxed">
                      {coupon.description || 'Valid on all student food orders.'}
                    </p>

                    {/* Requirements / Validity details */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mb-4 pt-3 border-t border-slate-100">
                      {coupon.minOrderValue && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-slate-400" />
                          Min Order: ₹{coupon.minOrderValue}
                        </span>
                      )}
                      {coupon.endTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Expires: {new Date(coupon.endTime).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(coupon.couponCode)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isCopied
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        {isCopied ? 'Copied' : 'Copy Code'}
                      </button>

                      <button
                        onClick={() => handleApplyInCart(coupon.couponCode)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#e23744] hover:bg-[#d02e3b] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-200 transition-all active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Apply in Cart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECTION 2: SYSTEM INFORMATION & ANNOUNCEMENTS ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#e23744]" />
            <h2 className="text-xl font-bold text-slate-900">System Features & Campus Offers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-md">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Rush Hour Discounts</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Look out for special time-limited Rush Hour coupons published by canteens during peak lunch & snack hours.
              </p>
            </div>

            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Combo & BOGO Savings</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Enjoy Buy-1-Get-1 free meal offers and combo discounts on popular beverage and snack combinations.
              </p>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Automated Refunds</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                If an order is cancelled, refunds are processed instantly via Razorpay straight back to your payment account.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: HOW TO REDEEM GUIDE ── */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">How to Redeem Coupons on CharusatNeeds</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Pick a Coupon', desc: 'Browse live promo codes above or tap "% Offers" inside your Cart.' },
              { step: '02', title: 'Copy or Tap Apply', desc: 'Click "Apply in Cart" to automatically paste and calculate your discount.' },
              { step: '03', title: 'Enjoy Savings', desc: 'Checkout with your discounted grand total and track your order live!' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-5 border border-white/10">
                <span className="text-2xl font-black text-yellow-400">{s.step}</span>
                <h3 className="font-bold text-white text-base mt-2">{s.title}</h3>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/80 font-medium text-center sm:text-left">
              Have questions about an offer? Visit your Canteen counter or check current order status.
            </p>
            <button
              onClick={() => navigate('/cart')}
              className="px-6 py-3 bg-[#e23744] hover:bg-[#d02e3b] text-white font-bold rounded-xl shadow-lg transition-all text-xs flex items-center gap-2 shrink-0"
            >
              Go to Cart & Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
