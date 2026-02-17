/**
 * ElectroBorder - Premium Electric Border Effect
 * 
 * A Tailwind CSS-based animated border with electric pulse effects.
 * Mimics the original SVG ElectroBorder with better performance.
 */

import { ReactNode } from 'react';

interface ElectroBorderProps {
  children: ReactNode;
  color?: 'red' | 'green' | 'blue' | 'emerald' | 'orange';
  radius?: string;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'high';
  animated?: boolean;
}

// Color configurations
const colorConfigs = {
  red: {
    primary: '#ef4444',
    secondary: '#dc2626',
    glow: 'rgba(239, 68, 68, 0.4)',
    glowStrong: 'rgba(239, 68, 68, 0.6)',
  },
  green: {
    primary: '#22c55e',
    secondary: '#16a34a',
    glow: 'rgba(34, 197, 94, 0.4)',
    glowStrong: 'rgba(34, 197, 94, 0.6)',
  },
  emerald: {
    primary: '#10b981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.4)',
    glowStrong: 'rgba(16, 185, 129, 0.6)',
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.4)',
    glowStrong: 'rgba(59, 130, 246, 0.6)',
  },
  orange: {
    primary: '#f97316',
    secondary: '#ea580c',
    glow: 'rgba(249, 115, 22, 0.4)',
    glowStrong: 'rgba(249, 115, 22, 0.6)',
  },
};

export default function ElectroBorder({
  children,
  color = 'emerald',
  radius = '1.5rem',
  className = '',
  intensity = 'medium',
  animated = true
}: ElectroBorderProps) {
  const config = colorConfigs[color];

  const glowIntensity = {
    subtle: { blur: 15, spread: 5 },
    medium: { blur: 25, spread: 10 },
    high: { blur: 40, spread: 15 },
  };

  const { blur, spread } = glowIntensity[intensity];

  return (
    <div className={`relative ${className}`} style={{ borderRadius: radius }}>
      {/* Outer glow layer */}
      <div
        className={`absolute inset-0 pointer-events-none ${animated ? 'electro-pulse' : ''}`}
        style={{
          borderRadius: radius,
          boxShadow: `
            0 0 ${blur}px ${spread}px ${config.glow},
            inset 0 0 ${blur / 2}px ${config.glow}
          `,
          transform: 'scale(1.02)',
          zIndex: 0,
        }}
      />

      {/* Electric border gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          padding: '2px',
          background: `linear-gradient(135deg, ${config.primary}, ${config.secondary}, ${config.primary})`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          zIndex: 1,
        }}
      />

      {/* Rotating energy field */}
      {animated && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ borderRadius: radius, zIndex: 2 }}
        >
          <div
            className="absolute w-[300%] h-[300%] -top-full -left-full electro-spin"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0deg,
                ${config.glowStrong} 30deg,
                transparent 60deg,
                transparent 120deg,
                ${config.glow} 150deg,
                transparent 180deg,
                transparent 240deg,
                ${config.glowStrong} 270deg,
                transparent 300deg,
                transparent 360deg
              )`,
              opacity: 0.7,
            }}
          />
        </div>
      )}

      {/* Corner energy accents */}
      {animated && (
        <>
          <div
            className="absolute w-8 h-8 -top-1 -left-1 electro-flicker pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${config.glowStrong} 0%, transparent 70%)`,
              zIndex: 3,
            }}
          />
          <div
            className="absolute w-8 h-8 -bottom-1 -right-1 electro-flicker pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${config.glowStrong} 0%, transparent 70%)`,
              animationDelay: '0.5s',
              zIndex: 3,
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative" style={{ borderRadius: radius, zIndex: 10 }}>
        {children}
      </div>

      <style>{`
        @keyframes electro-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes electro-pulse {
          0%, 100% { 
            opacity: 0.8;
            transform: scale(1.02);
          }
          50% { 
            opacity: 1;
            transform: scale(1.025);
          }
        }
        
        @keyframes electro-flicker {
          0%, 100% { opacity: 0.3; }
          25% { opacity: 0.8; }
          50% { opacity: 0.4; }
          75% { opacity: 0.9; }
        }
        
        .electro-spin {
          animation: electro-spin 6s linear infinite;
        }
        
        .electro-pulse {
          animation: electro-pulse 2s ease-in-out infinite;
        }
        
        .electro-flicker {
          animation: electro-flicker 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
