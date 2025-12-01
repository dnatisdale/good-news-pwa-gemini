import React from "react";
// Removed unused i18n import
import { formatContentItem } from "../utils/contentFormatter";
import { Volume2, Pause, Share2, Heart, Download } from "./Icons"; // Removed unused PlayCircle

const ACCENT_COLOR_CLASS = "text-brand-red";
const TEXT_COLOR_CLASS = "text-gray-800";

const ContentCard = ({
  item,
  lang,
  onSelect,
  t, // Translation object
  showLanguageName = true,
  largeLanguage = false, // ✅ NEW: make language text as big as the message title when true
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

  // Format duration as H:MM:SS or MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      // Format as H:MM:SS
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      // Format as MM:SS
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="bg-white dark:bg-[#374151] p-4 mb-3 rounded-xl shadow-md border-t-4 border-brand-red cursor-pointer card-hover flex items-start">
      {/* --- CHECKBOX AREA --- */}
      {onToggle && (
        <div
          className="pr-3 pt-1"
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

      {/* --- FAVORITE HEART (right after checkbox) --- */}
      {onToggleFavorite && (
        <div
          className="pr-3 pt-1"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart
            className={`w-5 h-5 cursor-pointer transition-all ${
              isFavorite
                ? "fill-brand-red text-brand-red"
                : "text-brand-red"
            }`}
            style={isFavorite ? { fill: "#CC3333", color: "#CC3333" } : { fill: "white", color: "#CC3333", strokeWidth: "2" }}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          />
        </div>
      )}

      {/* Content Info */}
      <div className="flex-grow" onClick={() => onSelect(item)}>
        {showLanguageName && (
          <p
            className={`${
              largeLanguage
                ? lang === "th"
                  ? "text-xl"
                  : "text-lg"
                : lang === "th"
                ? "text-lg"
                : "text-base"
            } font-semibold ${ACCENT_COLOR_CLASS} dark:text-white mb-1`}
          >
            {languageDisplay}
          </p>
        )}
        <h3
          className={`${
            lang === "th" ? "text-xl" : "text-lg"
          } font-bold ${TEXT_COLOR_CLASS} dark:text-white ${
            showLanguageName ? "" : "mt-1"
          }`}
        >
          {messageTitle}
        </h3>

        <p className="text-xs text-gray-400 dark:text-white mt-1.5">
          {t?.program_number || "Message No."} {programNumber}
        </p>
      </div>

      {/* --- ACTION BUTTONS (Play, Share) --- */}
      <div className="pl-2 pt-1 flex items-center gap-2">
        {/* Duration Display - Left of Play Button */}
        {item.duration && (
          <p className="text-xs text-gray-500 dark:text-white mr-1">
            {formatDuration(item.duration)}
          </p>
        )}

        {/* Download Button */}
        {(item.downloadUrl || item.audioUrl || item.sampleUrl) && (
          <a
            href={item.downloadUrl || item.audioUrl || item.sampleUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-gray-200 transition-all"
            title="Download"
          >
            <Download className="w-6 h-6" />
          </a>
        )}

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
