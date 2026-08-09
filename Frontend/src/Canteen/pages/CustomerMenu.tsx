import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  fetchMenu,
  getCategories,
  MenuItem,
  Category,
  Coupon,
  getActiveCoupons,
  fetchCanteens,
  Canteen,
} from "../utils/canteenStore";
import { Icons } from "@/components/Icons";
import {
  SlidersHorizontal,
  X,
  Star,
  TrendingUp,
  ArrowUpDown,
  ChevronDown,
  ShoppingCart,
  Minus,
  Plus,
  Tag,
  RotateCcw
} from "lucide-react";
import api from "../../utils/api";
import { toast } from "../../utils/toast";
import CustomizeModal from "../components/CustomizeModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useCouponWebSocket } from "@/hooks/useCouponWebSocket";

// ── Local fallback food images ──
const LOCAL_FOOD_IMAGES: Record<string, string> = {
  "Gujarati Thali": "/food/gujarati_thali.png",
  Thali: "/food/gujarati_thali.png",
  Salad: "/food/healthy_salad_bowl.png",
  Paneer: "/food/paneer_tikka.png",
  Tikka: "/food/paneer_tikka.png",
  Chai: "/food/masala_chai.png",
  Tea: "/food/masala_chai.png",
  Coffee: "/food/masala_chai.png",
  Dosa: "/food/dosa_platter.png",
  "South Indian": "/food/dosa_platter.png",
  Pizza: "/food/pizza_slice.png",
  default: "/food/gujarati_thali.png",
};

function getItemImage(item: MenuItem): string {
  if (item.image && !item.image.includes("placeholder")) return item.image;
  const nameUpper = item.name.toUpperCase();
  const catUpper = (item.category || "").toUpperCase();
  for (const [key, url] of Object.entries(LOCAL_FOOD_IMAGES)) {
    if (
      key !== "default" &&
      (nameUpper.includes(key.toUpperCase()) ||
        catUpper.includes(key.toUpperCase()))
    ) {
      return url;
    }
  }
  return LOCAL_FOOD_IMAGES["default"];
}

const DEFAULT_CANTEEN_BANNERS: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80",
  2: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80",
  3: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1600&auto=format&fit=crop&q=80",
  4: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600&auto=format&fit=crop&q=80",
  5: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&auto=format&fit=crop&q=80",
};

function getCanteenBanner(canteen: Canteen | null, canteenId: number): string {
  if (canteen?.imageUrl) return canteen.imageUrl;
  if (canteen?.image) return canteen.image;
  return DEFAULT_CANTEEN_BANNERS[canteenId] || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80";
}

type SortMode = "" | "price_asc" | "price_desc";

export default function CustomerMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [canteenName, setCanteenName] = useState<string>("");
  const [canteen, setCanteen] = useState<Canteen | null>(null);
  // Whether the restaurant is currently accepting orders
  const [isCanteenOpen, setIsCanteenOpen] = useState<boolean>(true);
  const { isConnected, subscribe } = useWebSocket();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("");
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [showOffers, setShowOffers] = useState(false);

  // Category accordion state — all open by default
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Tracks which category is currently in viewport (for sidebar active highlight)
  const [activeSidebarCat, setActiveSidebarCat] = useState<string>('');

  // Refs map: category name → DOM section element (for scroll-to-section)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /**
   * scrollToCategory
   *
   * Smoothly scrolls the page so the target category section is visible just
   * below the sticky header (~120 px offset). Also sets selectedCategory so
   * the mobile filter also activates the category.
   *
   * @param catName {string} - Category name matching item.category values.
   */
  const scrollToCategory = useCallback((catName: string) => {
    setSelectedCategory(''); // show all categories but highlight active
    setActiveSidebarCat(catName);
    const el = categoryRefs.current[catName];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  // Cart state
  const [cartItemCount, setCartItemCount] = useState(0);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Customize modal state — null means closed
  const [customizeTarget, setCustomizeTarget] = useState<MenuItem | null>(null);

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      const items = res.data?.items || [];
      setCartItems(items);
      setCartItemCount(items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0));
    } catch (err) { }
  };

  // Fetch cart count on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (item: MenuItem, quantity = 1, variantId?: string | null, addonIds?: string[]) => {
    try {
      setAddingItemId(item.id);
      const payload: Record<string, any> = { menuItemId: item.id, quantity };
      if (variantId) payload.variantId = variantId;
      if (addonIds?.length) payload.addonIds = addonIds;
      const res = await api.post("/cart/add", payload);
      if (res.data?.success) {
        // Silent add — the floating View Cart bar and quantity stepper provide
        // sufficient feedback without a disruptive popup notification.
        fetchCart();
      } else {
        toast.error(res.data?.error || "Failed to add item");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to add to cart");
    } finally {
      setAddingItemId(null);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    const cartItem = cartItems.find(ci => ci.menuItem.id === itemId);
    if (!cartItem) return;

    try {
      setAddingItemId(itemId);
      if (newQuantity <= 0) {
        // Silent remove — the quantity stepper disappears naturally, providing
        // clear visual feedback without a popup notification.
        await api.delete(`/cart/remove/${cartItem.id}`);
      } else {
        await api.put(`/cart/update/${cartItem.id}`, { quantity: newQuantity });
      }
      fetchCart();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update quantity");
    } finally {
      setAddingItemId(null);
    }
  };

  /**
   * handleAddOrCustomize
   *
   * Entry point for all ADD button taps. If the item requires variant or
   * addon selection, opens the CustomizeModal. Simple items are added directly.
   *
   * @param item {MenuItem} - The item the user tapped ADD on.
   */
  const handleAddOrCustomize = (item: MenuItem) => {
    if (item.hasVariants || item.hasAddons) {
      setCustomizeTarget(item);
    } else {
      addToCart(item);
    }
  };

  /**
   * handleCustomizeConfirm
   *
   * Receives finalized variant, addon, and quantity selections from the
   * CustomizeModal and forwards them to addToCart.
   */
  const handleCustomizeConfirm = (variantId: string | null, addonIds: string[], quantity: number) => {
    if (customizeTarget) addToCart(customizeTarget, quantity, variantId, addonIds);
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      const canteenId = id ? Number(id) : 1;
      setLoading(true);
      const startTime = Date.now();
      try {
        const [menuData, categoriesData, couponsData, canteens] =
          await Promise.all([
            fetchMenu(canteenId),
            getCategories(canteenId),
            getActiveCoupons(canteenId),
            fetchCanteens(),
          ]);
        const matched = canteens.find((c: Canteen) => c.id === canteenId);
        if (matched) {
          setCanteen(matched);
          setCanteenName(matched.name);
          setIsCanteenOpen(matched.isOpen !== false); // default open if field missing
        }
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 600 - elapsed);
        setTimeout(() => {
          setItems(menuData);
          setCategories(categoriesData);
          setCoupons(couponsData);
          setLoading(false);
        }, remaining);
      } catch (error) {
        console.error("Failed to load menu", error);
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  /**
   * Real-time canteen open/close subscription.
   *
   * Subscribes to /topic/canteen/{id}/status. When vendor toggles
   * open/closed state the CANTEEN_STATUS_CHANGED event arrives and
   * we update isCanteenOpen — showing/hiding the order banner instantly.
   */
  useEffect(() => {
    if (!isConnected || !id) return;
    const sub = subscribe(`/topic/canteen/${id}/status`, (payload: any) => {
      if (payload?.type === 'CANTEEN_STATUS_CHANGED') {
        setIsCanteenOpen(!!payload.isOpen);
      }
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [isConnected, subscribe, id]);

  /**
   * Real-time menu item availability & price subscription.
   *
   * Subscribes to /topic/canteen/{id}/menu. When vendor toggles an item's
   * availability in Menu Management, a MENU_ITEM_UPDATED event arrives and
   * we update the item's state in real-time on the student menu page.
   */
  useEffect(() => {
    if (!isConnected || !id) return;
    const sub = subscribe(`/topic/canteen/${id}/menu`, (payload: any) => {
      if (payload?.type === 'MENU_ITEM_UPDATED' && payload.itemId != null) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === payload.itemId
              ? {
                ...item,
                isAvailable: payload.isAvailable ?? item.isAvailable,
                price: payload.price ?? item.price,
              }
              : item
          )
        );
      }
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [isConnected, subscribe, id]);

  const reloadCoupons = useCallback(() => {
    const canteenId = id ? Number(id) : 1;
    getActiveCoupons(canteenId).then(setCoupons).catch(() => { });
  }, [id]);

  useCouponWebSocket({
    canteenId: id ? Number(id) : 1,
    onCreated: reloadCoupons,
    onUpdated: reloadCoupons,
    onDeleted: reloadCoupons,
    onToggled: reloadCoupons,
    onArchived: reloadCoupons,
    onRestored: reloadCoupons,
  });

  const itemDiscounts = useMemo(() => {
    const discounts: Record<
      number,
      { value: number; type: string; label: string }
    > = {};
    coupons.forEach((coupon) => {
      const val = coupon.discountValue || 0;
      const type = coupon.discountType || "FLAT";
      const label =
        coupon.couponType === "BOGO"
          ? "BOGO Offer"
          : type === "PERCENTAGE"
            ? `${val}% OFF`
            : `₹${val} OFF`;

      // 1) Applicable Items
      if (coupon.applicableItems && Array.isArray(coupon.applicableItems)) {
        coupon.applicableItems.forEach((appItem) => {
          const itemId = appItem.menuItemId;
          if (itemId && (!discounts[itemId] || val > discounts[itemId].value)) {
            discounts[itemId] = { value: val, type, label };
          }
        });
      }
      if (coupon.applicableItemIds && Array.isArray(coupon.applicableItemIds)) {
        coupon.applicableItemIds.forEach((itemId) => {
          if (itemId && (!discounts[itemId] || val > discounts[itemId].value)) {
            discounts[itemId] = { value: val, type, label };
          }
        });
      }
      // 2) BOGO free item
      if (coupon.bogoFreeItemId) {
        discounts[coupon.bogoFreeItemId] = { value: val, type, label: "BOGO FREE" };
      }
    });
    return discounts;
  }, [coupons]);

  const topDeals = useMemo(() => {
    return coupons.filter(c => c.couponType === 'BOGO' || c.couponType === 'COMBO' || c.couponType === 'RUSH_HOUR');
  }, [coupons]);

  const activeFilterCount = [
    selectedCategory,
    sortMode,
    showBestsellers,
    showOffers,
  ].filter(Boolean).length;

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        (item.category || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      const matchesBestseller =
        !showBestsellers ||
        Boolean(
          item.isRecommended ||
          (item.rating && item.rating >= 4.5) ||
          (item.salesCount && item.salesCount > 10)
        );
      const matchesOffers = !showOffers || !!itemDiscounts[item.id];
      return (
        matchesSearch &&
        matchesCategory &&
        matchesBestseller &&
        matchesOffers &&
        item.isAvailable !== false
      );
    });
    if (sortMode === "price_asc") result.sort((a, b) => a.price - b.price);
    if (sortMode === "price_desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [
    items,
    searchQuery,
    selectedCategory,
    showBestsellers,
    showOffers,
    sortMode,
    itemDiscounts,
  ]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  /**
   * allCategories — derived directly from ALL loaded items (not from the separate
   * categories API). This guarantees the sidebar always matches the right panel.
   * Each entry holds: name, count of available items.
   */
  const allCategories = useMemo(() => {
    const catMap: Record<string, number> = {};
    items.forEach(item => {
      if (item.isAvailable === false) return;
      const cat = item.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    return Object.entries(catMap).map(([name, count]) => ({ name, count }));
  }, [items]);

  // IntersectionObserver: update activeSidebarCat as user scrolls
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute('data-category');
            if (cat) setActiveSidebarCat(cat);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    Object.values(categoryRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [loading, itemsByCategory]);

  const toggleCategory = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSortMode("");
    setShowBestsellers(false);
    setShowOffers(false);
  };

  const getDiscountedPrice = (item: MenuItem) => {
    const disc = itemDiscounts[item.id];
    if (!disc) return null;
    return disc.type === "PERCENTAGE"
      ? Math.round(item.price * (1 - disc.value / 100))
      : Math.max(0, item.price - disc.value);
  };

  return (
    <div ref={topRef} className="min-h-screen bg-neutral-50">

      {/* ── Closed Restaurant Banner ── */}
      <AnimatePresence>
        {!isCanteenOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-[#1C1C1C] text-white text-center py-3 px-4 text-[13px] font-semibold tracking-wide z-40"
          >
            This restaurant is currently closed and not accepting new orders.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Canteen Cover Hero Banner ── */}
      <div className="relative w-full bg-neutral-900 overflow-hidden shadow-lg">
        <div className="relative h-56 sm:h-72 lg:h-80 w-full overflow-hidden">
          <img
            src={getCanteenBanner(canteen, id ? Number(id) : 1)}
            alt={canteenName || "Canteen Banner"}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 brightness-[0.85]"
          />
          {/* Subtle gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

          {/* Top Bar inside Hero */}
          <div className="absolute top-4 left-4 right-4 max-w-6xl mx-auto flex items-center justify-between z-10">
            <button
              onClick={() => navigate("/customer/dashboard")}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/75 transition-all border border-white/20 shadow-lg flex items-center gap-1.5 text-xs font-bold px-3.5"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold backdrop-blur-md transition-all border shadow-lg ${activeFilterCount > 0
                    ? "bg-[#e23744] text-white border-[#e23744]"
                    : "bg-black/50 text-white border-white/20 hover:bg-black/75"
                  }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-white text-[#e23744] rounded-full text-[9px] font-black flex items-center justify-center ml-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate("/cart")}
                className="relative p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/75 transition-all border border-white/20 shadow-lg"
                title="View Cart"
              >
                <Icons.ShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#e23744] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-neutral-900 shadow-sm animate-pulse">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Hero Overlay with Canteen Brand & Details */}
          <div className="absolute bottom-4 left-4 right-4 max-w-6xl mx-auto flex items-end justify-between gap-4 z-10">
            <div className="flex items-end gap-3 sm:gap-5">
              {/* Canteen Logo / Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white shadow-2xl bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                {canteen?.logoUrl ? (
                  <img src={canteen.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Icons.Store className="w-8 h-8 sm:w-10 sm:h-10 text-[#e23744]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/40 shadow-sm">
                    🌿 Pure Veg
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${isCanteenOpen ? "bg-emerald-600/90 text-white border border-emerald-400/40" : "bg-red-600/90 text-white border border-red-400/40"
                    }`}>
                    {isCanteenOpen ? "Open Now" : "Closed"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                  {canteenName || canteen?.name || "Canteen Menu"}
                </h1>

                <div className="flex items-center gap-3 text-white/90 text-xs sm:text-sm mt-1 font-semibold flex-wrap drop-shadow-sm">
                  <span className="flex items-center gap-1">
                    📍 {canteen?.location || "CHARUSAT Campus"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    {canteen?.rating || 4.5}
                  </span>
                  <span>•</span>
                  <span>{filteredItems.length} Dishes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Search & Quick Filter Bar ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="ag-search-wrapper flex-1">
              <Icons.Search className="ag-search-icon" />
              <input
                type="text"
                placeholder={`Search dishes in ${canteenName || 'canteen'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ag-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="ag-search-clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filter Pill: Bestsellers */}
            <button
              onClick={() => setShowBestsellers(!showBestsellers)}
              className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 border shadow-sm ${
                showBestsellers
                  ? "bg-amber-500 text-white border-amber-500 shadow-amber-200"
                  : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showBestsellers ? "fill-white" : "fill-amber-400 text-amber-400"}`} />
              <span>Bestsellers</span>
            </button>

            {/* Quick Filter Pill: Offers */}
            <button
              onClick={() => setShowOffers(!showOffers)}
              className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 border shadow-sm ${
                showOffers
                  ? "bg-[#e23744] text-white border-[#e23744] shadow-rose-200"
                  : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Offers</span>
            </button>

            {/* Main Animated Filter Trigger Button */}
            <div className="relative">
              <button
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 shadow-sm border ${
                  showFiltersDropdown || activeFilterCount > 0
                    ? "bg-[#e23744] text-white border-[#e23744] shadow-rose-200"
                    : "bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-white text-[#e23744] rounded-full text-[9px] font-black flex items-center justify-center shadow-inner">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showFiltersDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Ultra-Smooth Animated Dropdown Menu */}
              <AnimatePresence>
                {showFiltersDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-neutral-200/80 p-4 z-50 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-[#e23744]" />
                        <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Quick Filters</h3>
                      </div>
                      {activeFilterCount > 0 && (
                        <button onClick={clearAllFilters} className="text-[11px] font-extrabold text-[#e23744] hover:underline flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>

                    {/* Sort Options */}
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">Sort Order</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSortMode(sortMode === "price_asc" ? "" : "price_asc")}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            sortMode === "price_asc"
                              ? "bg-[#e23744] text-white border-[#e23744] shadow-md shadow-rose-200"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                          }`}
                        >
                          Price: Low → High
                        </button>
                        <button
                          onClick={() => setSortMode(sortMode === "price_desc" ? "" : "price_desc")}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            sortMode === "price_desc"
                              ? "bg-[#e23744] text-white border-[#e23744] shadow-md shadow-rose-200"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                          }`}
                        >
                          Price: High → Low
                        </button>
                      </div>
                    </div>

                    {/* Quick Toggles */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Highlights</p>
                      <button
                        onClick={() => setShowBestsellers(!showBestsellers)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                          showBestsellers
                            ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Star className={`w-4 h-4 ${showBestsellers ? "fill-white" : "fill-amber-400 text-amber-400"}`} /> Bestsellers Only
                        </span>
                        {showBestsellers && <span className="text-xs">✓</span>}
                      </button>

                      <button
                        onClick={() => setShowOffers(!showOffers)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                          showOffers
                            ? "bg-[#e23744] text-white border-[#e23744] shadow-md shadow-rose-200"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-current" /> Discounted Items Only
                        </span>
                        {showOffers && <span className="text-xs">✓</span>}
                      </button>
                    </div>

                    {/* Full Filter Modal Trigger */}
                    <div className="pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => {
                          setShowFiltersDropdown(false);
                          setShowFilters(true);
                        }}
                        className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <span>Open Advanced Filters</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: horizontal category pill strip (below header, above items) ── */}
      <div className="lg:hidden overflow-x-auto no-scrollbar bg-white border-b border-[#F4F4F4]">
        <div className="flex items-center gap-2 px-4 py-2.5 min-w-max">
          <button
            onClick={() => { setSelectedCategory(''); setActiveSidebarCat(''); }}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all ${!activeSidebarCat && !selectedCategory
                ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]'
                : 'bg-white text-[#696969] border-[#E8E8E8] hover:border-[#9C9C9C]'
              }`}
          >
            All
          </button>
          {allCategories.map(cat => (
            <button
              key={cat.name}
              onClick={() => scrollToCategory(cat.name)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all ${activeSidebarCat === cat.name
                  ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]'
                  : 'bg-white text-[#696969] border-[#E8E8E8] hover:border-[#9C9C9C]'
                }`}
            >
              {cat.name}
              <span className="ml-1 text-[10px] opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>



      {/* ── Menu Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex gap-6">
        {/* ── Desktop: left sticky category sidebar ── */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-28 bg-white rounded-2xl border border-[#E8E8E8] overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#F4F4F4]">
              <p className="text-[11px] font-extrabold text-[#9C9C9C] uppercase tracking-widest">Categories</p>
            </div>
            <nav className="py-1 max-h-[72vh] overflow-y-auto">
              {/* All Items — resets filter and scrolls to top */}
              <button
                onClick={() => { setActiveSidebarCat(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold border-l-[3px] transition-colors ${!activeSidebarCat
                    ? 'border-[#E23744] text-[#E23744] bg-[#FFF5F5]'
                    : 'border-transparent text-[#696969] hover:bg-[#F8F8F8]'
                  }`}
              >
                All Items
              </button>

              {/* Per-category buttons — derived from real item data */}
              {allCategories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => scrollToCategory(cat.name)}
                  className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold border-l-[3px] transition-colors ${activeSidebarCat === cat.name
                      ? 'border-[#E23744] text-[#E23744] bg-[#FFF5F5]'
                      : 'border-transparent text-[#696969] hover:bg-[#F8F8F8]'
                    }`}
                >
                  <span className="block truncate">{cat.name}</span>
                  <span className="text-[11px] text-[#B0B0B0] font-normal">{cat.count} items</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Item list (full width mobile, flex-1 desktop) ── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((g) => (
                <div key={g} className="bg-white rounded-2xl overflow-hidden">
                  <div className="px-4 py-3"><Skeleton width={120} height={16} /></div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-t border-[#F4F4F4]">
                      <div className="flex-1 space-y-2">
                        <Skeleton width="70%" height={14} />
                        <Skeleton width="40%" height={12} />
                        <Skeleton width="90%" height={10} />
                      </div>
                      <Skeleton width={88} height={80} borderRadius={12} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-3 bg-[#F4F4F4] rounded-full flex items-center justify-center">
                <Icons.Search className="w-7 h-7 text-[#D1D5DB]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1C1C]">No items found</h3>
              <p className="text-[#9C9C9C] text-xs mt-1">Try different filters</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="mt-3 px-4 py-1.5 text-xs font-bold text-[#E23744] bg-rose-50 rounded-lg">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            /* Category sections — Zomato horizontal row layout */
            <div className="space-y-2">
              {/* Top Deals strip */}
              {!showBestsellers && !selectedCategory && topDeals.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4" />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest">Top Deals</span>
                    <span className="ml-auto text-[10px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded-full">{topDeals.length} ACTIVE</span>
                  </div>
                  {topDeals.map((deal) => (
                    <div key={deal.id} className="bg-white/15 rounded-xl p-3 mb-2 last:mb-0 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{deal.title || deal.couponCode}</p>
                        <p className="text-[11px] text-orange-100 truncate">{deal.description || `Code: ${deal.couponCode}`}</p>
                      </div>
                      <span className="text-[10px] font-black bg-white text-orange-600 px-2.5 py-1 rounded-lg flex-shrink-0">
                        {deal.couponType === 'BOGO' ? `B${deal.bogoBuyQty || 1}G${deal.bogoGetQty || 1}` : deal.couponType}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {Object.entries(itemsByCategory).map(([category, catItems]) => {
                const isCollapsed = collapsedCats.has(category);
                return (
                  <div
                    key={category}
                    data-category={category}
                    ref={el => { categoryRefs.current[category] = el; }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F4F4F4]"
                  >
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F8F8F8] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="text-[14px] font-extrabold text-[#1C1C1C]">{category}</h2>
                        <span className="text-[10px] font-bold text-[#9C9C9C] bg-[#F4F4F4] px-2 py-0.5 rounded-full">{catItems.length}</span>
                      </div>
                      <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-[#9C9C9C]" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          {catItems.map((item, idx) => {
                            const discountPrice = getDiscountedPrice(item);
                            const cartItem = cartItems.find(ci => ci.menuItem.id === item.id);
                            const quantity = cartItem ? cartItem.quantity : 0;
                            const itemIsVeg = item.isVeg ?? item.isVegetarian ?? item.dietary?.vegetarian ?? true;
                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-3 px-4 py-4 ${idx < catItems.length - 1 ? 'border-b border-[#F4F4F4]' : ''}`}
                              >
                                {/* Left: text content */}
                                <div className="flex-1 min-w-0">
                                  {/* Veg / Non-Veg indicator */}
                                  <div className={`inline-flex items-center justify-center w-4 h-4 border-2 ${itemIsVeg ? 'border-[#1BA672]' : 'border-[#E23744]'} rounded-sm mb-1.5`}>
                                    <span className={`w-2 h-2 rounded-full ${itemIsVeg ? 'bg-[#1BA672]' : 'bg-[#E23744]'}`} />
                                  </div>

                                  {/* Bestseller badge */}
                                  {item.isRecommended && (
                                    <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 border border-amber-300 bg-amber-50 px-1.5 py-0.5 rounded">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                      Bestseller
                                    </span>
                                  )}

                                  <h3 className="text-[14px] font-semibold text-[#1C1C1C] mt-1 leading-snug">{item.name}</h3>

                                  {/* Price row */}
                                  <div className="flex items-baseline gap-1.5 mt-1">
                                    <span className="text-[14px] font-bold text-[#1C1C1C]">
                                      ₹{discountPrice !== null ? discountPrice : item.price}
                                    </span>
                                    {discountPrice !== null && (
                                      <span className="text-[11px] text-[#9C9C9C] line-through">₹{item.price}</span>
                                    )}
                                    {itemDiscounts[item.id] && (
                                      <span className="text-[11px] font-bold text-[#E23744]">{itemDiscounts[item.id].label}</span>
                                    )}
                                  </div>

                                  <p className="text-[12px] text-[#696969] mt-1.5 line-clamp-2 leading-relaxed">
                                    {item.description || 'Freshly prepared with authentic ingredients.'}
                                  </p>
                                </div>

                                {/* Right: image + ADD button */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-2 relative">
                                  <div className="w-[88px] h-[80px] rounded-xl overflow-hidden bg-[#F4F4F4] flex-shrink-0">
                                    <img
                                      src={getItemImage(item)}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>

                                  {/* ADD / stepper — floats below image; disabled when canteen is closed */}
                                  {quantity > 0 ? (
                                    <div className={`flex items-center justify-between w-[88px] h-8 border-2 rounded-xl overflow-hidden shadow-sm ${isCanteenOpen ? 'bg-white border-[#E23744]' : 'bg-[#F4F4F4] border-[#D1D5DB] opacity-50'
                                      }`}>
                                      <button
                                        onClick={() => isCanteenOpen && updateQuantity(item.id, quantity - 1)}
                                        disabled={addingItemId === item.id || !isCanteenOpen}
                                        className="w-1/3 h-full flex items-center justify-center text-[#E23744] hover:bg-rose-50 disabled:opacity-50 transition-colors"
                                      >
                                        <Minus size={13} strokeWidth={3} />
                                      </button>
                                      <span className="w-1/3 h-full flex items-center justify-center text-[12px] font-bold text-[#E23744]">
                                        {addingItemId === item.id ? '·' : quantity}
                                      </span>
                                      <button
                                        onClick={() => isCanteenOpen && updateQuantity(item.id, quantity + 1)}
                                        disabled={addingItemId === item.id || !isCanteenOpen}
                                        className="w-1/3 h-full flex items-center justify-center text-[#E23744] hover:bg-rose-50 disabled:opacity-50 transition-colors"
                                      >
                                        <Plus size={13} strokeWidth={3} />
                                      </button>
                                    </div>
                                  ) : (
                                    <motion.button
                                      whileTap={isCanteenOpen ? { scale: 0.93 } : {}}
                                      onClick={() => isCanteenOpen && handleAddOrCustomize(item)}
                                      disabled={addingItemId === item.id || !isCanteenOpen}
                                      title={!isCanteenOpen ? 'Restaurant is currently closed' : undefined}
                                      className={`w-[88px] h-8 border-2 rounded-xl text-[12px] font-extrabold shadow-sm transition-all duration-200 ${!isCanteenOpen
                                          ? 'border-[#D1D5DB] bg-[#F4F4F4] text-[#9C9C9C] cursor-not-allowed opacity-60'
                                          : addingItemId === item.id
                                            ? 'border-[#E23744] bg-[#E23744] text-white opacity-70 cursor-wait'
                                            : 'border-[#E23744] bg-white text-[#E23744] hover:bg-[#E23744] hover:text-white'
                                        }`}
                                    >
                                      {addingItemId === item.id ? '...' : 'ADD'}
                                    </motion.button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── REDESIGNED FILTER BOTTOM SHEET / DIALOG ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
              onClick={() => setShowFilters(false)}
            />
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
              <motion.div
                initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="pointer-events-auto w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] overflow-hidden flex flex-col sm:max-w-lg border border-neutral-100"
              >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden bg-gradient-to-b from-neutral-50 to-white">
                  <div className="w-12 h-1.5 bg-neutral-300 rounded-full" />
                </div>

                {/* Glassmorphic Header */}
                <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#e23744] text-white flex items-center justify-center shadow-lg shadow-rose-200">
                      <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-neutral-900 tracking-tight flex items-center gap-2">
                        Filter & Refine
                        {activeFilterCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#e23744] text-white shadow-sm">
                            {activeFilterCount} active
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-neutral-500">Customize your food preferences</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 divide-y divide-neutral-100">
                  {/* Section 1: Highlights & Quick Preferences */}
                  <div>
                    <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-3">
                      Special Highlights
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Bestsellers Card */}
                      <button
                        onClick={() => setShowBestsellers(!showBestsellers)}
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                          showBestsellers
                            ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/30 shadow-md"
                            : "bg-neutral-50/80 border-neutral-200 hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${showBestsellers ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-600"}`}>
                            <Star className="w-4 h-4 fill-current" />
                          </div>
                          {showBestsellers && <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">✓</span>}
                        </div>
                        <div>
                          <p className="text-xs font-black text-neutral-900">Bestsellers</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">Top-rated student favorites</p>
                        </div>
                      </button>

                      {/* Offers Card */}
                      <button
                        onClick={() => setShowOffers(!showOffers)}
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                          showOffers
                            ? "bg-rose-50 border-[#e23744] ring-2 ring-rose-400/30 shadow-md"
                            : "bg-neutral-50/80 border-neutral-200 hover:border-rose-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${showOffers ? "bg-[#e23744] text-white" : "bg-rose-100 text-[#e23744]"}`}>
                            <Tag className="w-4 h-4" />
                          </div>
                          {showOffers && <span className="w-5 h-5 rounded-full bg-[#e23744] text-white text-[10px] font-black flex items-center justify-center">✓</span>}
                        </div>
                        <div>
                          <p className="text-xs font-black text-neutral-900">Active Discounts</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">Items with active promo deals</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Sort Mode Selection */}
                  <div className="pt-5">
                    <div className="flex items-center gap-1.5 mb-3">
                      <ArrowUpDown className="w-4 h-4 text-[#e23744]" />
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                        Sort Price
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { key: "price_asc" as SortMode, label: "Price: Low to High", desc: "Cheapest first" },
                        { key: "price_desc" as SortMode, label: "Price: High to Low", desc: "Premium first" },
                      ].map((opt) => {
                        const isActive = sortMode === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setSortMode(isActive ? "" : opt.key)}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              isActive
                                ? "bg-[#e23744] text-white border-[#e23744] shadow-md shadow-rose-200"
                                : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            <p className="text-xs font-extrabold">{opt.label}</p>
                            <p className={`text-[10px] mt-0.5 ${isActive ? "text-white/80" : "text-neutral-500"}`}>{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Categories Grid */}
                  {allCategories.length > 0 && (
                    <div className="pt-5">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-3">
                        Filter by Category
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {allCategories.map((cat) => {
                          const isCatActive = selectedCategory === cat.name;
                          return (
                            <button
                              key={cat.name}
                              onClick={() => setSelectedCategory(isCatActive ? "" : cat.name)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 border flex items-center gap-1.5 ${
                                isCatActive
                                  ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                                  : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                              }`}
                            >
                              <span>{cat.name}</span>
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                                isCatActive ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-600"
                              }`}>
                                {cat.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="bg-white border-t border-neutral-100 p-4 px-6 flex items-center gap-3">
                  <button
                    onClick={clearAllFilters}
                    disabled={activeFilterCount === 0}
                    className="py-3 px-4 rounded-2xl text-xs font-extrabold text-neutral-600 border border-neutral-200 hover:bg-neutral-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-[#e23744] hover:bg-[#cb2c3e] shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Show {filteredItems.length} Dishes</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── FLOATING VIEW CART BAR — Zomato style ── */}
      <AnimatePresence>
        {cartItemCount > 0 && (() => {
          // Compute cart total from live cartItems state
          const cartTotal = cartItems.reduce(
            (sum: number, ci: any) => sum + ((ci.menuItem?.price || 0) * (ci.quantity || 1)),
            0
          );
          // Build a short preview string: first 2 item names
          const previewNames = cartItems
            .slice(0, 2)
            .map((ci: any) => ci.menuItem?.name || '')
            .filter(Boolean)
            .join(', ');
          const moreCount = cartItems.length - 2;

          return (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              // bottom-20 = above mobile bottom nav (h-16 = 64px + 16px gap)
              // md:bottom-6 = desktop has no bottom nav
              className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:max-w-sm"
            >
              <button
                onClick={() => navigate('/cart')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#E23744] hover:bg-[#C53030] rounded-2xl text-white shadow-xl shadow-rose-500/25 transition-all active:scale-98"
              >
                {/* Item count badge */}
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-black">{cartItemCount}</span>
                </div>

                {/* Middle: label + item name preview */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[14px] font-black leading-none">View Cart</p>
                  {previewNames && (
                    <p className="text-[11px] text-rose-100 font-medium mt-0.5 truncate">
                      {previewNames}{moreCount > 0 ? ` +${moreCount} more` : ''}
                    </p>
                  )}
                </div>

                {/* Right: total price */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[14px] font-black">₹{cartTotal}</p>
                  <p className="text-[10px] text-rose-200 font-medium">TOTAL</p>
                </div>
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Item Customization Bottom Sheet */}
      <CustomizeModal
        isOpen={customizeTarget !== null}
        onClose={() => setCustomizeTarget(null)}
        item={customizeTarget}
        onConfirm={handleCustomizeConfirm}
      />
    </div>
  );
}
