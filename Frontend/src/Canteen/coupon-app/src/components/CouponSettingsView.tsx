import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, CheckCircle2 } from 'lucide-react';

export interface CouponPreferences {
    codePrefix: string;
    defaultValidityHours: number;
    autoOpenMyOffers: boolean;
    hideExpiredOffers: boolean;
}

export const DEFAULT_COUPON_PREFERENCES: CouponPreferences = {
    codePrefix: 'SGP',
    defaultValidityHours: 24,
    autoOpenMyOffers: true,
    hideExpiredOffers: false,
};

interface CouponSettingsViewProps {
    preferences: CouponPreferences;
    onSave: (preferences: CouponPreferences) => void;
}

function sanitizePrefix(value: string): string {
    return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
}

export const CouponSettingsView: React.FC<CouponSettingsViewProps> = ({ preferences, onSave }) => {
    const [draft, setDraft] = useState<CouponPreferences>(preferences);
    const [saveMessage, setSaveMessage] = useState<string>('');

    useEffect(() => {
        setDraft(preferences);
    }, [preferences]);

    const couponPreview = useMemo(() => {
        const prefix = sanitizePrefix(draft.codePrefix);
        return prefix ? `${prefix}-AB12CD` : 'AB12CD';
    }, [draft.codePrefix]);

    const handleSave = () => {
        const next: CouponPreferences = {
            ...draft,
            codePrefix: sanitizePrefix(draft.codePrefix),
            defaultValidityHours: Math.max(1, Math.min(336, Math.round(draft.defaultValidityHours))),
        };
        onSave(next);
        setSaveMessage('Preferences saved');
        window.setTimeout(() => setSaveMessage(''), 1800);
    };

    const handleReset = () => {
        setDraft(DEFAULT_COUPON_PREFERENCES);
        onSave(DEFAULT_COUPON_PREFERENCES);
        setSaveMessage('Defaults restored');
        window.setTimeout(() => setSaveMessage(''), 1800);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        Coupon Settings
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Configure defaults for new campaigns and streamline your coupon workflow.
                    </p>
                </div>
                {saveMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                    >
                        <CheckCircle2 size={14} />
                        {saveMessage}
                    </motion.div>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Code Prefix</span>
                        <input
                            type="text"
                            value={draft.codePrefix}
                            onChange={(event) =>
                                setDraft((prev) => ({ ...prev, codePrefix: sanitizePrefix(event.target.value) }))
                            }
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-red-500/20"
                            placeholder="SGP"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Preview: <span className="font-semibold text-gray-700">{couponPreview}</span>
                        </p>
                    </label>

                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Default Validity (Hours)
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={336}
                            value={draft.defaultValidityHours}
                            onChange={(event) =>
                                setDraft((prev) => ({
                                    ...prev,
                                    defaultValidityHours: Math.max(1, Number(event.target.value) || 1),
                                }))
                            }
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-red-500/20"
                        />
                    </label>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={draft.autoOpenMyOffers}
                            onChange={(event) =>
                                setDraft((prev) => ({ ...prev, autoOpenMyOffers: event.target.checked }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-[#e23744] focus:ring-red-500"
                        />
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Open "My Offers" after creation</div>
                            <div className="text-xs text-gray-500">Jump straight to offer monitoring after create/activate.</div>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={draft.hideExpiredOffers}
                            onChange={(event) =>
                                setDraft((prev) => ({ ...prev, hideExpiredOffers: event.target.checked }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-[#e23744] focus:ring-red-500"
                        />
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Hide expired in active list</div>
                            <div className="text-xs text-gray-500">Keep the active list focused on currently useful offers.</div>
                        </div>
                    </label>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#e23744] to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
                    >
                        <Save size={15} />
                        Save Settings
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300"
                    >
                        <RotateCcw size={15} />
                        Reset Defaults
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CouponSettingsView;
