import React, { useState } from "react";
import { ReactComponent as LogoComponent } from "../assets/splash-screen-logo.svg";
import { X, Download, Settings } from "./Icons"; // Assuming Icons are in the same directory or adjusted path
import FontSizeButtons from "./FontSizeButtons";

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
    <div className="relative flex-shrink-0 mr-2 z-50">
      {/* Menu Dropdown (Opens Downwards) */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-3 bg-white rounded-2xl shadow-xl p-3 w-72 space-y-3 ring-1 ring-black ring-opacity-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LogoComponent
                className="w-8 h-8 rounded-md flex-shrink-0 bg-white p-0.5"
                aria-label="App Logo"
              />
              <span
                className="font-semibold text-white text-sm px-2 py-1 rounded-lg"
                style={{ backgroundColor: THAI_BLUE }}
              >
                {labelTools}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>
              {labelSelected}: <strong>{selectionCount}</strong>
            </span>
            <button
              onClick={onClearSelection}
              className="px-2 py-1 rounded-md text-xs bg-gray-200 hover:bg-gray-300"
            >
              {labelClear}
            </button>
          </div>
          <button
            onClick={() => {
              navigateToSelectedContent();
              setIsOpen(false);
            }}
            className="w-full py-2 text-white bg-red-700 hover:bg-red-600 rounded-lg text-center shadow-md transition-all"
          >
            <div className="flex items-center justify-center space-x-2">
              <Download className="w-5 h-5" />
              <span className="font-semibold">Selected Programs</span>
            </div>
          </button>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{labelFont}</span>
            <FontSizeButtons fontSize={fontSize} setFontSize={setFontSize} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{labelLang}</span>
            <button
              onClick={toggleLang}
              className="w-12 h-8 rounded-lg font-bold text-white flex items-center justify-center"
              style={{ backgroundColor: THAI_BLUE }}
            >
              {lang === "en" ? "ก" : "A"}
            </button>
          </div>
        </div>
      )}

      {/* BUTTON & BADGE CONTAINER */}
      <div className="relative">
        {/* 1. THE BLUE BUTTON (Standard Hover only) */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white relative 
                     transition-all duration-200 transform hover:scale-110 hover:brightness-125"
          style={{ backgroundColor: THAI_BLUE }}
          aria-label="Tools Panel"
        >
          <Settings className="w-6 h-6" />
        </button>

        {/* 2. THE YELLOW BADGE (Reacts to Card Hover!) */}
        {selectionCount > 0 && (
          <span
            // Keep key to trigger a re-render "pop" when number changes
            key={selectionCount}
            className={`absolute -bottom-1 -left-1 
               /* Base Shape & Color */
               text-black text-[10px] font-bold rounded-full 
               w-5 h-5 flex items-center justify-center 
               border-2 border-white shadow-sm pointer-events-none
               z-50
               
               /* 👇 ANIMATION ENGINE 👇 */
               origin-center
               transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
               
               /* 👇 DYNAMIC CLASSES 👇 */
               ${
                 isHovering
                   ? "bg-orange-400 scale-150 -translate-y-1" // State A: Hovering (Orange + Big)
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
