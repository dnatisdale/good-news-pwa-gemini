import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import html2canvas from "html2canvas";
import Header from "./components/Header";

import { useFirebase } from "./hooks/useFirebase";
import { i18n } from "./i18n";
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
} from "./components/Icons";
import { staticContent } from "./data/staticContent";
import QRCodeDisplay from "./components/QRCodeDisplay";
import AppLogo from "./assets/splash-screen-logo.svg";
import BannerLogo from "./assets/banner-logo.svg";

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
    localStorage.setItem("appFontSize", size);
  };

  // Style for unselected buttons (THAI_BLUE)
  const unselectedStyle = { backgroundColor: THAI_BLUE, color: "#ffffff" };
  // Style for selected button (White background, THAI_RED text)
  const selectedStyle = { backgroundColor: "#ffffff", color: THAI_RED };

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

// Language Card Component (For initial language list)
const LanguageCard = ({
  languageName,
  lang,
  onSelect,
  messageCount,
  onShowQrForLanguage,
}) => {
  return (
    <div
      className={`bg-white p-4 mb-3 rounded-xl shadow-md border-b-4 border-brand-red cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.01]`}
    >
      <div className="flex items-center justify-between">
        <div onClick={() => onSelect(languageName)} className="flex-grow pr-4">
          <h3 className={`text-2xl font-bold ${ACCENT_COLOR_CLASS}`}>
            {languageName}
          </h3>
          <p className={`text-sm text-gray-500 mt-1`}>
            {lang === "en" ? "Tap to view" : "แตะเพื่อดู"} ({messageCount}{" "}
            {lang === "en" ? "messages" : "ข้อความ"})
          </p>
        </div>
        {/* NEW: QR Button for Language */}
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

// Content Card Component (For message list within a language)
const ContentCard = ({ item, lang, onSelect, showLanguageName = true }) => {
  // Robust data access and using the correct item.langTh field
  const languageDisplayName =
    lang === "en" ? item.languageEn ?? "" : item.langTh ?? "";
  const messageTitle =
    lang === "en"
      ? item.title_en ?? "Untitled Message"
      : item.title_th ?? "ข้อความที่ไม่มีชื่อ";

  return (
    <div
      className={`bg-white p-4 mb-3 rounded-xl shadow-md border-t-4 border-gray-200 cursor-pointer transition-transform hover:shadow-lg hover:border-brand-red`}
      onClick={() => onSelect(item)}
    >
      {/* Language Name (Only shown if required, e.g., on Search/Bookmarks) */}
      {showLanguageName && (
        <p className={`text-base font-semibold ${ACCENT_COLOR_CLASS} mb-1`}>
          {languageDisplayName}
        </p>
      )}
      {/* Message Title (Primary focus on this card) */}
      <h3
        className={`text-lg font-bold ${TEXT_COLOR_CLASS} ${
          showLanguageName ? "" : "mt-1"
        }`}
      >
        {messageTitle}
      </h3>
      {/* Program Number */}
      <p className="text-sm text-gray-500 mt-0.5">Program No. {item.id}</p>
    </div>
  );
};

// --- Share Card Print View Component (For downloadable PNG) ---
const ShareCardPrintView = ({ item, lang, t, cardUrl }) => {
  const title =
    lang === "en" ? item.title_en ?? "Untitled" : item.title_th ?? "ไม่มีชื่อ";
  const verse = lang === "en" ? item.verse_en ?? "" : item.verse_th ?? "";

  // NEW: Labels based on user request for the downloadable card
  const appTitleDisplay = lang === "en" ? "Thai: Good News" : "ข่าวดี";
  const readMoreLabel =
    lang === "en" ? "Listen, Share, Download at" : "ฟัง แบ่งปัน ดาวน์โหลดที่";

  return (
    <div
      id="print-view-container"
      className="bg-white p-8 rounded-lg shadow-lg"
      style={{ width: "400px", margin: "auto", fontFamily: "sans-serif" }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        {appTitleDisplay} {/* NEW: Use specific title */}
      </h2>
      <h3 className="text-xl font-bold text-brand-red mb-2 text-center">
        {title} (Program #:{item.id}) {/* NEW: Use Program #: label */}
      </h3>

      {/* BIBLE VERSE ADDED TO QR CARD */}
      <p className="text-sm text-gray-700 mb-4 whitespace-pre-line text-center">
        {verse}
      </p>

      <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
        <QRCodeDisplay
          url={cardUrl}
          size={200}
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </div>

      <p className="text-sm text-gray-600 text-center break-all">
        {readMoreLabel}: <br /> {/* NEW: Use specific label */}
        <a href={cardUrl} className="text-brand-red underline">
          {cardUrl}
        </a>
      </p>
      <p className="text-xs text-gray-500 mt-4 text-center">
        {t.scan_qr_tip ||
          "Scan the QR code or visit the link to access this content."}
      </p>
    </div>
  );
};

// --- Language QR Modal Component ---
const LanguageQrModal = ({
  isOpen,
  onClose,
  languageDisplayName,
  languageShareUrl,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          {t.share_language || "Share Language"}
        </h2>
        <h3 className="text-lg font-semibold text-brand-red mb-4 text-center">
          {languageDisplayName}
        </h3>
        <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
          <QRCodeDisplay
            url={languageShareUrl}
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

// Content View Component (Detail Page)
const ContentView = ({
  item,
  lang,
  t,
  onBack,
  onForward,
  hasPrev,
  hasNext,
  userData,
  saveUserData,
  onPlay,
}) => {
  const [isQrLarge, setIsQrLarge] = useState(false);

  // We rely on userData being safely initialized with an array for bookmarks
  const isBookmarked = userData?.bookmarks?.includes(item.id) ?? false;
  const cardUrl = `https://5fi.sh/T${item.id}`;
  // FIX: Using robust check and the correct langTh field
  const languageDisplay =
    lang === "en" ? item.languageEn ?? "" : item.langTh ?? "";
  const titleDisplay =
    lang === "en"
      ? item.title_en ?? "Untitled Message"
      : item.title_th ?? "ข้อความที่ไม่มีชื่อ";
  // Save verse display for moving it later
  const verseDisplay =
    lang === "en"
      ? item.verse_en ?? t.no_verse_content
      : item.verse_th ?? t.no_verse_content;

  const toggleBookmark = () => {
    // Ensure we are working with an array
    const currentBookmarks = userData.bookmarks || [];
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = currentBookmarks.filter((id) => id !== item.id);
    } else {
      newBookmarks = [...currentBookmarks, item.id];
    }
    saveUserData({ ...userData, bookmarks: newBookmarks });
  };

  // --- REVISED handleShare: Calls the new global Web Share function ---
  const handleShare = () => {
    // Pass the current language, program ID, and URL to the global helper
    shareQRCard(lang, item.id, cardUrl);
  };

  const downloadShareCard = async () => {
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    document.body.appendChild(tempContainer);

    const root = ReactDOM.createRoot(tempContainer);
    root.render(
      <ShareCardPrintView item={item} lang={lang} t={t} cardUrl={cardUrl} />
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const elementToCapture = tempContainer.querySelector(
      "#print-view-container"
    );
    if (elementToCapture) {
      html2canvas(elementToCapture, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
        .then((canvas) => {
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngFile;
          downloadLink.download = `share-card-${item.id}-${lang}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        })
        .finally(() => {
          root.unmount();
          document.body.removeChild(tempContainer);
        });
    } else {
      root.unmount();
      document.body.removeChild(tempContainer);
      alert("Could not find print view container.");
    }
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

      {/* Language Name (Thai Flag Red - Largest) */}
      <h1 className={`text-4xl font-extrabold mb-2 ${ACCENT_COLOR_CLASS}`}>
        {languageDisplay}
      </h1>

      <div className="flex justify-between items-center mb-4 border-b pb-3">
        {/* Message Title (Secondary) */}
        <p className="text-xl font-semibold text-gray-700">{titleDisplay}</p>

        <button
          onClick={toggleBookmark}
          className={`p-2 rounded-full transition-colors ${
            isBookmarked
              ? "bg-yellow-400 text-white"
              : "bg-gray-200 text-gray-600 hover:bg-yellow-300"
          }`}
        >
          <Bookmark className="w-6 h-6 fill-current" />
        </button>
      </div>

      {/* --- LISTEN BUTTON (Thai Flag Blue) --- */}
      {item.trackDownloadUrl && (
        <button
          onClick={() => onPlay(item)}
          // Using THAI_BLUE for button background
          style={{ backgroundColor: THAI_BLUE }}
          className="w-full p-4 mb-6 font-bold text-white text-lg rounded-xl transition-colors hover:opacity-90 shadow-lg flex items-center justify-center"
        >
          <PlayCircle className="w-6 h-6 mr-2" />
          {t.listen_offline || "Listen (Offline Enabled)"}
        </button>
      )}

      {/* --- MAIN CONTENT GRID: Mobile (1-col) | Tablet/Laptop (2-col) --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* --- COLUMN 1: QR Code, Share/Export Buttons --- */}
        <div className="md:order-1 flex flex-col items-center">
          {/* QR CODE DISPLAY (Small and Expandable) */}
          <div
            className="flex flex-col items-center p-4 bg-white rounded-xl shadow-inner mb-6 cursor-pointer transition-all duration-300"
            onClick={() => setIsQrLarge((p) => !p)}
            style={{
              maxWidth: isQrLarge ? "100%" : "200px",
              margin: "0 auto 1.5rem auto",
            }}
          >
            <div className="p-2 bg-gray-50 rounded-lg">
              <QRCodeDisplay
                url={cardUrl}
                size={isQrLarge ? 250 : 150}
                fgColor="#000000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {isQrLarge
                ? t.tap_to_shrink || "Tap to shrink"
                : t.tap_to_enlarge || "Tap to enlarge"}
            </p>
          </div>

          {/* SHARE / EXPORT SECTION */}
          <div className="grid grid-cols-2 gap-3 mb-6 w-full">
            <button
              onClick={handleShare}
              className="p-3 font-bold text-white rounded-xl bg-brand-red transition-colors hover:bg-red-800 shadow-md flex flex-col items-center justify-center text-sm leading-tight"
            >
              <Share2 className="w-5 h-5 mb-1" /> {t.share_copy || "Share/Copy"}
            </button>
            <button
              onClick={downloadShareCard}
              className="p-3 font-bold text-white rounded-xl bg-brand-red transition-colors hover:bg-red-800 shadow-md flex flex-col items-center justify-center text-sm leading-tight"
            >
              <Download className="w-5 h-5 mb-1" />
              {t.download || "Download"} <br /> {t.qr_card || "QR Card"}
            </button>
          </div>
        </div>

        {/* --- COLUMN 2: Bible Verse and Notes --- */}
        <div className="md:order-2">
          {/* BIBLE VERSE */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-6">
            <p className="text-base leading-normal text-gray-700 whitespace-pre-line">
              {verseDisplay}
            </p>
          </div>

          {/* NOTES SECTION */}
          <div className="p-4 bg-red-50 border-l-4 border-brand-red rounded-lg mt-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {t.my_notes || "My Notes"}
            </h2>
            <p className="text-sm text-gray-500">
              {t.notes_feature_tip ||
                "Notes feature coming soon! You can view all saved notes on the Notes page."}
            </p>
          </div>
        </div>
      </div>
      {/* --- END MAIN CONTENT GRID --- */}
    </div>
  );
};

// New Page: Language List Page
const LanguageListPage = ({
  lang,
  t,
  onSelectLanguage,
  languageGroups,
  onShowQrForLanguage,
}) => {
  // Search is now handled globally in the App component, so no local searchTerm here
  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {languageGroups.map((group) => (
        <LanguageCard
          key={group.stableKey}
          languageName={
            lang === "en" ? group.displayNameEn : group.displayNameTh
          }
          lang={lang}
          onSelect={() => onSelectLanguage(group.stableKey)} // Use stableKey for selection
          messageCount={group.count}
          onShowQrForLanguage={() => onShowQrForLanguage(group.stableKey)} // Pass handler for QR button
        />
      ))}
      <div className="h-16"></div>
    </div>
  );
};

// New Page: Messages By Language Page
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
}) => {
  // Determine the display name for the header
  const languageDisplayName = useMemo(() => {
    const group = languageGroups.find(
      (g) => g.stableKey === selectedLanguageKey
    );
    if (!group) return selectedLanguageKey;
    return lang === "en" ? group.displayNameEn : group.displayNameTh;
  }, [lang, selectedLanguageKey, languageGroups]);

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

      {/* Language Title - Red, emphasized */}
      <h1 className={`text-2xl font-bold mb-1 ${ACCENT_COLOR_CLASS}`}>
        {languageDisplayName}
      </h1>
      <p className="text-sm text-gray-500 mb-4 font-semibold">
        {currentMessageList.length} {t.messages || "messages"}
      </p>
      {/* NOTE: showLanguageName is set to false here to remove the language name from individual message cards */}
      {currentMessageList.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          lang={lang}
          onSelect={onSelectMessage}
          showLanguageName={false}
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
    localStorage.setItem("appFontSize", newSize);
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
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-red focus:border-brand-red transition duration-150"
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
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-red focus:border-brand-red transition duration-150"
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
  const [deferredPrompt, setDeferredPrompt] = useState(null); // Install Prompt state

  // *** FIX: Changed from array to object destructuring and passed setLang ***
  const { userData, saveUserData, isAuthReady, error, userId } =
    useFirebase(setLang); // Added userId

  // NEW: Global Search State
  const [searchTerm, setSearchTerm] = useState("");

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
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    }
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
          onShowQrForLanguage={handleShowQrForLanguage} // Passed handler
        />
      );
      break;
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
        />
      );
      break;
    case "ContentView":
      PageContent = (
        <ContentView
          item={currentItem}
          lang={lang}
          t={t}
          onBack={() => handleNextPrevMessage("prev")}
          onForward={() => handleNextPrevMessage("next")}
          hasPrev={canGoPrev}
          hasNext={canGoNext}
          userData={userData}
          saveUserData={saveUserData}
          onPlay={handlePlayMessage}
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
      <div
        className="min-h-screen bg-gray-100 flex flex-col"
        style={{ fontSize }}
      >
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
          className={`sticky top-0 w-full ${PRIMARY_COLOR_CLASS} p-4 shadow-lg z-30 flex justify-between items-center rounded-b-xl md:py-3 md:px-6`}
        >
          {/* LEFT SECTION: Hamburger Menu and Logo (Now grouped) */}
          <div className="flex items-center flex-shrink-0">
            {/* 1. Navigation Button (Left) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors"
            >
              <Menu className="w-7 h-7" />
            </button>

            {/* 2. Logo Image (Now immediately after the hamburger) */}
            <img
              src={BannerLogo}
              alt={t.app_name}
              className="h-8 md:h-10 w-auto rounded-md shadow-sm mr-4 ml-3 bg-white p-1"
            />
          </div>

          {/* CENTER SECTION: Search Bar (Wider max-width for centering effect) */}
          <div className="flex items-center w-full max-w-lg mx-3 md:mx-6">
            <div className="relative w-full">
              {/* Search Input Field */}
              <input
                type="text"
                placeholder={
                  t.search_placeholder || "Search languages or messages..."
                }
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (currentPage.name !== "Search" && e.target.value) {
                    navigateTo("Search");
                  }
                }}
                className="w-full p-2 pl-10 text-gray-800 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-red-300 transition duration-150"
              />
              {/* Search Icon color changed to Thai Red */}
              <Search
                className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 ${ACCENT_COLOR_CLASS}`}
              />

              {/* Clear Button */}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT SECTION: Controls */}
          <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
            <FontSizeButtons fontSize={fontSize} setFontSize={setFontSize} />
            <LanguageToggle lang={lang} setLang={setLang} t={t} />
          </div>
        </header>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-grow overflow-y-auto pb-20">{PageContent}</main>

        {/* --- AUDIO PLAYER --- */}
        <AudioPlayer
          track={track}
          isMinimized={isAudioMinimized}
          toggleMinimize={toggleAudioMinimize}
          t={t}
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
            } flex flex-col`}
          >
            {/* Header */}
            <div
              className={`${PRIMARY_COLOR_CLASS} p-4 flex justify-between items-center rounded-r-xl flex-shrink-0`}
            >
              <h2 className="text-xl font-bold text-white">{t.app_name}</h2>
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
                  url: "https://www.5fish.com/",
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
