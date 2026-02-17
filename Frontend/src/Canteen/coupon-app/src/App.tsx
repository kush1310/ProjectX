/**
 * Coupon Management App with Sidebar Navigation
 * 
 * Updated to use Zomato-style red color palette
 */

import { useState, useEffect } from 'react';

import ElectroBorder from '../../../components/ElectroBorder';
import { CouponTable } from './components/CouponTable';
import { CreateCouponForm } from './components/CreateCouponForm';
import { ConfirmModal } from './components/ConfirmModal';
import { AnalyticsSection } from './components/AnalyticsSection';
import { EmptyState } from './components/EmptyState';

import { Plus, Search } from 'lucide-react';
import './index.css';

// Using store types
import { getCoupons, createCoupon, deleteCoupon, toggleCoupon } from '../../utils/canteenStore';
import type { Coupon } from '../../utils/canteenStore'; 

function App() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Confirmation State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '', action: () => { } });


  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await getCoupons();
      const formatted = data.map((c: any) => ({
          ...c,
          id: c.id.toString(),
          title: c.description || c.code,
          brandName: "My Canteen",
          isActive: c.isActive,
          expiryDate: c.validUntil
      }));
      setCoupons(formatted);
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;

    const newStatus = !coupon.isActive;
    
    setConfirmState({
      isOpen: true,
      type: newStatus ? 'info' : 'warning',
      title: `${newStatus ? 'Enable' : 'Disable'} Coupon?`,
      message: `Are you sure you want to ${newStatus ? 'enable' : 'disable'} "${coupon.code}"?`,
      action: async () => {
         await toggleCoupon(id);
         setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: newStatus } : c));
         setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      type: 'danger',
      title: 'Delete Coupon',
      message: 'This action cannot be undone. Are you sure you want to permanently delete this coupon?',
      action: async () => {
        await deleteCoupon(id);
        await loadCoupons();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddCoupon = async (couponData: Coupon) => {
    if (editingCoupon) {
      await loadCoupons(); 
      setEditingCoupon(null);
    } else {
      await createCoupon(couponData);
      await loadCoupons();
    }
    setShowCreateForm(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowCreateForm(true);
  };

  const handleDuplicate = async (coupon: Coupon) => {
    const newCode = `${coupon.code}-COPY-${Date.now().toString().slice(-4)}`;
    await createCoupon({
        ...coupon,
        id: undefined,
        code: newCode,
        isActive: false
    });
    await loadCoupons();
    
    setConfirmState({
      isOpen: true,
      type: 'info',
      title: 'Coupon Duplicated',
      message: `Created a copy of ${coupon.code} as ${newCode}. It is currently inactive.`,
      action: () => setConfirmState(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Filter Logic
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'active' ? c.isActive : !c.isActive;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-8 py-5 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Coupon Management
              </h1>
              <p className="text-sm text-gray-500">{coupons.length} coupons total</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="SEARCH COUPONS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#e23744] focus:ring-4 focus:ring-rose-50 outline-none transition-all text-sm"
                />
              </div>

              {/* Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:border-[#e23744] focus:ring-2 focus:ring-rose-100 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Add Button */}
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setShowCreateForm(true);
                }}
                className="bg-gradient-to-r from-[#e23744] to-rose-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-rose-200 flex items-center gap-2 hover:from-[#d62f3f] hover:to-rose-700 transition-all text-sm"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Deal</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          {/* Analytics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Overview</h2>
            <AnalyticsSection coupons={coupons} />
          </div>

          {/* Coupons Table with ElectroBorder */}
          <ElectroBorder color="red" intensity="medium" radius="1.5rem">
            <div className="bg-white rounded-3xl p-6 min-h-[400px]">
              <h3 className="text-lg font-bold mb-4">All Coupons</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-2 border-[#e23744] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredCoupons.length > 0 ? (
                <CouponTable
                  coupons={filteredCoupons}
                  onToggle={handleToggleActive}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onEdit={handleEdit}
                />
              ) : (
                <EmptyState
                  title="No coupons found"
                  description={searchQuery ? `No results for "${searchQuery}" in ${statusFilter} status.` : "No coupons created yet. Click 'Add Deal' to get started."}
                />
              )}
            </div>
          </ElectroBorder>
        </main>

        {showCreateForm && (
          <CreateCouponForm
            onSubmit={handleAddCoupon}
            onClose={() => {
              setShowCreateForm(false);
              setEditingCoupon(null);
            }}
            initialData={editingCoupon}
          />
        )}

        <ConfirmModal
          isOpen={confirmState.isOpen}
          type={confirmState.type}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.action}
          onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </>
  );
}

export default App;
