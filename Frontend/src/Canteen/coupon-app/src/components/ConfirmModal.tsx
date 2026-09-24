import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, type, title, message, onConfirm, onCancel
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={24} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={24} className="text-amber-500" />;
            case 'info': return <CheckCircle size={24} className="text-emerald-500" />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'danger': return 'linear-gradient(145deg, #fff5f5, #ffe0e0)';
            case 'warning': return 'linear-gradient(145deg, #fffbeb, #fef3c7)';
            case 'info': return 'linear-gradient(145deg, #ecfdf5, #d1fae5)';
        }
    };

    const getConfirmColor = () => {
        switch (type) {
            case 'danger': return 'text-red-500 hover:text-red-700';
            case 'warning': return 'text-amber-600 hover:text-amber-800';
            case 'info': return 'text-emerald-600 hover:text-emerald-800';
        }
    };

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
            onClick={onCancel}
        >
            {/* Glassmorphic backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />

            {/* Neumorphic glass card */}
            <div
                className="relative w-full max-w-xs overflow-hidden text-center"
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'blur(24px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: `
                        0 8px 32px rgba(0, 0, 0, 0.08),
                        0 1px 3px rgba(0, 0, 0, 0.04),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.02)
                    `,
                    animation: 'pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <div className="p-6">
                    {/* Neumorphic icon */}
                    <div
                        className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                            background: getIconBg(),
                            boxShadow: `
                                3px 3px 8px rgba(0, 0, 0, 0.04),
                                -3px -3px 8px rgba(255, 255, 255, 0.9),
                                inset 0 1px 0 rgba(255, 255, 255, 0.6)
                            `,
                        }}
                    >
                        {getIcon()}
                    </div>

                    <h3 className="text-base font-extrabold text-neutral-900 mb-1.5">{title}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">{message}</p>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-100/80" />

                {/* Text link actions */}
                <div className="flex divide-x divide-neutral-100/80">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 hover:bg-white/60 transition-all active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3.5 text-sm font-bold ${getConfirmColor()} hover:bg-white/60 transition-all active:scale-[0.98]`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
