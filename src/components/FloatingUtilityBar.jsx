import React, { useState, useEffect, useRef } from "react";
import { ReactComponent as LogoComponent } from "../assets/splash-screen-logo.svg";
import { X, Download, Settings, FontSize } from "./Icons"; // Assuming Icons are in the same directory or adjusted path

const THAI_BLUE = "#003366";

const FloatingUtilityBar = ({
  t,
  lang,
  setLang,
  selectionCount,
  onClearSelection,
  fontSize,
  setFontSize,
  navigateToSelectedContent,
  isHovering,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Labels
  const labelSelected =
    t.selected_count_label || (lang === "th" ? "เลือกแล้ว" : "Selected");
  const labelClear =
    t.clear_all || (lang === "th" ? "ล้างทั้งหมด" : "Clear all");
  const labelFont =
    t.font_size || (lang === "th" ? "ขนาดตัวอักษร" : "Font size");
  const labelLang = t.language || (lang === "th" ? "ภาษา" : "Language");
  const labelTools = t.tools_panel || (lang === "th" ? "เครื่องมือ" : "Tools");
  const toggleLang = () => {
    setLang(lang === "en" ? "th" : "en");
  };

  return (
    <div className="relative flex-shrink-0 mr-1 md:mr-2 z-50" ref={dropdownRef}>

      {/* BUTTON & BADGE CONTAINER */}
      <div className="relative flex flex-col md:flex-row items-center gap-px md:gap-1">
        {/* Plus Button (on top for mobile) */}
        <button
          onClick={() => {
            const currentSize = parseInt(fontSize);
            if (currentSize < 36) {
              setFontSize(`${currentSize + 1}px`);
            }
          }}
          disabled={parseInt(fontSize) >= 36}
          className={`w-5 h-5 md:w-8 md:h-8 rounded shadow-md flex items-center justify-center text-white font-bold text-sm md:text-lg
                     transition-all duration-200 ${
                       parseInt(fontSize) >= 36
                         ? 'opacity-50 cursor-not-allowed'
                         : 'hover:brightness-125'
                     }`}
          style={{ backgroundColor: THAI_BLUE }}
          aria-label="Increase Font Size"
        >
          +
        </button>
        
        {/* Minus Button (on bottom for mobile) */}
        <button
          onClick={() => {
            const currentSize = parseInt(fontSize);
            if (currentSize > 12) {
              setFontSize(`${currentSize - 1}px`);
            }
          }}
          disabled={parseInt(fontSize) <= 12}
          className={`w-5 h-5 md:w-8 md:h-8 rounded shadow-md flex items-center justify-center text-white font-bold text-sm md:text-lg
                     transition-all duration-200 ${
                       parseInt(fontSize) <= 12
                         ? 'opacity-50 cursor-not-allowed'
                         : 'hover:brightness-125'
                     }`}
          style={{ backgroundColor: THAI_BLUE }}
          aria-label="Decrease Font Size"
        >
          −
        </button>

        {/* 2. THE YELLOW BADGE (Reacts to Card Hover!) */}
        {selectionCount > 0 && (
          <span
            // Keep key to trigger a re-render "pop" when number changes
            key={selectionCount}
            className={`absolute -bottom-1 -left-1 
               /* Base Shape & Color */
               text-black text-xs font-bold rounded-full 
               w-6 h-6 flex items-center justify-center 
               border-2 border-white shadow-md pointer-events-none
               z-50
               
               /* 👇 ANIMATION ENGINE 👇 */
               origin-center
               transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
               
               /* 👇 DYNAMIC CLASSES 👇 */
               ${
                 isHovering
                   ? "bg-orange-400 scale-150 -translate-y-1 animate-bounce" // State A: Hovering (Orange + Big + Bounce)
                   : "bg-yellow-400 scale-100 translate-y-0"
               }  // State B: Normal (Yellow + Normal)
               `}
          >
            {selectionCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default FloatingUtilityBar;
