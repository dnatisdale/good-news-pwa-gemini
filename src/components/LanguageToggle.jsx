import React from "react";
import LanguageIconPng from "../assets/language-icon.png";

const LanguageToggle = ({ lang, setLang, t }) => {
  const toggleLang = () => {
    const newLang = lang === "en" ? "th" : "en";
    setLang(newLang);
    localStorage.setItem("appLang", newLang);
  };

  return (
    <div className="flex items-center space-x-1 md:space-x-2">
      <button
        onClick={toggleLang}
        className="transition-opacity hover:opacity-80"
        title="Th-Eng Switcher"
        aria-label="Th-Eng Switcher"
      >
        <img 
          src={LanguageIconPng} 
          alt="Language Toggle" 
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg"
        />
      </button>
    </div>
  );
};

export default LanguageToggle;
