import React from 'react';

interface NoiseBackgroundProps {
  children: React.ReactNode;
  containerClassName?: string;
  gradientColors?: string[];
  opacity?: number;
}

export const NoiseBackground: React.FC<NoiseBackgroundProps> = ({
  children,
  containerClassName,
  gradientColors = ["rgb(255, 100, 150)", "rgb(100, 150, 255)", "rgb(255, 200, 100)"],
  opacity = 0.5
}) => {
  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Noise Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${opacity}'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Gradient Blobs */}
      <div className="absolute inset-0 z-0 opacity-50 blur-3xl">
         <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent to-transparent" style={{ backgroundColor: gradientColors[0] }} />
         <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l from-transparent to-transparent" style={{ backgroundColor: gradientColors[1] }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
