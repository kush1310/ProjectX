/**
 * MagicLoader - Dynamic Particle-based Animated Loader
 * 
 * Features:
 * - Canvas-based particle swirl animation
 * - RED color theme
 * - TRANSPARENT background
 * - Smooth, mesmerizing animation
 */

import { useEffect, useRef, useCallback, memo } from 'react';

interface Particle {
  radius: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  accel: number;
  decay: number;
  life: number;
}

interface MagicLoaderProps {
  size?: number;
  particleCount?: number;
  speed?: number;
  className?: string;
}

const MagicLoader: React.FC<MagicLoaderProps> = memo(({
  size = 180,
  particleCount = 2,
  speed = 1,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const tickRef = useRef(0);
  const globalAngleRef = useRef(0);
  const globalRotationRef = useRef(0);
  const isInitializedRef = useRef(false);

  const createParticle = useCallback((centerX: number, centerY: number, tick: number, minSize: number): Particle => {
    return {
      radius: 9,
      x: centerX + Math.cos(tick / 18) * minSize / 2,
      y: centerY + Math.sin(tick / 18) * minSize / 2,
      angle: globalRotationRef.current + globalAngleRef.current,
      speed: 0,
      accel: 0.012,
      decay: 0.007,
      life: 1
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isInitializedRef.current = true;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const minSize = size * 0.65;

    const stepParticle = (particle: Particle, index: number) => {
      particle.speed += particle.accel;
      particle.x += Math.cos(particle.angle) * particle.speed * speed;
      particle.y += Math.sin(particle.angle) * particle.speed * speed;
      particle.angle += Math.PI / 64;
      particle.accel *= 1.008;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        particlesRef.current.splice(index, 1);
      }
    };

    const drawParticle = (particle: Particle, index: number, tick: number) => {
      const hue = 350 + ((tick * 0.5 + particle.life * 100) % 30);
      const saturation = 85 + particle.life * 15;
      const lightness = 55 + particle.life * 15;
      
      ctx.fillStyle = ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${particle.life * 0.85})`;
      ctx.lineWidth = 2.5;
      
      if (particlesRef.current[index - 1]) {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particlesRef.current[index - 1].x, particlesRef.current[index - 1].y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0.5, particle.life * particle.radius), 0, Math.PI * 2);
      ctx.fill();

      if (Math.random() > 0.65) {
        const sparkleSize = Math.random() * 2.5 + 0.5;
        const sparkleX = particle.x + ((Math.random() - 0.5) * 45) * particle.life;
        const sparkleY = particle.y + ((Math.random() - 0.5) * 45) * particle.life;
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${particle.life * 0.6})`;
        ctx.fillRect(Math.floor(sparkleX), Math.floor(sparkleY), sparkleSize, sparkleSize);
      }
    };

    const animate = () => {
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(createParticle(centerX, centerY, tickRef.current, minSize));
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        stepParticle(particlesRef.current[i], i);
      }

      // TRANSPARENT clear - no white background
      ctx.clearRect(0, 0, size, size);

      particlesRef.current.forEach((particle, index) => {
        drawParticle(particle, index, tickRef.current);
      });

      globalRotationRef.current += Math.PI / 7 * speed;
      globalAngleRef.current += Math.PI / 7 * speed;
      tickRef.current++;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      isInitializedRef.current = false;
    };
  }, [size, particleCount, speed, createParticle]);

  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
      />
    </div>
  );
});

MagicLoader.displayName = 'MagicLoader';

export default MagicLoader;
