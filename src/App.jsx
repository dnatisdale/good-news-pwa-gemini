// --- Import Section (Ensure AppLogo is imported from the correct path) ---
import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom/client";
import html2canvas from "html2canvas";

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
  ChevronRight, // Forward button icon
  Share2,
  Zap,
  Download,
  PlayCircle,
} from "./components/Icons";
import { staticContent } from "./data/staticContent";
import QRCodeDisplay from "./components/QRCodeDisplay";

// NEW: Import the Banner Logo
import AppLogo from "./assets/banner-logo.svg";
// NOTE: We don't need to explicitly import 'square-logo.svg' until we use it later (e.g., in a settings page).

// --- CONSTANTS ---
// PWA Custom Colors
const THAI_RED = "#A51931";
const THAI_BLUE = "#2D2A4A";

// Tailwind Class Mapping (using inline styles for new colors where needed)
const PRIMARY_COLOR_CLASS = "bg-brand-red";
const ACCENT_COLOR_CLASS = "text-brand-red";
const TEXT_COLOR_CLASS = "text-gray-800";
const DEFAULT_FONT_SIZE = "16px"; // Medium

// Helper for share fallback
const copyLink = (text, callback) => {
  navigator.clipboard
    .writeText(text)
    .then(() => callback("Link copied!"))
    .catch(() => callback("Failed to copy link."));
};

// --- Reusable Components ---

// Audio Player Component
const AudioPlayer = ({ track, isMinimized, toggleMinimize, t }) => {
  if (!track || !track.trackDownloadUrl) {
    return (
      <div className="sticky bottom-0 w-full p-3 bg-gray-200 text-center text-sm text-gray-600 z-20">
        {t.select_message_to_listen || "Select a message to listen to."}
      </div>
    );
  }

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
            ? (t.playing || "Playing") +
              ": " +
              (track.title_en ?? "Unknown Title")
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
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};

// Language Card Component (For initial language list)
const LanguageCard = ({ languageName, lang, onSelect, messageCount }) => {
  return (
    <div
      className={`bg-white p-4 mb-3 rounded-xl shadow-md border-b-4 border-brand-red cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.01]`}
      onClick={() => onSelect(languageName)}
    >
      <h3 className={`text-2xl font-bold ${ACCENT_COLOR_CLASS}`}>
        {languageName}
      </h3>
      <p className={`text-sm text-gray-500 mt-1`}>
        {lang === "en" ? "Tap to view" : "แตะเพื่อดู"} ({messageCount}{" "}
        {lang === "en" ? "messages" : "ข้อความ"})
      </p>
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
      <p className="text-sm text-gray-500 mt-0.5">
        {" "}
        {/* Reduced top margin */}
        Program No. {item.id}
      </p>
    </div>
  );
};

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
        // Centered text with slight padding adjustment for lift
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

  // Base class for all buttons (thinner rectangle, rounded corners)
  const baseClass = `p-1 rounded-md font-bold transition-colors shadow-sm text-center flex items-center justify-center`;

  return (
    // Adjusted spacing from negative margin to slight positive space-x-1
    <div className="flex items-center space-x-1">
      {/* Size 1 (Wider and shorter) */}
      <button
        onClick={() => handleFontSize("14px")}
        className={`${baseClass} w-6 h-5 text-xs z-10`}
        style={fontSize === "14px" ? selectedStyle : unselectedStyle}
      >
        1
      </button>
      {/* Size 2 (Bigger overall size and text) */}
      <button
        onClick={() => handleFontSize("16px")}
        // Bumped text size from text-sm to text-base, slightly larger button dims
        className={`${baseClass} w-7 h-6 text-base z-20`}
        style={fontSize === "16px" ? selectedStyle : unselectedStyle}
      >
        2
      </button>
      {/* Size 3 (Largest overall size and text) */}
      <button
        onClick={() => handleFontSize("20px")}
        // Bumped text size from text-base to text-xl, noticeably larger button dims
        className={`${baseClass} w-8 h-7 text-xl z-30`}
        style={fontSize === "20px" ? selectedStyle : unselectedStyle}
      >
        3
      </button>
    </div>
  );
};

// --- Share Card Print View Component ---
const ShareCardPrintView = ({ item, lang, t, cardUrl }) => {
  const title =
    lang === "en" ? item.title_en ?? "Untitled" : item.title_th ?? "ไม่มีชื่อ";
  const verse = lang === "en" ? item.verse_en ?? "" : item.verse_th ?? "";

  return (
    <div
      id="print-view-container"
      className="bg-white p-8 rounded-lg shadow-lg"
      style={{ width: "400px", margin: "auto", fontFamily: "sans-serif" }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        {t.app_name}
      </h2>
      <h3 className="text-xl font-bold text-brand-red mb-2 text-center">
        {" "}
        {/* Reduced mb */}
        {title} (Program {item.id})
      </h3>

      {/* BIBLE VERSE ADDED TO QR CARD */}
      <p className="text-sm text-gray-700 mb-4 whitespace-pre-line text-center">
        {" "}
        {/* Reduced mb */}
        {verse}
      </p>

      <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
        {" "}
        {/* Reduced mb */}
        <QRCodeDisplay
          url={cardUrl}
          size={200}
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </div>

      <p className="text-sm text-gray-600 text-center break-all">
        {t.read_more_at || "Read this message and more at"}: <br />
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

  const isBookmarked = userData.bookmarks.includes(item.id);
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
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = userData.bookmarks.filter((id) => id !== item.id);
    } else {
      newBookmarks = [...userData.bookmarks, item.id];
    }
    saveUserData({ ...userData, bookmarks: newBookmarks });
  };

  const generateShareText = () => {
    return `
${t.app_name} - ${titleDisplay}
${verseDisplay} 
${t.language_label || "Language"}: ${languageDisplay}
${t.program_number || "Program Number"}: ${item.id}
${t.read_more_at || "Read more"}: ${cardUrl}
${t.download_qr_card_tip || "Download QR card for easy sharing!"}
        `.trim();
  };

  const handleShare = () => {
    const shareText = generateShareText();
    if (navigator.share) {
      navigator
        .share({
          title: t.app_name,
          text: shareText,
          url: cardUrl,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      copyLink(shareText, (message) => alert(message));
    }
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
        {" "}
        {/* Reduced mb and pb */}
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
            // Adjusted sizing for desktop visibility
            style={{
              maxWidth: isQrLarge ? "100%" : "200px",
              margin: "0 auto 1.5rem auto",
            }}
          >
            <div className="p-2 bg-gray-50 rounded-lg">
              <QRCodeDisplay
                url={cardUrl}
                size={isQrLarge ? 250 : 150} // Slightly larger default size on desktop
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
            {/* FONT SIZE REDUCED to text-base */}
            <p className="text-base leading-normal text-gray-700 whitespace-pre-line">
              {verseDisplay}
            </p>
          </div>

          {/* NOTES SECTION */}
          <div className="p-4 bg-red-50 border-l-4 border-brand-red rounded-lg mt-4">
            {" "}
            {/* Reduced mt to mt-4 */}
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {t.my_notes || "My Notes"}
            </h2>{" "}
            {/* Reduced mb */}
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
const LanguageListPage = ({ lang, t, onSelectLanguage, languageGroups }) => {
  // Now receives languageGroups as prop
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Filter the pre-calculated language groups based on search term
  const filteredLanguageGroups = useMemo(() => {
    if (!searchTerm) {
      return languageGroups;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    // We filter based on the *display name* which matches what the user sees
    return languageGroups.filter((group) =>
      (lang === "en" ? group.displayNameEn : group.displayNameTh)
        .toLowerCase()
        .includes(lowerSearchTerm)
    );
  }, [lang, searchTerm, languageGroups]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Search fill-field with Thai red outline (Made sticky and removed 'relative') */}
      <div className="mb-4 sticky top-0 bg-gray-100 pb-3 z-10">
        {" "}
        {/* Reduced mb and pb */}
        <div className="relative">
          <input
            type="text"
            placeholder={t.search_languages || "Search Languages..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border-2 border-brand-red rounded-xl shadow-md focus:ring-brand-red focus:border-brand-red transition-all"
          />
          <Search
            className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${ACCENT_COLOR_CLASS}`}
          />
        </div>
      </div>
      {/* Pass stableKey (English name) to onSelectLanguage */}
      {filteredLanguageGroups.map((group) => (
        <LanguageCard
          key={group.stableKey}
          languageName={
            lang === "en" ? group.displayNameEn : group.displayNameTh
          }
          lang={lang}
          onSelect={() => onSelectLanguage(group.stableKey)} // Use stableKey for selection
          messageCount={group.count}
        />
      ))}
      <div className="h-16"></div>{" "}
      {/* Reduced h-20 to h-16 for tighter spacing */}
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
      </h1>{" "}
      {/* Reduced mb */}
      <p className="text-sm text-gray-500 mb-4 font-semibold">
        {" "}
        {/* Reduced mb */}
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
      <div className="h-16"></div> {/* Reduced h-20 to h-16 */}
    </div>
  );
};

// Bookmarks Page Component
const BookmarksPage = ({ lang, t, onSelect, userData }) => {
  const bookmarkedItems = useMemo(() => {
    return staticContent.filter((item) => userData.bookmarks.includes(item.id));
  }, [userData.bookmarks]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
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
      <div className="h-16"></div> {/* Reduced h-20 to h-16 */}
    </div>
  );
};

// Search Component
const SearchPage = ({ lang, t, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");

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
  }, [searchTerm, lang]);

  const resultCount = filteredContent.length;

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t.search}</h1>{" "}
      {/* Reduced mb */}
      <div className="mb-4 sticky top-0 bg-gray-100 pb-3 z-10">
        {" "}
        {/* Reduced pb */}
        <div className="relative">
          <input
            type="text"
            placeholder={t.search + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-xl shadow-md focus:ring-brand-red focus:border-brand-red transition-all"
          />
          <Search
            className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${ACCENT_COLOR_CLASS}`}
          />
        </div>
      </div>
      {searchTerm && (
        <p className="text-sm text-gray-600 mb-4 font-semibold">
          {resultCount}{" "}
          {resultCount === 1 ? t.result || "Result" : t.results || "Results"}{" "}
          {t.found || "found"}.
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
            {t.start_typing_to_search || "Start typing to search all"}{" "}
            {staticContent.length} {t.items || "items"}.
          </p>
        </div>
      )}
      <div className="h-16"></div> {/* Reduced h-20 to h-16 */}
    </div>
  );
};

// Settings Component with Auth UI
const SettingsPage = ({
  lang,
  t,
  setLang,
  userId,
  logOut,
  signUp,
  signIn,
  fontSize,
  setFontSize,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState(null);
  const isAnonymous =
    userId && userId.length > 20 && !userId.startsWith("firebase:");

  const handleAuthAction = async (action) => {
    if (action === "signup") {
      const success = await signUp(email, password);
      if (success)
        setAuthMessage(
          t.sign_up_success || "Sign up successful! You are now logged in."
        );
      else
        setAuthMessage(
          t.sign_up_fail ||
            "Sign up failed. Please check the error message in the console."
        );
    } else if (action === "signin") {
      const success = await signIn(email, password);
      if (success) setAuthMessage(t.sign_in_success || "Sign in successful!");
      else
        setAuthMessage(
          t.sign_in_fail || "Sign in failed. Check your email/password."
        );
    }
    setEmail("");
    setPassword("");
    setTimeout(() => setAuthMessage(null), 5000);
  };

  // NOTE: The font size controls are now handled via the buttons in the main header
  // I am keeping the logic in this component for consistency, but removing the UI rendering here
  const handleFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem("appFontSize", size);
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.settings}</h1>

      <div className="bg-white p-4 rounded-xl shadow-md mb-6 border border-gray-100">
        {/* --- APP STATUS --- */}
        <h2 className="text-lg font-semibold mb-2">
          {t.app_status || "App Status"}
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          {t.user_id || "User ID"}:{" "}
          <span className="font-mono text-xs text-brand-red">
            {userId ? userId : t.loading || "Loading..."}
          </span>
        </p>
        <p
          className={`text-sm font-bold ${
            isAnonymous ? "text-orange-500" : "text-green-600"
          }`}
        >
          {t.status || "Status"}:{" "}
          {isAnonymous
            ? t.guest || "Guest (Anonymous)"
            : t.registered_user || "Registered User"}
        </p>

        {/* --- LANGUAGE --- */}
        <h2 className="text-lg font-semibold mt-4 mb-2">
          {t.language_label || "Language"}
        </h2>
        <LanguageToggle lang={lang} setLang={setLang} t={t} />

        {/* --- FONT RESIZER (AAA) - REMOVED UI HERE, NOW IN HEADER --- */}
        <h2 className="text-lg font-semibold mt-4 mb-2">
          {t.text_size || "Text Size"}
        </h2>
        <div className="flex space-x-2 text-gray-500 text-sm italic">
          {t.text_size_controlled_by_header ||
            "Adjust text size using the 1-2-3 buttons in the top banner."}
        </div>
        {/* --- END FONT RESIZER --- */}
      </div>

      {authMessage && (
        <div className="p-3 mb-4 rounded-lg bg-green-100 text-green-700 font-semibold">
          {authMessage}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-md mb-6 border border-gray-100">
        {/* --- EMAIL AUTHENTICATION --- */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {t.email_auth || "Email Authentication"}
        </h2>

        {isAnonymous ? (
          <>
            <input
              type="email"
              placeholder={t.email || "Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-brand-red focus:border-brand-red"
            />
            <input
              type="password"
              placeholder={t.password || "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-brand-red focus:border-brand-red"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAuthAction("signin")}
                className="p-3 font-bold text-white rounded-xl bg-brand-red transition-colors hover:bg-red-800"
              >
                {t.sign_in || "Sign In"}
              </button>
              <button
                onClick={() => handleAuthAction("signup")}
                className="p-3 font-bold text-brand-red border border-brand-red rounded-xl transition-colors hover:bg-red-50"
              >
                {t.sign_up || "Sign Up"}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={logOut}
            // Log Out Button Color Fixed to Red
            className="w-full p-3 font-bold text-white rounded-xl bg-brand-red transition-colors hover:bg-red-800"
          >
            {t.log_out || "Log Out"}
          </button>
        )}
      </div>
    </div>
  );
};

// Side Drawer Component
const SideDrawer = ({
  isOpen,
  onClose,
  userId,
  navigate,
  t,
  appUrl,
  showInstallButton,
  triggerInstall,
}) => {
  const [showQr, setShowQr] = useState(false);

  const navItems = [
    {
      key: "home",
      label: t.contents,
      icon: Home,
      action: () => navigate("home"),
    },
    {
      key: "search",
      label: t.search,
      icon: Search,
      action: () => navigate("search"),
    },
    {
      key: "bookmarks",
      label: t.bookmarks,
      icon: Bookmark,
      action: () => navigate("bookmarks"),
    },
    {
      key: "notes",
      label: t.notes,
      icon: Pen,
      action: () => navigate("notes"),
    },
    {
      key: "share",
      label: t.share_app,
      icon: Share2,
      action: () => setShowQr((p) => !p),
    },
    {
      key: "settings",
      label: t.settings,
      icon: Settings,
      action: () => navigate("settings"),
    },
    {
      key: "website",
      label: "5fish Website",
      icon: Zap,
      action: () => window.open("https://5fish.mobi", "_blank"),
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-40 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div
        className={`relative w-64 bg-gray-50 h-full shadow-2xl flex flex-col`}
      >
        <div
          className={`p-4 ${PRIMARY_COLOR_CLASS} flex justify-between items-center`}
        >
          <h2 className="text-xl font-bold text-white">{t.menu}</h2>
          <button
            onClick={onClose}
            className="text-white p-1 hover:bg-red-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {/* Install PWA Button (Hidden by default, shown when ready) */}
          {showInstallButton && (
            <button
              onClick={() => {
                triggerInstall();
                onClose();
              }}
              className={`flex items-center w-full p-3 rounded-xl text-left font-bold text-white bg-green-600 hover:bg-green-700 transition-colors mb-4`}
            >
              <Download className={`w-5 h-5 mr-3 fill-current`} />
              <span className="font-semibold">
                {t.install_pwa || "Install App"}
              </span>
            </button>
          )}

          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                item.action();
                if (item.key !== "share" && item.key !== "website") {
                  onClose();
                }
              }}
              className={`flex items-center w-full p-3 rounded-xl text-left text-gray-700 hover:bg-gray-200 transition-colors mb-2 ${ACCENT_COLOR_CLASS}`}
            >
              {item.icon && (
                <item.icon className={`w-5 h-5 mr-3 ${ACCENT_COLOR_CLASS}`} />
              )}
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {showQr && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t.qr_code}
              </h3>
              <div className="p-2 bg-gray-100 rounded-lg inline-block">
                <QRCodeDisplay url={appUrl} size={150} fgColor="#000000" />
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Powered by 5fish</p>
          <p>App Version 1.0</p>
        </footer>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [lang, setLang] = useState(localStorage.getItem("appLang") || "en");
  const t = i18n[lang] || i18n.en;

  const [page, setPage] = useState("home");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedLanguageKey, setSelectedLanguageKey] = useState(null); // Key = English name
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);

  // Font size state
  const [fontSize, setFontSize] = useState(
    localStorage.getItem("appFontSize") || DEFAULT_FONT_SIZE
  );

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  const {
    isAuthReady,
    userId,
    userData,
    saveUserData,
    error,
    signUp,
    signIn,
    logOut,
  } = useFirebase(setLang);

  // --- Data Caching for Navigation ---
  // Memoize the list of unique language groups (stableKey and display names)
  const languageGroups = useMemo(() => {
    const groups = new Map();
    staticContent.forEach((item) => {
      const stableKey = item.languageEn ?? "Unknown Language";

      if (!groups.has(stableKey)) {
        groups.set(stableKey, {
          repItem: item, // Store a representative item
          messages: [],
        });
      }
      groups.get(stableKey).messages.push(item);
    });

    // Convert map to array of objects for easier sorting/mapping
    return Array.from(groups.values())
      .map((group) => {
        const languageDisplayNameEn =
          group.repItem.languageEn ?? "Unknown Language";
        const languageDisplayNameTh =
          group.repItem.langTh ?? languageDisplayNameEn; // Fallback to Eng
        return {
          stableKey: languageDisplayNameEn, // English name is the key
          displayNameEn: languageDisplayNameEn,
          displayNameTh: languageDisplayNameTh,
          count: group.messages.length,
        };
      })
      .sort((a, b) =>
        (lang === "en" ? a.displayNameEn : a.displayNameTh).localeCompare(
          lang === "en" ? b.displayNameEn : b.displayNameTh
        )
      );
  }, [lang]); // Re-sorts when language changes

  // Memoize the list of messages for the currently selected language
  const currentMessageList = useMemo(() => {
    if (!selectedLanguageKey) return [];

    return staticContent
      .filter((item) => {
        const currentLangNameEn = item.languageEn ?? "Unknown Language";
        return currentLangNameEn === selectedLanguageKey;
      })
      .sort((a, b) => {
        const titleA = (lang === "en" ? a.title_en : a.title_th) ?? "";
        const titleB = (lang === "en" ? b.title_en : b.title_th) ?? "";
        return titleA.localeCompare(titleB);
      });
  }, [lang, selectedLanguageKey]);
  // --- End Data Caching ---

  // Navigation function for Pages (home, search, settings, etc.)
  const navigate = (path, item = null) => {
    setPage(path);
    setSelectedItem(item);
  };

  // Navigation function to drill into a language
  const handleSelectLanguage = (languageKey) => {
    setSelectedLanguageKey(languageKey);
    setPage("languageMessages");
  };

  // Navigation function to go back to the language list
  const handleBackToLanguages = () => {
    setPage("home");
    setSelectedLanguageKey(null);
  };

  // Navigation function to view a message detail
  const handleSelectMessage = (item) => {
    navigate("detail", item);
  };

  // --- PWA INSTALL EFFECTS ---
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted")
      console.log("User accepted the install prompt.");
    else console.log("User dismissed the install prompt.");
    setInstallPrompt(null);
    setShowInstallButton(false);
  };
  // --- END PWA INSTALL EFFECTS ---

  // EFFECT: Checks URL for shared card ID on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get("card");
    const shareLang = urlParams.get("lang");

    if (cardId) {
      const item = staticContent.find((i) => i.id === parseInt(cardId));
      if (item) {
        // Find the language key for this item to set context
        setSelectedLanguageKey(item.languageEn ?? "Unknown Language");
        navigate("detail", item);
        if (shareLang && (shareLang === "en" || shareLang === "th")) {
          setLang(shareLang);
        }
      }
    }
  }, [setLang]);

  // EFFECT: Apply font size to the root HTML element
  useEffect(() => {
    document.documentElement.style.fontSize = fontSize;
  }, [fontSize]);

  // Handler for playing audio
  const handlePlayTrack = (item) => {
    console.log("Setting track to play:", item.trackDownloadUrl);
    setCurrentTrack(item);
    setIsPlayerMinimized(false); // Show player when a new track is selected
  };

  // Handler to toggle player minimization
  const toggleMinimize = () => {
    setIsPlayerMinimized((p) => !p);
  };

  // --- Smart Navigation Handlers ---

  // For Language List Page
  const handleNavLanguage = (direction) => {
    const currentIndex = languageGroups.findIndex(
      (g) => g.stableKey === selectedLanguageKey
    );
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < languageGroups.length) {
      setSelectedLanguageKey(languageGroups[newIndex].stableKey);
    }
  };

  // For Message Detail Page
  const handleNavMessage = (direction) => {
    const currentIndex = currentMessageList.findIndex(
      (item) => item.id === selectedItem.id
    );
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < currentMessageList.length) {
      setSelectedItem(currentMessageList[newIndex]);
    }
  };

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="p-8 text-center text-gray-600">
          {t.loading_auth || "Loading authentication..."}
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center text-red-600 font-bold">
          {t.error || "Error"}: {error}
        </div>
      );
    }

    switch (page) {
      case "detail":
        const currentMessageIndex = currentMessageList.findIndex(
          (item) => item.id === selectedItem.id
        );
        return (
          <ContentView
            item={selectedItem}
            lang={lang}
            t={t}
            // Go back to the message list
            onBack={() => setPage("languageMessages")}
            // Smart navigation for prev/next message
            onForward={() => handleNavMessage(1)}
            hasPrev={currentMessageIndex > 0}
            hasNext={currentMessageIndex < currentMessageList.length - 1}
            userData={userData}
            saveUserData={saveUserData}
            onPlay={handlePlayTrack}
          />
        );

      case "languageMessages":
        const currentLangIndex = languageGroups.findIndex(
          (g) => g.stableKey === selectedLanguageKey
        );
        return (
          <MessagesByLanguagePage
            lang={lang}
            t={t}
            selectedLanguageKey={selectedLanguageKey} // Pass the stable key
            currentMessageList={currentMessageList} // Pass the pre-filtered messages
            languageGroups={languageGroups} // Pass the language groups for the header
            // Go back to language list
            onBack={() => handleBackToLanguages()}
            // Smart navigation for prev/next language
            onForward={() => handleNavLanguage(1)}
            hasPrev={currentLangIndex > 0}
            hasNext={currentLangIndex < languageGroups.length - 1}
            onSelectMessage={handleSelectMessage}
          />
        );

      case "search":
        return <SearchPage lang={lang} t={t} onSelect={handleSelectMessage} />;

      case "bookmarks":
        return (
          <BookmarksPage
            lang={lang}
            t={t}
            onSelect={handleSelectMessage}
            userData={userData}
          />
        );

      case "notes":
        return (
          <div className="p-4 pt-8 text-center text-gray-500">
            <h1 className="text-2xl font-bold mb-4">{t.notes}</h1>
            <p>{t.notes_page_tip || "This page is ready to be built!"}</p>
          </div>
        );

      case "settings":
        return (
          <SettingsPage
            lang={lang}
            t={t}
            setLang={setLang}
            userId={userId}
            logOut={logOut}
            signUp={signUp}
            signIn={signIn}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        );

      case "home":
      default:
        // Home now renders the list of languages
        return (
          <LanguageListPage
            lang={lang}
            t={t}
            onSelectLanguage={handleSelectLanguage}
            languageGroups={languageGroups} // Pass pre-calculated groups
          />
        );
    }
  };

  return (
    // Main container with responsive sizing (max-w-md -> max-w-5xl)
    <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-100 shadow-xl overflow-hidden md:max-w-3xl lg:max-w-5xl">
      // Red Banner Header with Responsive Padding
      <header
        className={`sticky top-0 w-full ${PRIMARY_COLOR_CLASS} p-4 shadow-lg z-30 flex justify-between items-center rounded-b-xl md:py-3 md:px-6`}
      >
        {/* Navigation Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors"
        >
          <Menu className="w-7 h-7" />
        </button>

        {/* --- Logo Image (Responsive and Rounded) --- */}
        <div className="flex items-center mx-auto md:mx-0 md:mr-auto">
          <img
            src={AppLogo}
            alt={t.app_name}
            className="h-8 md:h-10 w-auto rounded-md shadow-sm mr-4"
          />
          <h1 className="text-xl font-bold text-white tracking-wide truncate md:text-2xl hidden md:block">
            {t.app_name}
          </h1>
        </div>

        {/* Right side controls: 1/2/3 buttons and Language Toggle */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <FontSizeButtons fontSize={fontSize} setFontSize={setFontSize} />
          <LanguageToggle lang={lang} setLang={setLang} t={t} />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      <AudioPlayer
        track={currentTrack}
        isMinimized={isPlayerMinimized}
        toggleMinimize={toggleMinimize}
        t={t} // Pass translation object to AudioPlayer
      />
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userId={userId}
        navigate={navigate}
        t={t}
        appUrl={window.location.href}
        // Pass PWA Install props
        showInstallButton={showInstallButton}
        triggerInstall={triggerInstall}
      />
    </div>
  );
}
