/**
 * VendorComplaints
 *
 * Displays all customer complaints for the vendor's canteen, fetched live from
 * the backend API. Supports responding to complaints and updating status
 * (OPEN → IN_PROGRESS → RESOLVED). No data is stored locally.
 */

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/utils/toast';
import api from '@/utils/api';
import { useOnDemandData } from '@/hooks/useOnDemandData';

type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

interface Complaint {
  id: number;
  subject?: string;
  description?: string;
  customerName?: string;
  orderNumber?: string;
  status: ComplaintStatus;
  createdAt?: string;
  vendorReply?: string;
}

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; icon: typeof AlertCircle }> = {
  OPEN:        { label: 'Open',        color: 'bg-red-50 text-red-600',    icon: AlertCircle  },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-50 text-amber-600', icon: Clock        },
  RESOLVED:    { label: 'Resolved',    color: 'bg-green-50 text-green-600', icon: CheckCircle  },
};

export default function VendorComplaints() {
  const { data: rawComplaints, loading, refetch } = useOnDemandData<any[]>({
    key: 'vendor_complaints',
    url: '/complaints/vendor',
  });

  const complaints: Complaint[] = Array.isArray(rawComplaints) ? rawComplaints : (rawComplaints as any)?.content || [];

  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');

  const updateStatus = async (id: number, status: ComplaintStatus) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      toast.success('Status updated');
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const submitReply = async (id: number) => {
    const text = (replyText[id] || '').trim();
    if (!text) { toast.error('Reply cannot be empty'); return; }
    setSubmitting(true);
    try {
      await api.put(`/complaints/${id}/reply`, { reply: text });
      toast.success('Response sent');
      setReplyingTo(null);
      setReplyText((p) => ({ ...p, [id]: '' }));
      refetch();
    } catch {
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = complaints.filter((c) => statusFilter === 'all' || c.status === statusFilter);

  const counts = {
    OPEN:        complaints.filter((c) => c.status === 'OPEN').length,
    IN_PROGRESS: complaints.filter((c) => c.status === 'IN_PROGRESS').length,
    RESOLVED:    complaints.filter((c) => c.status === 'RESOLVED').length,
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Complaints</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage and resolve customer complaints. All data fetched live from the database.</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(Object.entries(counts) as [ComplaintStatus, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div key={status} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{count}</p>
                <p className="text-xs text-gray-400 font-medium">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setStatusFilter(v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
              statusFilter === v
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
            }`}
          >
            {v === 'all' ? 'All' : STATUS_CONFIG[v].label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#e23744] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm font-medium">Loading complaints...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No complaints</h3>
          <p className="text-gray-400 text-sm mt-1">Customer complaints will appear here when raised.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.OPEN;
            const Icon = cfg.icon;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{c.subject || 'Complaint'}</span>
                      <span className="text-xs text-gray-300 ml-auto">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      From: <span className="font-semibold text-gray-700">{c.customerName || 'Customer'}</span>
                      {c.orderNumber && ` | Order #${c.orderNumber}`}
                    </p>
                    {c.description && <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>}

                    {c.vendorReply && (
                      <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-[#e23744] mb-1">Your Response</p>
                        <p className="text-sm text-gray-700">{c.vendorReply}</p>
                      </div>
                    )}

                    {replyingTo === c.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          rows={3}
                          value={replyText[c.id] || ''}
                          onChange={(e) => setReplyText((p) => ({ ...p, [c.id]: e.target.value }))}
                          placeholder="Write your response to the customer..."
                          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#e23744]/20 focus:border-[#e23744]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitReply(c.id)}
                            disabled={submitting}
                            className="px-4 py-2 bg-[#e23744] text-white rounded-xl text-xs font-bold hover:bg-[#d62f3f] transition-colors disabled:opacity-50"
                          >
                            {submitting ? 'Sending...' : 'Send Response'}
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {c.status !== 'RESOLVED' && (
                          <button
                            onClick={() => setReplyingTo(c.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#e23744] transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Respond
                          </button>
                        )}
                        {c.status === 'OPEN' && (
                          <button
                            onClick={() => updateStatus(c.id, 'IN_PROGRESS')}
                            className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-700 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Mark In Progress
                          </button>
                        )}
                        {c.status !== 'RESOLVED' && (
                          <button
                            onClick={() => updateStatus(c.id, 'RESOLVED')}
                            className="flex items-center gap-1.5 text-xs font-bold text-green-500 hover:text-green-700 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}