/**
 * InteractiveGradient Component
 * 
 * Premium mouse-following gradient glow card
 * For CharusatNeeds Canteen Dashboard
 */

import React, { useEffect, useRef, useState } from 'react';

interface GradientCardProps {
  color?: string;
  glowColor?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  children?: React.ReactNode;
  followMouse?: boolean;
  hoverOnly?: boolean;
  intensity?: number;
  backgroundColor?: string;
}

export default function InteractiveGradient({
  color = '#10b981',
  glowColor = 'rgba(16, 185, 129, 0.15)',
  width = '',
  height = '',
  borderRadius = '1rem',
  className = '',
  children,
  followMouse = true,
  hoverOnly = true,
  intensity = 60,
  backgroundColor,
}: GradientCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [resolvedBgColor, setResolvedBgColor] = useState('#ffffff');

  // Detect dark mode for fallback
  useEffect(() => {
    if (!backgroundColor || (!backgroundColor.startsWith('#') && !backgroundColor.startsWith('rgb'))) {
      const html = document.documentElement;
      const updateColor = () => {
        const isDark = html.classList.contains('dark');
        setResolvedBgColor(isDark ? '#1a1a1a' : '#ffffff');
      };

      updateColor();
      const observer = new MutationObserver(updateColor);
      observer.observe(html, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    } else {
      setResolvedBgColor(backgroundColor);
    }
  }, [backgroundColor]);

  const normalizedIntensity = Math.max(0, Math.min(100, intensity)) / 100;

  useEffect(() => {
    if (!followMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current || (hoverOnly && !isHovering)) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [followMouse, hoverOnly, isHovering]);

  const getBackgroundStyle = (): React.CSSProperties => {
    if (!followMouse || (hoverOnly && !isHovering)) {
      return {
        background: `radial-gradient(circle at center, ${glowColor} 0%, ${resolvedBgColor} ${45 * normalizedIntensity}%, ${resolvedBgColor} 100%)`,
      };
    }

    return {
      background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${glowColor} 0%, ${resolvedBgColor} ${45 * normalizedIntensity}%, ${resolvedBgColor} 100%)`,
    };
  };

  const getBorderStyle = (): React.CSSProperties => {
    return {
      '--gradient-border': `linear-gradient(135deg, ${resolvedBgColor}, ${resolvedBgColor}, ${color})`,
    } as React.CSSProperties;
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative
        border border-gray-100/50
        transition-all duration-500 ease-out
        hover:border-emerald-200/80
        hover:shadow-2xl hover:shadow-emerald-500/10
        interactive-gradient-card
        ${className}
      `}
      style={{
        ...getBackgroundStyle(),
        ...getBorderStyle(),
        width,
        height,
        borderRadius,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Gradient border effect */}
      <style>
        {`
          .interactive-gradient-card {
            position: relative;
            overflow: hidden;
          }
          .interactive-gradient-card::before {
            position: absolute;
            content: "";
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: ${borderRadius};
            z-index: -1;
            opacity: 0;
            transition: opacity 0.5s ease;
            border: 1.5px solid transparent;
            background: var(--gradient-border) border-box;
            -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
          }
          .interactive-gradient-card:hover::before {
            opacity: 1;
          }
        `}
      </style>
      {children}
    </div>
  );
}
