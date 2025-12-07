import React from "react";
import { Share2, Volume2, Heart, Download, YouTubeColor, ExternalLink } from "./Icons";
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
  languageVideoUrl, // 👇 NEW: YouTube URL for the language
  searchQuery, // 👇 NEW: Search query for highlighting
  id, // 👇 NEW: ID for A-Z navigation scrolling
}) => {
  // Helper to highlight text
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-900 text-black dark:text-white rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };


  return (
    <div
      id={id}
      onMouseEnter={() => setHovering && setHovering(true)}
      onMouseLeave={() => setHovering && setHovering(false)}
      className="bg-white dark:bg-[#374151] p-2 mb-1 rounded-xl shadow-md border-b-4 border-brand-red cursor-pointer card-hover transition-colors"
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

        {/* TEXT AREA – takes all remaining width */}
        <div onClick={() => onSelect(languageName)} className="flex-1 min-w-0">
          <h3
            className={`text-xl font-bold ${ACCENT_COLOR_CLASS} dark:text-white`}
          >
            {highlightText(languageName, searchQuery)}
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
        <div className="grid grid-cols-3 md:flex items-center gap-2 shrink-0">
          {/* External Link Button - Row 2 on mobile, position 1 on desktop */}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-white text-gray-600 dark:text-gray-600 hover:bg-blue-500 hover:text-white transition-all"
              style={{ gridRow: '2' }}
              title={
                i18n[lang].open_language_on_grn ||
                "Open this language on GRN / 5fish"
              }
            >
              <ExternalLink className="w-6 h-6" />
            </a>
          )}

          {/* Download Button - Row 2 on mobile, position 2 on desktop */}
          {sampleUrl && (
            <a
              href={sampleUrl}
              download
              onClick={(e) => e.stopPropagation()}
              className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-white text-gray-600 dark:text-gray-600 hover:bg-green-500 hover:text-white transition-all"
              style={{ gridRow: '2' }}
              title="Download Sample"
            >
              <Download className="w-6 h-6" />
            </a>
          )}

          {/* YouTube Button - Row 2 on mobile, position 3 on desktop */}
          {languageVideoUrl ? (
            <a
              href={languageVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-white hover:bg-gray-300 transition-all"
              style={{ gridRow: '2' }}
              title={lang === "en" ? "Watch Video" : "ดูวิดีโอ"}
            >
              <YouTubeColor className="w-6 h-6" />
            </a>
          ) : (
            <div
              className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-white cursor-not-allowed"
              style={{ gridRow: '2' }}
              title={lang === "en" ? "No video available" : "ไม่มีวิดีโอ"}
            >
              <YouTubeColor className="w-6 h-6" />
            </div>
          )}

          {/* Play Button - Row 1 on mobile, position 4 on desktop */}
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
            style={{ gridRow: '1' }}
            title={lang === "en" ? "Listen to sample" : "ฟังตัวอย่าง"}
          >
            <Volume2 className="w-6 h-6" />
          </button>

          {/* Favorite Heart Button - Row 1 on mobile, position 5 on desktop */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="group p-1 md:p-2 rounded-full bg-gray-200 dark:bg-white hover:bg-brand-red transition-all"
              style={{ gridRow: '1' }}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart
                className="w-6 h-6 transition-all"
                style={{
                  fill: isFavorite ? "#CC3333" : "none",
                  color: "#CC3333",
                  strokeWidth: "2"
                }}
                onMouseEnter={(e) => {
                  if (isFavorite) {
                    e.currentTarget.style.fill = "white";
                    e.currentTarget.style.color = "white";
                  } else {
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFavorite) {
                    e.currentTarget.style.fill = "#CC3333";
                    e.currentTarget.style.color = "#CC3333";
                  } else {
                    e.currentTarget.style.color = "#CC3333";
                  }
                }}
              />
            </button>
          )}

          {/* Share Button - Row 1 on mobile, position 6 on desktop */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowQrForLanguage(languageName);
            }}
            className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-white text-gray-600 dark:text-gray-600 hover:bg-brand-red hover:text-white transition-colors"
            style={{ gridRow: '1' }}
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
