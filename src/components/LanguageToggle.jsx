import React from "react";

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
        className={`w-8 h-8 md:w-10 md:h-10 p-1 rounded-lg font-bold transition-colors shadow-sm text-brand-red bg-white hover:bg-gray-200 text-sm md:text-lg flex items-center justify-center`}
      >
        {lang === "en" ? "ก" : "A"}
      </button>
    </div>
  );
};

export default LanguageToggle;
