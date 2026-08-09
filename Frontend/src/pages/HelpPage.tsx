/**
 * HelpPage — Vendor Help Centre & Feedback Portal
 *
 * Provides a structured help & support interface for canteen vendors.
 * Includes an FAQ accordion section, a quick contact card, and a
 * feedback submission form that POSTs to /api/feedback.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, MessageSquare, Mail, Phone, BookOpen,
  CheckCircle2, Send, Loader2
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from '@/utils/toast';

interface FaqItem {
  readonly question: string;
  readonly answer:   string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I mark my canteen as Open or Closed?',
    answer:
      'Go to the Order Dashboard and click the "Open" or "Closed" toggle button in the header. The change is instantly visible to all students on the platform.',
  },
  {
    question: 'How do I accept or reject an incoming order?',
    answer:
      'On the Order Dashboard, each incoming order card has an "Accept Order" button. Click it to move the order to Confirmed status. To reject a PENDING order, click the cancel (X) icon on the card.',
  },
  {
    question: 'Why is an order showing as Unpaid even though the student paid?',
    answer:
      'This can happen if the payment confirmation is delayed. Refresh the dashboard after 30 seconds. If the issue persists after 5 minutes, contact support with the order number.',
  },
  {
    question: 'How do I update my canteen menu items?',
    answer:
      'Navigate to Menu Management from the sidebar. You can add, edit, or remove items and toggle item availability in real time. Changes are visible to students immediately.',
  },
  {
    question: 'How are coupons applied to orders?',
    answer:
      'Students apply coupon codes at checkout. The discount is deducted from the total before payment. You can view coupon usage stats in the Coupons section under Vendor Tools.',
  },
  {
    question: 'How do I request a payout for my earnings?',
    answer:
      'Go to Payout Centre from the sidebar. Ensure your bank account details are complete in Vendor Profile, then click "Request Payout". Funds arrive within 2–3 business days.',
  },
  {
    question: 'Can I add variants and add-ons to menu items?',
    answer:
      'Yes. In Menu Management, open any item and scroll to the Variants and Add-ons sections. You can define size variants (Small, Medium, Large) and add-on groups (Extra Cheese, etc.).',
  },
  {
    question: 'How do I view my sales reports?',
    answer:
      'Go to Reports from the sidebar. You will see a 7-day revenue trend, top-selling items, order status breakdown, and peak-hour heatmap — all computed from live order data.',
  },
];

export default function HelpPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [submitted,     setSubmitted]     = useState(false);

  /**
   * submitFeedback
   *
   * Submits the vendor's feedback/bug report to POST /api/feedback.
   * Validates that feedback text is non-empty before sending.
   * Clears the form and shows success state on 2xx response.
   *
   * @returns {void}
   * @validates  feedbackText must not be blank.
   * @edge-cases Network failure shows a toast error; form is not cleared.
   */
  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error('Please enter your feedback before submitting.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/feedback', {
        type:    feedbackType,
        message: feedbackText.trim(),
        source:  'VENDOR_HELP_PAGE',
      });
      setSubmitted(true);
      setFeedbackText('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Help Centre</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Find answers, contact support, or send feedback</p>
      </div>

      {/* ── Quick Contact ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Mail,    label: 'Email Support',  value: 'support@charusat.edu.in', href: 'mailto:support@charusat.edu.in' },
          { icon: Phone,   label: 'Phone Support',  value: '+91 2697 247 500',        href: 'tel:+912697247500'              },
          { icon: BookOpen, label: 'Documentation', value: 'View User Guide',         href: '#'                              },
        ].map(({ icon: Icon, label, value, href }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm hover:border-[#3D6EEE] hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] flex items-center justify-center group-hover:bg-[#3D6EEE] transition-colors flex-shrink-0">
              <Icon className="w-4.5 h-4.5 text-[#3D6EEE] group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-semibold text-neutral-800 truncate">{value}</p>
            </div>
          </a>
        ))}
      </div>

      {/* ── FAQ Accordion ── */}
      <div>
        <h2 className="text-base font-extrabold text-neutral-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((faq, idx) => (
            <motion.div
              key={idx}
              layout
              className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                id={`faq-btn-${idx}`}
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <span className="text-sm font-semibold text-neutral-800">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openFaqIndex === idx ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openFaqIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed border-t border-neutral-50 pt-3">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Feedback Form ── */}
      <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D6EEE] to-[#5B8AF5] flex items-center justify-center shadow-sm">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-neutral-900 text-base">Send Feedback</h2>
            <p className="text-xs text-neutral-400">Report bugs, request features, or share suggestions</p>
          </div>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <p className="text-base font-bold text-neutral-900">Thank you for your feedback!</p>
            <p className="text-sm text-neutral-500 mt-1">Our team will review it shortly.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-sm font-semibold text-[#3D6EEE] hover:underline"
            >
              Send another
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Feedback Type Selection */}
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Feedback Type</p>
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: 'bug',     label: 'Bug Report'   },
                  { key: 'feature', label: 'Feature Request' },
                  { key: 'general', label: 'General Feedback' },
                ] as const).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setFeedbackType(opt.key)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      feedbackType === opt.key
                        ? 'bg-[#3D6EEE] border-[#3D6EEE] text-white shadow-sm'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-[#3D6EEE]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Message</p>
              <textarea
                id="feedback-message"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Describe the issue or idea in detail..."
                rows={5}
                maxLength={2000}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium text-neutral-800 placeholder:text-neutral-400 outline-none resize-none focus:border-[#3D6EEE] focus:ring-2 focus:ring-[#3D6EEE]/10 transition-all"
              />
              <p className="text-[10px] text-neutral-400 mt-1 text-right">{feedbackText.length}/2000</p>
            </div>

            {/* Submit */}
            <button
              id="feedback-submit-btn"
              onClick={submitFeedback}
              disabled={isSubmitting || !feedbackText.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-[#3D6EEE] text-white font-bold rounded-xl text-sm hover:bg-[#3560D4] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200/40"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Feedback</>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
