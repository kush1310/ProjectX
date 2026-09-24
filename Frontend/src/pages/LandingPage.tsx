import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  ChevronLeft,
  Store,
  Users,
  ShoppingBag,
  Star,
  MapPin,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Heart,
  Tag,
  PhoneCall,
  Mail,
  Building2,
  TrendingUp,
  Search,
  ExternalLink,
  Info,
  Menu,
  X
} from 'lucide-react';
import api from '@/utils/api';
import { fetchCanteens, Canteen } from '@/Canteen/utils/canteenStore';

interface PublicStats {
  totalCanteens: number;
  totalOrdersServed: number;
  activeDishes: number;
  activeCoupons: number;
  avgRating: number;
}

interface BlogPost {
  id: number;
  title: string;
  category: string;
  readTime: string;
  date: string;
  image: string;
  snippet: string;
  content: string;
  author: string;
}

const HERO_CAROUSEL = [
  {
    id: 1,
    title: 'FLAT 40% OFF on Grizzly Cheeseburgers',
    subtitle: 'Craving juicy burgers between lectures? Use code GRIZZLY40 at checkout.',
    badge: 'Limited Flash Offer',
    code: 'GRIZZLY40',
    image: '/hero_burger.png',
    canteenId: 1,
    canteenName: 'Grizzly Diner',
    btnText: 'Order Cheeseburger'
  },
  {
    id: 2,
    title: 'BUY 1 GET 1 FREE — Havmor Sundaes',
    subtitle: 'Beat the afternoon heat with sizzling brownie ice cream sundaes.',
    badge: 'Sweet Afternoon Deal',
    code: 'HAVMORBOGO',
    image: '/hero_dessert.png',
    canteenId: 2,
    canteenName: 'Havmor Eatery',
    btnText: 'Claim Free Sundae'
  },
  {
    id: 3,
    title: 'Special Rush-Hour Thali & Crispy Dosa',
    subtitle: 'Fresh authentic South Indian breakfasts & thalis served under 5 mins.',
    badge: 'Campus Bestseller',
    code: 'MEALRUSH',
    image: '/hero_thali.png',
    canteenId: 3,
    canteenName: "Foodie's Hub",
    btnText: 'View Lunch Menu'
  }
];

const CANTEEN_DEFAULT_IMAGES: Record<string, string> = {
  grizzly: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
  havmor: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
  foodie: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80'
};

const getCanteenImage = (name: string, customImage?: string) => {
  if (customImage && customImage.startsWith('http')) return customImage;
  const lower = (name || '').toLowerCase();
  if (lower.includes('grizzly')) return CANTEEN_DEFAULT_IMAGES.grizzly;
  if (lower.includes('havmor')) return CANTEEN_DEFAULT_IMAGES.havmor;
  if (lower.includes('foodie')) return CANTEEN_DEFAULT_IMAGES.foodie;
  if (lower.includes('bakery')) return CANTEEN_DEFAULT_IMAGES.bakery;
  return CANTEEN_DEFAULT_IMAGES.default;
};

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'Top 5 Quick Energy Snacks During Exam Season at CHARUSAT',
    category: 'Student Nutrition',
    readTime: '3 min read',
    date: '18 July 2026',
    author: 'Campus Student Council',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80',
    snippet: 'Struggling through late night study sessions? Discover the healthiest quick bites available across campus canteens.',
    content: `When exam week arrives at CHARUSAT, staying energized and focused without feeling sluggish is vital.
    
    1. **Hazelnut Cold Brew from Campus Bakery**: Low sugar, high caffeine clarity to power through revision blocks.
    2. **Fresh Steamed Idli Sambar at Foodie's Hub**: Light on stomach, rich in complex carbohydrates for sustained energy.
    3. **Grilled Paneer Sandwich at Grizzly**: High protein snack to keep hunger pangs away during long lab sessions.
    4. **Fruit Smoothies at Havmor**: Natural sugars without the crash of artificial energy drinks.
    
    Order ahead on CHARUSAT Needs to skip lines during 15-minute exam breaks!`
  },
  {
    id: 2,
    title: 'How CHARUSAT Needs Reduced Lunch Queue Times by 82%',
    category: 'Technology & Campus Impact',
    readTime: '4 min read',
    date: '12 July 2026',
    author: 'Tech Innovation Team',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    snippet: 'With smart STOMP WebSocket notifications and pre-orders, students now spend 5x less time waiting for food.',
    content: `Before CHARUSAT Needs, 1:00 PM lunch breaks meant 25-minute queues across campus food stalls.
    
    By introducing real-time order status tracking, digital token calling, and instant Razorpay UPI checkouts:
    - Average pick-up time dropped from 22 mins to under 3.5 mins.
    - Food waste decreased by 18% due to accurate pre-order forecasting.
    - Vendors experience smoother kitchen workflow during peak semester hours.`
  },
  {
    id: 3,
    title: 'Budget Bites: Complete Campus Meals Under ₹100',
    category: 'Budget Guide',
    readTime: '2 min read',
    date: '05 July 2026',
    author: 'CHARUSAT Food Club',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    snippet: 'Eating well on a student budget is easier than ever with daily student combo offers.',
    content: `Eating delicious, hygienic food on campus doesn't need to break the bank.
    
    - **Foodie's Hub Executive Mini Thali (₹85)**: Includes 3 Roti, Subzi, Rice, Dal & Salad.
    - **Grizzly Meal Deal (₹99)**: Veggie Crispy Burger + Salted Fries + Mint Cooler.
    - **Campus Bakery Combo (₹75)**: Puff Pastry + Hot Coffee/Tea.
    
    Keep an eye on CHARUSAT Needs daily promo codes to save up to 40% more!`
  }
];

const renderFormattedContent = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-1" />;

    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    const formattedElements = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (trimmed.startsWith('- ')) {
      return (
        <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-slate-700">
          <span className="text-red-600 font-bold">•</span>
          <span>{formattedElements}</span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <div key={idx} className="ml-1 my-1 text-slate-800 font-medium">
          {formattedElements}
        </div>
      );
    }

    return (
      <p key={idx} className="my-1.5 text-slate-700 leading-relaxed">
        {formattedElements}
      </p>
    );
  });
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loadingCanteens, setLoadingCanteens] = useState(true);
  const [stats, setStats] = useState<PublicStats>({
    totalCanteens: 4,
    totalOrdersServed: 12500,
    activeDishes: 80,
    activeCoupons: 15,
    avgRating: 4.8
  });

  // Modal States
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSubmitted, setVendorSubmitted] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);

  const [vendorForm, setVendorForm] = useState({
    applicantName: '',
    email: '',
    phone: '',
    canteenName: '',
    canteenType: 'Fast Food',
    description: '',
    address: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    fssaiLicense: ''
  });

  // Auto slide carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_CAROUSEL.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Fetch live public stats & portal canteens directly from backend API
  useEffect(() => {
    const loadPortalData = async () => {
      try {
        const [statsRes, canteensData] = await Promise.all([
          api.get('/public/stats').catch(() => null),
          fetchCanteens().catch(() => [])
        ]);

        if (statsRes?.data) {
          setStats(statsRes.data);
        }

        if (canteensData && canteensData.length > 0) {
          setCanteens(canteensData);
        }
      } catch (e) {
        console.warn('Failed to load portal canteens', e);
      } finally {
        setLoadingCanteens(false);
      }
    };
    loadPortalData();
  }, []);

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vendor-applications', vendorForm);
      setVendorSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission failed. Please check inputs.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
      {/* Soft Red & White Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-gradient-to-tr from-red-100/70 to-rose-100/50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[35rem] h-[35rem] bg-gradient-to-br from-red-50 to-rose-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[38rem] h-[38rem] bg-red-100/40 rounded-full blur-3xl" />
      </div>

      {/* ─── NAVBAR (Red & White Theme) ───────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-red-100 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 p-0.5 shadow-md shadow-red-600/20">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-red-600">
                CHARUSAT <span className="text-slate-900">Needs</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-red-600">
                Interuniversity Canteen Service
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-700">
            <a href="#home" className="hover:text-red-600 transition-colors">Home</a>
            <a href="#about" className="hover:text-red-600 transition-colors">About Us</a>
            <a href="#canteens" className="hover:text-red-600 transition-colors">Campus Canteens</a>
            <a href="#blogs" className="hover:text-red-600 transition-colors">Blogs & News</a>
            <button onClick={() => setIsVendorModalOpen(true)} className="hover:text-red-600 transition-colors flex items-center gap-1">
              <Store className="w-4 h-4 text-red-600" /> Partner Vendor
            </button>
          </nav>

          {/* Auth CTA Buttons & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white text-xs sm:text-sm font-extrabold shadow-md sm:shadow-lg shadow-red-600/25 hover:shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 sm:gap-1.5"
            >
              <span className="sm:hidden">Register</span>
              <span className="hidden sm:inline">Student Register</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
            {/* Mobile Navigation Toggle Button */}
            <button
              onClick={() => setIsMobileNavOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              className="lg:hidden p-2 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              {isMobileNavOpen ? <X className="w-5 h-5 text-red-600" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-red-100 mt-3 pt-3 overflow-hidden"
            >
              <div className="flex flex-col space-y-1.5 text-sm font-bold text-slate-700 pb-2">
                <a
                  href="#home"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  Home
                </a>
                <a
                  href="#about"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#canteens"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  Campus Canteens
                </a>
                <a
                  href="#blogs"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  Blogs & News
                </a>
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setIsVendorModalOpen(true);
                  }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <Store className="w-4 h-4 text-red-600" /> Partner Vendor
                </button>
                <div className="pt-2 border-t border-red-50 flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex-1 text-center py-2 text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex-1 text-center py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── HERO CAROUSEL SECTION ────────────────────────────── */}
      <section id="home" className="relative z-10 pt-10 pb-16 px-6 max-w-7xl mx-auto">
        <div className="relative bg-white border border-red-100 rounded-3xl overflow-hidden shadow-2xl shadow-red-950/5 backdrop-blur-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Offer Content */}
            <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={HERO_CAROUSEL[activeSlide].id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    {HERO_CAROUSEL[activeSlide].badge}
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-[1.15]">
                    {HERO_CAROUSEL[activeSlide].title}
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                    {HERO_CAROUSEL[activeSlide].subtitle}
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promo Code:</span>
                    <span className="font-mono text-sm font-black text-red-600 bg-red-50 border border-red-200 px-3.5 py-1 rounded-lg shadow-sm">
                      {HERO_CAROUSEL[activeSlide].code}
                    </span>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <Link
                      to="/signup"
                      className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-extrabold text-sm shadow-xl shadow-red-600/25 hover:shadow-red-600/40 hover:scale-[1.03] transition-all flex items-center gap-2"
                    >
                      {HERO_CAROUSEL[activeSlide].btnText} <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#canteens"
                      className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-700 font-bold text-sm transition-all border border-slate-200 hover:border-red-200"
                    >
                      Browse All Canteens
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Hero Image Slider */}
            <div className="lg:col-span-6 relative min-h-[320px] lg:min-h-full overflow-hidden bg-red-50/40">
              <AnimatePresence mode="wait">
                <motion.img
                  key={HERO_CAROUSEL[activeSlide].id}
                  src={HERO_CAROUSEL[activeSlide].image}
                  alt={HERO_CAROUSEL[activeSlide].title}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Overlay Canteen Badge */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-red-100 shadow-md flex items-center gap-2">
                <Store className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-slate-800">{HERO_CAROUSEL[activeSlide].canteenName}</span>
              </div>

              {/* Carousel Navigation Buttons */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => setActiveSlide((prev) => (prev - 1 + HERO_CAROUSEL.length) % HERO_CAROUSEL.length)}
                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-red-600 hover:text-white text-slate-800 flex items-center justify-center shadow-md border border-slate-200 hover:border-red-600 transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_CAROUSEL.length)}
                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-red-600 hover:text-white text-slate-800 flex items-center justify-center shadow-md border border-slate-200 hover:border-red-600 transition-all hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Carousel Indicators */}
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                {HERO_CAROUSEL.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === activeSlide ? 'w-8 bg-red-600' : 'w-2.5 bg-white/80 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE CAMPUS STATS BAR ─────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 mb-20">
        <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-xl shadow-red-950/5 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-red-100">
          <div className="pt-4 lg:pt-0">
            <p className="text-3xl sm:text-4xl font-black text-red-600">{stats.totalCanteens}+</p>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1 uppercase tracking-wider">Active Canteens</p>
          </div>
          <div className="pt-4 lg:pt-0">
            <p className="text-3xl sm:text-4xl font-black text-red-600">{stats.totalOrdersServed.toLocaleString()}+</p>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1 uppercase tracking-wider">Orders Served</p>
          </div>
          <div className="pt-4 lg:pt-0">
            <p className="text-3xl sm:text-4xl font-black text-red-600">{stats.activeDishes}+</p>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1 uppercase tracking-wider">Dishes & Drinks</p>
          </div>
          <div className="pt-4 lg:pt-0 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1">
              <span className="text-3xl sm:text-4xl font-black text-red-600">{stats.avgRating}</span>
              <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1 uppercase tracking-wider">Student Rating</p>
          </div>
        </div>
      </section>

      {/* ─── ABOUT US SECTION ───────────────────────────────────── */}
      <section id="about" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-red-600/10 via-rose-500/5 to-red-600/10 border border-red-200/80 rounded-3xl p-8 sm:p-14 shadow-lg">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider mb-4">
              <Building2 className="w-4 h-4 text-red-600" /> About CHARUSAT Needs
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Revolutionizing Interuniversity Canteen Dining Across Campus
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
              CHARUSAT Needs connects students, faculty, and campus food vendors under one unified real-time ordering network. Designed to handle peak semester rush hours, our platform provides pre-ordering, instant UPI payments, and zero queue pickups across all campus institutes.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Multi-Stall Aggregator</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Order from any canteen in a single cart.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Instant Live Tracking</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Real-time STOMP WebSocket status updates.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Student Rush Perks</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Daily discount coupons & flash sales.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CAMPUS CANTEENS ACCESS & DIRECT LINKS (PORTAL ONLY) ─── */}
      <section id="canteens" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider mb-2">
              <Store className="w-4 h-4 text-red-600" /> User Portal Canteens
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Active Campus Canteens</h2>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-2 sm:mt-0">Displaying canteens registered in the CHARUSAT portal</p>
        </div>

        {loadingCanteens ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl h-72 animate-pulse p-4" />
            ))}
          </div>
        ) : canteens.length === 0 ? (
          <div className="bg-white border border-red-100 rounded-3xl p-12 text-center">
            <Store className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No Canteens Currently Found</h3>
            <p className="text-xs text-slate-500 mt-1">Check back soon or register as a partner vendor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {canteens.map((canteen) => {
              const canteenImg = getCanteenImage(canteen.name, canteen.image);
              const isAvailableNow = canteen.isOpen !== false;

              return (
                <div
                  key={canteen.id}
                  className="bg-white border border-red-100 rounded-3xl overflow-hidden shadow-lg shadow-red-950/5 hover:shadow-2xl hover:shadow-red-600/10 hover:border-red-300 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={canteenImg}
                        alt={canteen.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-amber-600 shadow-md flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {canteen.rating || 4.8}
                      </div>
                      <div
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider shadow-md text-white ${
                          isAvailableNow ? 'bg-red-600' : 'bg-slate-700'
                        }`}
                      >
                        {isAvailableNow ? 'Open Now' : 'Closed'}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        {canteen.name}
                      </h3>
                      <p className="text-xs font-semibold text-red-600 mt-1">
                        {canteen.cuisineType || canteen.description || 'Campus Canteen Specialty'}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
                        <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="line-clamp-1">{canteen.location || 'CHARUSAT Campus'}</span>
                      </div>

                      {canteen.openingTime && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{canteen.openingTime} - {canteen.closingTime || '7:00 PM'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Access Action Buttons */}
                  <div className="p-6 pt-0 space-y-2">
                    <Link
                      to={`/canteen/${canteen.id}/menu`}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200 hover:border-red-200"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-red-600" /> Direct Menu Access
                    </Link>
                    <Link
                      to="/login"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/20 hover:shadow-red-600/35 transition-all flex items-center justify-center gap-1.5"
                    >
                      Order Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── BLOGS & CAMPUS FOOD NEWS SECTION ───────────────────── */}
      <section id="blogs" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4 text-red-600" /> Campus Food & Stories
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Blogs & Student Articles</h2>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-2 sm:mt-0">Latest updates on student dining & campus life</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((blog) => (
            <article
              key={blog.id}
              onClick={() => setSelectedBlog(blog)}
              className="bg-white border border-red-100 rounded-3xl overflow-hidden shadow-lg shadow-red-950/5 hover:shadow-2xl hover:border-red-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {blog.category}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span>{blog.date}</span>
                    <span>{blog.readTime}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {blog.snippet}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <span className="text-xs font-bold text-red-600 group-hover:underline flex items-center gap-1">
                  Read Full Article <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── BLOG READER MODAL ──────────────────────────────────── */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative border border-red-100"
          >
            <button
              onClick={() => setSelectedBlog(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 font-bold"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="px-3.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider">
              {selectedBlog.category}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4 leading-tight">
              {selectedBlog.title}
            </h2>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-3 pb-4 border-b border-slate-100">
              <span>By {selectedBlog.author}</span>
              <span>•</span>
              <span>{selectedBlog.date}</span>
              <span>•</span>
              <span>{selectedBlog.readTime}</span>
            </div>

            <img
              src={selectedBlog.image}
              alt={selectedBlog.title}
              className="w-full h-56 object-cover rounded-2xl my-6"
            />

            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-2">
              {renderFormattedContent(selectedBlog.content)}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedBlog(null)}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Close Article
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── VENDOR APPLICATION MODAL ────────────────────────────── */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-red-100 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
          >
            <button
              onClick={() => { setIsVendorModalOpen(false); setVendorSubmitted(false); }}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {vendorSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-slate-900">Application Submitted!</h3>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  Thank you for applying to join CHARUSAT Needs. Our campus administration team will review your application and send your login credentials to your email.
                </p>
                <button
                  onClick={() => { setIsVendorModalOpen(false); setVendorSubmitted(false); }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-red-600 text-white font-extrabold text-sm shadow-md"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleVendorSubmit} className="space-y-4">
                <div>
                  <span className="px-3.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider">
                    Vendor Registration
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">Partner as Campus Vendor</h3>
                  <p className="text-xs text-slate-500 mt-1">Register your canteen or food stall on the CHARUSAT Needs platform.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Name *</label>
                    <input
                      required
                      type="text"
                      value={vendorForm.applicantName}
                      onChange={(e) => setVendorForm({ ...vendorForm, applicantName: e.target.value })}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                    <input
                      required
                      type="email"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      placeholder="vendor@charusat.edu.in"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      required
                      type="text"
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Canteen Name *</label>
                    <input
                      required
                      type="text"
                      value={vendorForm.canteenName}
                      onChange={(e) => setVendorForm({ ...vendorForm, canteenName: e.target.value })}
                      placeholder="e.g. Campus Juice Center"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campus Location / Block *</label>
                  <input
                    required
                    type="text"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    placeholder="e.g. CSPIT Building Ground Floor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-black text-red-700 mb-2">Banking & License (AES-256 Encrypted)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={vendorForm.bankName}
                      onChange={(e) => setVendorForm({ ...vendorForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-red-600"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={vendorForm.accountNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-red-600"
                    />
                    <input
                      type="text"
                      placeholder="IFSC Code"
                      value={vendorForm.ifscCode}
                      onChange={(e) => setVendorForm({ ...vendorForm, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-extrabold text-sm shadow-md shadow-red-600/20 hover:shadow-red-600/35 transition-all"
                >
                  Submit Vendor Application
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* ─── FOOTER (Red & White Theme) ─────────────────────────── */}
      <footer className="relative z-10 border-t border-red-100 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-5 h-5 text-red-600" />
            <span className="font-extrabold text-slate-800">CharusatNeeds Platform</span> — Interuniversity Canteen Network
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-bold text-slate-700">
            <a href="#home" className="hover:text-red-600 transition-colors">Home</a>
            <a href="#about" className="hover:text-red-600 transition-colors">About Us</a>
            <a href="#canteens" className="hover:text-red-600 transition-colors">Canteens</a>
            <a href="#blogs" className="hover:text-red-600 transition-colors">Blogs</a>
            <Link to="/login" className="hover:text-red-600 transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-red-600 transition-colors">Student Register</Link>
          </div>
          <p>© 2026 CHARUSAT University. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
