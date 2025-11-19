import React, { useState, useMemo, useEffect, useRef } from "react";
// --- MOVED: ReactDOM and html2canvas to ContentView.jsx ---
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
  BookOpen,
  ExternalLink,
  // --- CORRECTED ICONS ---
  Qrcode, // The system exports it as 'Qrcode'
  PlayCircle,
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

// --- FLOATING UTILITY BAR (Search + Lang + Font + Clear + Selected) ---
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
  onOpenSelected,
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
  const labelViewSelected =
    t.view_selected ||
    (lang === "th" ? "ดูรายการที่เลือก" : "Selected Content");

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

          {/* View Selected Content row */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenSelected && onOpenSelected();
            }}
            className="w-full mt-1 flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
          >
            <span className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              {labelViewSelected}
            </span>
            {selectedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-brand-red text-white text-[10px] px-2 py-0.5">
                {selectedCount}
              </span>
            )}
          </button>

          {/* Font size row */}
          <div className="flex items-center justify-between pt-1">
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

      {/* Floating main button (Menu icon) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white relative"
        style={{ backgroundColor: THAI_RED }}
        aria-label="Tools"
      >
        <Menu className="w-7 h-7" />
        {selectedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#2D2A4A] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
            {selectedCount}
          </span>
        )}
      </button>
    </div>
  );
};

// --- Reusable Components ---
// Audio Player Component
const AudioPlayer = ({ track, isMinimized, toggleMinimize, t }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // in seconds
  const [duration, setDuration] = useState(0); // in seconds
  const [volume, setVolume] = useState(1); // from 0 to 1

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const onTimeUpdate = () => {
      setProgress(audio.currentTime || 0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track) {
      audio.src = track.trackDownloadUrl;
      audio.load();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => console.error("Audio play error:", error));
    }
  };

  const handleProgressChange = (event) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = (event.target.value / 100) * duration;
    audio.currentTime = newTime;
    setProgress(newTime);
  };

  const handleVolumeChange = (event) => {
    const newVolume = event.target.value / 100;
    setVolume(newVolume);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;
  const playerBgColor = isPlaying ? THAI_BLUE : "#1F2937"; // Tailwind gray-800
  const playerTextColor = "#ffffff";

  if (!track) return null;

  return (
    <div
      className={`fixed left-0 right-0 ${
        isMinimized ? "bottom-4" : "bottom-0"
      } mx-4 md:mx-8 lg:mx-16`}
      style={{ zIndex: 50 }}
    >
      {/* Minimized/Expanded Toggle Button */}
      <button
        onClick={toggleMinimize}
        className="absolute -top-3 right-4 bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg"
      >
        {isMinimized ? "▲" : "▼"}
      </button>

      {/* Player Container */}
      <div
        className={`rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isMinimized ? "h-16" : "h-32"
        }`}
        style={{ backgroundColor: playerBgColor, color: playerTextColor }}
      >
        {/* Player Content */}
        <div className="flex h-full items-center px-4 space-x-4">
          {/* Play/Pause Button */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-gray-800 shadow-lg"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <span className="font-bold text-lg">❚❚</span>
            ) : (
              <PlayCircle className="w-6 h-6" />
            )}
          </button>

          {/* Track Info & Progress */}
          <div className="flex-1 space-y-1">
            <div className="text-sm font-semibold truncate">
              {track.title_en || track.title_th || "Unknown Title"}
            </div>
            <div className="text-xs text-gray-200 truncate">
              {track.languageEn || track.langTh || ""}
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px]">{formatTime(progress)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={handleProgressChange}
                className="flex-1 accent-red-400"
              />
              <span className="text-[10px]">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Slider */}
          {!isMinimized && (
            <div className="flex items-center space-x-1 w-24">
              <span className="text-[10px]">🔈</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={handleVolumeChange}
                className="flex-1 accent-red-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
};

// Language Group Card Component
const LanguageGroupCard = ({
  group,
  lang,
  t,
  isSelected,
  isIndeterminate,
  onToggle,
  onNavigate,
  fontSize,
}) => {
  const languageName = lang === "th" ? group.langTh : group.languageEn;
  const messageCountLabel =
    lang === "th"
      ? `${group.messages.length} ข้อความ`
      : `${group.messages.length} messages`;

  const checkboxLabel =
    lang === "th" ? "เลือกทั้งหมด" : "Select all in this language";

  return (
    <div
      className="rounded-xl shadow-md mb-3 bg-white overflow-hidden"
      style={{ borderBottom: `6px solid ${THAI_RED}` }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={onNavigate}
      >
        <div>
          <h2
            className={`font-bold ${TEXT_COLOR_CLASS}`}
            style={{ fontSize: fontSize || DEFAULT_FONT_SIZE }}
          >
            {languageName}
          </h2>
          <p className="text-sm text-gray-500">
            {t.tap_to_view || "Tap to view"} ({messageCountLabel})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            aria-label={checkboxLabel}
            className="w-6 h-6 rounded border-2 border-gray-400 flex items-center justify-center bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isSelected ? (
              <span className="text-xs text-brand-red">✓</span>
            ) : isIndeterminate ? (
              <span className="text-xs text-brand-red">−</span>
            ) : null}
          </button>
          <button
            aria-label={t.view_details || "View details"}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shadow-sm text-gray-500 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Program Card Component
const ProgramCard = ({
  program,
  lang,
  t,
  onToggle,
  isSelected,
  onOpenContent,
}) => {
  const programLabel =
    lang === "th"
      ? `${program.messages.length} ข้อความ`
      : `${program.messages.length} messages`;

  const checkboxLabel =
    lang === "th" ? "เลือกโปรแกรมนี้" : "Select this program";

  const showTrackCount = program.messages.length;

  return (
    <div
      className="rounded-xl shadow-md mb-3 bg-white overflow-hidden"
      style={{ borderBottom: `4px solid ${THAI_RED}` }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={onOpenContent}
      >
        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            {program.title}
          </h3>
          <p className="text-sm text-gray-500">
            {t.tap_to_view || "Tap to view"} ({programLabel})
          </p>
          {showTrackCount > 1 && (
            <p className="text-xs text-gray-400">
              {lang === "th"
                ? `รวม ${showTrackCount} แทร็ก`
                : `Includes ${showTrackCount} tracks`}
            </p>
          )}
        </div>
        <button
          aria-label={checkboxLabel}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
            isSelected
              ? "bg-brand-red border-brand-red text-white"
              : "bg-white border-gray-400 text-brand-red"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isSelected && <span className="text-xs">✓</span>}
        </button>
      </div>
    </div>
  );
};

// Selected Content Page Component
const SelectedContentPage = ({
  lang,
  t,
  onBack,
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

  const isEmpty = filteredContent.length === 0;

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center text-brand-red font-semibold"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <h1 className="text-xl font-extrabold text-brand-red">
          {t.selected_content || "Selected Content"}
        </h1>
      </div>

      {isEmpty ? (
        <div className="text-center text-gray-500 mt-10">
          {t.no_selected_content || "No content selected yet."}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {t.selected_count_label || "Selected:"}{" "}
              <strong>{filteredContent.length}</strong>{" "}
              {t.items || "items/programs"}
            </p>
            <button
              onClick={onClearSelection}
              className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-xs font-semibold"
            >
              {t.clear_all || "Clear all"}
            </button>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={onShare}
              className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#00152d]"
            >
              <Share2 className="w-6 h-6 mb-1" />
              <span className="text-xs">{t.share || "Share"}</span>
            </button>
            <button
              onClick={onCopy}
              className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#00152d]"
            >
              <Share2 className="w-6 h-6 mb-1" />
              <span className="text-xs">{t.copy || "Copy"}</span>
            </button>
            <button
              onClick={onDownload}
              className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#00152d]"
            >
              <Download className="w-6 h-6 mb-1" />
              <span className="text-xs">{t.print || "Print/Download"}</span>
            </button>
          </div>

          {/* List of selected items */}
          <div className="space-y-3">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-white shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-sm text-gray-800">
                    {lang === "th"
                      ? item.langTh || item.languageEn
                      : item.languageEn || item.langTh}
                  </h2>
                  <span className="text-[11px] text-gray-500">
                    {t.program_label || "Program #"} {item.id}
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  {lang === "th"
                    ? item.title_th || item.title_en
                    : item.title_en || item.title_th}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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

  const [lang, setLang] = useState(
    () => localStorage.getItem("appLang") || "en"
  );

  // Persist language choice
  useEffect(() => {
    localStorage.setItem("appLang", lang);
  }, [lang]);

  const [fontSize, setFontSize] = useState("16px");

  const { t } = useMemo(() => {
    return { t: i18n[lang] || i18n.en };
  }, [lang]);

  // Firebase hook for user data and offline-ready handling
  const {
    userName,
    userLanguage,
    userVerse,
    userNotes,
    userBookmarks,
    audioCache,
    stableKeys,
    saveUserData,
    isAuthReady,
    error,
    userId,
  } = useFirebase(setLang); // Added userId

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

  // NEW: Language QR modal state
  const [isLanguageQrModalOpen, setIsLanguageQrModalOpen] = useState(false);
  const [modalLanguageName, setModalLanguageName] = useState("");
  const [modalLanguageShareUrl, setModalLanguageShareUrl] = useState("");

  // QR size state
  const [qrSize, setQrSize] = useState(200);

  const [pageStack, setPageStack] = useState([{ name: "Home" }]);
  const [track, setTrack] = useState(null);
  const [isAudioMinimized, setIsAudioMinimized] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Splash Screen loading state
  const [route, setRoute] = useState(window.location.hash || "#/browse");

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Listen to hash changes (for basic routing)
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");
  const isExport = route.startsWith("#/export");
  const isAbout = route.startsWith("#/about");

  const languageGroups = useMemo(() => {
    const byLanguage = {};
    staticContent.forEach((item) => {
      const stableKey = item.stableKey;
      const key = stableKey || item.id;
      if (!byLanguage[key]) {
        byLanguage[key] = {
          stableKey: key,
          langTh: item.langTh,
          languageEn: item.languageEn,
          formatKey: item.formatKey,
          messages: [],
        };
      }
      byLanguage[key].messages.push(item);
    });

    return Object.values(byLanguage);
  }, []);

  const selectedLanguageIds = useMemo(
    () => new Set(selectedLangs),
    [selectedLangs]
  );

  const [flatContentList, setFlatContentList] = useState([]);
  useEffect(() => {
    const flattened = staticContent.flatMap((message) => [
      {
        ...message,
        seriesType: "Good News",
      },
    ]);

    setFlatContentList(flattened);
  }, []);

  const languageGroupsWithSelection = useMemo(
    () =>
      languageGroups.map((group) => {
        const programIds = group.messages.map((msg) => msg.id);
        const { isSelected, isIndeterminate } = getLanguageIndeterminateState(
          programIds,
          selectedPrograms
        );
        return {
          ...group,
          isSelected,
          isIndeterminate,
        };
      }),
    [languageGroups, selectedPrograms]
  );

  const filteredLanguageGroups = useMemo(() => {
    if (!searchTerm.trim()) return languageGroupsWithSelection;
    const lowerSearch = searchTerm.toLowerCase();
    return languageGroupsWithSelection.filter((group) => {
      const langName =
        lang === "th" ? group.langTh || "" : group.languageEn || "";
      const matchesLanguage = langName.toLowerCase().includes(lowerSearch);
      const matchesPrograms = group.messages.some((msg) => {
        const title = lang === "th" ? msg.title_th || "" : msg.title_en || "";
        const verse = lang === "th" ? msg.verse_th || "" : msg.verse_en || "";
        return (
          title.toLowerCase().includes(lowerSearch) ||
          verse.toLowerCase().includes(lowerSearch)
        );
      });
      return matchesLanguage || matchesPrograms;
    });
  }, [languageGroupsWithSelection, searchTerm, lang]);

  const [isScrolling, setIsScrolling] = useState(false);
  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsScrolling(false), 150);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleAudioMinimize = () => {
    setIsAudioMinimized((prev) => !prev);
  };

  const navigateToHome = () => {
    setPageStack([{ name: "Home" }]);
  };

  const navigateTo = (pageName, key = null, sourceList = null) => {
    setPageStack((prev) => [...prev, { name: pageName, key, sourceList }]);
    setIsDrawerOpen(false);
    if (pageName !== "Search" && pageName !== "Home") {
      setSearchTerm("");
    }
  };

  const goBack = () => {
    if (pageStack.length > 1) {
      setPageStack((prev) => prev.slice(0, -1));
    } else {
      navigateToHome();
    }
  };

  const currentMessageList = useMemo(() => {
    const currentPage = pageStack[pageStack.length - 1];
    if (currentPage.name === "MessagesByLanguage") {
      const group = languageGroups.find((g) => g.stableKey === currentPage.key);
      if (group) {
        return group.messages;
      }
    } else if (currentPage.name === "Home" || currentPage.name === "Search") {
      return flatContentList;
    }
    return [];
  }, [pageStack, languageGroups, flatContentList]);

  const canNavigateFromList = (direction) => {
    if (
      !["MessagesByLanguage", "Home", "Search"].includes(
        pageStack[pageStack.length - 1].name
      )
    ) {
      return { canNavigate: false, nextItem: null };
    }

    const list = currentMessageList;
    if (!list.length) return { canNavigate: false, nextItem: null };
    if (!pageStack[pageStack.length - 1].key)
      return { canNavigate: false, nextItem: null };

    const currentIndex = list.findIndex(
      (item) => item.id === pageStack[pageStack.length - 1].key
    );
    if (currentIndex === -1) return { canNavigate: false, nextItem: null };

    let nextIndex =
      direction === "forward" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= list.length) {
      return { canNavigate: false, nextItem: null };
    }

    return { canNavigate: true, nextItem: list[nextIndex] };
  };

  const goForwardFromList = () => {
    const { canNavigate, nextItem } = canNavigateFromList("forward");
    if (canNavigate && nextItem) {
      navigateTo("ContentView", nextItem.id, currentMessageList);
    }
  };

  const goBackFromList = () => {
    const { canNavigate, nextItem } = canNavigateFromList("backward");
    if (canNavigate && nextItem) {
      navigateTo("ContentView", nextItem.id, currentMessageList);
    }
  };

  // --- Current Content and Navigation Status ---
  const currentPage = pageStack[pageStack.length - 1];
  const currentItem =
    currentPage.name === "ContentView"
      ? staticContent.find((item) => item.id === currentPage.key)
      : null;

  const currentItemIndex = currentItem
    ? flatContentList.findIndex((item) => item.id === currentItem.id)
    : -1;
  const canGoPrev = currentItemIndex > 0;
  const canGoNext =
    currentItemIndex !== -1 && currentItemIndex < flatContentList.length - 1;

  // Shared Search handler (used by header search box and floating tools)
  const handleSearchChange = (value) => {
    setSearchTerm(value);

    if (value) {
      if (currentPage.name !== "Search") {
        navigateTo("Search");
      }
    } else if (currentPage.name === "Search") {
      navigateToHome();
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (!currentItem) return;
    if (!flatContentList.length) return;

    const index =
      currentItemIndex !== -1
        ? currentItemIndex
        : flatContentList.findIndex((item) => item.id === currentItem.id);

    if (index !== -1) {
      const canPrev = index > 0;
      const canNext = index < flatContentList.length - 1;
      console.log("Can go prev/next:", canPrev, canNext);
    }
  }, [currentItem, flatContentList, currentItemIndex]);

  const handlePlayTrack = (item) => {
    setTrack(item);
    setIsAudioMinimized(false);
  };

  const renderHeaderTitle = () => {
    switch (currentPage.name) {
      case "Home":
        return t.app_title || "Thai: Good News";
      case "MessagesByLanguage": {
        const group = languageGroups.find(
          (g) => g.stableKey === currentPage.key
        );
        if (!group) return t.app_title || "Thai: Good News";
        return lang === "th"
          ? group.langTh || "ภาษา"
          : group.languageEn || "Language";
      }
      case "ContentView": {
        if (!currentItem) return t.app_title || "Thai: Good News";
        const languageLabel =
          lang === "th"
            ? currentItem.langTh || currentItem.languageEn
            : currentItem.languageEn || currentItem.langTh;
        return (
          (t.message_detail_title || "Message") +
          ": " +
          (currentItem.title_en || currentItem.title_th || languageLabel)
        );
      }
      case "SelectedContent":
        return t.selected_content || "Selected Content";
      case "Search":
        return t.search_results || "Search Results";
      default:
        return t.app_title || "Thai: Good News";
    }
  };

  const renderSubtitle = () => {
    switch (currentPage.name) {
      case "Home":
        return t.home_subtitle || "Browse languages and messages";
      case "MessagesByLanguage": {
        const group = languageGroups.find(
          (g) => g.stableKey === currentPage.key
        );
        if (!group) return "";
        const msgCount =
          lang === "th"
            ? `${group.messages.length} ข้อความ`
            : `${group.messages.length} messages`;
        return msgCount;
      }
      case "ContentView": {
        if (!currentItem) return "";
        return (
          t.program_label ||
          "Program #" + (currentItem.id || currentItem.programNumber)
        );
      }
      case "SelectedContent":
        return t.selected_subtitle || "Share, copy, or print your selection";
      case "Search":
        return t.search_subtitle || "Results matching your search";
      default:
        return "";
    }
  };

  const renderHeaderActions = () => {
    const showBackButton = currentPage.name !== "Home";
    return (
      <div className="flex items-center space-x-2">
        {showBackButton && (
          <button
            onClick={goBack}
            className="p-2 rounded-full bg-white shadow text-brand-red hover:bg-gray-100 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-full bg-white shadow text-brand-red hover:bg-gray-100 flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const selectedCount = selectedPrograms.length;

  const renderLanguageBar = () => {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={navigateToHome}
            className="flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-brand-red"
          >
            <Home className="w-4 h-4" />
            <span>{t.home || "Home"}</span>
          </button>
          <button
            onClick={() => navigateTo("SelectedContent")}
            className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
              selectedCount > 0
                ? "bg-brand-red text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>
              {t.selected_short || "Selected"}: {selectedCount}
            </span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-1 rounded-md text-xs font-bold ${
              lang === "en"
                ? "bg-brand-red text-white"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("th")}
            className={`px-2 py-1 rounded-md text-xs font-bold ${
              lang === "th"
                ? "bg-brand-red text-white"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            ไทย
          </button>
        </div>
      </div>
    );
  };

  const renderSplashScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-700 to-red-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_60%),radial-gradient(circle_at_bottom,_#000000,_transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div className="mb-8">
            <img
              src={BannerLogo}
              alt="Thai Good News"
              className="w-64 h-auto drop-shadow-lg"
            />
          </div>

          <h1 className="text-3xl font-extrabold mb-2 tracking-wide">
            {t.app_title || "Thai: Good News"}
          </h1>
          <p className="text-sm opacity-90 max-w-md mb-6">
            {t.splash_tagline ||
              "Browse, listen, and share the Good News in many languages across Thailand."}
          </p>

          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-150" />
            <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-300" />
          </div>

          <div className="text-xs opacity-80">
            {t.loading || "Loading your experience…"}
          </div>
        </div>
      </div>
    );
  };

  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      setIsInstallBannerVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      alert("Install prompt is not available yet.");
      return;
    }

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setIsInstallBannerVisible(false);
    } else {
      console.log("User dismissed the install prompt");
    }
  };

  const handleLanguageGroupClick = (stableKey) => {
    navigateTo("MessagesByLanguage", stableKey);
  };

  const handleProgramCardToggle = (programId) => {
    handleProgramToggle(programId);
  };

  const handleQrSizeChange = (event) => {
    setQrSize(parseInt(event.target.value, 10));
  };

  const handleShareLanguageQr = (group) => {
    const stableKey = group.stableKey;
    const shareTextEn = `Thai: Good News – ${group.languageEn}\nBrowse messages in this language.`;
    const shareTextTh = `ข่าวดี – ${group.langTh}\nเลือกฟังเนื้อหาในภาษานี้`;
    const cardUrl = `https://thai-good-news.netlify.app/#/browse/lang/${encodeURIComponent(
      stableKey
    )}`;

    const title =
      lang === "th" ? "แชร์ภาษา" : "Share Language QR / Language Link";
    const text = lang === "th" ? shareTextTh : shareTextEn;

    if (navigator.share) {
      navigator
        .share({
          title,
          text,
          url: cardUrl,
        })
        .then(() => console.log("Language QR shared successfully!"))
        .catch((error) =>
          console.error("Error sharing language QR card:", error)
        );
    } else {
      copyLink(cardUrl, (message) => alert(message));
    }
  };

  const openLanguageQrModal = (group) => {
    const stableKey = group.stableKey;
    const url = `https://thai-good-news.netlify.app/#/browse/lang/${encodeURIComponent(
      stableKey
    )}`;
    setModalLanguageName(lang === "th" ? group.langTh : group.languageEn);
    setModalLanguageShareUrl(url);
    setIsLanguageQrModalOpen(true);
  };

  const handleCloseLanguageQrModal = () => {
    setIsLanguageQrModalOpen(false);
    setModalLanguageName("");
    setModalLanguageShareUrl("");
  };

  const handleShareSelected = async () => {
    const selectedContent = getSelectedContent();
    if (!selectedContent) return;

    const isThai = lang === "th";

    const exportText = selectedContent
      .map((item) => {
        const languageDisplay = isThai
          ? item.langTh || ""
          : item.languageEn || "";
        const titleDisplay = isThai
          ? item.title_th || "ไม่มีชื่อ"
          : item.title_en || "Untitled";
        const verseDisplay = isThai ? item.verse_th || "" : item.verse_en || "";
        const label = isThai
          ? "ฟัง แบ่งปัน ดาวน์โหลดที่:"
          : "Listen, Share, Download at:";
        const cardUrl = `https://5fi.sh/T${item.id}`;

        return `${languageDisplay} – ${titleDisplay}
Program # ${item.id}

${verseDisplay}

${label}
${cardUrl}`;
      })
      .join("\n\n------------------------------\n\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: t.bulk_share_title || "QR Cards",
          text: exportText,
        });
        alert(t.content_shared || "Content shared successfully!");
      } else {
        await navigator.clipboard.writeText(exportText);
        alert(t.content_copied || "Content copied to clipboard!");
      }
    } catch (error) {
      console.error("Sharing failed:", error);
      alert(t.share_failed || "Sharing failed or cancelled.");
    }
  };

  const handleCopySelected = async () => {
    const selectedContent = getSelectedContent();
    if (!selectedContent) return;

    const isThai = lang === "th";

    const exportText = selectedContent
      .map((item) => {
        const languageDisplay = isThai
          ? item.langTh || ""
          : item.languageEn || "";
        const titleDisplay = isThai
          ? item.title_th || "ไม่มีชื่อ"
          : item.title_en || "Untitled";
        const verseDisplay = isThai ? item.verse_th || "" : item.verse_en || "";
        const label = isThai
          ? "ฟัง แบ่งปัน ดาวน์โหลดที่:"
          : "Listen, Share, Download at:";
        const cardUrl = `https://5fi.sh/T${item.id}`;

        return `${languageDisplay} – ${titleDisplay}
Program # ${item.id}

${verseDisplay}

${label}
${cardUrl}`;
      })
      .join("\n\n------------------------------\n\n");

    try {
      await navigator.clipboard.writeText(exportText);
      alert(
        `${selectedContent.length} ${t.messages_copied || "QR cards copied!"}`
      );
    } catch (error) {
      console.error("Copy failed:", error);
      alert(t.copy_failed || "Failed to copy QR cards.");
    }
  };

  const handleDownloadSelected = () => {
    const selectedContent = getSelectedContent();
    if (!selectedContent) return;

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

  if (isLoading) {
    return renderSplashScreen();
  }

  let PageContent = null;

  switch (currentPage.name) {
    case "Home":
      PageContent = (
        <div className="p-4 pt-8">
          {filteredLanguageGroups.map((group) => (
            <LanguageGroupCard
              key={group.stableKey}
              group={group}
              lang={lang}
              t={t}
              isSelected={group.isSelected}
              isIndeterminate={group.isIndeterminate}
              onToggle={() =>
                handleLanguageToggle(
                  group.stableKey, // 1st: The ID of the language (String)
                  group.messages // 2nd: The list of messages (Array)
                )
              }
              onNavigate={() => handleLanguageGroupClick(group.stableKey)}
              fontSize={fontSize}
            />
          ))}
        </div>
      );
      break;
    case "MessagesByLanguage": {
      const group = languageGroups.find((g) => g.stableKey === currentPage.key);
      if (!group) {
        PageContent = (
          <div className="p-4 pt-8">
            <p className="text-gray-500">{t.no_messages || "No messages"}</p>
          </div>
        );
      } else {
        PageContent = (
          <div className="p-4 pt-8">
            {group.messages.map((program) => (
              <ProgramCard
                key={program.id}
                program={{
                  title:
                    lang === "th"
                      ? program.title_th || program.title_en
                      : program.title_en || program.title_th,
                  messages: [program],
                }}
                lang={lang}
                t={t}
                onToggle={() => handleProgramCardToggle(program.id)}
                isSelected={selectedPrograms.includes(program.id)}
                onOpenContent={() =>
                  navigateTo("ContentView", program.id, group.messages)
                }
              />
            ))}
          </div>
        );
      }
      break;
    }
    case "ContentView":
      if (!currentItem) {
        PageContent = (
          <div className="p-4 pt-8">
            <p className="text-gray-500">
              {t.no_message_found || "Message not found"}
            </p>
          </div>
        );
      } else {
        PageContent = (
          <ContentView
            item={currentItem}
            lang={lang}
            t={t}
            onBack={goBackFromList}
            onForward={goForwardFromList}
            hasPrev={canGoPrev}
            hasNext={canGoNext}
            userData={{
              bookmarks: userBookmarks,
              notes: userNotes,
              userName,
              userLanguage,
              userVerse,
            }}
            saveUserData={saveUserData}
            onPlay={handlePlayTrack}
            pageStack={pageStack}
          />
        );
      }
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
    default:
      PageContent = null;
      break;
  }

  const languageControls = {
    lang,
    setLang,
  };

  const fontSizeControls = {
    fontSize,
    setFontSize,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        onLogoClick={navigateToHome}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        // We removed languageControls and fontSizeControls from here
      />

      {renderLanguageBar()}

      {isInstallBannerVisible && (
        <div className="fixed left-0 right-0 bottom-0 z-50 px-4 pb-4">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl border border-red-100 overflow-hidden">
            <div className="flex items-center p-4 bg-red-700 text-white">
              <img
                src={BannerLogo}
                alt="Thai Good News Logo"
                className="w-10 h-10 rounded-md mr-3 shadow-md bg-white p-1"
              />
              <div>
                <h3 className="font-bold text-sm">
                  {t.install_title || "Install Thai: Good News"}
                </h3>
                <p className="text-xs opacity-90">
                  {t.install_subtitle ||
                    "Quick access to all languages and messages on your device."}
                </p>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between bg-gray-50">
              <button
                onClick={() => setIsInstallBannerVisible(false)}
                className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                {t.install_dismiss || "Not now"}
              </button>
              {installPromptEvent && (
                <button
                  onClick={handleInstallClick}
                  className={`w-full flex items-center justify-center ml-3 px-3 py-2 rounded-full text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-colors`}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t.install_app || "Install App"}
                </button>
              )}
            </div>
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

      {/* --- FLOATING TOOLS BUTTON + PANEL --- */}
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
        onOpenSelected={() => navigateTo("SelectedContent")}
      />

      {/* --- NAVIGATION DRAWER (Sidebar) --- */}
      <div
        className={`fixed inset-0 z-40 transition ${
          isDrawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black bg-opacity-40"
          onClick={() => setIsDrawerOpen(false)}
        />
        <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <img
                src={AppLogo}
                alt="App Logo"
                className="w-8 h-8 rounded shadow-sm"
              />
              <div>
                <div className="font-semibold text-gray-800">
                  {t.app_title_short || "Good News"}
                </div>
                <div className="text-xs text-gray-400">
                  {t.version_label || "PWA Version"} 1.0.1
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={navigateToHome}
            className="flex items-center w-full px-3 py-2 mb-2 rounded-lg hover:bg-gray-100 text-sm font-semibold text-gray-800"
          >
            <Home className="w-4 h-4 mr-2" />
            {t.menu_home || "Home"}
          </button>

          <button
            onClick={() => navigateTo("SelectedContent")}
            className="flex items-center w-full px-3 py-2 mb-2 rounded-lg hover:bg-gray-100 text-sm font-semibold text-gray-800"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            {t.menu_selected || "Selected Content"}
            {selectedCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center rounded-full bg-brand-red text-white text-[10px] px-2 py-0.5">
                {selectedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => alert("Settings coming soon!")}
            className="flex items-center w-full px-3 py-2 mb-2 rounded-lg hover:bg-gray-100 text-sm font-semibold text-gray-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            {t.menu_settings || "Settings"}
          </button>

          <a
            href="https://thai-good-news.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center w-full px-3 py-2 mt-auto rounded-lg hover:bg-gray-100 text-xs text-gray-600"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {t.menu_open_site || "Open website"}
          </a>
        </div>
      </div>
    </div>
  );
}
