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
            case 'danger': return <AlertTriangle size={32} color="var(--danger)" />;
            case 'warning': return <AlertTriangle size={32} color="#f59e0b" />;
            case 'info': return <CheckCircle size={32} color="var(--accent-blue)" />;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: 'var(--bg-card)',
                padding: '30px',
                borderRadius: '24px',
                width: '90%',
                maxWidth: '400px',
                border: 'var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                animation: 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <div style={{ marginBottom: '16px', display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'var(--table-header-bg)' }}>
                    {getIcon()}
                </div>

                <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{message}</p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid var(--text-secondary)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            background: type === 'danger' ? 'var(--danger)' : 'var(--text-primary)',
                            color: type === 'danger' ? 'white' : 'var(--bg-dark)',
                            cursor: 'pointer',
                            fontWeight: 700
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
