/**
 * AnimatedBorder - Lightweight CSS-based animated border
 * 
 * A performant alternative to ElectroBorder that uses CSS animations
 * instead of heavy SVG filters. Supports Rush Hour mode with color changes.
 */

import { PropsWithChildren } from 'react';

export interface AnimatedBorderProps extends PropsWithChildren {
  /** Border color (normal mode) */
  color?: string;
  /** Whether Rush Hour is active */
  rushHour?: boolean;
  /** Border radius */
  radius?: string;
  /** Additional className */
  className?: string;
}

export default function AnimatedBorder({
  children,
  color = '#10b981',
  rushHour = false,
  radius = '1.5rem',
  className = '',
}: AnimatedBorderProps) {
  const borderColor = rushHour ? '#f59e0b' : color;
  const glowColor = rushHour ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)';
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ borderRadius: radius }}
    >
      {/* Animated glow border */}
      <div 
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 20px ${glowColor}, inset 0 0 10px ${glowColor}`,
          animation: rushHour ? 'pulse-border 1.5s ease-in-out infinite' : 'glow-border 3s ease-in-out infinite',
          borderRadius: radius,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10" style={{ borderRadius: radius }}>
        {children}
      </div>
      
      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes glow-border {
          0%, 100% { 
            box-shadow: 0 0 15px ${glowColor}, inset 0 0 5px ${glowColor}; 
            opacity: 0.8;
          }
          50% { 
            box-shadow: 0 0 25px ${glowColor}, inset 0 0 10px ${glowColor}; 
            opacity: 1;
          }
        }
        
        @keyframes pulse-border {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.4), inset 0 0 8px rgba(245, 158, 11, 0.2); 
            border-color: #f59e0b;
          }
          50% { 
            box-shadow: 0 0 35px rgba(245, 158, 11, 0.6), inset 0 0 15px rgba(245, 158, 11, 0.3); 
            border-color: #fbbf24;
          }
        }
      `}</style>
    </div>
  );
}
