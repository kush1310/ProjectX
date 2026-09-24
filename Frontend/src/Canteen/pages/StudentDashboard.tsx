import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import FuzzySearch from 'fuzzy-search';
import { fetchCanteens, getActiveCoupons, Coupon, Canteen } from '../utils/canteenStore';
import { getSession } from '@/utils/authStore';
import { Icons } from '@/components/Icons';
import AddressModal from '../components/AddressModal';
import { SlidersHorizontal, Leaf, Clock, MapPin, Star, Bookmark, ChevronDown, ChevronLeft, ChevronRight, Copy, Check, Sparkles, Tag, Tag as TagIcon, Percent, ShoppingBag, Mic, Store, ArrowRight } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useCouponWebSocket } from '@/hooks/useCouponWebSocket';
import { toast } from '@/utils/toast';
import api from '@/utils/api';

const CANTEEN_CAROUSEL_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&auto=format&fit=crop&q=80',
    canteen: 'Central Campus Canteen',
  },
  {
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&auto=format&fit=crop&q=80',
    canteen: 'CSPIT Food Hub',
  },
  {
    url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1400&auto=format&fit=crop&q=80',
    canteen: 'DEPSTAR Canteen & Bistro',
  },
  {
    url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1400&auto=format&fit=crop&q=80',
    canteen: 'RPCP Food Plaza',
  },
  {
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&auto=format&fit=crop&q=80',
    canteen: 'CMPICA Food Court',
  },
];

export default function StudentDashboard() {
  const navigate  = useNavigate();
  const session   = getSession();
  const { isConnected, subscribe } = useWebSocket();

  const [canteens,         setCanteens]         = useState<Canteen[]>([]);
  const [loading,          setLoading]           = useState(true);
  const [searchQuery,      setSearchQuery]        = useState('');
  const [isSearchFocused,  setIsSearchFocused]   = useState(false);
  const [showAddressModal, setShowAddressModal]  = useState(false);
  const [userAddress,      setUserAddress]       = useState<any>(null);
  const [topCoupon,        setTopCoupon]         = useState<Coupon | null>(null);
  const [allCoupons,       setAllCoupons]        = useState<Coupon[]>([]);
  const [copiedCode,       setCopiedCode]        = useState<string | null>(null);
  const [vegMode,          setVegMode]           = useState(false);
  const [activeFilter,     setActiveFilter]      = useState('All');
  const [showFilterModal,  setShowFilterModal]   = useState(false);
  const [filterModalTab,   setFilterModalTab]    = useState<'sort' | 'rating' | 'cost'>('sort');
  const [sortMode,         setSortMode]          = useState<'popularity' | 'rating' | 'cost_asc' | 'cost_desc'>('popularity');
  const [minRating,        setMinRating]         = useState<number>(0);
  const [costRange,        setCostRange]         = useState<'all' | 'under_100' | '100_250' | 'above_250'>('all');
  // Backend-persisted bookmark set — loaded on mount, updated on toggle
  const [savedCanteens,    setSavedCanteens]     = useState<Set<number>>(new Set());
  // Mapping of canteenId → lowercase item names, built in background for cross-dish search
  const [menuItemsMap,     setMenuItemsMap]      = useState<Record<number, string[]>>({});
  // Mapping of canteenId → live average rating from the reviews table
  const [canteenRatings,   setCanteenRatings]    = useState<Record<number, number>>({});
  // Tracks which canteen appeared because of a menu item match (for search chip display)
  const [itemMatchNames,   setItemMatchNames]    = useState<Record<number, string>>({});
  const [bannerIndex,      setBannerIndex]       = useState(0);

  // Auto-rotate canteen banner image carousel every 4.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % CANTEEN_CAROUSEL_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handlePrevBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerIndex((prev) => (prev - 1 + CANTEEN_CAROUSEL_IMAGES.length) % CANTEEN_CAROUSEL_IMAGES.length);
  };

  const handleNextBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerIndex((prev) => (prev + 1) % CANTEEN_CAROUSEL_IMAGES.length);
  };

  const user = session;

  const refreshCoupons = useCallback(async () => {
    try {
      const couponsData = await getActiveCoupons();
      setAllCoupons(couponsData || []);
      if (couponsData?.length > 0) {
        setTopCoupon(
          [...couponsData].sort((a, b) => (b.discountValue || 0) - (a.discountValue || 0))[0]
        );
      } else {
        setTopCoupon(null);
      }
    } catch { /* graceful fallback */ }
  }, []);

  useCouponWebSocket({
    onCreated: refreshCoupons,
    onUpdated: refreshCoupons,
    onDeleted: refreshCoupons,
    onToggled: refreshCoupons,
    onArchived: refreshCoupons,
    onRestored: refreshCoupons,
  });

  /**
   * Loads canteen list and active coupons in parallel.
   * Enforces a minimum 1 s skeleton for perceived smoothness.
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const startTime = Date.now();
      try {
        const [canteenData, couponsData] = await Promise.all([
          fetchCanteens(),
          getActiveCoupons(),
        ]);
        setAllCoupons(couponsData || []);
        if (couponsData?.length > 0) {
          setTopCoupon(
            [...couponsData].sort((a, b) => (b.discountValue || 0) - (a.discountValue || 0))[0]
          );
        }
        const remaining = Math.max(0, 1000 - (Date.now() - startTime));
        setTimeout(async () => {
          setCanteens(canteenData);
          setLoading(false);

          // Fetch live average ratings for all canteens in the background
          try {
            const api = (await import('@/utils/api')).default;
            const ratingMaps: Record<number, number> = {};
            await Promise.all(
              canteenData.map(async (c) => {
                try {
                  const res = await api.get(`/reviews/canteen/${c.id}/rating`);
                  ratingMaps[c.id] = res.data?.avgRating ?? 0;
                } catch {
                  ratingMaps[c.id] = 0;
                }
              })
            );
            setCanteenRatings(ratingMaps);
          } catch {
            // Non-critical — cards will hide the rating pill when 0
          }
        }, remaining);
      } catch {
        setLoading(false);
      }
    };
    loadData();

    // Load persisted bookmarks from backend on mount
    api.get('/favorites/canteens')
      .then(res => {
        if (res.data?.canteenIds) {
          setSavedCanteens(new Set(res.data.canteenIds as number[]));
        }
      })
      .catch(() => { /* non-critical — local state falls back gracefully */ });
  }, []);

  /**
   * Real-time canteen status subscription.
   *
   * Subscribes to /topic/canteens WebSocket topic. When a vendor toggles
   * their restaurant open or closed, a CANTEEN_STATUS_CHANGED event arrives
   * and we mutate that canteen's isOpen field in local state. This flips
   * the CLOSED overlay on the card instantly without any page reload.
   */
  useEffect(() => {
    if (!isConnected) return;
    const sub = subscribe('/topic/canteens', (payload: any) => {
      if (payload?.type === 'CANTEEN_STATUS_CHANGED' && payload.canteenId != null) {
        setCanteens(prev =>
          prev.map(c =>
            c.id === payload.canteenId
              ? { ...c, isOpen: payload.isOpen }
              : c
          )
        );
      }
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [isConnected, subscribe]);

  // On-demand dish index build when user begins searching for food items
  useEffect(() => {
    if (searchQuery.trim().length > 1 && Object.keys(menuItemsMap).length === 0 && canteens.length > 0) {
      (async () => {
        try {
          const { fetchMenu } = await import('../utils/canteenStore');
          const menuMaps: Record<number, string[]> = {};
          await Promise.all(
            canteens.map(async (c) => {
              try {
                const items = await fetchMenu(c.id);
                menuMaps[c.id] = items.map((i: any) => (i.name || '').toLowerCase());
              } catch {
                menuMaps[c.id] = [];
              }
            })
          );
          setMenuItemsMap(menuMaps);
        } catch { /* ignore */ }
      })();
    }
  }, [searchQuery, canteens, menuItemsMap]);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied! Apply at checkout.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  /**
   * Applies fuzzy search against canteen names AND menu item names (Zomato model),
   * VEG MODE filter, active filter chip, and sort to the full canteen list.
   * All filters are composable and memoised.
   */
  const filteredCanteens = useMemo(() => {
    let results = canteens;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      // Primary: fuzzy match on canteen name / location / cuisineType
      const canteenSearcher = new FuzzySearch(canteens, ['name', 'location', 'cuisineType'], { caseSensitive: false, sort: true });
      const nameMatches = canteenSearcher.search(searchQuery);
      const nameMatchIds = new Set(nameMatches.map((c) => c.id));

      // Secondary: any canteen whose menu contains a matching item name
      const itemMatches = canteens.filter(
        (c) => !nameMatchIds.has(c.id) &&
          (menuItemsMap[c.id] || []).some((itemName) => itemName.includes(q))
      );

      results = [...nameMatches, ...itemMatches];
    }

    if (vegMode) {
      results = results.filter(c => c.isVeg !== false);
    }

    if (activeFilter === 'Offers') {
      results = results.filter(c => c.hasOffer);
    } else if (activeFilter === 'Rating') {
      results = results.filter(c => (c.rating || canteenRatings[c.id] || 4.5) >= 4.0);
    } else if (activeFilter === 'Open') {
      results = results.filter(c => c.isOpen);
    }

    if (minRating > 0) {
      results = results.filter(c => (c.rating || canteenRatings[c.id] || 4.5) >= minRating);
    }

    if (costRange === 'under_100') {
      results = results.filter(c => (c.minPrice || 60) <= 100);
    } else if (costRange === '100_250') {
      results = results.filter(c => (c.minPrice || 150) >= 100 && (c.minPrice || 150) <= 250);
    } else if (costRange === 'above_250') {
      results = results.filter(c => (c.minPrice || 260) > 250);
    }

    if (sortMode === 'rating') {
      results = [...results].sort((a, b) => (b.rating || canteenRatings[b.id] || 4.5) - (a.rating || canteenRatings[a.id] || 4.5));
    } else if (sortMode === 'cost_asc') {
      results = [...results].sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    } else if (sortMode === 'cost_desc') {
      results = [...results].sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
    }

    return results;
  }, [canteens, searchQuery, vegMode, activeFilter, sortMode, minRating, costRange, menuItemsMap, canteenRatings]);

  // Derive itemMatchNames separately to avoid mutation inside useMemo
  useEffect(() => {
    if (!searchQuery.trim()) { setItemMatchNames({}); return; }
    const q = searchQuery.trim().toLowerCase();
    const map: Record<number, string> = {};
    filteredCanteens.forEach(c => {
      const matched = (menuItemsMap[c.id] || []).find(name => name.includes(q));
      if (matched) map[c.id] = matched;
    });
    setItemMatchNames(map);
  }, [filteredCanteens, searchQuery, menuItemsMap]);

  /**
   * toggleSaved
   *
   * Optimistically toggles the canteen bookmark in local state, then persists
   * to the backend via POST /api/favorites/canteens/toggle/{id}.
   * On backend failure, the optimistic update is silently rolled back.
   *
   * @param e   {React.MouseEvent} - Click event; propagation is stopped to prevent card navigation.
   * @param id  {number}           - Canteen ID to toggle.
   */
  const toggleSaved = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const wasBookmarked = savedCanteens.has(id);
    // Optimistic update
    setSavedCanteens(prev => {
      const next = new Set(prev);
      wasBookmarked ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      await api.post(`/favorites/canteens/toggle/${id}`);
    } catch {
      // Rollback on network failure
      setSavedCanteens(prev => {
        const next = new Set(prev);
        wasBookmarked ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  const filterChips = [
    { id: 'All', label: 'All', icon: null, dot: false },
    { id: 'Canteens', label: 'Canteens', icon: Store, dot: false },
    { id: 'Open', label: 'Open Now', icon: null, dot: true },
    { id: 'Offers', label: 'Offers', icon: TagIcon, dot: false },
    { id: 'Rating', label: 'Rating', icon: Star, dot: false },
  ];

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">

      {/* ── Sticky sub-header: location + VEG MODE + search ── */}
      <div className="bg-white border-b border-[#E8E8E8] sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">

          {/* Row 1: Location + VEG MODE — flex-wrap ensures no overflow on mobile */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Location chip — truncates on narrow screens */}
            <button
              onClick={() => setShowAddressModal(true)}
              className="flex items-center gap-1.5 group min-w-0 max-w-[60%]"
            >
              <MapPin className="w-4 h-4 text-[#E23744] flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[13px] font-bold text-[#1C1C1C] leading-none truncate">
                    {userAddress?.hostelName || 'CHARUSAT Campus'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#696969] flex-shrink-0" />
                </div>
                {userAddress?.roomNumber && (
                  <span className="text-[10px] text-[#9C9C9C] font-medium leading-none">
                    Room {userAddress.roomNumber}
                  </span>
                )}
              </div>
            </button>

            {/* VEG MODE toggle — flex-shrink-0 prevents it from compressing */}
            <button
              onClick={() => setVegMode(!vegMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-[12px] font-bold transition-all duration-200 flex-shrink-0 ${
                vegMode
                  ? 'border-[#1BA672] bg-emerald-50 text-[#1BA672]'
                  : 'border-[#E8E8E8] bg-white text-[#696969]'
              }`}
            >
              <Leaf className={`w-3.5 h-3.5 flex-shrink-0 ${vegMode ? 'fill-[#1BA672]' : ''}`} />
              <span>VEG MODE</span>
              <div
                className={`w-8 h-4 rounded-full transition-all duration-300 relative ml-1 flex-shrink-0 ${
                  vegMode ? 'bg-[#1BA672]' : 'bg-[#D1D5DB]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    vegMode ? 'left-4' : 'left-0.5'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Row 2: Search bar — Reference pill style with Mic icon */}
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all duration-200 ${
              isSearchFocused
                ? 'border-[#E23744] bg-white shadow-md shadow-rose-100/40'
                : 'border-[#E8E8E8] bg-[#F8F8F8] hover:border-[#D1D5DB]'
            }`}
          >
            <Icons.Search className={`w-4 h-4 flex-shrink-0 ${isSearchFocused ? 'text-[#E23744]' : 'text-[#9C9C9C]'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search canteens or dishes..."
              className="flex-1 bg-transparent outline-none text-[13px] text-[#1C1C1C] placeholder:text-[#9C9C9C] font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 text-[#9C9C9C] hover:text-[#1C1C1C]">
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => toast.info("Voice search is active. Speak your dish or canteen name.")}
              className="p-1 text-[#9C9C9C] hover:text-[#E23744] transition-colors flex-shrink-0"
              aria-label="Voice search"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Row 3: Filter chips & Filter dropdown button */}
          <div className="flex items-center gap-2 relative">
            {/* Filter button with inline animated popout dropdown menu */}
            <div className="relative flex-shrink-0 z-30">
              <button
                onClick={() => setShowFilterModal(!showFilterModal)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[12px] font-bold transition-all shadow-sm ${
                  showFilterModal || (sortMode !== 'popularity' || minRating > 0 || costRange !== 'all')
                    ? 'border-[#E23744] bg-[#E23744] text-white shadow-rose-200'
                    : 'border-[#E8E8E8] bg-white text-[#1C1C1C] hover:border-[#1C1C1C]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {(sortMode !== 'popularity' || minRating > 0 || costRange !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFilterModal ? 'rotate-180' : ''}`} />
              </button>

              {/* Inline Animated Dropdown Popout */}
              <AnimatePresence>
                {showFilterModal && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFilterModal(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 top-full mt-2 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
                    >
                      {/* Two-column Zomato layout inside dropdown */}
                      <div className="flex h-72">
                        {/* Left: categories sidebar */}
                        <div className="w-28 border-r border-[#F4F4F4] bg-[#F8F8F8] py-2 flex-shrink-0">
                          {[
                            { id: 'sort' as const, label: 'Sort by', badge: sortMode !== 'popularity' ? '•' : null },
                            { id: 'rating' as const, label: 'Rating', badge: minRating > 0 ? `${minRating}+` : null },
                            { id: 'cost' as const, label: 'Cost', badge: costRange !== 'all' ? '•' : null },
                          ].map((tab) => {
                            const isActive = filterModalTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setFilterModalTab(tab.id)}
                                className={`w-full text-left px-3 py-3 text-[12px] font-bold border-l-[3px] transition-all flex items-center justify-between ${
                                  isActive
                                    ? 'border-[#E23744] text-[#E23744] bg-white shadow-sm'
                                    : 'border-transparent text-[#696969] hover:bg-white/60'
                                }`}
                              >
                                <span>{tab.label}</span>
                                {tab.badge && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#E23744] text-white">
                                    {tab.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Right: options content based on active tab */}
                        <div className="flex-1 py-3 px-4 overflow-y-auto">
                          {filterModalTab === 'sort' && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-[#9C9C9C] uppercase tracking-widest mb-2">Sort Outlets By</p>
                              {[
                                { key: 'popularity', label: 'Popularity' },
                                { key: 'rating',     label: 'Rating: High to Low' },
                                { key: 'cost_asc',   label: 'Cost: Low to High' },
                                { key: 'cost_desc',  label: 'Cost: High to Low' },
                              ].map(opt => (
                                <label key={opt.key} className="flex items-center justify-between py-2 border-b border-[#F4F4F4] cursor-pointer">
                                  <span className={`text-[12px] font-semibold ${sortMode === opt.key ? 'text-[#E23744] font-bold' : 'text-[#1C1C1C]'}`}>
                                    {opt.label}
                                  </span>
                                  <input
                                    type="radio"
                                    name="sort"
                                    checked={sortMode === opt.key}
                                    onChange={() => setSortMode(opt.key as any)}
                                    className="accent-[#E23744] w-3.5 h-3.5 cursor-pointer"
                                  />
                                </label>
                              ))}
                            </div>
                          )}

                          {filterModalTab === 'rating' && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-[#9C9C9C] uppercase tracking-widest mb-2">Minimum Rating</p>
                              {[
                                { val: 0, label: 'Any Rating' },
                                { val: 4.5, label: '4.5+ ★ Exceptional' },
                                { val: 4.0, label: '4.0+ ★ Top Rated' },
                                { val: 3.5, label: '3.5+ ★ Good' },
                              ].map(opt => (
                                <label key={opt.val} className="flex items-center justify-between py-2 border-b border-[#F4F4F4] cursor-pointer">
                                  <span className={`text-[12px] font-semibold ${minRating === opt.val ? 'text-[#E23744] font-bold' : 'text-[#1C1C1C]'}`}>
                                    {opt.label}
                                  </span>
                                  <input
                                    type="radio"
                                    name="rating"
                                    checked={minRating === opt.val}
                                    onChange={() => setMinRating(opt.val)}
                                    className="accent-[#E23744] w-3.5 h-3.5 cursor-pointer"
                                  />
                                </label>
                              ))}
                            </div>
                          )}

                          {filterModalTab === 'cost' && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-[#9C9C9C] uppercase tracking-widest mb-2">Cost per Person</p>
                              {[
                                { val: 'all', label: 'Any Cost' },
                                { val: 'under_100', label: 'Under ₹100' },
                                { val: '100_250', label: '₹100 to ₹250' },
                                { val: 'above_250', label: 'Above ₹250' },
                              ].map(opt => (
                                <label key={opt.val} className="flex items-center justify-between py-2 border-b border-[#F4F4F4] cursor-pointer">
                                  <span className={`text-[12px] font-semibold ${costRange === opt.val ? 'text-[#E23744] font-bold' : 'text-[#1C1C1C]'}`}>
                                    {opt.label}
                                  </span>
                                  <input
                                    type="radio"
                                    name="cost"
                                    checked={costRange === opt.val}
                                    onChange={() => setCostRange(opt.val as any)}
                                    className="accent-[#E23744] w-3.5 h-3.5 cursor-pointer"
                                  />
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Footer Actions */}
                      <div className="px-3.5 py-2.5 bg-neutral-50 border-t border-[#F4F4F4] flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSortMode('popularity');
                            setMinRating(0);
                            setCostRange('all');
                            setActiveFilter('All');
                            setShowFilterModal(false);
                          }}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#696969] hover:bg-neutral-200 transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setShowFilterModal(false)}
                          className="flex-1 py-1.5 rounded-xl text-[11px] font-bold text-white bg-[#E23744] hover:bg-[#C53030] transition-colors shadow-md"
                        >
                          Apply ({filteredCanteens.length})
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable chip strip — Reference pill chips */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {filterChips.map((chip) => {
                const isActive = activeFilter === chip.id;
                const IconComponent = chip.icon;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setActiveFilter(isActive && chip.id !== 'All' ? 'All' : chip.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? 'border-[#1C1C1C] bg-[#1C1C1C] text-white shadow-sm'
                        : 'border-[#E8E8E8] bg-white text-[#1C1C1C] hover:border-[#9C9C9C]'
                    }`}
                  >
                    {chip.dot && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {IconComponent && (
                      <IconComponent
                        className={`w-3.5 h-3.5 ${
                          chip.id === 'Offers'
                            ? 'text-amber-500'
                            : chip.id === 'Rating'
                            ? 'text-amber-400 fill-amber-400'
                            : isActive
                            ? 'text-white'
                            : 'text-neutral-500'
                        }`}
                      />
                    )}
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">

        {/* ── Wide Campus Canteen Animated Image Carousel Banner ── */}
        {/* ── Deal of the Day Promo Card per Reference Screen 1 ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/customer/offers')}
          className="mb-6 rounded-3xl overflow-hidden cursor-pointer relative bg-gradient-to-r from-[#881337] via-[#E23744] to-[#EA580C] shadow-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 group select-none"
        >
          {/* Left Details */}
          <div className="flex-1 min-w-0 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-[11px] font-black uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>DEAL OF THE DAY</span>
            </div>

            <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mb-1">
              {canteens.find(c => c.id === (allCoupons[0] || topCoupon)?.canteenId)?.name || canteens[0]?.name || 'SWEET SPOT'}
            </p>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-1.5 drop-shadow-md">
              {topCoupon?.title || 'Thali Lover'}
            </h2>

            <p className="text-white/90 text-xs sm:text-sm font-semibold mb-4 drop-shadow-sm">
              {topCoupon?.description || 'Flat ₹100 off on any Thali'}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/customer/offers');
              }}
              className="px-5 py-2.5 rounded-full bg-[#E23744] hover:bg-[#C53030] text-white font-bold text-xs shadow-lg shadow-black/20 flex items-center gap-1.5 active:scale-95 transition-all border border-white/20"
            >
              <span>Order Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Image: Indian Thali Platter */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0 relative z-10 flex items-center justify-center">
            <img
              src="/food/gujarati_thali.png"
              alt="Thali Lover Meal"
              className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>

        {/* ── Active Campus Offers Carousel ── */}
        {!loading && allCoupons.length > 0 && (
          <div id="active-offers-section" className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg text-[#E23744]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#1C1C1C]">
                  Live Campus Offers & Coupons
                </h2>
                <span className="px-2 py-0.5 bg-red-50 text-[#E23744] text-[10px] font-bold rounded-full border border-red-100">
                  {allCoupons.length} Available
                </span>
              </div>
              <button
                onClick={() => navigate('/customer/offers')}
                className="text-xs font-bold text-[#E23744] hover:underline"
              >
                View All Offers &rarr;
              </button>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {allCoupons.map((coupon) => {
                const canteenObj = canteens.find(c => c.id === coupon.canteenId);
                const canteenName = canteenObj?.name || 'All Campus Canteens';
                const isCopied = copiedCode === coupon.couponCode;

                const getTypeBadge = (type: string) => {
                  switch (type) {
                    case 'BOGO': return { bg: 'bg-purple-100 text-purple-700 border-purple-200', label: 'BOGO' };
                    case 'COMBO': return { bg: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Combo' };
                    case 'RUSH_HOUR': return { bg: 'bg-pink-100 text-pink-700 border-pink-200', label: 'Rush Hour' };
                    case 'NEW_DISH': return { bg: 'bg-amber-100 text-amber-700 border-amber-200', label: 'New Dish' };
                    case 'ITEM_SPECIFIC': return { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Item Deal' };
                    default: return { bg: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Special' };
                  }
                };

                const badge = getTypeBadge(coupon.couponType);

                return (
                  <motion.div
                    key={coupon.id}
                    whileHover={{ y: -3 }}
                    className="flex-shrink-0 w-[260px] sm:w-[290px] bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-red-200 transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400 truncate max-w-[130px]">
                          {canteenName}
                        </span>
                      </div>

                      <div className="mb-2">
                        <div className="text-lg font-black text-gray-900 leading-tight">
                          {coupon.discountType === 'PERCENTAGE'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} OFF`}
                        </div>
                        <h3 className="font-bold text-gray-800 text-xs sm:text-sm mt-0.5 line-clamp-1">
                          {coupon.title || coupon.couponCode}
                        </h3>
                      </div>

                      <p className="text-[11px] text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                        {coupon.description || 'Exclusive discount for CHARUSAT students.'}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-gray-400 font-medium truncate">
                        {coupon.minOrderValue ? `Min ₹${coupon.minOrderValue}` : 'No min order'}
                      </div>
                      <button
                        onClick={(e) => handleCopyCode(e, coupon.couponCode)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-red-50 hover:bg-[#E23744] text-[#E23744] hover:text-white border border-red-100'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> {coupon.couponCode}
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}



        {/* ── Canteen listing ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1C1C1C]">
              {searchQuery || activeFilter !== 'All'
                ? `Results (${filteredCanteens.length})`
                : 'Popular Canteens'}
            </h2>
            <button
              onClick={() => {
                setActiveFilter('All');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-[#E23744] flex items-center gap-0.5 hover:underline"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              /* Skeleton grid */
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F0F0F0]">
                    <Skeleton height={160} />
                    <div className="p-3.5 space-y-2">
                      <Skeleton width="60%" height={18} />
                      <Skeleton width="40%" height={13} />
                      <div className="flex gap-4 pt-1">
                        <Skeleton width={60} height={12} />
                        <Skeleton width={80} height={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>

            ) : filteredCanteens.length === 0 ? (
              /* Empty state */
              <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center py-20">
                <div className="w-20 h-20 bg-[#F4F4F4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.Search className="w-8 h-8 text-[#D1D5DB]" />
                </div>
                <h3 className="text-base font-bold text-[#1C1C1C] mb-2">No results found</h3>
                <p className="text-[#696969] text-sm">
                  {searchQuery
                    ? `No canteens or dishes matching "${searchQuery}". Try a different keyword.`
                    : 'No canteens match the selected filter'}
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveFilter('All'); setVegMode(false); }}
                  className="mt-4 px-5 py-2 bg-[#E23744] text-white text-sm font-bold rounded-xl hover:bg-[#C53030] transition-colors"
                >
                  Clear filters
                </button>
              </motion.div>

            ) : (
              /* Canteen cards matching Reference Screen 1 */
              <motion.div
                key="results"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredCanteens.map((canteen) => {
                  const ratingVal = (canteenRatings[canteen.id] && canteenRatings[canteen.id] > 0)
                    ? canteenRatings[canteen.id].toFixed(1)
                    : (canteen.rating ? canteen.rating.toFixed(1) : '4.5');

                  const discountText = canteen.hasOffer && topCoupon?.discountValue
                    ? `${topCoupon.discountType === 'FLAT' ? '₹' : ''}${topCoupon.discountValue}${topCoupon.discountType === 'PERCENTAGE' ? '%' : ''} OFF Above ₹${topCoupon.minOrderValue || 199}`
                    : '₹100 OFF Above ₹299';

                  return (
                    <motion.div
                      key={canteen.id}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/canteen/${canteen.id}/menu`)}
                      className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 border border-[#F0F0F0] flex flex-col group"
                    >
                      {/* Card image container */}
                      <div className="relative w-full h-40 bg-[#F4F4F4] overflow-hidden">
                        {canteen.imageUrl ? (
                          <img
                            src={canteen.imageUrl}
                            alt={canteen.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <Icons.Store className="w-12 h-12 text-[#9C9C9C]" />
                          </div>
                        )}

                        {/* Bookmark — top-right */}
                        <button
                          onClick={(e) => toggleSaved(e, canteen.id)}
                          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
                        >
                          <Bookmark
                            className={`w-4 h-4 transition-colors ${
                              savedCanteens.has(canteen.id) ? 'fill-[#E23744] text-[#E23744]' : 'text-[#9C9C9C]'
                            }`}
                          />
                        </button>

                        {/* CLOSED overlay */}
                        {!canteen.isOpen && (
                          <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-10">
                            <span className="text-white font-black text-xs tracking-widest uppercase px-3 py-1.5 bg-black/70 rounded-lg">
                              CLOSED
                            </span>
                          </div>
                        )}

                        {/* Floating dual badges at bottom of image matching Reference Screen 1 */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                          {/* Rating badge */}
                          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-[#1C1C1C] shadow-sm">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{ratingVal}</span>
                          </div>

                          {/* Open status badge */}
                          {canteen.isOpen ? (
                            <div className="flex items-center gap-1 bg-emerald-600/95 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span>Open</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-neutral-800/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm">
                              <span>Closed</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-[#1C1C1C] text-[15px] leading-snug line-clamp-1 group-hover:text-[#E23744] transition-colors">
                            {canteen.name}
                          </h3>

                          {/* Cuisine / location */}
                          <p className="text-[#696969] text-[12px] font-medium truncate mt-0.5">
                            {canteen.cuisineType || 'North Indian, Chinese, Snacks'}
                          </p>
                        </div>

                        {/* Offer tag row matching Reference Screen 1 */}
                        <div className="mt-2.5 pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[#E23744] text-[11px] font-bold">
                            <Tag className="w-3 h-3 text-[#E23744]" />
                            <span className="truncate">{discountText}</span>
                          </div>
                          <span className="text-[11px] text-[#9C9C9C] font-semibold flex-shrink-0">
                            15-25 min
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={(addr) => setUserAddress(addr)}
        initialData={userAddress}
      />
    </div>
  );
}
