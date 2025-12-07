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
      {/* ================= LEFT SIDE: CHECKBOX ================= */}

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
        <div className="md:flex md:items-baseline md:gap-2">
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

          {/* Message / program number - inline on desktop, below on mobile */}
          <p className="text-xs text-gray-400 dark:text-white mt-1.5 md:mt-0 md:text-gray-500">
            {t?.program_number || "Message #"}{programNumber}
          </p>
        </div>
      </div>

      {/* ================= RIGHT SIDE: RESPONSIVE BUTTON LAYOUT ================= */}
      <div className="pl-2 pt-1 grid grid-cols-3 md:flex md:flex-wrap items-center gap-2">
        {/* External Link Button - Row 2 on mobile, position 1 on desktop */}
        {getExternalMessageUrl() && (
          <a
            href={getExternalMessageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-blue-500 hover:text-white transition-all"
            style={{ gridRow: '2', '@media (min-width: 768px)': { gridRow: 'auto' } }}
            title={
              t?.open_message_on_grn
                ? `${t.open_message_on_grn}${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
                : lang === "en"
                ? `Open this message on 5fish / GRN${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
                : `เปิดข้อความนี้ใน 5fish / GRN${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
            }
          >
            <ExternalLink className="w-6 h-6" />
          </a>
        )}

        {/* Download button - Row 2 on mobile, position 2 on desktop */}
        {(item.downloadUrl || item.audioUrl || item.sampleUrl) && (
          <a
            href={item.downloadUrl || item.audioUrl || item.sampleUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-green-500 hover:text-white transition-all"
            style={{ gridRow: '2' }}
            title={
              t?.download_audio
                ? `${t.download_audio}${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
                : `Download${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
            }
          >
            <Download className="w-6 h-6" />
          </a>
        )}

        {/* YouTube Button - Row 2 on mobile, position 3 on desktop */}
        {videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white hover:bg-gray-200 transition-all"
            style={{ gridRow: '2' }}
            title={
              t?.watch_on_youtube
                ? `${t.watch_on_youtube}${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
                : `Watch on YouTube${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
            }
          >
            <YouTubeColor className="w-6 h-6" />
          </a>
        ) : (
          <div
            className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white cursor-not-allowed opacity-50"
            style={{ gridRow: '2' }}
            title={`No video available${item.duration ? ` (${formatDuration(item.duration)})` : ""}`}
          >
            <YouTubeColor className="w-6 h-6" />
          </div>
        )}

        {/* Preview play button - Row 1 on mobile, position 4 on desktop */}
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
            style={{ gridRow: '1' }}
            title={
              isPlayingSample
                ? `Stop Preview${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
                : `Listen to Preview${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
            }
          >
            {isPlayingSample ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </button>
        )}

        {/* Favorite heart - Row 1 on mobile, position 5 on desktop */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            onMouseEnter={(e) => e.currentTarget.dataset.hovering = 'true'}
            onMouseLeave={(e) => e.currentTarget.dataset.hovering = 'false'}
            className="group p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white hover:bg-brand-red transition-all"
            style={{ gridRow: '1' }}
            title={
              isFavorite
                ? `Remove from Favorites${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
                : `Add to Favorites${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
            }
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

        {/* Share button - Row 1 on mobile, position 6 on desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowQrForMessage && onShowQrForMessage();
          }}
          className="p-1 md:p-2 rounded-full bg-gray-100 dark:bg-white text-gray-500 dark:text-gray-600 hover:bg-brand-red hover:text-white transition-all"
          style={{ gridRow: '1' }}
          title={
            t?.share_message
              ? `${t.share_message}${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
              : `Share Message${item.duration ? ` (${formatDuration(item.duration)})` : ""}`
          }
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
