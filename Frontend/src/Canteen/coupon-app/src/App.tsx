/**
 * Campaign App - Premium Dashboard UI with Sidebar Navigation
 *
 * Features: Sidebar nav, category-specific sections, form flow, analytics and settings.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import CreateCouponForm from './components/CreateCouponForm';
import { ConfirmModal } from './components/ConfirmModal';
import { OfferTrackingCard } from './components/OfferTrackingCard';
import { CreateOffersView } from './components/CreateOffersView';
import { TrackOffersAnalytics } from './components/TrackOffersAnalytics';
import { OfferPerformanceTable } from './components/OfferPerformanceTable';
import { EmptyState } from './components/EmptyState';
import { TrackOffersSkeleton } from './components/SkeletonLoader';
import { OfferTypeSelector } from './components/forms/OfferTypeSelector';
import { OfferFormGeneral } from './components/forms/OfferFormGeneral';
import { OfferFormBOGO } from './components/forms/OfferFormBOGO';
import { OfferFormItemSpecific } from './components/forms/OfferFormItemSpecific';
import { OfferFormCombo } from './components/forms/OfferFormCombo';
import { OfferFormNewDish } from './components/forms/OfferFormNewDish';
import { OfferFormRushHour } from './components/forms/OfferFormRushHour';
import { RestoreModal } from './components/RestoreModal';
import { DEFAULT_COUPON_PREFERENCES, type CouponPreferences } from './components/CouponSettingsView';

import {
  Plus, Search, X, Tag, BarChart3,
  RotateCcw, Archive, Megaphone,
  ArrowLeft,
} from 'lucide-react';
import './index.css';

import {
  getTrackCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCoupon,
  getCouponHistory, restoreCoupon as restoreCouponApi, archiveCoupon as archiveCouponApi,
} from '../../utils/canteenStore';
import type { Coupon, CouponType } from '../../utils/canteenStore';
import { useCouponWebSocket } from '../../../hooks/useCouponWebSocket';

type MainTab = 'dashboard' | 'offers' | 'performance';
type OffersSubTab = 'active' | 'history';
type OfferFilter = 'all' | 'active' | 'scheduled' | 'inactive';
type CouponCategoryFilter = 'all' | CouponType;

type SidebarNavItem = {
  key: MainTab;
  label: string;
  icon: any;
};

const PREFERENCES_STORAGE_KEY = 'coupon-dashboard-preferences-v1';

const SIDEBAR_NAV: SidebarNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Megaphone },
  { key: 'offers', label: 'My Offers', icon: Tag },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
];

const HEADER_CONFIG: Record<MainTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Marketing Hub', subtitle: 'Manage your active campaigns and trends.' },
  offers: { title: 'My Offer Repository', subtitle: 'Detailed view of your current and past offers.' },
  performance: { title: 'Analytics Insights', subtitle: 'Track how your offers are performing.' },
};

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerText.includes(lowerQuery)) return true;
  let qi = 0;
  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) qi++;
  }
  return qi === lowerQuery.length;
}

function sanitizePrefix(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
}

function readPreferences(): CouponPreferences {
  if (typeof window === 'undefined') return DEFAULT_COUPON_PREFERENCES;
  try {
    const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) return DEFAULT_COUPON_PREFERENCES;
    return { ...DEFAULT_COUPON_PREFERENCES, ...(JSON.parse(stored) as Partial<CouponPreferences>) };
  } catch {
    return DEFAULT_COUPON_PREFERENCES;
  }
}

function App() {
  const location = useLocation();
  const createForItem = (location.state as { createForItem?: { id: number; name: string } } | undefined)?.createForItem;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [historyCoupons, setHistoryCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [mainTab, setMainTab] = useState<MainTab>('dashboard');
  const [offersSubTab, setOffersSubTab] = useState<OffersSubTab>('active');

  const [offerFilter, setOfferFilter] = useState<OfferFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState<CouponCategoryFilter>('all');
  const [couponPreferences] = useState<CouponPreferences>(() => readPreferences());

  const [formFlow, setFormFlow] = useState<'none' | 'typeSelect' | 'form'>('none');
  const [selectedFormType, setSelectedFormType] = useState<CouponType | null>(null);

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Coupon | null>(null);


  const [showCreateForm, setShowCreateForm] = useState(Boolean(createForItem));
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(
    createForItem
      ? {
        title: `Deal on ${createForItem.name}`,
        couponCode: `${createForItem.name.substring(0, 3).toUpperCase()}20`,
        couponType: 'ITEM_SPECIFIC',
        applicableItemIds: [createForItem.id],
        discountValue: 20,
        discountType: 'PERCENTAGE',
        isActive: true,
      } as Coupon
      : null,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '', action: () => { } });

  useEffect(() => {
    loadCoupons();
  }, [offerFilter, categoryFilter]);

  // Real-time WebSocket sync — auto-refresh vendor dashboard when any coupon event occurs
  useCouponWebSocket({
    onEvent: useCallback(() => {
      loadCoupons();
      if (mainTab === 'offers' && offersSubTab === 'history') {
        loadHistory();
      }
    }, [mainTab, offersSubTab]),
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(couponPreferences));
    }
  }, [couponPreferences]);

  useEffect(() => {
    if (mainTab === 'offers' && offersSubTab === 'history') {
      loadHistory();
    }
  }, [mainTab, offersSubTab]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const status: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' =
        offerFilter === 'all' ? 'ALL' : offerFilter.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
      const data = await getTrackCoupons({
        status,
        couponType: categoryFilter === 'all' ? undefined : categoryFilter,
      });
      setCoupons(data);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getCouponHistory();
      setHistoryCoupons(data);
    } catch {
      setHistoryCoupons([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateCouponCode = (seed?: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const prefix = sanitizePrefix(couponPreferences.codePrefix);
    const seedChunk = seed ? seed.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4) : '';
    let code = seedChunk;
    for (let i = code.length; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return prefix ? `${prefix}-${code}` : code;
  };

  const normalizeCouponPayload = (couponData: Partial<Coupon>): Partial<Coupon> => {
    const payload = { ...couponData };
    const prefix = sanitizePrefix(couponPreferences.codePrefix);

    if (payload.couponCode) {
      payload.couponCode = String(payload.couponCode).trim().toUpperCase();
    }

    if (!payload.couponCode) {
      payload.couponCode = generateCouponCode(payload.title);
    } else if (prefix && !payload.couponCode.startsWith(`${prefix}-`)) {
      payload.couponCode = `${prefix}-${payload.couponCode}`;
    }

    if (payload.isActive === undefined) payload.isActive = true;
    if (!payload.discountType) payload.discountType = 'PERCENTAGE';
    if (!payload.couponType) payload.couponType = 'GENERAL';

    if (!payload.startTime && !payload.endTime && couponPreferences.defaultValidityHours > 0) {
      const start = new Date();
      const end = new Date(start.getTime() + couponPreferences.defaultValidityHours * 60 * 60 * 1000);
      payload.startTime = start.toISOString();
      payload.endTime = end.toISOString();
    }

    return payload;
  };

  const createCouponWithValidation = async (couponData: Partial<Coupon>): Promise<boolean> => {
    try {
      const payload = normalizeCouponPayload(couponData);
      await createCoupon(payload);
      await loadCoupons();
      return true;
    } catch (err) {
      console.error('Failed to create coupon', err);
      setConfirmState({
        isOpen: true,
        type: 'danger',
        title: 'Creation Failed',
        message: err instanceof Error ? err.message : 'Failed to create coupon. Please try again.',
        action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
      });
      return false;
    }
  };

  const handleToggleActive = async (id: string) => {
    const coupon = coupons.find((item) => item.id === id);
    if (!coupon) return;

    setConfirmState({
      isOpen: true,
      type: coupon.isActive ? 'warning' : 'info',
      title: coupon.isActive ? 'Deactivate Offer?' : 'Activate Offer?',
      message: coupon.isActive ? 'This offer will stop appearing for customers.' : 'This offer will go live.',
      action: async () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        try {
          await toggleCoupon(id);
          await loadCoupons();
        } catch (err) {
          console.error(err);
          setConfirmState({
            isOpen: true,
            type: 'danger',
            title: 'Error',
            message: 'Failed to toggle offer. Please try again.',
            action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  const handleDelete = async (id: string) => {
    const coupon = coupons.find((item) => item.id === id);
    if (!coupon) return;

    setConfirmState({
      isOpen: true,
      type: 'danger',
      title: 'Delete Offer?',
      message: `"${coupon.couponCode}" will be permanently removed.`,
      action: async () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteCoupon(id);
          await loadCoupons();
        } catch (err) {
          console.error(err);
          setConfirmState({
            isOpen: true,
            type: 'danger',
            title: 'Error',
            message: 'Failed to delete offer.',
            action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  const handleArchive = async (id: string) => {
    const coupon = coupons.find((item) => item.id === id);
    if (!coupon) return;

    setConfirmState({
      isOpen: true,
      type: 'warning',
      title: 'Archive Offer?',
      message: `"${coupon.couponCode}" will be moved to history. You can restore it later.`,
      action: async () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        try {
          await archiveCouponApi(id);
          await loadCoupons();
        } catch (err) {
          console.error(err);
          setConfirmState({
            isOpen: true,
            type: 'danger',
            title: 'Error',
            message: 'Failed to archive offer.',
            action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  const handleAddCoupon = async (couponData: Partial<Coupon>) => {
    if (editingCoupon?.id) {
      try {
        await updateCoupon(editingCoupon.id, couponData);
        await loadCoupons();
      } catch (err) {
        console.error(err);
        setConfirmState({
          isOpen: true,
          type: 'danger',
          title: 'Error',
          message: 'Failed to update coupon.',
          action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
        });
      }
    } else {
      await createCouponWithValidation(couponData);
    }

    setShowCreateForm(false);
    setEditingCoupon(null);
  };

  const handleBifurcatedSubmit = async (couponData: Partial<Coupon>) => {
    const payload = normalizeCouponPayload(couponData);
    const ok = await createCouponWithValidation(payload);

    if (ok) {
      setFormFlow('none');
      setSelectedFormType(null);
      if (couponPreferences.autoOpenMyOffers) {
        setMainTab('offers');
        setOffersSubTab('active');
      } else {
        setMainTab('dashboard');
      }

      setConfirmState({
        isOpen: true,
        type: 'info',
        title: 'Offer Created!',
        message: `"${payload.couponCode}" is now live.`,
        action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowCreateForm(true);
  };

  const handleDuplicate = async (coupon: Coupon) => {
    const duplicate = { ...coupon };
    delete (duplicate as { id?: string }).id;
    duplicate.couponCode = generateCouponCode(coupon.couponCode);
    duplicate.title = `${coupon.title} (Copy)`;
    duplicate.isActive = false;

    await createCouponWithValidation(duplicate);

    setConfirmState({
      isOpen: true,
      type: 'info',
      title: 'Duplicated!',
      message: `"${duplicate.couponCode}" created as inactive copy.`,
      action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const handleActivatePreset = async (preset: Partial<Coupon>) => {
    const payload = normalizeCouponPayload(preset);
    const ok = await createCouponWithValidation(payload);

    if (ok) {
      if (couponPreferences.autoOpenMyOffers) {
        setMainTab('offers');
        setOffersSubTab('active');
      }

      setConfirmState({
        isOpen: true,
        type: 'info',
        title: 'Offer Activated!',
        message: `"${payload.couponCode}" is now live.`,
        action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  // handleCreateForSegment removed as it was unused

  const handleRestore = async (id: string, startTime: string, endTime: string) => {
    try {
      await restoreCouponApi(id, startTime, endTime);
      setRestoreModalOpen(false);
      setRestoreTarget(null);
      await loadHistory();
      await loadCoupons();

      setConfirmState({
        isOpen: true,
        type: 'info',
        title: 'Restored!',
        message: 'Offer has been restored and is now active.',
        action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
      });
    } catch {
      setConfirmState({
        isOpen: true,
        type: 'danger',
        title: 'Error',
        message: 'Failed to restore offer.',
        action: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  const filteredCoupons = useMemo(
    () =>
      coupons.filter((coupon) => {
        if (coupon.isArchived) return false;

        if (
          couponPreferences.hideExpiredOffers &&
          coupon.endTime &&
          new Date(coupon.endTime).getTime() < Date.now()
        ) {
          return false;
        }

        const matchesSearch =
          fuzzyMatch(coupon.couponCode, searchQuery) ||
          fuzzyMatch(coupon.title || '', searchQuery) ||
          fuzzyMatch(coupon.description || '', searchQuery);

        const matchesCategory = categoryFilter === 'all' || coupon.couponType === categoryFilter;

        let matchesFilter = true;
        if (offerFilter === 'active') matchesFilter = coupon.isActive === true;
        else if (offerFilter === 'inactive') matchesFilter = coupon.isActive === false;
        else if (offerFilter === 'scheduled') {
          matchesFilter = coupon.startTime ? new Date(coupon.startTime) > new Date() : false;
        }

        return matchesSearch && matchesFilter && matchesCategory;
      }),
    [coupons, couponPreferences.hideExpiredOffers, searchQuery, categoryFilter, offerFilter],
  );

  const sidebarStats = useMemo(
    () => ({
      totalOffers: coupons.filter((coupon) => !coupon.isArchived).length,
      historyCount: historyCoupons.length,
    }),
    [coupons, historyCoupons],
  );

  const handleSidebarNav = (item: SidebarNavItem) => {
    if (item.key === 'offers' && mainTab !== 'offers') setOffersSubTab('active');
    setMainTab(item.key);
  };

  if (formFlow === 'typeSelect') {
    return (
      <div className="min-h-screen bg-gray-50">
        <CampaignHeader mainTab={mainTab} onNav={handleSidebarNav} onNewOffer={() => setFormFlow('typeSelect')} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <OfferTypeSelector
            onSelect={(type) => {
              setSelectedFormType(type);
              setFormFlow('form');
            }}
            onBack={() => setFormFlow('none')}
          />
        </div>
      </div>
    );
  }

  if (formFlow === 'form' && selectedFormType) {
    const formProps = { onSubmit: handleBifurcatedSubmit, onBack: () => setFormFlow('typeSelect') };
    const formMap: Record<CouponType, React.ReactElement> = {
      GENERAL: <OfferFormGeneral {...formProps} />,
      BOGO: <OfferFormBOGO {...formProps} />,
      ITEM_SPECIFIC: <OfferFormItemSpecific {...formProps} />,
      COMBO: <OfferFormCombo {...formProps} />,
      NEW_DISH: <OfferFormNewDish {...formProps} />,
      RUSH_HOUR: <OfferFormRushHour {...formProps} />,
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <CampaignHeader mainTab={mainTab} onNav={handleSidebarNav} onNewOffer={() => setFormFlow('typeSelect')} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{formMap[selectedFormType]}</div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CampaignHeader mainTab={mainTab} onNav={handleSidebarNav} onNewOffer={() => setFormFlow('typeSelect')} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <CreateCouponForm
            onSubmit={handleAddCoupon}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingCoupon(null);
            }}
            initialData={editingCoupon || undefined}
          />
        </div>
      </div>
    );
  }

  // ── Category filter chip data ──
  const CATEGORY_OPTIONS: { key: CouponCategoryFilter; label: string; color: string }[] = [
    { key: 'all', label: 'All Categories', color: 'bg-gray-100 text-gray-700' },
    { key: 'GENERAL', label: 'General', color: 'bg-orange-50 text-orange-700' },
    { key: 'BOGO', label: 'BOGO', color: 'bg-violet-50 text-violet-700' },
    { key: 'ITEM_SPECIFIC', label: 'Item Specific', color: 'bg-emerald-50 text-emerald-700' },
    { key: 'COMBO', label: 'Combo', color: 'bg-red-50 text-red-700' },
    { key: 'NEW_DISH', label: 'New Dish', color: 'bg-amber-50 text-amber-700' },
    { key: 'RUSH_HOUR', label: 'Rush Hour', color: 'bg-pink-50 text-pink-700' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* ── Top Header with inline nav ── */}
      <CampaignHeader mainTab={mainTab} onNav={handleSidebarNav} onNewOffer={() => setFormFlow('typeSelect')} />

      {/* ── Section Header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4">
          <h2 className="text-lg font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{HEADER_CONFIG[mainTab].title}</h2>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">{HEADER_CONFIG[mainTab].subtitle}</p>

          {mainTab === 'offers' && (
            <div className="flex gap-1 mt-3 bg-gray-100 p-1 rounded-xl w-fit">
              {(['active', 'history'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setOffersSubTab(tab)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-black capitalize transition-all ${
                    offersSubTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab === 'active' ? 'Active Offers' : 'History'}
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {tab === 'active' ? filteredCoupons.length : sidebarStats.historyCount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        <AnimatePresence mode="wait">
          {mainTab === 'dashboard' && (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {(formFlow as string) === 'none' ? (
                <CreateOffersView
                  onCreateCustom={() => setFormFlow('typeSelect')}
                  onActivatePreset={handleActivatePreset}
                  onSelectType={(type) => {
                    setSelectedFormType(type);
                    setFormFlow('form');
                  }}
                />
              ) : (formFlow as string) === 'typeSelect' ? (
                <OfferTypeSelector
                  onSelect={(type) => {
                    setSelectedFormType(type);
                    setFormFlow('form');
                  }}
                  onBack={() => setFormFlow('none')}
                />
              ) : (
                <div className="space-y-6 max-w-5xl mx-auto w-full">
                  <button
                    onClick={() => setFormFlow('typeSelect')}
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Back to Types
                  </button>

                  {selectedFormType === 'GENERAL' && <OfferFormGeneral onBack={() => setFormFlow('typeSelect')} onSubmit={handleBifurcatedSubmit} initialData={editingCoupon?.couponType === 'GENERAL' ? editingCoupon : undefined} />}
                  {selectedFormType === 'BOGO' && <OfferFormBOGO onBack={() => setFormFlow('typeSelect')} onSubmit={handleBifurcatedSubmit} initialData={editingCoupon?.couponType === 'BOGO' ? editingCoupon : undefined} />}
                  {selectedFormType === 'ITEM_SPECIFIC' && <OfferFormItemSpecific onBack={() => setFormFlow('typeSelect')} onSubmit={handleBifurcatedSubmit} initialData={editingCoupon?.couponType === 'ITEM_SPECIFIC' ? editingCoupon : undefined} />}
                  {selectedFormType === 'COMBO' && <OfferFormCombo onBack={() => setFormFlow('typeSelect')} onSubmit={handleBifurcatedSubmit} initialData={editingCoupon?.couponType === 'COMBO' ? editingCoupon : undefined} />}
                  {selectedFormType === 'NEW_DISH' && <OfferFormNewDish onBack={() => setFormFlow('typeSelect')} onSubmit={handleBifurcatedSubmit} initialData={editingCoupon?.couponType === 'NEW_DISH' ? editingCoupon : undefined} />}
                  {selectedFormType === 'RUSH_HOUR' && <OfferFormRushHour onBack={() => setFormFlow('typeSelect')} onSubmit={handleBifurcatedSubmit} initialData={editingCoupon?.couponType === 'RUSH_HOUR' ? editingCoupon : undefined} />}
                </div>
              )}
            </motion.div>
          )}

          {mainTab === 'offers' && offersSubTab === 'active' && (
            <motion.div
              key="offers-active-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <TrackOffersAnalytics coupons={coupons} />

              <div className="mt-6">
                {/* Filter pills + search */}
                <div className="flex flex-col gap-3 mb-5">
                  {/* Status filters */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                    {([
                      { key: 'active' as OfferFilter, label: 'Active' },
                      { key: 'scheduled' as OfferFilter, label: 'Scheduled' },
                      { key: 'inactive' as OfferFilter, label: 'Inactive' },
                      { key: 'all' as OfferFilter, label: 'All' },
                    ]).map(f => (
                      <button
                        key={f.key}
                        onClick={() => setOfferFilter(f.key)}
                        className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black border-2 whitespace-nowrap transition-all ${
                          offerFilter === f.key
                            ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Category chip pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                    {CATEGORY_OPTIONS.map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setCategoryFilter(cat.key)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition-all ${
                          categoryFilter === cat.key
                            ? `${cat.color} ring-2 ring-gray-900/10 shadow-sm`
                            : 'bg-[#FAFAF8] text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="ag-search-wrapper sm:max-w-xs">
                    <Search size={14} className="ag-search-icon" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search offers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ag-search-input"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                        className="ag-search-clear"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <TrackOffersSkeleton />
                ) : filteredCoupons.length > 0 ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredCoupons.map((coupon) => (
                        <OfferTrackingCard
                          key={coupon.id || coupon.couponCode}
                          coupon={coupon}
                          onToggle={handleToggleActive}
                          onDelete={handleDelete}
                          onArchive={handleArchive}
                          onDuplicate={handleDuplicate}
                          onEdit={handleEdit}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <EmptyState
                    title="No offers found"
                    description={
                      searchQuery
                        ? `No results for "${searchQuery}".`
                        : "No offers yet. Switch to 'Dashboard' to create one."
                    }
                  />
                )}
              </div>
            </motion.div>
          )}

          {mainTab === 'offers' && offersSubTab === 'history' && (
            <motion.div
              key="offers-history-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-extrabold text-neutral-900">Coupon History</h2>
                  <p className="text-[11px] text-neutral-400">Archived & expired coupons. Restore them with new dates.</p>
                </div>
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-bold text-neutral-500">
                  {historyCoupons.length}
                </span>
              </div>

              {historyLoading ? (
                <TrackOffersSkeleton />
              ) : historyCoupons.length > 0 ? (
                <div className="space-y-2.5">
                  {historyCoupons.map((coupon) => (
                    <motion.div
                      key={coupon.id || coupon.couponCode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border-2 border-gray-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 hover:shadow-md shadow-sm shadow-gray-100/60 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-sm text-neutral-900">{coupon.couponCode}</span>
                          {coupon.isArchived && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] rounded-full font-bold flex items-center gap-1">
                              <Archive size={9} /> Archived
                            </span>
                          )}
                          {coupon.isExpired && !coupon.isArchived && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] rounded-full font-bold">Expired</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 truncate">{coupon.title}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-neutral-400">
                          <span>Type: {coupon.couponType}</span>
                          {coupon.endTime && <span>Expired: {new Date(coupon.endTime).toLocaleDateString()}</span>}
                          {coupon.archivedAt && <span>Archived: {new Date(coupon.archivedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setRestoreTarget(coupon); setRestoreModalOpen(true); }}
                        className="px-5 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 whitespace-nowrap hover:shadow-lg transition-shadow"
                      >
                        <RotateCcw size={12} /> Restore
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No history" description="Archived and expired coupons will appear here." />
              )}
            </motion.div>
          )}

          {mainTab === 'performance' && (
            <motion.div
              key="performance-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <OfferPerformanceTable
                coupons={coupons}
                onBack={() => { setMainTab('offers'); setOffersSubTab('active'); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <footer className="mt-auto py-8 px-4 sm:px-6 border-t border-gray-100 bg-[#FAFAF8]">
        <div className="max-w-[1600px] w-full mx-auto text-center">
          <p className="text-xs text-gray-400 font-medium">© 2026 Campaign · CharusatNeeds</p>
        </div>
      </footer>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        type={confirmState.type}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <RestoreModal
        isOpen={restoreModalOpen}
        coupon={restoreTarget}
        onRestore={handleRestore}
        onClose={() => {
          setRestoreModalOpen(false);
          setRestoreTarget(null);
        }}
      />
    </div>
  );
}

/* ── Inline Campaign Header ── */
function CampaignHeader({ mainTab, onNav, onNewOffer }: {
  mainTab: MainTab;
  onNav: (item: SidebarNavItem) => void;
  onNewOffer: () => void;
}) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-md">
              <Megaphone size={15} className="text-white" fill="white" strokeWidth={1.5} />
            </div>
            <span className="text-sm sm:text-base font-black text-gray-900 hidden xs:inline" style={{ fontFamily: "'Outfit', sans-serif" }}>Campaign</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-xl overflow-x-auto max-w-[calc(100vw-110px)] sm:max-w-none">
            {SIDEBAR_NAV.map(item => {
              const isActive = mainTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNav(item)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* New Offer */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={onNewOffer}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl text-[11px] sm:text-xs font-black shadow-md hover:shadow-lg transition-all shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Offer</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

export default App;
