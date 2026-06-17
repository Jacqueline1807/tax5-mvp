import React, { useEffect } from "react";
import { Logo } from "./Logo";
import { Sparkles } from "lucide-react";

interface SplashViewProps {
  onComplete: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ onComplete }) => {
  useEffect(() => {
    // Show splash animation for 2200ms, then transition automatically to Welcome screen
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#FAFCFB] p-6 text-navy text-center select-none">
      {/* Spacer to push container content */}
      <div className="h-4"></div>

      {/* Main Grouped Brand Block (centered, slightly above middle of the screen) */}
      <div className="flex flex-col items-center justify-center -mt-12 space-y-4 animate-pulse">
        {/* Logo container - Clean layout with hover zoom */}
        <div className="transition-transform duration-300 transform hover:scale-105">
          <Logo showText={true} size="xl" />
        </div>

        {/* Tagline and connected MVP demo badge */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-base font-bold tracking-tight text-navy">
            Your Form BE pre-filing assistant
          </p>
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-brand-light text-teal-brand text-[11px] font-bold border border-teal-brand/10">
            <Sparkles className="w-3 h-3 text-teal-brand" />
            <span>Pre-filing MVP Demo v1.0</span>
          </div>
        </div>
      </div>

      {/* Loading progress and Microcopy at the bottom */}
      <div className="w-full max-w-xs mx-auto space-y-4 pb-8">
        <div className="flex items-center justify-center gap-2">
          {/* Spinner */}
          <div className="w-4 h-4 rounded-full border-2 border-teal-brand border-t-transparent animate-spin"></div>
          <span className="text-neutral-500 text-xs font-semibold">
            Preparing your tax helpers...
          </span>
        </div>
        
        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-teal-brand rounded-full" 
            style={{ 
              width: "55%",
              animation: "pulse 1.5s infinite ease-in-out" 
            }}
          ></div>
        </div>
        
        <p className="text-[10px] text-neutral-400 font-medium">
          Digitize receipts. Plan, sort, and draft claims safely.
        </p>
      </div>
    </div>
  );
};
export default SplashView;
