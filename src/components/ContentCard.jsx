import React from "react";
// Removed unused i18n import
import { formatContentItem } from "../utils/contentFormatter";
import { Volume2, Pause, Share2, Heart } from "./Icons"; // Removed unused PlayCircle

const ACCENT_COLOR_CLASS = "text-brand-red";
const TEXT_COLOR_CLASS = "text-gray-800";

const ContentCard = ({
  item,
  lang,
  onSelect,
  t, // Translation object
  showLanguageName = true,
  isSelected, // Is this specific message selected?
  onToggle, // Function to toggle this message
  isPlayingSample, // Is this sample playing?
  onPlaySample, // Function to toggle sample playback
  onShowQrForMessage, // Show QR modal
  isFavorite, // Is this item a favorite?
  onToggleFavorite, // Function to toggle favorite
}) => {
  const { languageDisplay, messageTitle, trackTitle, programNumber } =
    formatContentItem(item, lang);

  return (
    <div className="bg-white dark:bg-[#374151] p-4 mb-3 rounded-xl shadow-md border-t-4 border-brand-red cursor-pointer card-hover flex items-start">
      {/* --- CHECKBOX AREA --- */}
      {onToggle && (
        <div
          className="pr-4 pt-1"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <input
            type="checkbox"
            className="w-6 h-6 accent-[#003366] dark:accent-[#a91b0d] cursor-pointer"
            checked={isSelected || false}
            onChange={() => {}} // Handled by div click
          />
        </div>
      )}

      {/* Content Info */}
      <div className="flex-grow" onClick={() => onSelect(item)}>
        {showLanguageName && (
          <p
            className={`text-base font-semibold ${ACCENT_COLOR_CLASS} dark:text-white mb-1`}
          >
            {languageDisplay}
          </p>
        )}
        <h3
          className={`text-lg font-bold ${TEXT_COLOR_CLASS} dark:text-white ${
            showLanguageName ? "" : "mt-1"
          }`}
        >
          {messageTitle}
        </h3>

        <p className="text-xs text-gray-400 dark:text-white mt-1.5">
          {t?.program_number || "Message No."} {programNumber}
        </p>
      </div>

      {/* --- ACTION BUTTONS (Play, Favorite, Share) --- */}
      <div className="pl-2 pt-1 flex items-center gap-2">
        {/* Play Button (only show if sample exists) */}
        {item.sampleUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlaySample && onPlaySample();
            }}
            className={`p-1 md:p-2 rounded-full transition-all ${
              isPlayingSample
                ? "bg-amber-100 dark:bg-amber-100 text-amber-600 dark:text-amber-600 animate-pulse"
                : "bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-gray-200"
            }`}
            title={isPlayingSample ? "Stop Preview" : "Listen to Preview"}
          >
            {isPlayingSample ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </button>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1 md:p-2 rounded-full transition-all ${
              isFavorite
                ? "bg-red-100 dark:bg-red-100"
                : "bg-gray-100 dark:bg-white hover:bg-red-100"
            }`}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              className={`w-6 h-6 ${
                isFavorite
                  ? "fill-brand-red text-brand-red"
                  : "text-gray-500 dark:text-gray-600"
              }`}
              style={isFavorite ? { fill: "#CC3333", color: "#CC3333" } : {}}
            />
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowQrForMessage && onShowQrForMessage();
          }}
          className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-brand-red hover:text-white transition-all"
          title="Share Message"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
