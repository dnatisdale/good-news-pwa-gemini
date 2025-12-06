// src/components/ContentCard.jsx
// =====================================
// Uncle Map 🧭 (so future-Dan doesn’t get lost)
//
//  1–4   : Imports
//  6–9   : Style helper constants
// 11–33  : Props coming in from the parent (MessagesByLanguagePage / MyLibraryPage)
// 35–66  : Pull out nice display text from the raw item + build external GRN/5fish URL
// 68–88  : Duration formatter (seconds -> H:MM:SS or MM:SS)
// 90–176 : JSX layout
//          - Checkbox + Heart (left)
//          - Main text area (language + clickable message title + message number)
//          - Duration + Download + YouTube + Preview Play + Share buttons (right)

import React from "react";
import { formatContentItem } from "../utils/contentFormatter";
import { Volume2, Pause, Share2, Heart, Download, YouTube, YouTubeColor, YouTubeOff, ExternalLink } from "./Icons";

const ACCENT_COLOR_CLASS = "text-brand-red";
const TEXT_COLOR_CLASS = "text-gray-800";

const ContentCard = ({
  // --- DATA + LANGUAGE ---
  item, // The raw message/program object
  lang, // "en" or "th"
  t, // Translation object from i18n (for labels/tooltips)

  // --- NAVIGATION ---
  onSelect, // When the row (blue bar) is tapped → open detail/QR page

  // --- DISPLAY OPTIONS ---
  showLanguageName = true, // Show the language name above the title?
  largeLanguage = false, // Make language text as big as the title?

  // --- SELECTION (checkbox) ---
  isSelected, // Is this message currently selected?
  onToggle, // Toggle selection when checkbox area is clicked

  // --- AUDIO SAMPLE PREVIEW ---
  isPlayingSample, // Is this sample currently playing?
  onPlaySample, // Toggle play/stop preview

  // --- QR / SHARE ---
  onShowQrForMessage, // Open QR modal for just this message

  // --- FAVORITES ---
  isFavorite, // Is this message in the favorites list?
  onToggleFavorite, // Add/remove from favorites
}) => {
  // 1) Turn the raw item into nicely formatted display text
  const { languageDisplay, messageTitle, trackTitle, programNumber } =
    formatContentItem(item, lang); // trackTitle is available if you ever want it

  // 2) Build external URL for this specific message (5fi.sh / 5fish / GRN)
  const getExternalMessageUrl = () => {
    // Try fields that might already contain a full or partial URL
    let url =
      item.shareUrl ||
      item.streamUrl ||
      item.trackDownloadUrl ||
      item.sampleUrl;

    // Fallback: short 5fi.sh link using ID / programId
    if (!url) {
      if (item.id) {
        url = `https://5fi.sh/T${item.id}`;
      } else if (item.programId) {
        url = `https://5fi.sh/T${item.programId}`;
      } else {
        return null;
      }
    }

    // If it’s missing http/https, add it
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    return url;
  };

  // 3) Format duration as H:MM:SS or MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      // Format as H:MM:SS
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    } else {
      // Format as MM:SS
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

  // 4) Determine Video URL (specific message URL or fallback to language/program URL)
  const videoUrl = item.youtubeUrl || item.languageVideoUrl;

  return (
    <div className="bg-white dark:bg-[#374151] p-4 mb-3 rounded-xl shadow-md border-t-4 border-brand-red cursor-pointer card-hover flex items-start">
      {/* ================= LEFT SIDE: CHECKBOX + HEART ================= */}

      {/* Selection checkbox (whole language row selection) */}
      {onToggle && (
        <div
          className="pr-1 pt-1"
          onClick={(e) => {
            e.stopPropagation(); // don’t also trigger onSelect
            onToggle();
          }}
        >
          <input
            type="checkbox"
            className="w-6 h-6 accent-[#003366] dark:accent-[#a91b0d] cursor-pointer"
            checked={isSelected || false}
            onChange={() => {}} // handled via the wrapping div
          />
        </div>
      )}

      {/* Favorite heart */}
      {onToggleFavorite && (
        <div
          className="pr-1 pt-1"
          onClick={(e) => {
            e.stopPropagation(); // don’t open detail page
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

      {/* ================= CENTER: MAIN TEXT AREA ================= */}
      {/* Clicking this center area (not the tiny buttons) opens the QR/detail page */}
      <div className="flex-grow" onClick={() => onSelect && onSelect(item)}>
        {/* Language name (Akeu, Bangla Chittagonian, etc.) */}
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

        {/* Message title (Good News, LLL 1 Beginning with GOD, etc.) */}
        <h3
          className={`${
            lang === "th" ? "text-xl" : "text-lg"
          } font-bold ${TEXT_COLOR_CLASS} dark:text-white ${
            showLanguageName ? "" : "mt-1"
          }`}
        >
          {getExternalMessageUrl() ? (
            <button
              type="button"
              onClick={(e) => {
                // IMPORTANT: open GRN/5fish WITHOUT opening the QR page
                e.stopPropagation();
                const url = getExternalMessageUrl();
                if (url) {
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              }}
              className="underline decoration-dotted underline-offset-2 hover:decoration-solid bg-transparent border-none p-0 m-0 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-brand-red rounded-sm"
              title={
                t?.open_message_on_grn ||
                (lang === "en"
                  ? "Open this message on 5fish / GRN"
                  : "เปิดข้อความนี้ใน 5fish / GRN")
              }
            >
              {messageTitle}
            </button>
          ) : (
            messageTitle
          )}
        </h3>

        {/* Message / program number */}
        <p className="text-xs text-gray-400 dark:text-white mt-1.5">
          {t?.program_number || "Message No."} {programNumber}
        </p>
      </div>

      {/* ================= RIGHT SIDE: DURATION + BUTTONS ================= */}
      <div className="pl-2 pt-1 flex items-center gap-2">
        {/* Duration (e.g. 0:14) */}
        {item.duration && (
          <p className="text-xs text-gray-500 dark:text-white mr-1">
            {formatDuration(item.duration)}
          </p>
        )}

        {/* External Link Button (New) */}
        {getExternalMessageUrl() && (
          <a
            href={getExternalMessageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-blue-500 hover:text-white transition-all"
            title={
              t?.open_message_on_grn ||
              (lang === "en"
                ? "Open this message on 5fish / GRN"
                : "เปิดข้อความนี้ใน 5fish / GRN")
            }
          >
            <ExternalLink className="w-6 h-6" />
          </a>
        )}

        {/* Download button (uses first available download-ish URL) */}
        {(item.downloadUrl || item.audioUrl || item.sampleUrl) && (
          <a
            href={item.downloadUrl || item.audioUrl || item.sampleUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-green-500 hover:text-white transition-all"
            title={t?.download_audio || "Download"}
          >
            <Download className="w-6 h-6" />
          </a>
        )}

        {/* YouTube Button (Always visible, 2nd position) */}
        {videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white hover:bg-gray-200 transition-all"
            title={t?.watch_on_youtube || "Watch on YouTube"}
          >
            <YouTubeColor className="w-6 h-6" />
          </a>
        ) : (
          <div
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white cursor-not-allowed"
            title="No video available"
          >
            <YouTubeColor className="w-6 h-6" />
          </div>
        )}

        {/* Preview play button (short sample audio) */}
        {item.sampleUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlaySample && onPlaySample();
            }}
            className={`p-1 md:p-2 rounded-full transition-all ${
              isPlayingSample
                ? "bg-amber-100 dark:bg-amber-100 text-amber-600 dark:text-amber-600 animate-pulse"
                : "bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-orange-500 hover:text-white"
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

        {/* Share button (opens QR / share modal for this message) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowQrForMessage && onShowQrForMessage();
          }}
          className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-brand-red hover:text-white transition-all"
          title={t?.share_message || "Share Message"}
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
