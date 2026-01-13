import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";


// Customized for CharusatNeeds Order Timeline
export interface TimelineEvent {
  id?: string;
  year: string; // Used as Time/Status
  title: string;
  subtitle?: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface ScrollTimelineProps {
  events: TimelineEvent[];
  title?: string;
  subtitle?: string;
  animationOrder?: "sequential" | "staggered" | "simultaneous";
  cardAlignment?: "alternating" | "left" | "right";
  lineColor?: string;
  activeColor?: string;
  progressIndicator?: boolean;
  cardVariant?: "default" | "elevated" | "outlined" | "filled";
  cardEffect?: "none" | "glow" | "shadow" | "bounce";
  parallaxIntensity?: number;
  progressLineWidth?: number;
  progressLineCap?: "round" | "square";
  dateFormat?: "text" | "badge";
  className?: string;
  revealAnimation?: "fade" | "slide" | "scale" | "flip" | "none";
  connectorStyle?: "dots" | "line" | "dashed";
  perspective?: boolean;
  darkMode?: boolean;
  smoothScroll?: boolean;
}

// Simple Card components to replace shadcn/ui dependency
const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}>
    {children}
  </div>
);

const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("p-6 pt-0", className)}>
    {children}
  </div>
);

export const ScrollTimeline = ({
  events,
  className = "",
  darkMode = false,
}: ScrollTimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const progressHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((v) => {
      const newIndex = Math.floor(v * events.length);
      if (
        newIndex !== activeIndex &&
        newIndex >= 0 &&
        newIndex < events.length
      ) {
        setActiveIndex(newIndex);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, events.length, activeIndex]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "relative w-full overflow-hidden py-10",
        darkMode ? "bg-gray-900 text-white" : "bg-transparent text-gray-900",
        className
      )}
    >
        {/* Timeline Line */}
        <div className="absolute left-[20px] top-0 bottom-0 w-[4px] bg-gray-100 rounded-full" />
        
        {/* Progress Line */}
        <motion.div
           className="absolute left-[20px] top-0 w-[4px] bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 rounded-full z-10 box-glow"
           style={{ height: progressHeight, boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
        />
    
        {/* Traveling Comet */}
        <motion.div
            className="absolute left-[20px] z-20"
            style={{ top: progressHeight, x: '-50%', y: '-50%' }}
        >
            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse ring-4 ring-emerald-100" />
        </motion.div>

        <div className="space-y-12 pl-2 pr-4 relative z-20">
            {events.map((event, index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative pl-12"
            >
                {/* Dot on Line */}
                <div 
                    className={cn(
                        "absolute left-[14px] top-6 w-3 h-3 rounded-full border-2 transition-all duration-500 z-30",
                        index <= activeIndex ? "bg-emerald-500 border-emerald-200 scale-125" : "bg-gray-200 border-white"
                    )} 
                />
                
                <Card className="hover:border-emerald-200 transition-colors duration-300">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", event.color || "bg-gray-100 text-gray-600")}>
                                    {event.year}
                                </span>
                             </div>
                             {event.icon && <div className="text-gray-400">{event.icon}</div>}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                    </CardContent>
                </Card>
            </motion.div>
            ))}
        </div>
    </div>
  );
};
