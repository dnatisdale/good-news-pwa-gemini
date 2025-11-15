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
  Share2,
  Zap,
  Download,
  PlayCircle,
} from "./components/Icons";
import { staticContent } from "./data/staticContent";
import QRCodeDisplay from "./components/QRCodeDisplay";

// --- CONSTANTS ---
const PRIMARY_COLOR = "bg-brand-red";
const ACCENT_COLOR = "text-brand-red";
const TEXT_COLOR = "text-gray-800";
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
const AudioPlayer = ({ track, isMinimized, toggleMinimize }) => {
  if (!track || !track.trackDownloadUrl) {
    return (
      <div className="sticky bottom-0 w-full p-3 bg-gray-200 text-center text-sm text-gray-600">
        Select a message to listen.
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
            ? "Playing: " + (track.title_en ?? "Unknown Title")
            : "Controls"}
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
          Your browser does support the audio element.
        </audio>
      </div>
    </div>
  );
};

// Language Card Component (For initial language list)
const LanguageCard = ({ languageName, lang, onSelect, messageCount }) => {
  return (
    <div
      className="bg-white p-4 mb-4 rounded-xl shadow-md border-b-4 border-brand-red cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.01]"
      onClick={() => onSelect(languageName)}
    >
      <h3 className={`text-2xl font-bold ${ACCENT_COLOR}`}>{languageName}</h3>
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
      className="bg-white p-4 mb-4 rounded-xl shadow-md border-t-4 border-gray-200 cursor-pointer transition-transform hover:shadow-lg hover:border-brand-red"
      onClick={() => onSelect(item)}
    >
      {/* Language Name (Only shown if required, e.g., on Search/Bookmarks) */}
      {showLanguageName && (
        <p className={`text-base font-semibold ${ACCENT_COLOR} mb-1`}>
          {languageDisplayName}
        </p>
      )}
      {/* Message Title (Primary focus on this card) */}
      <h3
        className={`text-lg font-bold ${TEXT_COLOR} ${
          showLanguageName ? "" : "mt-1"
        }`}
      >
        {messageTitle}
      </h3>
      {/* Program Number */}
      <p className="text-sm text-gray-500 mt-1">Program No. {item.id}</p>
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
      <span className="text-sm font-semibold text-white">
        {t.language_label || "Language"}:
      </span>
      <button
        onClick={toggleLang}
        className={`p-2 rounded-lg font-bold transition-colors shadow-sm text-brand-red bg-white hover:bg-gray-200`}
      >
        {lang === "en" ? "ไทย" : "English"}
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
      <h3 className="text-xl font-bold text-brand-red mb-4 text-center">
        {title} (Program {item.id})
      </h3>

      <p className="text-base text-gray-700 mb-6 whitespace-pre-line text-center">
        {verse}
      </p>

      <div className="flex justify-center mb-6 p-4 bg-gray-50 rounded-lg">
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
  userData,
  saveUserData,
  onPlay,
}) => {
  const isBookmarked = userData.bookmarks.includes(item.id);
  const cardUrl = `https://5fi.sh/T${item.id}`;
  // FIX: Using robust check and the correct langTh field
  const languageDisplay =
    lang === "en" ? item.languageEn ?? "" : item.langTh ?? "";
  const titleDisplay =
    lang === "en"
      ? item.title_en ?? "Untitled Message"
      : item.title_th ?? "ข้อความที่ไม่มีชื่อ";
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
      <button
        onClick={onBack}
        className={`text-sm font-semibold mb-4 flex items-center ${ACCENT_COLOR} hover:text-red-700 transition-colors`}
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        {t.back || "Back"}
      </button>

      {/* Language Name (Thai Flag Red - Largest) */}
      <h1 className={`text-4xl font-extrabold mb-2 ${ACCENT_COLOR}`}>
        {languageDisplay}
      </h1>

      <div className="flex justify-between items-center mb-6 border-b pb-4">
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

      <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-6">
        {/* Line spacing adjusted with leading-normal */}
        <p className="text-xl leading-normal text-gray-700 whitespace-pre-line">
          {verseDisplay}
        </p>
      </div>

      {/* --- LISTEN BUTTON (Thai Flag Blue) --- */}
      {item.trackDownloadUrl && (
        <button
          onClick={() => onPlay(item)}
          className="w-full p-4 mb-6 font-bold text-white text-lg rounded-xl bg-blue-800 transition-colors hover:bg-blue-900 shadow-lg flex items-center justify-center"
        >
          <PlayCircle className="w-6 h-6 mr-2" />
          {t.listen_offline || "Listen (Offline Enabled)"}
        </button>
      )}

      {/* --- SHARE / EXPORT SECTION (Thai Flag Red Buttons) --- */}
      <h2 className="text-lg font-bold mb-3 mt-6 text-gray-800">
        {t.share_this_message || "Share This Message"}
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Share/Copy - Solid Red */}
        <button
          onClick={handleShare}
          className="p-3 font-bold text-white rounded-xl bg-brand-red transition-colors hover:bg-red-800 shadow-md flex flex-col items-center justify-center text-sm leading-tight"
        >
          <Share2 className="w-5 h-5 mb-1" /> {t.share_copy || "Share/Copy"}
        </button>

        {/* Download QR Card - Solid Red, two lines */}
        <button
          onClick={downloadShareCard}
          className="p-3 font-bold text-white rounded-xl bg-brand-red transition-colors hover:bg-red-800 shadow-md flex flex-col items-center justify-center text-sm leading-tight"
        >
          <Download className="w-5 h-5 mb-1" />
          {t.download || "Download"} <br /> {t.qr_card || "QR Card"}
        </button>
      </div>

      <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-inner">
        <p className="text-sm text-gray-600 mb-2">
          {t.in_app_qr_tip || "In-app QR code (download above for print-ready)"}
        </p>
        <div className="p-2 bg-gray-50 rounded-lg">
          <QRCodeDisplay url={cardUrl} size={150} fgColor="#000000" />
        </div>
      </div>

      <div className="p-4 bg-red-50 border-l-4 border-brand-red rounded-lg mt-6">
        <h2 className="text-lg font-semibold text-gray-700">
          {t.my_notes || "My Notes"}
        </h2>
        <p className="text-sm text-gray-500">
          {t.notes_feature_tip ||
            "Notes feature coming soon! You can view all saved notes on the Notes page."}
        </p>
      </div>
    </div>
  );
};

// New Page: Language List Page
const LanguageListPage = ({ lang, t, onSelectLanguage }) => {
  // New state for search term on the home page
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Group content by language name (using the correct language property and robust checks)
  const languageGroups = useMemo(() => {
    const groups = new Map();
    staticContent.forEach((item) => {
      // CRITICAL FIX: Use item.langTh for Thai name if available
      const languageKey =
        (lang === "en" ? item.languageEn : item.langTh) ??
        (lang === "en" ? "Unknown Language" : "ไม่ทราบภาษา");

      if (!groups.has(languageKey)) {
        groups.set(languageKey, []);
      }
      groups.get(languageKey).push(item);
    });

    // Convert map to array of objects for easier sorting/mapping
    let sortedGroups = Array.from(groups.entries())
      .map(([languageName, messages]) => ({
        languageName,
        messages,
        count: messages.length,
      }))
      .sort((a, b) => a.languageName.localeCompare(b.languageName));

    // 2. Filter groups based on search term (real-time filtering)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      sortedGroups = sortedGroups.filter((group) =>
        group.languageName.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return sortedGroups;
  }, [lang, searchTerm]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Search fill-field with Thai red outline (Replaces the title) */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder={t.search_languages || "Search Languages..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 border-2 border-brand-red rounded-xl shadow-md focus:ring-brand-red focus:border-brand-red transition-all"
        />
        <Search
          className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${ACCENT_COLOR}`}
        />
      </div>

      <h1 className="text-xl font-bold text-gray-800 mb-4">
        {languageGroups.length} {t.languages || "Languages"}
      </h1>

      {languageGroups.map((group) => (
        <LanguageCard
          key={group.languageName}
          languageName={group.languageName}
          lang={lang}
          onSelect={onSelectLanguage}
          messageCount={group.count}
        />
      ))}
      <div className="h-20"></div>
    </div>
  );
};

// New Page: Messages By Language Page
const MessagesByLanguagePage = ({
  lang,
  t,
  selectedLanguage,
  onBack,
  onSelectMessage,
}) => {
  const filteredContent = useMemo(() => {
    return staticContent
      .filter((item) => {
        // Robust check for language name comparison
        const currentLangName =
          (lang === "en" ? item.languageEn : item.langTh) ??
          (lang === "en" ? "Unknown Language" : "ไม่ทราบภาษา");
        return currentLangName === selectedLanguage;
      })
      .sort((a, b) => {
        // Sort messages by title alphabetically (robust check)
        const titleA = (lang === "en" ? a.title_en : a.title_th) ?? "";
        const titleB = (lang === "en" ? b.title_en : b.title_th) ?? "";
        return titleA.localeCompare(titleB);
      });
  }, [lang, selectedLanguage]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <button
        onClick={onBack}
        className={`text-sm font-semibold mb-4 flex items-center ${ACCENT_COLOR} hover:text-red-700 transition-colors`}
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        {t.back_to_languages || "Back to Languages"}
      </button>
      {/* Language Title - Red, emphasized */}
      <h1 className={`text-2xl font-bold mb-2 ${ACCENT_COLOR}`}>
        {selectedLanguage}
      </h1>
      <p className="text-sm text-gray-500 mb-6 font-semibold">
        {filteredContent.length} {t.messages || "messages"}
      </p>
      {/* NOTE: showLanguageName is set to false here to remove the language name from individual message cards */}
      {filteredContent.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          lang={lang}
          onSelect={onSelectMessage}
          showLanguageName={false}
        />
      ))}
      <div className="h-20"></div>
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
      <div className="h-20"></div>
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.search}</h1>

      <div className="mb-4 sticky top-0 bg-gray-100 pb-4 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder={t.search + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-xl shadow-md focus:ring-brand-red focus:border-brand-red transition-all"
          />
          <Search
            className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${ACCENT_COLOR}`}
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
      <div className="h-20"></div>
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

        {/* --- FONT RESIZER (AAA) --- */}
        <h2 className="text-lg font-semibold mt-4 mb-2">
          {t.text_size || "Text Size"}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleFontSize("14px")}
            className={`p-2 rounded-lg font-bold text-sm ${
              fontSize === "14px"
                ? "bg-brand-red text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            A
          </button>
          <button
            onClick={() => handleFontSize("16px")}
            className={`p-2 rounded-lg font-bold text-base ${
              fontSize === "16px"
                ? "bg-brand-red text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            A
          </button>
          <button
            onClick={() => handleFontSize("20px")}
            className={`p-2 rounded-lg font-bold text-xl ${
              fontSize === "20px"
                ? "bg-brand-red text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            A
          </button>
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
          className={`p-4 ${PRIMARY_COLOR} flex justify-between items-center`}
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
              className={`flex items-center w-full p-3 rounded-xl text-left text-gray-700 hover:bg-gray-200 transition-colors mb-2 ${ACCENT_COLOR}`}
            >
              {item.icon && (
                <item.icon className={`w-5 h-5 mr-3 ${ACCENT_COLOR}`} />
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
  const [selectedLanguage, setSelectedLanguage] = useState(null);
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

  // Navigation function for Pages (home, search, settings, etc.)
  const navigate = (path, item = null) => {
    setPage(path);
    setSelectedItem(item);
  };

  // Navigation function to drill into a language
  const handleSelectLanguage = (languageName) => {
    setSelectedLanguage(languageName);
    setPage("languageMessages");
  };

  // Navigation function to go back to the language list
  const handleBackToLanguages = () => {
    setPage("home");
    setSelectedLanguage(null);
  };

  // Navigation function to view a message detail
  const handleSelectMessage = (item) => {
    navigate("detail", item);
  };

  // --- PWA INSTALL EFFECTS ---
  useEffect(() => {
    // Event listener to capture the browser's install prompt event
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Cleanup listener on unmount
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;

    // Show the prompt
    installPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt.");
    } else {
      console.log("User dismissed the install prompt.");
    }

    // The prompt can only be shown once, so hide the button afterward
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
        return (
          <ContentView
            item={selectedItem}
            lang={lang}
            t={t}
            onBack={
              selectedLanguage
                ? () => setPage("languageMessages")
                : () => setPage("home")
            }
            userData={userData}
            saveUserData={saveUserData}
            onPlay={handlePlayTrack}
          />
        );

      case "languageMessages":
        return (
          <MessagesByLanguagePage
            lang={lang}
            t={t}
            selectedLanguage={selectedLanguage}
            onBack={handleBackToLanguages}
            onSelectMessage={handleSelectMessage}
          />
        );

      case "search":
        // Note: The main language search is now on the 'home' page (LanguageListPage)
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
        // Home now renders the list of languages with the inline search field
        return (
          <LanguageListPage
            lang={lang}
            t={t}
            onSelectLanguage={handleSelectLanguage}
          />
        );
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-100 shadow-xl overflow-hidden">
      {/* Red Banner Header with Rounded Bottom Corners */}
      <header
        className={`sticky top-0 w-full ${PRIMARY_COLOR} p-4 shadow-lg z-30 flex justify-between items-center rounded-b-xl`}
      >
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors"
        >
          <Menu className="w-7 h-7" />
        </button>
        <h1 className="text-xl font-bold text-white tracking-wide truncate px-2">
          {t.app_name}
        </h1>
        <LanguageToggle lang={lang} setLang={setLang} t={t} />
      </header>

      <main className="flex-1 overflow-y-auto">{renderContent()}</main>

      <AudioPlayer
        track={currentTrack}
        isMinimized={isPlayerMinimized}
        toggleMinimize={toggleMinimize}
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
