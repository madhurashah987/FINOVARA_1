import React from 'react';
import { cn } from '@/lib/utils';

interface AppIconProps {
  className?: string;
  size?: number;
}

export function AppIcon({ className, size = 40 }: AppIconProps) {
  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-br from-black to-[#0a192f] flex items-center justify-center shadow-2xl",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_70%)]" />
      
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/4 h-3/4 relative z-10"
      >
        <defs>
          <linearGradient id="arrowGradient" x1="50" y1="80" x2="50" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Neural Network Lines */}
        <path d="M50 80 L30 60 M50 80 L70 60 M30 60 L50 40 M70 60 L50 40 M50 40 L50 20" stroke="url(#arrowGradient)" strokeWidth="1.5" strokeOpacity="0.4" />
        
        {/* Nodes */}
        <circle cx="50" cy="80" r="3" fill="#3b82f6" filter="url(#glow)" />
        <circle cx="30" cy="60" r="2.5" fill="#3b82f6" filter="url(#glow)" />
        <circle cx="70" cy="60" r="2.5" fill="#3b82f6" filter="url(#glow)" />
        <circle cx="50" cy="40" r="3.5" fill="#8b5cf6" filter="url(#glow)" />
        <circle cx="50" cy="20" r="4" fill="white" filter="url(#glow)" />

        {/* Arrow Structure */}
        <path 
          d="M50 85 V25 M50 25 L35 45 M50 25 L65 45" 
          stroke="url(#arrowGradient)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.5))' }}
        />
      </svg>

      {/* Subtle Shine */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
