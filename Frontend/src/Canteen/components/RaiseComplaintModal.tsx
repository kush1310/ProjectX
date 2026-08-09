/**
 * RaiseComplaintModal
 *
 * Slide-in modal for raising a complaint against a specific completed order.
 * Sends POST /api/complaints, receives a reference ID, and shows a success state.
 * An email is sent to both the customer and vendor by the backend asynchronously.
 *
 * @param isOpen      {boolean}    - Controls modal visibility.
 * @param onClose     {function}   - Callback to close the modal.
 * @param orderId     {number}     - The order this complaint is tied to.
 * @param canteenId   {number}     - The canteen this complaint targets.
 * @param orderNumber {string}     - Human-readable order number shown in UI.
 * @param canteenName {string}     - Canteen name shown in UI header.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import api from '@/utils/api';
import { toast } from '@/utils/toast';

interface RaiseComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  canteenId: number;
  orderNumber: string;
  canteenName: string;
}

const SUBJECT_PRESETS = [
  'Wrong item delivered',
  'Missing items in order',
  'Poor food quality',
  'Late delivery',
  'Payment issue',
  'Unhygienic food',
  'Rude behaviour',
  'Other',
];

export default function RaiseComplaintModal({
  isOpen, onClose, orderId, canteenId, orderNumber, canteenName,
}: RaiseComplaintModalProps) {
  const [subject, setSubject]         = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const effectiveSubject = subject === 'Other' ? customSubject : subject;

  const handleClose = () => {
    setSubject('');
    setCustomSubject('');
    setDescription('');
    setReferenceId(null);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!subject) { toast.error('Please select a subject'); return; }
    if (subject === 'Other' && !customSubject.trim()) { toast.error('Please describe the subject'); return; }
    if (!description.trim()) { toast.error('Please describe your complaint'); return; }
    if (description.trim().length < 20) { toast.error('Please provide at least 20 characters of detail'); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/complaints', {
        orderId,
        canteenId,
        subject:     effectiveSubject,
        description: description.trim(),
      });
      setReferenceId(res.data.referenceId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Panel Container */}
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="pointer-events-auto w-full md:w-[480px] md:rounded-2xl bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
            {/* Header */}
            <div className="flex items-start gap-3 px-5 py-4 border-b border-neutral-100">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-neutral-900">Raise a Complaint</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                  {canteenName} · Order #{orderNumber}
                </p>
              </div>
              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {referenceId ? (
                /* Success state */
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-1">Complaint Submitted</h3>
                  <p className="text-xs text-neutral-500 mb-4">
                    Your complaint has been registered. The canteen will respond within 24–48 hours.
                    You'll receive email updates at every status change.
                  </p>
                  <div className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Reference ID</p>
                    <p className="text-lg font-extrabold text-[#e23744] tracking-wide">{referenceId}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Save this ID to track your complaint status</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Subject selector */}
                  <div>
                    <label className="text-xs font-bold text-neutral-600 block mb-1.5">
                      What went wrong? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                          subject ? 'border-neutral-200 text-neutral-900' : 'border-neutral-100 text-neutral-400'
                        } bg-neutral-50 hover:border-neutral-200`}
                      >
                        {subject || 'Select complaint type'}
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-100 rounded-xl shadow-xl z-20 overflow-hidden">
                          {SUBJECT_PRESETS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => { setSubject(opt); setDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                subject === opt ? 'bg-rose-50 text-[#e23744] font-bold' : 'text-neutral-700 hover:bg-neutral-50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {subject === 'Other' && (
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Briefly describe the issue..."
                        maxLength={100}
                        className="mt-2 w-full px-3.5 py-2.5 rounded-xl border-2 border-neutral-100 text-sm focus:outline-none focus:border-[#e23744]/40 bg-neutral-50"
                      />
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-neutral-600 block mb-1.5">
                      Describe your complaint <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={1000}
                      placeholder="Please provide specific details about what happened. Include time, item names, and any other relevant information..."
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-neutral-100 text-sm resize-none focus:outline-none focus:border-[#e23744]/40 bg-neutral-50 placeholder:text-neutral-300"
                    />
                    <p className="text-[10px] text-neutral-300 text-right mt-0.5">{description.length}/1000</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      A confirmation email with your reference ID will be sent to your registered email address.
                      The canteen vendor will also be notified immediately.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!referenceId && (
              <div className="px-5 py-4 border-t border-neutral-100 flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !subject || !description.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#e23744] text-white text-sm font-bold hover:bg-[#d62f3f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </>
      )}
    </AnimatePresence>
  );
}
