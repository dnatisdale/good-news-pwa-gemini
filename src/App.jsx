import React, { useState, useMemo, useEffect, useRef } from "react";
import html2canvas from "html2canvas"; // 👈 ADD THIS
import ContentView from "./pages/ContentView";
import Header from "./components/Header";

import { useFirebase } from "./hooks/useFirebase";
import { i18n } from "./i18n";
import { useContentFilter } from "./hooks/useContentFilter";
import {
  getFilteredMessages,
  getLanguageIndeterminateState,
} from "./utils/filterLogic";
import {
  Home,
  Search,
  Bookmark,
  Pen,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Zap,
  Download,
  PlayCircle,
  ExternalLink,
  // --- CORRECTED ICONS ---
  Qrcode, // The system exports it as 'Qrcode'
} from "./components/Icons";
import { staticContent } from "./data/staticContent";
import QRCodeDisplay from "./components/QRCodeDisplay";
import AppLogo from "./assets/splash-screen-logo.svg";
import BannerLogo from "./assets/banner-logo.svg";
import { Copy } from "lucide-react";

// --- CONSTANTS ---
// PWA Custom Colors
const THAI_RED = "#CC3333";
const THAI_BLUE = "#003366";

// Tailwind Class Mapping (using inline styles for new colors where needed)
const PRIMARY_COLOR_CLASS = "bg-brand-red";
const ACCENT_COLOR_CLASS = "text-brand-red";
const TEXT_COLOR_CLASS = "text-gray-800";
const DEFAULT_FONT_SIZE = "16px";

// Helper for share fallback
const copyLink = (text, callback) => {
  navigator.clipboard
    .writeText(text)
    .then(() => callback("Link copied!"))
    .catch(() => callback("Failed to copy link."));
};

// --- LOGO CLICK HANDLER ---
const YOUTUBE_URL = "https://youtu.be/I2QSn9DJKo8?si=nmza42Y6AiuynsaI";

const handleLogoClick = () => {
  // Opens the video in a new tab so the PWA remains active
  window.open(YOUTUBE_URL, "_blank");
};

// --- NEW/REFACTORED COMPONENTS (Defined outside App function) ---

// Language Toggle Component
const LanguageToggle = ({ lang, setLang, t }) => {
  const toggleLang = () => {
    const newLang = lang === "en" ? "th" : "en";
    setLang(newLang);
    localStorage.setItem("appLang", newLang);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleLang}
        className={`w-10 h-10 p-1 rounded-lg font-bold transition-colors shadow-sm text-brand-red bg-white hover:bg-gray-200 text-lg flex items-center justify-center`}
      >
        {lang === "en" ? "ก" : "A"}
      </button>
    </div>
  );
};

// Font Size Buttons
const FontSizeButtons = ({ fontSize, setFontSize }) => {
  const handleFontSize = (size) => {
    setFontSize(size);
    // --- REMOVED: localStorage.setItem("appFontSize", size); ---
  };

  // Style for unselected buttons (THAI_BLUE)
  const unselectedStyle = { backgroundColor: THAI_BLUE, color: "#ffffff" };
  // Style for selected button (White background, THAI_RED text)
  const selectedStyle = { backgroundColor: "#ffffff", color: THAI_RED };
  SettingsPage;
  // Base class for all buttons
  const baseClass = `p-1 rounded-md font-bold transition-colors shadow-sm text-center flex items-center justify-center`;

  return (
    <div className="flex items-center space-x-1">
      {/* Size 1 */}
      <button
        onClick={() => handleFontSize("14px")}
        className={`${baseClass} w-6 h-5 text-xs z-10`}
        style={fontSize === "14px" ? selectedStyle : unselectedStyle}
      >
        1
      </button>
      {/* Size 2 */}
      <button
        onClick={() => handleFontSize("16px")}
        className={`${baseClass} w-7 h-6 text-base z-20`}
        style={fontSize === "16px" ? selectedStyle : unselectedStyle}
      >
        2
      </button>
      {/* Size 3 */}
      <button
        onClick={() => handleFontSize("20px")}
        className={`${baseClass} w-8 h-7 text-xl z-30`}
        style={fontSize === "20px" ? selectedStyle : unselectedStyle}
      >
        3
      </button>
    </div>
  );
};

// --- FLOATING UTILITY BAR (Search + Lang + Font + Clear + QR) ---
const FloatingUtilityBar = ({
  t,
  lang,
  setLang,
  searchTerm,
  onSearchChange,
  selectedCount,
  onClearSelection,
  fontSize,
  setFontSize,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLang = () => {
    const newLang = lang === "en" ? "th" : "en";
    setLang(newLang);
    localStorage.setItem("appLang", newLang);
  };

  const labelSearch = t.search || (lang === "th" ? "ค้นหา" : "Search");
  const labelSelected =
    t.selected_count_label || (lang === "th" ? "เลือกแล้ว" : "Selected");
  const labelClear =
    t.clear_all || (lang === "th" ? "ล้างทั้งหมด" : "Clear all");
  const labelFont =
    t.font_size || (lang === "th" ? "ขนาดตัวอักษร" : "Font size");
  const labelLang = t.language || (lang === "th" ? "ภาษา" : "Language");
  const labelTools = t.tools_panel || (lang === "th" ? "เครื่องมือ" : "Tools");

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen && (
        <div className="mb-2 bg-white rounded-2xl shadow-xl p-3 w-72 space-y-3">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 text-sm">
              {labelTools}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search row */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              {labelSearch}
            </label>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                placeholder={
                  t.search_placeholder || "Search languages or messages…"
                }
              />
            </div>
          </div>

          {/* Selected + Clear row */}
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>
              {labelSelected}: <strong>{selectedCount}</strong>
            </span>
            <button
              onClick={onClearSelection}
              className="px-2 py-1 rounded-md text-xs bg-gray-200 hover:bg-gray-300"
            >
              {labelClear}
            </button>
          </div>

          {/* Font size row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{labelFont}</span>
            <FontSizeButtons fontSize={fontSize} setFontSize={setFontSize} />
          </div>

          {/* Language row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{labelLang}</span>
            <button
              onClick={toggleLang}
              className="w-12 h-8 rounded-lg font-bold text-white flex items-center justify-center"
              style={{ backgroundColor: THAI_BLUE }}
            >
              {lang === "en" ? "ก" : "A"}
            </button>
          </div>
        </div>
      )}

      {/* Floating main button with QR + badge */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white relative"
        style={{ backgroundColor: THAI_RED }}
        aria-label="QR Tools"
      >
        <Qrcode className="w-7 h-7" />
        {selectedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#2D2A4A] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
            {selectedCount}
          </span>
        )}
      </button>
    </div>
  );
};

// --- NEW GLOBAL SHARE FUNCTION (Uses Web Share API) ---
const shareQRCard = (lang, programNumber, qrCodeUrl) => {
  if (navigator.share) {
    let title;
    let text;

    // NEW Labels based on user request
    if (lang === "th") {
      title = "ข่าวดี"; // Thai title
      text = `Program #:${programNumber}\n\nฟัง แบ่งปัน ดาวน์โหลดที่: ${qrCodeUrl}\n\nค้นหาความรู้ใหม่ๆ กับ PWA ข่าวดี!`;
    } else {
      title = "Thai: Good News"; // English title
      text = `Program #:${programNumber}\n\nListen, Share, Download at: ${qrCodeUrl}\n\nDiscover more with the Thai: Good News PWA!`;
    }

    navigator
      .share({
        title: title,
        text: text,
        url: qrCodeUrl,
      })
      .then(() => console.log("QR Card shared successfully!"))
      .catch((error) => console.error("Error sharing QR Card:", error));
  } else {
    // Fallback logic for non-supporting browsers
    const fallbackText =
      lang === "th"
        ? `ข่าวดี Program #:${programNumber}\nฟัง แบ่งปัน ดาวน์โหลดที่: ${qrCodeUrl}`
        : `Thai: Good News Program #:${programNumber}\nListen, Share, Download at: ${qrCodeUrl}`;

    copyLink(fallbackText, (message) => alert(message));
  }
};

// --- Reusable Components ---
// Audio Player Component
const AudioPlayer = ({ track, isMinimized, toggleMinimize, t }) => {
  // Check if a track is available
  if (!track || !track.trackDownloadUrl) {
    return (
      <div className="sticky bottom-0 w-full p-3 bg-gray-200 text-center text-sm text-gray-600 z-20">
        {t.select_message_to_listen || "Select a message to listen to."}
      </div>
    );
  }

  // Determine the current language from the translation object
  const currentLang = t.lang || "en";

  // Determine the correctly translated message title
  const displayTitle =
    currentLang === "en"
      ? track.title_en ?? "Unknown Title"
      : track.title_th ?? "ข้อความไม่ทราบชื่อ";

  return (
    <div
      className={`sticky bottom-0 w-full p-0 bg-gray-800 shadow-inner transition-transform duration-300 ${
        isMinimized ? "translate-y-[calc(100%-48px)]" : "translate-y-0"
      } rounded-t-xl z-20`}
    >
      {/* Clickable Header for Minimize/Maximize */}
      <div
        onClick={toggleMinimize}
        className="flex items-center p-3 cursor-pointer bg-gray-900 rounded-t-xl"
      >
        <PlayCircle className="w-5 h-5 text-white mr-2 flex-shrink-0" />
        <p className="text-sm font-bold text-white truncate">
          {isMinimized
            ? (t.playing || "Playing") + ": " + displayTitle
            : t.controls || "Controls"}
        </p>
        <ChevronLeft
          className={`w-5 h-5 text-white ml-auto transition-transform ${
            isMinimized ? "rotate-90" : "-rotate-90"
          }`}
        />
      </div>

      {/* Full Controls (Hidden when minimized) */}
      <div className={`${isMinimized ? "hidden" : "p-4"}`}>
        <audio
          key={track.id}
          controls
          autoPlay
          src={track.trackDownloadUrl}
          className="w-full"
        >
          {t.audio_not_supported ||
            "Your browser does not support the audio element."}
        </audio>
      </div>
    </div>
  );
};

// Language Card Component (With Checkbox)
const LanguageCard = ({
  languageName,
  lang,
  onSelect,
  messageCount,
  onShowQrForLanguage,
  selectionState, // "checked", "unchecked", or "indeterminate"
  onToggle, // Function to handle the checkbox click
}) => {
  return (
    <div className="bg-white p-4 mb-3 rounded-xl shadow-md border-b-4 border-brand-red cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-center justify-between">
        {/* --- NEW: CHECKBOX AREA --- */}
        <div
          className="pr-4 flex items-center"
          onClick={(e) => {
            e.stopPropagation(); // Stop card from opening when checking box
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
            readOnly // React controls the state
          />
        </div>

        {/* Label and Info */}
        <div onClick={() => onSelect(languageName)} className="flex-grow pr-4">
          <h3 className={`text-2xl font-bold ${ACCENT_COLOR_CLASS}`}>
            {languageName}
          </h3>
          <p className={`text-sm text-gray-500 mt-1`}>
            {lang === "en" ? "Tap to view" : "แตะเพื่อดู"} ({messageCount}{" "}
            {lang === "en" ? "messages" : "ข้อความ"})
          </p>
        </div>

        {/* QR Button */}
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

// src/App.jsx - New Page Component

const SelectedContentPage = ({
  lang,
  t,
  onBack,
  messages,
  selectedMessages,
  selectedPrograms,
  languageGroups,
  allMessages,
  onClearSelection,
  onShare,
  onCopy,
  onDownload,
}) => {
  // Use the logic to get the actual message objects
  const filteredContent = getFilteredMessages(allMessages, selectedPrograms);
  const count = filteredContent.length;

  return (
    <div className="p-4 pt-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${ACCENT_COLOR_CLASS} hover:text-red-700`}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onClearSelection}
          className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
        >
          {t.clear_all || "Clear All"}
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-1 ${ACCENT_COLOR_CLASS}">
        {t.selected_content || "Selected Programs"}
      </h1>
      <p className="text-sm text-gray-500 mb-4 font-semibold">
        {count} {t.messages_selected || "messages selected"}
      </p>

      {/* --- Action Buttons --- */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={onShare}
          className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#002244]"
        >
          <Share2 className="w-6 h-6 mb-1" />
          <span className="text-xs">{t.share || "Share"}</span>
        </button>
        <button
          onClick={onCopy}
          className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#002244]"
        >
          <Copy className="w-6 h-6 mb-1" />
          {/* 👆 IF YOU PICK ANOTHER ICON, replace Copy with: Copy, ClipboardCopy, CopyCheck, or Files */}
          <span className="text-xs">{t.copy || "Copy"}</span>
        </button>

        <button
          onClick={onDownload}
          className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#002244]"
        >
          {/* Using Download as a stand-in for Print/Download */}
          <Download className="w-6 h-6 mb-1" />
          <span className="text-xs">{t.print || "Print/Download"}</span>
        </button>
      </div>
      {/* --- End Action Buttons --- */}
      <div className="flex-grow overflow-y-auto pb-4">
        {count === 0 ? (
          <p className="text-center text-gray-500 pt-8">
            {t.no_content_selected ||
              "No content selected yet. Go back and check some boxes!"}
          </p>
        ) : (
          filteredContent.map((item) => (
            <ContentCard // Re-use the card we updated earlier!
              key={item.id}
              item={item}
              lang={lang}
              onSelect={() => {
                /* Don't navigate on this page */
              }}
              showLanguageName={true} // Show the Language name since they are mixed
            />
          ))
        )}
      </div>
    </div>
  );
};

// Content Card Component (With Checkbox)
const ContentCard = ({
  item,
  lang,
  onSelect,
  showLanguageName = true,
  isSelected, // NEW: Is this specific message selected?
  onToggle, // NEW: Function to toggle this message
}) => {
  const languageDisplayName =
    lang === "en" ? item.languageEn ?? "" : item.langTh ?? "";
  const messageTitle =
    lang === "en"
      ? item.title_en ?? "Untitled Message"
      : item.title_th ?? "ข้อความที่ไม่มีชื่อ";

  return (
    <div className="bg-white p-4 mb-3 rounded-xl shadow-md border-t-4 border-gray-200 cursor-pointer transition-transform hover:shadow-lg hover:border-brand-red flex items-start">
      {/* --- NEW: CHECKBOX AREA --- */}
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
            className="w-6 h-6 accent-[#003366] cursor-pointer"
            checked={isSelected || false}
            onChange={() => {}} // Handled by div click
          />
        </div>
      )}

      {/* Content Info */}
      <div className="flex-grow" onClick={() => onSelect(item)}>
        {showLanguageName && (
          <p className={`text-base font-semibold ${ACCENT_COLOR_CLASS} mb-1`}>
            {languageDisplayName}
          </p>
        )}
        <h3
          className={`text-lg font-bold ${TEXT_COLOR_CLASS} ${
            showLanguageName ? "" : "mt-1"
          }`}
        >
          {messageTitle}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">Program No. {item.id}</p>
      </div>
    </div>
  );
};
// --- Language QR Modal Component ---
const LanguageQrModal = ({
  isOpen,
  onClose,
  languageDisplayName,
  languageShareUrl, // <-- This is the correct prop!
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative">
        <button
          onClick={onClose} // <-- This is the close function
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-lg font-semibold text-brand-red mb-4 text-center">
          {languageDisplayName}
        </h3>
        {/* --- QR CODE DISPLAY --- */}
        <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
          <QRCodeDisplay
            // -------------------------------------------------------------
            // --- FIX APPLIED HERE: Using languageShareUrl instead of cardUrl ---
            url={languageShareUrl}
            // -------------------------------------------------------------
            size={200}
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        </div>
        <p className="text-sm text-gray-600 text-center break-all mb-2">
          {t.scan_qr_to_view_messages || "Scan QR to view all messages in"}:{" "}
          <br />
          <a href={languageShareUrl} className="text-brand-red underline">
            {languageShareUrl}
          </a>
        </p>
      </div>
    </div>
  );
};

// --- Page Components ---
// New Page: Language List Page (Updated with Selection)
const LanguageListPage = ({
  lang,
  t,
  onSelectLanguage,
  languageGroups,
  onShowQrForLanguage,
  selectedPrograms, // NEW: Needed to calculate state
  onToggleLanguage, // NEW: Handler
}) => {
  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {languageGroups.map((group) => (
        <LanguageCard
          key={group.stableKey}
          languageName={
            lang === "en" ? group.displayNameEn : group.displayNameTh
          }
          lang={lang}
          onSelect={() => onSelectLanguage(group.stableKey)}
          messageCount={group.count}
          onShowQrForLanguage={() => onShowQrForLanguage(group.stableKey)}
          // --- NEW PROPS FOR CHECKBOX ---
          selectionState={getLanguageIndeterminateState(
            group,
            selectedPrograms
          )}
          onToggle={() => onToggleLanguage(group.stableKey, group.messages)}
        />
      ))}
      <div className="h-16"></div>
    </div>
  );
};

// New Page: Messages By Language Page (Updated with Selection)
const MessagesByLanguagePage = ({
  lang,
  t,
  selectedLanguageKey,
  onBack,
  onForward,
  hasPrev,
  hasNext,
  onSelectMessage,
  currentMessageList,
  languageGroups,
  pageStack, // Keep this if you use it for back button logic
  selectedPrograms, // NEW
  onToggleProgram, // NEW
}) => {
  const languageDisplayName = useMemo(() => {
    const group = languageGroups.find(
      (g) => g.stableKey === selectedLanguageKey
    );
    if (!group) return selectedLanguageKey;
    return lang === "en" ? group.displayNameEn : group.displayNameTh;
  }, [lang, selectedLanguageKey, languageGroups]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasPrev
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasPrev}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasNext
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasNext}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-1 ${ACCENT_COLOR_CLASS}">
        {languageDisplayName}
      </h1>
      <p className="text-sm text-gray-500 mb-4 font-semibold">
        {currentMessageList.length} {t.messages || "messages"}
      </p>

      {currentMessageList.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          lang={lang}
          onSelect={onSelectMessage}
          showLanguageName={false}
          // --- NEW PROPS FOR CHECKBOX ---
          isSelected={selectedPrograms.includes(item.id)}
          onToggle={() =>
            onToggleProgram(item.id, selectedLanguageKey, currentMessageList)
          }
        />
      ))}
      <div className="h-16"></div>
    </div>
  );
};

// Bookmarks Page Component
const BookmarksPage = ({
  lang,
  t,
  onSelect,
  userData,
  onBack,
  onForward,
  hasPrev,
  hasNext,
}) => {
  // Added nav props for consistency
  const bookmarkedItems = useMemo(() => {
    // Ensure userData.bookmarks is an array before calling includes()
    const bookmarks = userData?.bookmarks || [];
    return staticContent.filter((item) => bookmarks.includes(item.id));
  }, [userData.bookmarks]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Back and Forward Controls (added for consistency) */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasPrev
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasPrev}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasNext
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasNext}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.bookmarks}</h1>
      {bookmarkedItems.length > 0 ? (
        bookmarkedItems.map((item) => (
          // Show language name on search/bookmark cards
          <ContentCard
            key={item.id}
            item={item}
            lang={lang}
            onSelect={onSelect}
            showLanguageName={true}
          />
        ))
      ) : (
        <div className="text-center p-8 text-gray-500">
          <p>{t.no_bookmarks}</p>
          <p className="text-sm mt-2">{t.bookmark_tip}</p>
        </div>
      )}
      <div className="h-16"></div>
    </div>
  );
};

// Search Component
const SearchPage = ({
  lang,
  t,
  onSelect,
  searchTerm,
  onBack,
  onForward,
  hasPrev,
  hasNext,
}) => {
  // Receives searchTerm and nav props
  const filteredContent = useMemo(() => {
    if (!searchTerm) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();

    return staticContent.filter((item) => {
      // Robust search logic to prevent crashes
      const languageEn = item.languageEn?.toLowerCase() ?? "";
      const languageTh = item.langTh?.toLowerCase() ?? ""; // Corrected field access
      const titleEn = item.title_en?.toLowerCase() ?? "";
      const titleTh = item.title_th?.toLowerCase() ?? "";
      const verseEn = item.verse_en?.toLowerCase() ?? "";
      const verseTh = item.verse_th?.toLowerCase() ?? "";

      return (
        languageEn.includes(lowerSearchTerm) ||
        languageTh.includes(lowerSearchTerm) ||
        titleEn.includes(lowerSearchTerm) ||
        titleTh.includes(lowerSearchTerm) ||
        verseEn.includes(lowerSearchTerm) ||
        verseTh.includes(lowerSearchTerm)
      );
    });
  }, [searchTerm, lang]); // Now depends on global searchTerm

  const resultCount = filteredContent.length;

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Back and Forward Controls (added for consistency) */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasPrev
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasPrev}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasNext
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasNext}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        {t.search_results || "Search Results"}
      </h1>

      {searchTerm && (
        <p className="text-sm text-gray-600 mb-4 font-semibold">
          {resultCount}{" "}
          {resultCount === 1 ? t.result || "Result" : t.results || "Results"}{" "}
          {t.found || "found"} {t.for_query || "for"} "{searchTerm}".
        </p>
      )}

      {resultCount > 0 ? (
        filteredContent.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            lang={lang}
            onSelect={onSelect}
            showLanguageName={true}
          />
        ))
      ) : searchTerm ? (
        <div className="text-center p-8 text-gray-500">
          <p>
            {t.no_results_for || "No results found for"} "{searchTerm}".
          </p>
          <p className="mt-2 text-sm">
            {t.search_tip ||
              "Try searching by title, language, or a verse snippet."}
          </p>
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          <p>
            {t.start_typing_to_search ||
              "Start typing in the banner search bar to search all"}{" "}
            {staticContent.length}{" "}
            {staticContent.length === 1
              ? t.message || "message"
              : t.messages || "messages"}
            .
          </p>
        </div>
      )}
      <div className="h-16"></div>
    </div>
  );
};

// Other Pages (NotesPage, etc. are currently placeholders)
const OtherPage = ({ titleKey, t, onBack, onForward, hasPrev, hasNext }) => (
  <div className="p-4 pt-8 h-full overflow-y-auto">
    {/* Back and Forward Controls (added for consistency) */}
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={onBack}
        className={`text-sm font-semibold flex items-center transition-colors ${
          hasPrev
            ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
            : "text-gray-400 cursor-not-allowed"
        }`}
        disabled={!hasPrev}
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        {t.back || "Back"}
      </button>
      <button
        onClick={onForward}
        className={`text-sm font-semibold flex items-center transition-colors ${
          hasNext
            ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
            : "text-gray-400 cursor-not-allowed"
        }`}
        disabled={!hasNext}
      >
        {t.forward || "Forward"}
        <ChevronRight className="w-5 h-5 ml-1" />
      </button>
    </div>

    <h1 className="text-2xl font-bold text-gray-800 mb-4">{t[titleKey]}</h1>
    <p className="text-gray-600">
      {t.feature_coming_soon || "This feature is coming soon!"}
    </p>
  </div>
);

// --- NEW: Settings Page Component ---
// This replaces the "OtherPage" placeholder for "Settings"
const SettingsPage = ({
  lang,
  setLang,
  fontSize,
  setFontSize,
  t,
  onBack,
  onForward,
  hasPrev,
  hasNext,
}) => {
  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem("appLang", newLang);
  };

  const handleFontSizeChange = (e) => {
    const newSize = e.target.value;
    setFontSize(newSize);
    // --- REMOVED: localStorage.setItem("appFontSize", newSize); ---
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Back and Forward Controls */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasPrev
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasPrev}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasNext
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasNext}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.settings}</h1>

      {/* Settings Controls */}
      <div className="space-y-6 bg-white p-6 rounded-xl shadow-md">
        {/* Language Selector */}
        <div className="space-y-2">
          <label
            htmlFor="language-select"
            className="block text-sm font-medium text-gray-700"
          >
            {t.language_label || "Language"}
          </label>
          <select
            id="language-select"
            value={lang}
            onChange={handleLangChange}
            // 💡 ADD 'text-inherit' CLASS
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-red focus:border-brand-red transition duration-150 text-inherit"
          >
            <option value="en">English</option>
            <option value="th">ไทย (Thai)</option>
          </select>
        </div>

        {/* Font Size Selector */}
        <div className="space-y-2">
          <label
            htmlFor="font-size-select"
            className="block text-sm font-medium text-gray-700"
          >
            {t.font_size_label || "Font Size"}
          </label>
          <select
            id="font-size-select"
            value={fontSize}
            onChange={handleFontSizeChange}
            // 💡 ADD 'text-inherit' CLASS
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-red focus:border-brand-red transition duration-150 text-inherit"
          >
            <option value="14px">{t.font_size_small || "Small"}</option>
            <option value="16px">{t.font_size_medium || "Medium"}</option>
            <option value="20px">{t.font_size_large || "Large"}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  // --- NEW: Filtered Message Helper ---
  const getSelectedContent = () => {
    // 1. Get the list of actual message objects based on selectedPrograms
    const filteredContent = getFilteredMessages(
      staticContent,
      selectedPrograms
    );

    if (filteredContent.length === 0) {
      alert(t.select_content_first || "Please select some content first!");
      return null;
    }

    return filteredContent;
  };

  // --- HELPER: Make a single QR Card PNG for one item ---
  const generateQrCardPng = (item) => {
    const isThai = lang === "th";

    const languageDisplay = isThai ? item.langTh || "" : item.languageEn || "";
    const titleDisplay = isThai
      ? item.title_th || "ไม่มีชื่อ"
      : item.title_en || "Untitled";
    const verseDisplay = isThai ? item.verse_th || "" : item.verse_en || "";
    const readMoreLabel = isThai
      ? "ฟัง แบ่งปัน ดาวน์โหลดที่:"
      : "Listen, Share, Download at:";
    const cardUrl = `https://5fi.sh/T${item.id}`;

    // simple QR image service
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      cardUrl
    )}`;

    return new Promise((resolve, reject) => {
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.innerHTML = `
        <div id="qr-share-card"
             style="
               width: 420px;
               padding: 20px 18px 22px;
               border-radius: 26px;
               background: #ffffff;
               box-shadow: 0 4px 12px rgba(0,0,0,0.15);
               font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
               text-align: center;
             ">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
            <div>
              <img src="${AppLogo}" style="width:42px;height:42px;border-radius:6px;" />
            </div>
            <div style="flex:1;margin-left:8px;text-align:right;">
              <div style="font-size:18px;font-weight:700;color:#111827;">${languageDisplay}</div>
              <div style="font-size:18px;font-weight:700;color:#CC3333;">${titleDisplay}</div>
              <div style="font-size:11px;color:#4B5563;">Program # ${
                item.id
              }</div>
            </div>
          </div>

          <div style="font-size:12px;color:#374151;font-style:italic;margin:10px 6px 14px;min-height:40px;">
            ${verseDisplay}
          </div>

          <div style="background:#F9FAFB;border-radius:18px;padding:12px;margin-bottom:10px;">
            <img src="${qrImg}" style="width:220px;height:220px;" />
          </div>

          <div style="font-size:11px;color:#4B5563;margin-bottom:6px;">
            ${readMoreLabel}<br />
            <span style="color:#CC3333;word-break:break-all;">${cardUrl}</span>
          </div>

          <div style="font-size:10px;color:#9CA3AF;">
            ${
              t.scan_qr_tip ||
              "Scan the QR code or visit the link to access this content."
            }
          </div>
        </div>
      `;

      document.body.appendChild(tempContainer);
      const cardElement = tempContainer.querySelector("#qr-share-card");

      setTimeout(() => {
        html2canvas(cardElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        })
          .then((canvas) => {
            canvas.toBlob(
              (blob) => {
                document.body.removeChild(tempContainer);
                if (!blob) {
                  reject(new Error("Could not create image blob"));
                  return;
                }
                const fileName = `qr-card-${item.id}-${
                  isThai ? "th" : "en"
                }.png`;
                const file = new File([blob], fileName, { type: "image/png" });
                resolve(file);
              },
              "image/png",
              1.0
            );
          })
          .catch((err) => {
            document.body.removeChild(tempContainer);
            reject(err);
          });
      }, 200);
    });
  };

  // --- NEW: Share Filtered Content (single language) ---
  // --- SHARE: send first selected QR card as PNG (fallback: download) ---
  const handleShareSelected = async () => {
    const selectedContent = getSelectedContent();
    if (!selectedContent || selectedContent.length === 0) return;

    const item = selectedContent[0]; // use first selected card
    const isThai = lang === "th";
    const cardUrl = `https://5fi.sh/T${item.id}`;
    const label = isThai
      ? "ฟัง แบ่งปัน ดาวน์โหลดที่:"
      : "Listen, Share, Download at:";

    try {
      const file = await generateQrCardPng(item);

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: isThai ? "ข่าวดี" : "Thai: Good News",
          text: `${label} ${cardUrl}`,
          files: [file],
        });
        alert(t.content_shared || "QR card shared successfully!");
      } else {
        // fallback: just download the PNG
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert(
          t.share_failed_fallback ||
            "Your device can't share images directly, so the QR card was downloaded instead."
        );
      }
    } catch (error) {
      console.error("Sharing QR card failed:", error);
      alert(t.share_failed || "Sharing failed or was cancelled.");
    }
  };

  // --- NEW: Copy Filtered Content (single language) ---
  // --- COPY: copy first selected QR card as image (fallback: download) ---
  const handleCopySelected = async () => {
    const selectedContent = getSelectedContent();
    if (!selectedContent || selectedContent.length === 0) return;

    const item = selectedContent[0];

    try {
      const file = await generateQrCardPng(item);

      if (navigator.clipboard && window.ClipboardItem) {
        const blob = new Blob([file], { type: "image/png" });
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        alert(t.messages_copied || "QR card image copied!");
      } else {
        // fallback: download the PNG
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert(
          t.copy_failed_fallback ||
            "Your device can't copy images, so the QR card was downloaded instead."
        );
      }
    } catch (error) {
      console.error("Copy QR card failed:", error);
      alert(t.copy_failed || "Failed to copy QR card.");
    }
  };

  // --- NEW: Download/Print Filtered Content (single language) ---
  // --- Download/Print SELECTED QR CARDS (3x3 grid, shrunk) ---
  const handleDownloadSelected = () => {
    const selectedContent = getSelectedContent();
    if (!selectedContent) return;

    // group into pages of 9 items
    const pages = [];
    for (let i = 0; i < selectedContent.length; i += 9) {
      pages.push(selectedContent.slice(i, i + 9));
    }

    const isThai = lang === "th";

    const htmlPages = pages
      .map((pageItems) => {
        const cardsHtml = pageItems
          .map((item) => {
            const title = isThai
              ? item.title_th || "ไม่มีชื่อ"
              : item.title_en || "Untitled";
            const verse = isThai ? item.verse_th || "" : item.verse_en || "";
            const languageDisplay = isThai
              ? item.langTh || ""
              : item.languageEn || "";
            const readMoreLabel = isThai
              ? "ฟัง แบ่งปัน ดาวน์โหลดที่:"
              : "Listen, Share, Download at:";
            const cardUrl = `https://5fi.sh/T${item.id}`;

            // simple QR image (200x200) for the card
            const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              cardUrl
            )}`;

            return `
              <div class="qr-card">
                <div class="qr-header">
                  <div class="logo-wrap">
                    <img src="${AppLogo}" class="logo" />
                  </div>
                  <div class="header-text">
                    <div class="language">${languageDisplay}</div>
                    <div class="series">${title}</div>
                    <div class="program">Program # ${item.id}</div>
                  </div>
                </div>
                <div class="verse">${verse}</div>
                <div class="qr-wrap">
                  <img src="${qrImg}" class="qr-img" />
                </div>
                <div class="read-more">
                  ${readMoreLabel}<br />
                  <span class="url">${cardUrl}</span>
                </div>
                <div class="footer">${
                  t.scan_qr_tip ||
                  "Scan the QR code or visit the link to access this content."
                }</div>
              </div>
            `;
          })
          .join("");

        return `
          <div class="page">
            ${cardsHtml}
          </div>
        `;
      })
      .join("");

    const printHtml = `
      <html>
        <head>
          <title>${t.export_title || "QR Cards"}</title>
          <style>
            @page {
              size: A4;
              margin: 0.5in;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              margin: 0;
              padding: 0.25in;
            }
            .page {
              page-break-after: always;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0.4in;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .qr-card {
              border-radius: 16px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.12);
              padding: 10px 10px 14px;
              text-align: center;
              background: #ffffff;
            }
            .qr-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 6px;
            }
            .logo-wrap .logo {
              width: 28px;
              height: 28px;
            }
            .header-text {
              flex: 1;
              margin-left: 6px;
              text-align: right;
            }
            .language {
              font-size: 12px;
              font-weight: 700;
              color: #111827;
            }
            .series {
              font-size: 12px;
              font-weight: 700;
              color: #CC3333;
            }
            .program {
              font-size: 9px;
              color: #4B5563;
            }
            .verse {
              font-size: 9px;
              font-style: italic;
              color: #374151;
              margin: 6px 4px 6px;
              min-height: 34px;
            }
            .qr-wrap {
              background: #F9FAFB;
              border-radius: 12px;
              padding: 6px;
              margin-bottom: 6px;
            }
            .qr-img {
              width: 110px;
              height: 110px;
            }
            .read-more {
              font-size: 8px;
              color: #4B5563;
              margin-bottom: 3px;
            }
            .url {
              color: #CC3333;
              word-break: break-all;
            }
            .footer {
              font-size: 7px;
              color: #9CA3AF;
            }
          </style>
        </head>
        <body>
          ${htmlPages}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function(){ window.close(); }, 100);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  // --- State Management ---
  const initialLang = localStorage.getItem("appLang") || "en";
  const initialFontSize =
    localStorage.getItem("appFontSize") || DEFAULT_FONT_SIZE;

  const [lang, setLang] = useState(initialLang);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [pageStack, setPageStack] = useState([{ name: "Home" }]);
  const [track, setTrack] = useState(null);
  const [isAudioMinimized, setIsAudioMinimized] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Splash Screen state
  // --- NEW STATE FOR SEARCH TOGGLE (Fixes ReferenceError at line 1613) ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // ----------------------------------------------------------------------
  const [deferredPrompt, setDeferredPrompt] = useState(null); // Install Prompt state
  // --- NEW FUNCTION: navigateToHome (Fixes ReferenceError at line 1564) ---
  const navigateToHome = () => {
    // This function resets the pageStack to the single 'Home' entry
    setPageStack([{ name: "Home" }]);
    // Optionally, close the sidebar if it's open, if that's the desired behavior:
    // setIsDrawerOpen(false);
  };
  // --------------------------------------------------------------------------
  // *** FIX: Changed from array to object destructuring and passed setLang ***
  const { userData, saveUserData, isAuthReady, error, userId } =
    useFirebase(setLang); // Added userId

  // NEW: Global Search State
  const [searchTerm, setSearchTerm] = useState("");
  // --- NEW: Content Filter Logic ---
  const {
    selectedLangs,
    selectedPrograms,
    handleLanguageToggle,
    handleProgramToggle,
    clearSelection,
  } = useContentFilter();

  // NEW: Language QR Modal State
  const [isLanguageQrModalOpen, setIsLanguageQrModalOpen] = useState(false);
  const [modalLanguageName, setModalLanguageName] = useState("");
  const [modalLanguageShareUrl, setModalLanguageShareUrl] = useState("");

  const t = useMemo(() => i18n[lang], [lang]);

  // Group Messages by Language (Memoized for performance)
  const languageGroups = useMemo(() => {
    const groups = {};
    staticContent.forEach((item) => {
      const stableKey = item.stableKey; // e.g., 'Central Thai'

      // Check if the item matches the global search term
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const languageEn = item.languageEn?.toLowerCase() ?? "";
        const languageTh = item.langTh?.toLowerCase() ?? "";
        const titleEn = item.title_en?.toLowerCase() ?? "";
        const titleTh = item.title_th?.toLowerCase() ?? "";
        const verseEn = item.verse_en?.toLowerCase() ?? "";
        const verseTh = item.verse_th?.toLowerCase() ?? "";

        const matches =
          languageEn.includes(lowerSearchTerm) ||
          languageTh.includes(lowerSearchTerm) ||
          titleEn.includes(lowerSearchTerm) ||
          titleTh.includes(lowerSearchTerm) ||
          verseEn.includes(lowerSearchTerm) ||
          verseTh.includes(lowerSearchTerm);

        if (!matches) {
          return; // Skip this item if it doesn't match the search
        }
      }

      if (!groups[stableKey]) {
        groups[stableKey] = {
          stableKey,
          displayNameEn: item.languageEn,
          displayNameTh: item.langTh,
          count: 0,
          messages: [],
        };
      }
      groups[stableKey].count += 1;
      groups[stableKey].messages.push(item);
    });

    // Convert object to array and sort by display name in the current language
    return Object.values(groups).sort((a, b) => {
      const nameA = lang === "en" ? a.displayNameEn : a.displayNameTh;
      const nameB = lang === "en" ? b.displayNameEn : b.displayNameTh;
      return nameA.localeCompare(nameB, lang);
    });
  }, [lang, searchTerm]); // Recalculate if language or searchTerm changes

  // Memoize the flat list of content for current language message view
  const currentMessageList = useMemo(() => {
    const currentPage = pageStack[pageStack.length - 1];
    if (currentPage.name === "MessagesByLanguage") {
      const group = languageGroups.find((g) => g.stableKey === currentPage.key);
      return group ? group.messages : [];
    }
    return [];
  }, [pageStack, languageGroups]);

  // Memoize the total flat list of content (used for navigation in message view)
  const flatContentList = useMemo(() => {
    // Only generate the full list when viewing a specific language
    const currentPage = pageStack[pageStack.length - 1];
    if (
      currentPage.name === "ContentView" &&
      currentPage.sourceList === "language"
    ) {
      // The item ID is currentPage.key. Find the group it belongs to.
      const targetItem = staticContent.find((i) => i.id === currentPage.key);
      if (!targetItem) return [];

      const targetGroup = languageGroups.find(
        (g) => g.stableKey === targetItem.stableKey
      );
      return targetGroup ? targetGroup.messages : [];
    } else if (
      currentPage.name === "ContentView" &&
      currentPage.sourceList === "search"
    ) {
      // Re-use the search page's filtering logic
      if (!searchTerm) return [];
      const lowerSearchTerm = searchTerm.toLowerCase();

      return staticContent.filter((item) => {
        const languageEn = item.languageEn?.toLowerCase() ?? "";
        const languageTh = item.langTh?.toLowerCase() ?? "";
        const titleEn = item.title_en?.toLowerCase() ?? "";
        const titleTh = item.title_th?.toLowerCase() ?? "";
        const verseEn = item.verse_en?.toLowerCase() ?? "";
        const verseTh = item.verse_th?.toLowerCase() ?? "";

        return (
          languageEn.includes(lowerSearchTerm) ||
          languageTh.includes(lowerSearchTerm) ||
          titleEn.includes(lowerSearchTerm) ||
          titleTh.includes(lowerSearchTerm) ||
          verseEn.includes(lowerSearchTerm) ||
          verseTh.includes(lowerSearchTerm)
        );
      });
    }
    // Fallback for other contexts (e.g., bookmarks or direct content view)
    return staticContent;
  }, [pageStack, languageGroups, searchTerm]);

  // --- Navigation and State Logic ---

  const navigateTo = (pageName, key = null, sourceList = null) => {
    setPageStack((prev) => [...prev, { name: pageName, key, sourceList }]);
    setIsDrawerOpen(false);
    // Clear search term when navigating away from Home/Search
    if (pageName !== "Search" && pageName !== "Home") {
      setSearchTerm("");
    }
  };

  const goBack = () => {
    if (pageStack.length > 1) {
      setPageStack((prev) => prev.slice(0, -1));
    } else {
      // Safety net: If we try to go back from the root, reset to Home.
      setPageStack([{ name: "Home" }]);
    }
  };

  const goForward = () => {
    // Not used for navigation stack but kept for consistency
    console.log("Forward navigation not implemented in stack model.");
  };

  const hasPrev = pageStack.length > 1;
  const hasNext = false; // Always false in this stack implementation

  // Handler for Language Card click
  const handleSelectLanguage = (stableKey) => {
    navigateTo("MessagesByLanguage", stableKey);
  };

  // Handler for Message Card click
  const handleSelectMessage = (item, sourceList = "language") => {
    navigateTo("ContentView", item.id, sourceList);
  };

  // Handler for Content View navigation (Next/Prev)
  const handleNextPrevMessage = (direction) => {
    const currentPage = pageStack[pageStack.length - 1];
    if (currentPage.name !== "ContentView") return;

    const currentItemId = currentPage.key;
    const currentIndex = flatContentList.findIndex(
      (item) => item.id === currentItemId
    );

    let newIndex;
    if (direction === "next" && currentIndex < flatContentList.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === "prev" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      return; // Cannot move
    }

    const newItem = flatContentList[newIndex];
    // Replace current item in stack instead of pushing a new one
    setPageStack((prev) => {
      const newStack = [...prev];
      newStack[newStack.length - 1] = {
        name: "ContentView",
        key: newItem.id,
        sourceList: currentPage.sourceList,
      };
      return newStack;
    });
    setTrack(newItem); // Auto-play next track if audio player is active
  };

  // Handler for Content Card play button
  const handlePlayMessage = (item) => {
    setTrack(item);
    setIsAudioMinimized(false);
  };

  // Handler for Language QR Modal button
  const handleShowQrForLanguage = (stableKey) => {
    const group = languageGroups.find((g) => g.stableKey === stableKey);
    if (group) {
      setModalLanguageName(
        lang === "en" ? group.displayNameEn : group.displayNameTh
      );
      // Construct the shareable URL
      const url = `${window.location.origin}/?langKey=${encodeURIComponent(
        stableKey
      )}`;
      setModalLanguageShareUrl(url);
      setIsLanguageQrModalOpen(true);
    }
  };

  // Close Language QR Modal
  const handleCloseLanguageQrModal = () => {
    setIsLanguageQrModalOpen(false);
    setModalLanguageName("");
    setModalLanguageShareUrl("");
  };

  // Audio Player Toggle
  const toggleAudioMinimize = () => {
    setIsAudioMinimized((p) => !p);
  };

  // --- NEW: PWA Install Click Handler ---
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted the PWA install prompt");
      } else {
        console.log("User dismissed the PWA install prompt");
      }
      // We can only use the prompt once, so clear it
      setDeferredPrompt(null);
      setIsDrawerOpen(false); // Close drawer after action
    }
  };

  // --- Current Content and Navigation Status ---
  const currentPage = pageStack[pageStack.length - 1];
  const currentItem =
    currentPage.name === "ContentView"
      ? staticContent.find((item) => item.id === currentPage.key)
      : null;

  // Shared Search handler (used by header + floating bar)
  const handleSearchChange = (value) => {
    setSearchTerm(value);

    if (value) {
      if (currentPage.name !== "Search") {
        navigateTo("Search");
      }
    } else {
      // If search cleared while on Search page, go back Home
      if (currentPage.name === "Search") {
        navigateTo("Home");
      }
    }
  };

  // Determine current index and next/prev status for ContentView
  const currentItemIndex = currentItem
    ? flatContentList.findIndex((item) => item.id === currentItem.id)
    : -1;
  const canGoPrev = currentItemIndex > 0;
  const canGoNext =
    currentItemIndex !== -1 && currentItemIndex < flatContentList.length - 1;

  // --- Effects ---

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, []);

  // URL Parameter Effect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langKey = urlParams.get("langKey");

    if (langKey) {
      const decodedLangKey = decodeURIComponent(langKey);
      const group = languageGroups.find((g) => g.stableKey === decodedLangKey);

      if (group) {
        setPageStack([
          { name: "Home" },
          { name: "MessagesByLanguage", key: decodedLangKey },
        ]);

        // --- REMOVED window.history.replaceState(...) ---
        // By removing the replaceState, the browser history remains intact,
        // allowing the <Back button to function correctly.
      }
    }
    // ... rest of useEffect
  }, [languageGroups]); // Depend on languageGroups to ensure data is loaded

  // --- NEW: PWA Install Prompt Listener ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      console.log("beforeinstallprompt event captured.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // --- ADDED: New Global Font Size Effect ---
  useEffect(() => {
    // Apply the selected font size to the root <html> element
    // This will scale all rem-based Tailwind classes.
    if (fontSize) {
      document.documentElement.style.fontSize = fontSize;
      // We also consolidate saving to localStorage here
      localStorage.setItem("appFontSize", fontSize);
    }
  }, [fontSize]); // Rerun this effect whenever fontSize changes
  // --- END of new block ---

  // *** FIX: Added Firebase Loading Check ***
  // If the app is not ready (Firebase has not loaded user state), show a loading screen.
  if (!isAuthReady && !isLoading) {
    // Only show auth loading AFTER splash screen
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
        <Zap className="w-12 h-12 text-brand-red animate-pulse mb-4" />
        <p className="text-xl font-semibold text-gray-700">
          {t.loading_app || "Loading application and connecting..."}
        </p>
        {error && <p className="mt-4 text-red-500 text-sm">Error: {error}</p>}
      </div>
    );
  }

  // --- Render Logic ---

  let PageContent;
  switch (currentPage.name) {
    case "Home":
      PageContent = (
        <LanguageListPage
          lang={lang}
          t={t}
          onSelectLanguage={handleSelectLanguage}
          languageGroups={languageGroups}
          onShowQrForLanguage={handleShowQrForLanguage}
          // --- NEW WIRING ---
          selectedPrograms={selectedPrograms}
          onToggleLanguage={handleLanguageToggle}
        />
      );
      break;

    case "SelectedContent":
      PageContent = (
        <SelectedContentPage
          lang={lang}
          t={t}
          onBack={goBack}
          selectedPrograms={selectedPrograms}
          languageGroups={languageGroups}
          allMessages={staticContent}
          onClearSelection={clearSelection}
          onShare={handleShareSelected}
          onCopy={handleCopySelected}
          onDownload={handleDownloadSelected}
        />
      );
      break;

    // --- THIS IS THE MISSING BLOCK THAT FIXES THE 404 ERROR ---
    case "ContentView":
      PageContent = (
        <ContentView
          item={currentItem}
          lang={lang}
          t={t}
          onBack={goBack}
          onForward={() => handleNextPrevMessage("next")}
          hasPrev={canGoPrev}
          hasNext={canGoNext}
          userData={userData}
          saveUserData={saveUserData}
          onPlay={handlePlayMessage}
          pageStack={pageStack}
        />
      );
      break;
    // --------------------------------------------------------

    case "MessagesByLanguage":
      PageContent = (
        <MessagesByLanguagePage
          lang={lang}
          t={t}
          selectedLanguageKey={currentPage.key}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onSelectMessage={(item) => handleSelectMessage(item, "language")}
          currentMessageList={currentMessageList}
          languageGroups={languageGroups}
          pageStack={pageStack}
          // --- NEW WIRING ---
          selectedPrograms={selectedPrograms}
          onToggleProgram={handleProgramToggle}
        />
      );
      break;
    case "Search":
      PageContent = (
        <SearchPage
          lang={lang}
          t={t}
          onSelect={(item) => handleSelectMessage(item, "search")}
          searchTerm={searchTerm}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          // --- FIX: ADDED pageStack PROP ---
          pageStack={pageStack}
        />
      );
      break;
    case "Bookmarks":
      PageContent = (
        <BookmarksPage
          lang={lang}
          t={t}
          onSelect={(item) => handleSelectMessage(item, "bookmark")}
          userData={userData}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          // --- FIX: ADDED pageStack PROP ---
          pageStack={pageStack}
        />
      );
      break;
    case "Notes":
      PageContent = (
        <OtherPage
          titleKey="notes"
          t={t}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          // --- FIX: ADDED pageStack PROP ---
          pageStack={pageStack}
        />
      );
      break;
    case "Settings":
      // --- NEW: Render the actual SettingsPage component ---
      PageContent = (
        <SettingsPage
          lang={lang}
          setLang={setLang}
          fontSize={fontSize}
          setFontSize={setFontSize}
          t={t}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          // --- FIX: ADDED pageStack PROP ---
          pageStack={pageStack}
        />
      );
      break;

    default:
      PageContent = (
        <div className="p-4 pt-8 text-center text-red-500">
          404: Page not found.
          <button
            onClick={() => setPageStack([{ name: "Home" }])}
            className="mt-4 p-2 bg-red-100 rounded"
          >
            Go Home
          </button>
        </div>
      );
  }

  // Determine if the search bar should be fully visible or just an icon
  const isSearchPage = currentPage.name === "Search";

  // --- START OF MAIN RETURN ---
  return (
    // 💡 CONDITIONAL RENDER: Show Splash Screen OR the App
    isLoading ? (
      // 1. --- SPLASH SCREEN COMPONENT (Visible while isLoading is TRUE) ---
      <div
        className={`fixed inset-0 flex items-center justify-center ${PRIMARY_COLOR_CLASS} z-50`}
      >
        <img
          src={AppLogo} // Your optimized square logo source
          alt={t.app_name || "App Loading"}
          className="
            w-72 h-72 
            lg:w-96 lg:h-96 
            rounded-3xl shadow-2xl animate-pulse 
            object-cover
          "
        />
      </div>
    ) : (
      // 2. --- NORMAL APPLICATION START (Visible while isLoading is FALSE) ---
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* --- LANGUAGE QR MODAL --- */}
        <LanguageQrModal
          isOpen={isLanguageQrModalOpen}
          onClose={handleCloseLanguageQrModal}
          languageDisplayName={modalLanguageName}
          languageShareUrl={modalLanguageShareUrl}
          t={t}
        />

        {/* --- HEADER (Banner) --- */}
        <header
          className={`sticky top-0 w-full ${PRIMARY_COLOR_CLASS} py-0.5 px-1 shadow-lg z-30 flex justify-between items-center rounded-b-xl md:py-3 md:px-6`}
        >
          {/* LEFT SECTION: Hamburger Menu and Logo/Link */}
          <div className="flex items-center flex-shrink-0">
            {/* 1. Sidebar Toggle Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <Menu className="w-7 h-7" />
            </button>

            {/* 2. Logo (Now a link to 5fish.mobi/th?r=Asia&country=Thailand) */}
            <a
              href="https://5fish.mobi/th?r=Asia&country=Thailand"
              target="_blank"
              rel="noopener noreferrer"
              title="5fish.mobi/th?r=Asia&country=Thailand"
              className="flex items-center text-white **p-0** rounded-lg hover:bg-red-800 transition-colors **ml-2** focus:outline-none focus:ring-2 focus:ring-white"
            >
              {/* Enlarged Logo Image */}
              <img
                src={BannerLogo}
                alt={t.app_name}
                className="h-10 md:h-12 w-auto rounded-md shadow-sm bg-white p-1"
              />
              {/* --- "หน้าแรก" (Home Text) HAS BEEN REMOVED --- */}
            </a>
          </div>

          {/* RIGHT SECTION: Controls (Font, Language, Search, Selected Content) */}
          <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
            {/* 1. Font Size Buttons */}
            <FontSizeButtons fontSize={fontSize} setFontSize={setFontSize} />

            {/* 2. Language Switch Button */}
            <LanguageToggle lang={lang} setLang={setLang} t={t} />

            {/* 3. QR Code / Selected Content Button (NEW) */}
            <button
              onClick={() => navigateTo("SelectedContent")}
              className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors"
              aria-label={t.view_selected || "View Selected Content"}
              title={t.view_selected || "View Selected Content"}
            >
              <Qrcode className="w-6 h-6" />
            </button>

            {/* 4. Search Button (Toggle for Search Input) */}
            <button
              onClick={() => setIsSearchOpen(true)} // Opens the search input field
              className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors"
              aria-label="Toggle Search"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* --- TOGGLED SEARCH BAR (Below Header) --- */}
        {isSearchOpen && (
          // IMPORTANT CHANGE: Increased top-16 to top-20 (5rem) and lowered z-index to z-10
          <div className="sticky top-20 w-full p-2 bg-white shadow-xl z-10">
            <div className="relative w-full flex items-center">
              {/* Search Input Field */}
              <input
                type="text"
                placeholder={
                  t.search_placeholder || "Search languages or messages.."
                }
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full p-2 pl-10 text-gray-800 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-red-300 transition duration-150"
                style={{ fontSize: "1.2rem" }} // For the 1-point increase
                autoFocus
              />
              {/* Search Icon color changed to Thai Red */}
              <Search
                className={`absolute left-2 top-1.5 w-5 h-5 ${ACCENT_COLOR_CLASS}`}
              />

              {/* Close Button */}
              <button
                onClick={() => setIsSearchOpen(false)} // Close the search bar
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800"
                aria-label="Close Search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-grow overflow-y-auto pb-20">{PageContent}</main>

        {/* --- AUDIO PLAYER --- */}
        <AudioPlayer
          track={track}
          isMinimized={isAudioMinimized}
          toggleMinimize={toggleAudioMinimize}
          t={t}
        />

        {/* --- FLOATING UTILITY BAR (Search + Lang + Font + Clear) --- */}
        <FloatingUtilityBar
          t={t}
          lang={lang}
          setLang={setLang}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          selectedCount={selectedPrograms.length}
          onClearSelection={clearSelection}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />

        {/* --- NAVIGATION DRAWER (Sidebar) --- */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${
            isDrawerOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Overlay (Click to close) */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div
            className={`absolute left-0 top-0 w-72 h-full bg-white shadow-2xl transition-transform duration-300 transform ${
              isDrawerOpen ? "translate-x-0" : "-translate-x-full"
              // 💡 ADD rounded-tr-xl CLASS HERE
            } rounded-tr-xl flex flex-col`}
          >
            {/* Header */}
            <div
              className={`${PRIMARY_COLOR_CLASS} px-3 py-4 flex justify-start items-center space-x-4 rounded-r-xl flex-shrink-0`}
            >
              {/* 1. The Square Logo (Flush Left, Rounded) */}
              <img
                src={AppLogo}
                alt="Logo"
                className="w-11 h-11 rounded-xl bg-white shadow-md p-1"
              />

              {/* 2. The App Title */}
              <h2 className="text-xl font-bold text-white flex-grow">
                {t.app_name}
              </h2>

              {/* 3. Close Button (Pushed to the right automatically by flex-grow on title) */}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-white p-1 hover:bg-red-800 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links (Scrollable) */}
            <nav className="p-4 space-y-2 overflow-y-auto flex-grow">
              {/* Navigation Items */}
              {[
                { name: "Home", icon: Home, target: "Home" },
                { name: "Search", icon: Search, target: "Search" },
                { name: "Bookmarks", icon: Bookmark, target: "Bookmarks" },
                { name: "Notes", icon: Pen, target: "Notes" },
                { name: "Settings", icon: Settings, target: "Settings" },
                // --- NEW: 5fish Website Link ---
                {
                  name: "5fish Website",
                  icon: ExternalLink,
                  target: "5fish",
                  url: "https://5fish.mobi/",
                },
              ].map((item) => {
                // --- NEW: Logic to render a link or a button ---
                if (item.url) {
                  return (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center p-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <item.icon className="w-6 h-6 mr-3" />
                      {item.name}
                    </a>
                  );
                }

                // Original button logic
                return (
                  <button
                    key={item.name}
                    onClick={() => navigateTo(item.target)}
                    className={`w-full flex items-center p-3 rounded-lg font-semibold transition-colors ${
                      currentPage.name === item.target
                        ? `${ACCENT_COLOR_CLASS} bg-red-100`
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-6 h-6 mr-3" />
                    {t[item.name.toLowerCase()]}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Controls (Sticky) */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-3">
              {/* --- NEW: Auth Status --- */}
              <div className="text-xs text-gray-500 space-y-1">
                <p className="truncate">
                  {t.auth_status || "Status"}:
                  <span
                    className={`font-semibold ${
                      isAuthReady ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {isAuthReady
                      ? t.auth_ready || " Ready"
                      : t.auth_pending || " Pending"}
                  </span>
                </p>
                <p className="truncate">
                  {t.user_id || "User ID"}:
                  <span className="font-mono text-gray-600 ml-1">
                    {userId || "..."}
                  </span>
                </p>
              </div>

              {/* --- NEW: Install Button --- */}
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className={`w-full flex items-center justify-center p-3 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors`}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t.install_app || "Install App"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    ) // This is the closing parenthesis for the entire application UI block
  ); // This is the closing parenthesis for the main return
} // This is the closing bracket for the App function
