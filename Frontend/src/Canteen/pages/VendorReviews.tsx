/**
 * VendorReviews
 *
 * Displays all customer reviews for the vendor's canteen fetched live from the
 * backend API. Supports vendor reply inline, star filter, and date/rating sort.
 * Nothing is stored locally -- all state derives from database-fetched data.
 */

import { useEffect, useState, useCallback } from 'react';
import { Star, MessageSquare, ThumbsUp, Clock, Filter, ChevronDown } from 'lucide-react';
import { toast } from '@/utils/toast';
import api from '@/utils/api';
import { useOnDemandData } from '@/hooks/useOnDemandData';

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function VendorReviews() {
  const { data: rawReviews, loading, refetch } = useOnDemandData<any[]>({
    key: 'vendor_reviews',
    url: '/reviews/vendor',
  });

  const reviews = Array.isArray(rawReviews) ? rawReviews : (rawReviews as any)?.content || [];

  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [sortOpen, setSortOpen] = useState(false);

  const submitReply = async (id: number) => {
    const text = (replyText[id] || '').trim();
    if (!text) { toast.error('Reply cannot be empty'); return; }
    setSubmitting(true);
    try {
      await api.put(`/reviews/${id}/vendor-reply`, { vendorReply: text });
      toast.success('Reply posted');
      setReplyingTo(null);
      setReplyText((p) => ({ ...p, [id]: '' }));
      refetch();
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const avg = reviews.length
    ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const list = [...reviews]
    .filter((r: any) => ratingFilter === 'all' || r.rating === ratingFilter)
    .sort((a: any, b: any) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'highest') return b.rating - a.rating;
      return a.rating - b.rating;
    });

  const sortLabels: Record<string, string> = {
    newest: 'Newest First',
    oldest: 'Oldest First',
    highest: 'Highest Rated',
    lowest: 'Lowest Rated',
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Reviews</h1>
        <p className="text-gray-500 mt-1 text-sm">All reviews fetched live from the database. Reply to build customer trust.</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold text-gray-900">{avg}</span>
          <StarRow value={parseFloat(avg)} />
          <span className="text-xs text-gray-400 mt-2">{reviews.length} total reviews</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:col-span-2">
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Rating Breakdown</p>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r: any) => r.rating === star).length;
            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-gray-700 w-4">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        {(['all', 5, 4, 3, 2, 1] as const).map((v) => (
          <button
            key={String(v)}
            onClick={() => setRatingFilter(v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
              ratingFilter === v
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
            }`}
          >
            {v === 'all' ? 'All Stars' : `${v} Star`}
          </button>
        ))}

        {/* Sort */}
        <div className="relative ml-auto">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {sortLabels[sortBy]}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[100]">
                {(Object.entries(sortLabels) as [typeof sortBy, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                      sortBy === key ? 'text-[#e23744] bg-rose-50' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#e23744] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm font-medium">Loading reviews...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
          <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No reviews yet</h3>
          <p className="text-gray-400 text-sm mt-1">Customer reviews will appear here after orders are placed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-[#e23744] font-bold text-sm shrink-0">
                  {review.isAnonymous ? '?' : (review.customerName?.[0] || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">
                      {review.isAnonymous ? 'Anonymous' : review.customerName}
                    </span>
                    {review.orderNumber && <span className="text-xs text-gray-400">#{review.orderNumber}</span>}
                    <span className="text-xs text-gray-300 ml-auto">
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : ''}
                    </span>
                  </div>
                  <StarRow value={review.rating} />
                  {review.comment && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>}

                  {review.vendorReply && (
                    <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-bold text-[#e23744] mb-1">Your Reply</p>
                      <p className="text-sm text-gray-700">{review.vendorReply}</p>
                    </div>
                  )}

                  {replyingTo === review.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={3}
                        value={replyText[review.id] || ''}
                        onChange={(e) => setReplyText((p) => ({ ...p, [review.id]: e.target.value }))}
                        placeholder="Write a professional reply..."
                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#e23744]/20 focus:border-[#e23744]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitReply(review.id)}
                          disabled={submitting}
                          className="px-4 py-2 bg-[#e23744] text-white rounded-xl text-xs font-bold hover:bg-[#d62f3f] transition-colors disabled:opacity-50"
                        >
                          {submitting ? 'Posting...' : 'Post Reply'}
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
                    !review.vendorReply && (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#e23744] transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Reply to this review
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}