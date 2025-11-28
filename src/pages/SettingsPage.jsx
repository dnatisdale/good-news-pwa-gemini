import React from "react";
import { ChevronLeft, ChevronRight } from "../components/Icons";

const ACCENT_COLOR_CLASS = "text-brand-red dark:text-white";

const SettingsPage = ({
  lang,
  setLang,
  fontSize,
  setFontSize,
  t,
  onBack,
  onForward,
  hasPrev,
  hasNext,
}) => {
  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem("appLang", newLang);
  };

  const handleFontSizeChange = (e) => {
    const newSize = e.target.value;
    setFontSize(newSize);
    // --- REMOVED: localStorage.setItem("appFontSize", newSize); ---
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Back and Forward Controls */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasPrev
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasPrev}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasNext
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasNext}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.settings}</h1>

      {/* Settings Controls */}
      <div className="space-y-6 bg-white p-6 rounded-xl shadow-md">
        {/* Language Selector */}
        <div className="space-y-2">
          <label
            htmlFor="language-select"
            className="block text-sm font-medium text-gray-700"
          >
            {t.language_label || "Language"}
          </label>
          <select
            id="language-select"
            value={lang}
            onChange={handleLangChange}
            // 💡 ADD 'text-inherit' CLASS
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-red focus:border-brand-red transition duration-150 text-inherit"
          >
            <option value="en">English</option>
            <option value="th">ไทย (Thai)</option>
          </select>
        </div>

        {/* Font Size Selector */}
        <div className="space-y-2">
          <label
            htmlFor="font-size-select"
            className="block text-sm font-medium text-gray-700"
          >
            {t.font_size_label || "Font Size"}
          </label>
          <select
            id="font-size-select"
            value={fontSize}
            onChange={handleFontSizeChange}
            // 💡 ADD 'text-inherit' CLASS
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-red focus:border-brand-red transition duration-150 text-inherit"
          >
            <option value="14px">{t.font_size_small || "Small"}</option>
            <option value="16px">{t.font_size_medium || "Medium"}</option>
            <option value="20px">{t.font_size_large || "Large"}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
