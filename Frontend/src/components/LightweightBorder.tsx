/**
 * LightweightBorder Component
 * 
 * A CSS-based animated border effect that's mobile-friendly.
 * Replaces ElectroBorder SVG for better scroll performance on mobile.
 * Uses CSS gradients and animations instead of SVG filters.
 */

import { ReactNode } from 'react';

interface LightweightBorderProps {
  children: ReactNode;
  borderColor?: string;
  glowColor?: string;
  radius?: string;
  className?: string;
  animated?: boolean;
}

export default function LightweightBorder({
  children,
  borderColor = '#ef4444',
  glowColor,
  radius = '1.5rem',
  className = '',
  animated = true
}: LightweightBorderProps) {
  const glow = glowColor || borderColor;
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ borderRadius: radius }}
    >
      {/* Animated glow background */}
      <div 
        className={`absolute inset-0 ${animated ? 'animate-pulse' : ''}`}
        style={{
          borderRadius: radius,
          background: `linear-gradient(135deg, ${borderColor}20, ${borderColor}40, ${borderColor}20)`,
          boxShadow: `0 0 20px ${glow}30, 0 0 40px ${glow}15`,
          transform: 'scale(1.01)',
          zIndex: 0
        }}
      />
      
      {/* Border gradient */}
      <div 
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          padding: '2.5px',
          background: `linear-gradient(135deg, ${borderColor}, ${borderColor}80, ${borderColor})`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          zIndex: 1
        }}
      />
      
      {/* Rotating gradient shimmer */}
      {animated && (
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: radius, zIndex: 2 }}
        >
          <div 
            className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${borderColor}60, transparent, transparent)`,
              animation: 'spin 4s linear infinite',
              opacity: 0.5
            }}
          />
        </div>
      )}
      
      {/* Content */}
      <div className="relative" style={{ borderRadius: radius, zIndex: 10 }}>
        {children}
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
