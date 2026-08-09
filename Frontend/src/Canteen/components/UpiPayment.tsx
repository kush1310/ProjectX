/**
 * UpiPayment — UPI-specific payment UI.
 * 
 * Features:
 * - VPA input with real-time regex validation
 * - Green tick / red X inline feedback
 * - "Verify UPI ID" button → calls backend
 * - UPI app shortcut buttons (mobile only)
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Smartphone } from 'lucide-react';
import { validateVpa } from '../utils/razorpayService';

const VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

// Recognizable UPI app brand icons as inline SVGs (no external CDN dependency)
const UPI_APPS = [
  {
    name: 'GPay',
    prefix: 'tez://upi/pay',
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="68%" textAnchor="middle" fontSize="26" fontWeight="700" fontFamily="Arial,sans-serif" fill="#4285F4">G</text>
      </svg>
    ),
  },
  {
    name: 'PhonePe',
    prefix: 'phonepe://pay',
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="68%" textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="Arial,sans-serif" fill="#5f259f">Pe</text>
      </svg>
    ),
  },
  {
    name: 'Paytm',
    prefix: 'paytmmp://pay',
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="68%" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="Arial,sans-serif" fill="#00BAF2">Pay</text>
      </svg>
    ),
  },
];

export default function UpiPayment() {
  const [vpa, setVpa] = useState('');
  const [vpaValid, setVpaValid] = useState<boolean | null>(null);
  const [vpaName, setVpaName] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const handleVpaChange = useCallback((value: string) => {
    setVpa(value);
    setVpaName(null);

    if (value.length === 0) {
      setVpaValid(null);
      return;
    }

    setVpaValid(VPA_REGEX.test(value));
  }, []);

  const handleVerifyVpa = async () => {
    if (!vpaValid) return;

    setIsVerifying(true);
    try {
      const result = await validateVpa(vpa);
      if (result.valid) {
        setVpaName(result.name);
        setVpaValid(true);
      } else {
        setVpaValid(false);
        setVpaName(null);
      }
    } catch {
      setVpaValid(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* UPI VPA Input */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Enter UPI ID
        </label>
        <div className="relative">
          <input
            type="text"
            value={vpa}
            onChange={(e) => handleVpaChange(e.target.value)}
            placeholder="yourname@upi"
            className={`w-full px-4 py-3 pr-20 rounded-xl border-2 text-sm transition-all focus:outline-none ${
              vpaValid === null
                ? 'border-slate-200 focus:border-[#e23744]'
                : vpaValid
                  ? 'border-green-400 bg-green-50/50 focus:border-green-500'
                  : 'border-red-400 bg-red-50/50 focus:border-red-500'
            }`}
          />

          {/* Inline validation indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <AnimatePresence mode="wait">
              {vpa.length > 0 && vpaValid !== null && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  {vpaValid ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <motion.div
                      animate={{ x: [0, -4, 4, -2, 2, 0] }}
                      transition={{ duration: 0.4 }}
                      className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Verified name */}
        <AnimatePresence>
          {vpaName && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-green-600 mt-1.5 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Verified: {vpaName}
            </motion.p>
          )}
        </AnimatePresence>

        {vpa.length > 0 && !vpaValid && vpaValid !== null && (
          <p className="text-xs text-red-500 mt-1">
            Invalid UPI ID format. Example: yourname@okaxis
          </p>
        )}
      </div>

      {/* Verify Button */}
      {vpaValid && !vpaName && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleVerifyVpa}
          disabled={isVerifying}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium
                     transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify UPI ID'
          )}
        </motion.button>
      )}

      {/* UPI App Shortcuts (mobile only) */}
      {isMobile && (
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Or pay with UPI app
          </p>
          <div className="flex gap-2">
            {UPI_APPS.map((app) => (
              <motion.button
                key={app.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-center
                           border border-slate-200 transition-colors flex flex-col items-center gap-1"
              >
                {app.icon}
                <p className="text-xs text-slate-600">{app.name}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
        <Smartphone className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          After clicking "Pay", the Razorpay checkout will open. You can complete payment using any UPI app,
          scan QR code, or enter your UPI ID directly.
        </p>
      </div>
    </div>
  );
}
