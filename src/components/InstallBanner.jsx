import React, { useState, useEffect } from "react";
import { Download, X } from "./Icons";

// Use the bright orange color from the design system
// Assuming "hover:bg-[#ff9900]" or similar is the "bright orange" we've been using.
// Using a hardcoded value if not defined in tailwind config, or "bg-amber-500" / "bg-orange-500".
// The user mentioned "bright orange we've been using lately". I'll use a strong orange hex code or class.
// Looking at recent tasks, maybe just a vibrant standard orange.

const InstallBanner = ({ onInstall, onClose, t, lang }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after a short delay to be less intrusive
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-[#FF8C00] text-white rounded-xl shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-white/20">
        
        {/* Left Side: Icon + Text */}
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-white/20 p-3 rounded-full animate-wiggle">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg leading-tight animate-breathe origin-left">
              {lang === "th" 
                ? "ติดตั้งแอพเพื่อใช้งานแบบออฟไลน์และโหลดเร็วขึ้น!" 
                : "Install App for offline access and faster loading times!"}
            </h3>
          </div>
        </div>

        {/* Right Side: Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onInstall}
            className="flex-1 md:flex-none px-6 py-2.5 bg-white text-[#FF8C00] font-bold rounded-lg shadow-sm hover:bg-gray-100 transition-colors active:scale-95 whitespace-nowrap animate-wiggle-subtle"
          >
            {lang === "th" ? "ติดตั้งทันที" : "Install Now"}
          </button>
          
          <button
            onClick={onClose}
            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
