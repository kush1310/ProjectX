/**
 * VendorPayout — Canteen Earnings & Bank Payout Dashboard
 *
 * Displays the vendor's accumulated revenue, completed order count, bank account
 * details from their KYC profile, and provides a payout request CTA.
 * Data is fetched from /api/canteens/my-canteen (bank details) and
 * /api/orders/vendor-orders (revenue computation).
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, CreditCard, IndianRupee, CheckCircle2,
  Clock, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from '@/utils/toast';

interface PayoutSummary {
  totalRevenue: number;
  completedOrders: number;
  pendingPayout: number;
  lastPayoutDate: string | null;
  lastPayoutAmount: number;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  gstNo: string;
}

export default function VendorPayout() {
  const [summary,        setSummary]        = useState<PayoutSummary | null>(null);
  const [bankDetails,    setBankDetails]    = useState<BankDetails | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isRequesting,   setIsRequesting]   = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  /**
   * loadData
   *
   * Fetches the vendor's canteen profile (bank/KYC details) and order history
   * in parallel. Computes payout summary from completed orders with PAID status.
   *
   * @returns {void}
   * @validates  Checks for empty/missing bank details; shows warning if KYC incomplete.
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [canteenRes, ordersRes] = await Promise.all([
        api.get('/canteens/my-canteen'),
        api.get('/orders/my-orders?size=1000').catch(() => api.get('/orders/vendor-orders')),
      ]);

      const canteen = canteenRes.data?.canteen;
      if (canteen) {
        setBankDetails({
          bankName:          canteen.bankName          || '',
          accountNumber:     canteen.accountNumber     || '',
          ifscCode:          canteen.ifscCode          || '',
          accountHolderName: canteen.accountHolderName || '',
          gstNo:             canteen.gstNo             || '',
        });
      }

      const rawOrders = ordersRes.data?.content || ordersRes.data;
      const orders = Array.isArray(rawOrders) ? rawOrders : [];
      const completedPaidOrders = orders.filter(
        (o: any) => (o.status === 'COMPLETED' || o.status === 'DELIVERED') && (o.paymentStatus === 'PAID' || !o.paymentStatus)
      );
      const totalRevenue = completedPaidOrders.reduce(
        (sum: number, o: any) => sum + (o.totalAmount || o.total || 0), 0
      );

      setSummary({
        totalRevenue,
        completedOrders: completedPaidOrders.length,
        pendingPayout:   totalRevenue,
        lastPayoutDate:  null,
        lastPayoutAmount: 0,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load payout data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * requestPayout
   *
   * Initiates a payout request by submitting to /api/payouts/request.
   * Validates that bank details are complete before submitting.
   * Refreshes the summary after a successful request.
   *
   * @returns {void}
   * @validates  Checks that bank account number and IFSC are present.
   * @edge-cases Prevents submission if KYC is incomplete; shows actionable error.
   */
  const requestPayout = async () => {
    if (!bankDetails?.accountNumber || !bankDetails?.ifscCode) {
      toast.error('Please complete your bank details in Profile before requesting a payout.');
      return;
    }
    if (!summary || summary.pendingPayout <= 0) {
      toast.error('No pending payout amount available.');
      return;
    }
    setIsRequesting(true);
    try {
      await api.post('/payouts/request', { amount: summary.pendingPayout });
      toast.success('Payout request submitted. You will receive funds within 2-3 business days.');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit payout request');
    } finally {
      setIsRequesting(false);
    }
  };

  const maskAccount = (acc: string) => {
    if (!acc || acc.length < 4) return '••••';
    return '••••' + acc.slice(-4);
  };

  const isKycComplete = !!(
    bankDetails?.bankName &&
    bankDetails?.accountNumber &&
    bankDetails?.ifscCode &&
    bankDetails?.accountHolderName
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[#3D6EEE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Payout Centre</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Review your earnings and request bank transfers</p>
        </div>
        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-500 hover:text-[#3D6EEE] hover:border-[#3D6EEE] transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── KYC Warning ── */}
      {!isKycComplete && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Bank details incomplete</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Go to <strong>Vendor Profile</strong> and add your bank account number, IFSC code, and account holder name to enable payouts.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: `₹${(summary?.totalRevenue ?? 0).toLocaleString('en-IN')}`,
            icon: IndianRupee,
            color: 'from-emerald-500 to-emerald-600',
          },
          {
            label: 'Completed Orders',
            value: String(summary?.completedOrders ?? 0),
            icon: CheckCircle2,
            color: 'from-[#3D6EEE] to-[#5B8AF5]',
          },
          {
            label: 'Pending Payout',
            value: `₹${(summary?.pendingPayout ?? 0).toLocaleString('en-IN')}`,
            icon: Clock,
            color: 'from-amber-500 to-orange-500',
          },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-neutral-900">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Bank Account Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D6EEE] to-[#5B8AF5] flex items-center justify-center shadow-sm">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-neutral-900 text-base">Bank Account</h2>
            <p className="text-xs text-neutral-400">Payouts are sent to this account</p>
          </div>
          {isKycComplete && (
            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        {isKycComplete ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Account Holder', value: bankDetails!.accountHolderName },
              { label: 'Bank Name',      value: bankDetails!.bankName },
              { label: 'Account Number', value: maskAccount(bankDetails!.accountNumber) },
              { label: 'IFSC Code',      value: bankDetails!.ifscCode },
              bankDetails!.gstNo ? { label: 'GST No.',  value: bankDetails!.gstNo } : null,
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{row.label}</p>
                <p className="text-sm font-bold text-neutral-800">{row.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-neutral-200" />
            <p className="text-sm font-semibold text-neutral-500">No bank account linked</p>
            <p className="text-xs text-neutral-400 mt-1">Add bank details in Vendor Profile to receive payouts</p>
          </div>
        )}
      </motion.div>

      {/* ── Payout History Placeholder ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-neutral-400" />
          <h2 className="font-bold text-neutral-900 text-base">Payout History</h2>
        </div>
        <div className="text-center py-8">
          <Clock className="w-10 h-10 mx-auto mb-3 text-neutral-200" />
          <p className="text-sm font-semibold text-neutral-500">No payouts processed yet</p>
          <p className="text-xs text-neutral-400 mt-1">Your payout history will appear here once processed</p>
        </div>
      </motion.div>

      {/* ── Request Payout CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-[#3D6EEE] to-[#5B8AF5] rounded-2xl p-6 shadow-lg shadow-blue-200/40"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-extrabold text-lg">
              ₹{(summary?.pendingPayout ?? 0).toLocaleString('en-IN')} available
            </h3>
            <p className="text-blue-100 text-sm mt-0.5">Funds typically arrive within 2–3 business days</p>
          </div>
          <button
            onClick={requestPayout}
            disabled={isRequesting || !isKycComplete || (summary?.pendingPayout ?? 0) <= 0}
            className="flex items-center gap-2 px-6 py-3 bg-white text-[#3D6EEE] font-bold rounded-xl text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shadow-md"
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#3D6EEE]/30 border-t-[#3D6EEE] rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IndianRupee className="w-4 h-4" />
                Request Payout
              </>
            )}
          </button>
        </div>
      </motion.div>

    </div>
  );
}
