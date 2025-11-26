import React from "react";
import { Share2, Volume2, Heart } from "./Icons";
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
  // 👇 NEW: Audio playback props
  onPlayLanguage,
  isPlayingLanguage,
  isFavorite, // 👇 NEW
  onToggleFavorite, // 👇 NEW
}) => {
  return (
    <div
      // 👇 NEW EVENTS: Send the signal!
      onMouseEnter={() => setHovering && setHovering(true)}
      onMouseLeave={() => setHovering && setHovering(false)}
      className="bg-white dark:bg-[#374151] p-4 mb-3 rounded-xl shadow-md border-b-4 border-brand-red cursor-pointer card-hover transition-colors"
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
            className="w-6 h-6 accent-[#003366] dark:accent-[#a91b0d] cursor-pointer"
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
          <h3 className={`text-2xl font-bold ${ACCENT_COLOR_CLASS} dark:text-white`}>
            {languageName}
          </h3>
          <p className={`text-sm text-gray-500 dark:text-gray-300 mt-1`}>
            {lang === "en" ? "Tap to view" : "แตะเพื่อดู"} ({messageCount}{" "}
            {lang === "en" ? "messages" : "ข้อความ"})
          </p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Play Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayLanguage && onPlayLanguage();
            }}
            className={`p-1 md:p-2 rounded-full transition-all ${
              isPlayingLanguage
                ? "bg-amber-100 dark:bg-amber-100 text-amber-600 dark:text-amber-600 animate-pulse"
                : "bg-gray-200 dark:bg-white text-gray-600 dark:text-gray-600 hover:bg-amber-500 hover:text-white"
            }`}
            title={lang === "en" ? "Listen to sample" : "ฟังตัวอย่าง"}
          >
            <Volume2 className="w-6 h-6" />
          </button>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1 md:p-2 rounded-full transition-all ${
                isFavorite
                  ? "bg-red-100 dark:bg-red-100 text-red-600 dark:text-red-600"
                  : "bg-gray-200 dark:bg-white text-gray-600 dark:text-gray-600 hover:bg-red-100 hover:text-red-600"
              }`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart
                className={`w-6 h-6 ${
                  isFavorite ? "fill-brand-red text-brand-red" : ""
                }`}
                style={
                  isFavorite ? { fill: "#CC3333", color: "#CC3333" } : {}
                }
              />
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowQrForLanguage(languageName);
            }}
            className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-white text-gray-600 dark:text-gray-600 hover:bg-brand-red hover:text-white transition-colors"
            title={i18n[lang].share_language_qr || "Share Language QR"}
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageCard;
