import React from "react";
import { Share2, Volume2, Heart, Download } from "./Icons";
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
  // 👇 Hover state
  setHovering,
  // 👇 Audio playback props
  onPlayLanguage,
  isPlayingLanguage,
  isFavorite,
  onToggleFavorite,
  sampleUrl, // 👇 NEW: Sample URL for download
  // 👇 NEW: external GRN/5fish URL
  externalUrl,
}) => {
  const handleLanguageClick = (e) => {
    e.stopPropagation(); // don’t trigger onSelect
    if (!externalUrl) return;
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <div
      onMouseEnter={() => setHovering && setHovering(true)}
      onMouseLeave={() => setHovering && setHovering(false)}
      className="bg-white dark:bg-[#374151] p-4 mb-3 rounded-xl shadow-md border-b-4 border-brand-red cursor-pointer card-hover transition-colors"
    >
      {/* MAIN ROW */}
      <div className="flex items-center gap-1.5">
        {/* Checkbox */}
        <div
          className="pr-1 flex items-center shrink-0"
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

        {/* Favorite Heart - Right after checkbox */}
        {onToggleFavorite && (
          <div
            className="pr-1 flex items-center shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Heart
              className={`w-5 h-5 cursor-pointer transition-all ${
                isFavorite ? "fill-brand-red text-brand-red" : "text-brand-red"
              }`}
              style={
                isFavorite
                  ? { fill: "#CC3333", color: "#CC3333" }
                  : { fill: "white", color: "#CC3333", strokeWidth: "2" }
              }
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            />
          </div>
        )}

        {/* TEXT AREA – takes all remaining width */}
        <div onClick={() => onSelect(languageName)} className="flex-1 min-w-0">
          <h3
            className={`text-xl font-bold ${ACCENT_COLOR_CLASS} dark:text-white`}
          >
            {externalUrl ? (
              <button
                type="button"
                onClick={handleLanguageClick}
                className="underline decoration-dotted underline-offset-2 hover:decoration-solid bg-transparent border-none p-0 m-0 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-brand-red rounded-sm"
                title={
                  i18n[lang].open_language_on_grn ||
                  "Open this language on GRN / 5fish"
                }
              >
                {languageName}
              </button>
            ) : (
              languageName
            )}
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
            {lang === "en" ? "Tap to view" : "แตะเพื่อดู"} ({messageCount}{" "}
            {messageCount === 1
              ? lang === "en"
                ? "message"
                : "ข้อความ"
              : lang === "en"
              ? "messages"
              : "ข้อความ"}
            )
          </p>
        </div>

        {/* ICONS – fixed width, don't squeeze text */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Download Button */}
          {sampleUrl && (
            <a
              href={sampleUrl}
              download
              onClick={(e) => e.stopPropagation()}
              className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-white text-gray-600 dark:text-gray-600 hover:bg-amber-500 hover:text-white transition-all"
              title="Download Sample"
            >
              <Download className="w-6 h-6" />
            </a>
          )}

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
