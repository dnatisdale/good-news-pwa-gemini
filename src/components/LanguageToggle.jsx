import React from "react";
import { Globe } from "./Icons";

const LanguageToggle = ({ lang, setLang, t }) => {
  const toggleLang = () => {
    const newLang = lang === "en" ? "th" : "en";
    setLang(newLang);
    localStorage.setItem("appLang", newLang);
  };

  return (
    <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
      <button
        onClick={toggleLang}
        className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors btn-hover flex-shrink-0"
        title="Th-Eng Switcher"
        aria-label="Th-Eng Switcher"
      >
        <Globe className="w-5 h-5 md:w-6 md:h-6" />
      </button>
    </div>
  );
};

export default LanguageToggle;
