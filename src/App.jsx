import React, { useState, useMemo } from "react";
import { i18n } from "./i18n";
import QRCodeDisplay from "./components/QRCodeDisplay";
import { staticContent } from "./data/staticContent";
import { useFirebase } from "./hooks/useFirebase";
import {
  Home,
  Search,
  Bookmark,
  Menu,
  Settings,
  Share2,
  Volume2,
  Download,
  Qrcode,
  X,
  Zap,
  BookOpen,
  Pen,
} from "./components/Icons";

// --- Constants ---
const PRIMARY_COLOR = "bg-brand-red";
const ACCENT_COLOR = "text-brand-red";

// --- Utility Functions ---
const copyLink = (link, setStatus) => {
  try {
    const el = document.createElement("textarea");
    el.value = link;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setStatus("link_copied");
  } catch (err) {
    console.error("Failed to copy text", err);
    setStatus("copy_error");
  }
  setTimeout(() => setStatus(null), 3000);
};

// --- Sub-Components ---

const LanguageToggle = ({ lang, setLang, t }) => {
  const toggleLanguage = () => {
    const newLang = lang === "en" ? "th" : "en";
    setLang(newLang);
    localStorage.setItem("appLang", newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-full font-bold transition-colors ${PRIMARY_COLOR} text-white shadow-lg text-sm`}
    >
      <Zap className="w-4 h-4" />
      <span>{t.language_switch}</span>
    </button>
  );
};

const ContentCard = ({ item, lang, onSelect }) => {
  const titleKey = lang === "en" ? "title_en" : "title_th";
  const languageTitle = `${item.language} - ${item[titleKey]}`;

  const PlaceholderImage = () => (
    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-yellow-100 rounded-lg border-2 border-yellow-400 overflow-hidden relative">
      <BookOpen className="w-10 h-10 absolute inset-0 m-auto text-yellow-600 opacity-70" />
      <span className="absolute bottom-1 right-1 text-xs font-bold text-yellow-700 opacity-80">
        {item.language.slice(0, 3)}
      </span>
    </div>
  );

  return (
    <div
      onClick={() => onSelect(item)}
      className="flex items-center space-x-4 p-4 bg-white border-b border-gray-100 active:bg-red-50 transition-colors cursor-pointer rounded-xl shadow-sm hover:shadow-md mb-2"
    >
      <PlaceholderImage />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {languageTitle}
        </p>
        <p className="text-xs text-gray-500 truncate">{item.verse_en}</p>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 ${ACCENT_COLOR}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
};

const ContentView = ({ item, lang, t, onBack, userData, saveUserData }) => {
  const titleKey = lang === "en" ? "title_en" : "title_th";
  const verseKey = lang === "en" ? "verse_en" : "verse_th";

  const isBookmarked = userData.bookmarks.includes(item.id);
  const itemNote = userData.notes.find((n) => n.id === item.id) || {
    id: item.id,
    text: "",
  };
  const [noteText, setNoteText] = useState(itemNote.text);
  const [shareStatus, setShareStatus] = useState(null);

  const toggleBookmark = () => {
    const newBookmarks = isBookmarked
      ? userData.bookmarks.filter((id) => id !== item.id)
      : [...userData.bookmarks, item.id];
    saveUserData({ ...userData, bookmarks: newBookmarks });
  };

  const handleSaveNote = () => {
    const otherNotes = userData.notes.filter((n) => n.id !== item.id);
    const newNotes = [...otherNotes, { id: item.id, text: noteText }];
    saveUserData({ ...userData, notes: newNotes });
  };

  const handleShare = (link) => {
    copyLink(link, (status) => {
      if (status === "link_copied") setShareStatus(t.share_link_copied);
      if (status === "copy_error") setShareStatus(t.copy_error);
    });
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto bg-gray-50">
      <button
        onClick={onBack}
        className={`flex items-center mb-6 font-semibold ${ACCENT_COLOR} text-sm transition-opacity hover:opacity-75`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {t.back_to_list}
      </button>

      <h1
        className={`text-2xl font-extrabold text-gray-900 mb-2 ${ACCENT_COLOR}`}
      >
        {item.language}
      </h1>
      <h2 className="text-xl font-bold text-gray-700 mb-4">{item[titleKey]}</h2>

      <div className="bg-white p-6 rounded-2xl shadow-xl mb-6 border border-gray-100">
        <div className="flex justify-center items-center h-48 bg-gray-100 rounded-lg mb-4">
          <Qrcode className="w-16 h-16 text-gray-400" />
        </div>
        <p className="text-center text-sm text-gray-600 mb-4 font-mono truncate">
          {item.link}
        </p>
        <p className="text-lg text-center font-serif text-gray-800 mb-6">
          {item[verseKey]}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`col-span-2 flex items-center justify-center p-3 font-bold text-white rounded-xl transition-all shadow-lg hover:shadow-xl ${PRIMARY_COLOR}`}
          >
            <Volume2 className="w-5 h-5 mr-2" /> {t.listen_now}
          </a>
          <button
            onClick={() => handleShare(item.link)}
            className={`flex items-center justify-center p-3 border border-red-200 ${ACCENT_COLOR} font-semibold rounded-xl transition-colors hover:bg-red-50`}
          >
            <Share2 className="w-5 h-5 mr-1" /> {t.share_mp3}
          </button>
          <a
            href={`${item.link}/full.zip`}
            className={`flex items-center justify-center p-3 border border-red-200 ${ACCENT_COLOR} font-semibold rounded-xl transition-colors hover:bg-red-50`}
          >
            <Download className="w-5 h-5 mr-1" /> {t.download_full_zip}
          </a>
        </div>
        {shareStatus && (
          <p
            className={`text-center text-sm font-semibold ${
              shareStatus.includes("copied") ? "text-green-600" : "text-red-600"
            } mt-2`}
          >
            {shareStatus}
          </p>
        )}

        <button
          onClick={toggleBookmark}
          className={`mt-4 w-full flex items-center justify-center p-3 font-semibold rounded-xl transition-all shadow-md ${
            isBookmarked
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Bookmark
            className={`w-5 h-5 mr-2 ${isBookmarked ? "fill-current" : ""}`}
          />
          {isBookmarked ? "Bookmarked" : "Add Bookmark"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        <h3 className="text-xl font-bold text-gray-700 mb-3 flex items-center">
          <Pen className="w-5 h-5 mr-2" /> {t.notes}
        </h3>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={t.add_note}
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
        ></textarea>
        <button
          onClick={handleSaveNote}
          className={`mt-3 w-full flex items-center justify-center p-3 font-bold text-white rounded-xl transition-colors ${PRIMARY_COLOR} hover:bg-red-800 shadow-md`}
        >
          {t.save}
        </button>
      </div>
    </div>
  );
};

const SideDrawer = ({ isOpen, onClose, userId, navigate, t, appUrl }) => {
  const [showQr, setShowQr] = useState(false);
  const navItems = [
    { key: "home", label: t.contents, icon: Home, path: "home" },
    { key: "search", label: t.search, icon: Search, path: "search" },
    { key: "bookmarks", label: t.bookmarks, icon: Bookmark, path: "bookmarks" },
    { key: "notes", label: t.notes, icon: Pen, path: "notes" },
    // Only keep this one, which toggles the QR code display:
    {
      key: "share",
      label: t.share_app,
      icon: Share2,
      action: () => setShowQr((p) => !p),
    },
    { key: "settings", label: t.settings, icon: Settings, path: "settings" },
    {
      key: "5fish",
      label: "5fish Website",
      icon: Zap,
      action: () => window.open("https://5fish.mobi", "_blank"),
    },
  ];

  <div className="p-4 border-t border-gray-200">
    {showQr && (
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {t.qr_code}
        </h3>
        <QRCodeDisplay url={appUrl} size={150} /> {/* <--- QR CODE HERE */}
      </div>
    )}
  </div>;

  return (
    <div
      className={`fixed inset-0 z-40 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="relative w-72 max-w-xs h-full bg-white shadow-2xl overflow-y-auto">
        <div
          className={`${PRIMARY_COLOR} p-6 pb-8 flex flex-col items-center shadow-md`}
        >
          <div className="w-20 h-20 bg-white rounded-xl mb-2 flex items-center justify-center shadow-lg">
            <BookOpen className={`w-10 h-10 ${ACCENT_COLOR}`} />
          </div>
          <h2 className="text-xl font-bold text-white">{t.app_name}</h2>
          <p className="text-xs text-gray-200 mt-2">
            {t.auth_status} {userId ? userId.substring(0, 8) : "Guest"}
          </p>
        </div>
        <div className="p-4">
          {navItems.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                if (item.path) navigate(item.path);
                if (item.action) item.action();
                onClose();
              }}
              className="flex items-center p-3 text-gray-700 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer text-base font-medium"
            >
              <item.icon className={`w-6 h-6 mr-4 ${ACCENT_COLOR}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("home");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const t = useMemo(() => i18n[lang], [lang]);
  const { isAuthReady, userId, userData, saveUserData, error } =
    useFirebase(setLang);

  const bookmarkedContent = useMemo(() => {
    if (!userData || userData.bookmarks.length === 0) return [];
    return staticContent.filter((item) => userData.bookmarks.includes(item.id));
  }, [userData]);

  const navigate = (newPage, item = null) => {
    if (item) {
      setSelectedItem(item);
      setPage("detail");
    } else {
      setSelectedItem(null);
      setPage(newPage);
    }
  };

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-red" />
          <p className="mt-4 text-gray-600 font-semibold">{t.loading}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center p-8 text-red-600 font-bold">
          {t.error_auth}
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
            onBack={() => setPage("home")}
            userData={userData}
            saveUserData={saveUserData}
          />
        );
      case "bookmarks":
        return (
          <div className="p-4 pt-8 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              {t.bookmarks} ({bookmarkedContent.length})
            </h1>
            {bookmarkedContent.length > 0 ? (
              bookmarkedContent.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  onSelect={(item) => navigate("detail", item)}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center p-8">{t.no_bookmarks}</p>
            )}
          </div>
        );
      case "settings":
        return (
          <div className="p-4 pt-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              {t.settings}
            </h1>
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h2 className="text-lg font-semibold mb-2">Language</h2>
              <LanguageToggle lang={lang} setLang={setLang} t={t} />
            </div>
          </div>
        );
      case "home":
      default:
        return (
          <div className="p-4 pt-8 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              {t.all_content} ({staticContent.length})
            </h1>
            {staticContent.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                lang={lang}
                onSelect={(item) => navigate("detail", item)}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col font-sans">
      <header
        className={`sticky top-0 w-full ${PRIMARY_COLOR} p-4 shadow-lg z-30 flex justify-between items-center`}
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

      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userId={userId}
        navigate={navigate}
        t={t}
        appUrl={window.location.href} // <--- ADD THIS
      />
    </div>
  );
};

export default App;
