import React from "react";
import { Share2 } from "./Icons";
import { i18n } from "../i18n";

const ACCENT_COLOR_CLASS = "text-brand-red";

const LanguageCard = ({
  languageName,
  lang,
  onSelect,
  messageCount,
  onShowQrForLanguage,
  selectionState,
  onToggle,
  // 👇 NEW PROP
  setHovering,
}) => {
  return (
    <div
      // 👇 NEW EVENTS: Send the signal!
      onMouseEnter={() => setHovering && setHovering(true)}
      onMouseLeave={() => setHovering && setHovering(false)}
      className="bg-white p-4 mb-3 rounded-xl shadow-md border-b-4 border-brand-red cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.01]"
    >
      <div className="flex items-center justify-between">
        <div
          className="pr-4 flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <input
            type="checkbox"
            className="w-6 h-6 accent-[#003366] cursor-pointer"
            checked={selectionState === "checked"}
            ref={(input) => {
              if (input) {
                input.indeterminate = selectionState === "indeterminate";
              }
            }}
            readOnly
          />
        </div>

        <div onClick={() => onSelect(languageName)} className="flex-grow pr-4">
          <h3 className={`text-2xl font-bold ${ACCENT_COLOR_CLASS}`}>
            {languageName}
          </h3>
          <p className={`text-sm text-gray-500 mt-1`}>
            {lang === "en" ? "Tap to view" : "แตะเพื่อดู"} ({messageCount}{" "}
            {lang === "en" ? "messages" : "ข้อความ"})
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowQrForLanguage(languageName);
          }}
          className="flex-shrink-0 p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-brand-red hover:text-white transition-colors"
          title={i18n[lang].share_language_qr || "Share Language QR"}
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default LanguageCard;
