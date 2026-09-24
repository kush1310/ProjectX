import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldOff, Copy, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { toast } from '../utils/toast';

/**
 * MFA Setup Page — allows users to enable/disable TOTP two-factor authentication.
 * Shows QR code URI for authenticator app scanning and OTP verification input.
 */
export default function MfaSetupPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUri: string } | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const res = await api.get('/mfa/status');
      setMfaEnabled(res.data.mfaEnabled);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setLoading(true);
      const res = await api.post('/mfa/setup');
      setSetupData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast.error('Enter a 6-digit code');
      return;
    }
    try {
      setVerifying(true);
      await api.post('/mfa/verify', { code });
      toast.success('MFA enabled successfully!');
      setMfaEnabled(true);
      setSetupData(null);
      setCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const disableMfa = async () => {
    if (disableCode.length !== 6) {
      toast.error('Enter your current 6-digit code');
      return;
    }
    try {
      setDisabling(true);
      await api.post('/mfa/disable', { code: disableCode });
      toast.success('MFA disabled');
      setMfaEnabled(false);
      setShowDisable(false);
      setDisableCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid code');
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#e23744]" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${mfaEnabled ? 'bg-emerald-50' : 'bg-neutral-100'}`}>
            {mfaEnabled ? (
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            ) : (
              <Shield className="w-7 h-7 text-neutral-400" />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">Two-Factor Authentication</h1>
            <p className="text-sm text-neutral-500">
              {mfaEnabled ? 'Your account is protected with TOTP' : 'Add an extra layer of security'}
            </p>
          </div>
        </div>

        {/* ── MFA Enabled State ── */}
        {mfaEnabled && !showDisable && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-900">MFA is Active</h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Your account is secured with time-based one-time passwords (TOTP).
                  You'll need your authenticator app to log in.
                </p>
                <button
                  onClick={() => setShowDisable(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  <ShieldOff className="w-4 h-4" />
                  Disable MFA
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Disable MFA Form ── */}
        {showDisable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-neutral-900">Disable Two-Factor Authentication</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Enter your current authenticator code to confirm.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                maxLength={6}
                value={disableCode}
                onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
              />
              <button
                onClick={disableMfa}
                disabled={disabling || disableCode.length !== 6}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {disabling && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
            <button
              onClick={() => { setShowDisable(false); setDisableCode(''); }}
              className="mt-3 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* ── Setup Flow (Not enabled yet) ── */}
        {!mfaEnabled && !setupData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
          >
            <h3 className="font-bold text-neutral-900 mb-2">How it works</h3>
            <ul className="space-y-3 text-sm text-neutral-600 mb-6">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#e23744]/10 text-[#e23744] rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                Install an authenticator app (Google Authenticator, Authy, etc.)
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#e23744]/10 text-[#e23744] rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                Scan the QR code or enter the secret key manually
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#e23744]/10 text-[#e23744] rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                Enter the 6-digit code from your authenticator to verify
              </li>
            </ul>
            <button
              onClick={startSetup}
              className="w-full py-3.5 bg-gradient-to-r from-[#e23744] to-[#ff6b6b] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-rose-200/40 transition-all"
            >
              Set Up MFA
            </button>
          </motion.div>
        )}

        {/* ── QR Code + Secret + Verify ── */}
        {setupData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* QR Code */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm text-center">
              <h3 className="font-bold text-neutral-900 mb-4">Scan with Authenticator App</h3>
              <div className="bg-neutral-50 rounded-xl p-6 inline-block mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUri)}`}
                  alt="MFA QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-xs text-neutral-400">
                Scan this QR code with Google Authenticator, Authy, or any TOTP app
              </p>
            </div>

            {/* Manual Secret */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
              <p className="text-xs text-neutral-500 mb-2 font-medium">Can't scan? Enter this key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-mono tracking-wider border border-neutral-200 break-all">
                  {setupData.secret}
                </code>
                <button
                  onClick={copySecret}
                  className="p-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-neutral-500" />}
                </button>
              </div>
            </div>

            {/* Verify Code */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-neutral-900 mb-1">Verify Setup</h3>
              <p className="text-sm text-neutral-500 mb-4">Enter the 6-digit code from your authenticator app</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && verifyCode()}
                  placeholder="000000"
                  autoFocus
                  className="flex-1 px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#e23744]/20 focus:border-[#e23744]/30"
                />
                <button
                  onClick={verifyCode}
                  disabled={verifying || code.length !== 6}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#e23744] to-[#ff6b6b] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-rose-200/40 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
