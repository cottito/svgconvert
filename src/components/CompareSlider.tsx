import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface CompareSliderProps {
  original: string;
  svg: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ original, svg }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    
    setSliderPos(Math.max(0, Math.min(100, position)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square bg-[#151619] rounded-xl overflow-hidden cursor-ew-resize select-none border border-white/10"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* SVG Layer (Background) */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-8 bg-white/5"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {/* Original Layer (Foreground with Clip) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img 
          src={original} 
          alt="Original" 
          className="w-full h-full object-contain p-8 opacity-80"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-[#151619]">
          <div className="flex gap-1">
            <div className="w-0.5 h-3 bg-[#151619] rounded-full" />
            <div className="w-0.5 h-3 bg-[#151619] rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 z-20 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] uppercase tracking-widest text-white/70 border border-white/10">
        Original
      </div>
      <div className="absolute bottom-4 right-4 z-20 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] uppercase tracking-widest text-white/70 border border-white/10">
        SVG Vector
      </div>
    </div>
  );
};
