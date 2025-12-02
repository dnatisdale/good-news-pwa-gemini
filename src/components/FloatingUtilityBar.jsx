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
        {/* Font Size Icon Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors btn-hover flex-shrink-0"
          style={{ backgroundColor: isOpen ? '#a91b0d' : 'transparent' }}
          aria-label="Font Size"
          title="Font Size"
        >
          <FontSize className="w-6 h-6" />
        </button>

        {/* Font Size Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 py-2 min-w-[140px] z-50">
            {[
              { label: lang === 'en' ? 'Small' : 'เล็ก', size: '12px' },
              { label: lang === 'en' ? 'Medium' : 'กลาง', size: '16px' },
              { label: lang === 'en' ? 'Large' : 'ใหญ่', size: '20px' },
              { label: lang === 'en' ? 'X-Large' : 'ใหญ่มาก', size: '24px' },
              { label: lang === 'en' ? 'XX-Large' : 'ใหญ่พิเศษ', size: '28px' },
            ].map(({ label, size }) => (
              <button
                key={size}
                onClick={() => {
                  setFontSize(size);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors ${
                  fontSize === size
                    ? 'font-semibold'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
                style={fontSize === size ? { backgroundColor: '#FCD34D', color: '#1F2937' } : {}}
              >
                <span className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {parseInt(size)}px
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

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
