import React, { useState, useMemo, useEffect } from "react";
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
  ChevronLeft, // Added for detail back button
  Share2,
  Zap,
  Download, // Added for content export
} from "./components/Icons";
import { staticContent } from "./data/staticContent"; // Ensure your file is named staticContent.js
import QRCodeDisplay from "./components/QRCodeDisplay";

// --- CONSTANTS ---
const PRIMARY_COLOR = "bg-brand-red"; // Your primary theme color
const ACCENT_COLOR = "text-brand-red";
const TEXT_COLOR = "text-gray-800";

// You will need to create a helper for copyLink, used as a share fallback
const copyLink = (text, callback) => {
  navigator.clipboard
    .writeText(text)
    .then(() => callback("Link copied!"))
    .catch(() => callback("Failed to copy link."));
};

// --- Reusable Components ---

// Content Card Component
const ContentCard = ({ item, lang, onSelect }) => {
  return (
    <div
      className="bg-white p-4 mb-4 rounded-xl shadow-md border-t-4 border-brand-red cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.01]"
      onClick={() => onSelect(item)}
    >
      <h3 className={`text-xl font-bold mb-1 ${ACCENT_COLOR}`}>
        {lang === "en" ? item.title_en : item.title_th}
      </h3>
      <p className={`text-sm font-semibold text-gray-500 mb-2`}>
        {item.language}
      </p>
      <p className={`text-base line-clamp-2 ${TEXT_COLOR}`}>
        {lang === "en" ? item.verse_en : item.verse_th}
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
      <span className="text-sm font-semibold text-white">
        {t.language_label}:
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

// --- Page Components ---

// Content View Component (Detail Page)
const ContentView = ({ item, lang, t, onBack, userData, saveUserData }) => {
  const isBookmarked = userData.bookmarks.includes(item.id);
  const cardUrl = `${window.location.origin}/?card=${item.id}&lang=${lang}`; // Unique URL for this card

  const toggleBookmark = () => {
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = userData.bookmarks.filter((id) => id !== item.id);
    } else {
      newBookmarks = [...userData.bookmarks, item.id];
    }
    saveUserData({ ...userData, bookmarks: newBookmarks });
  };

  // Function to generate the content string for sharing
  const generateShareText = () => {
    return `
${t.app_name} - ${lang === "en" ? item.title_en : item.title_th}
${lang === "en" ? item.verse_en : item.verse_th}
Language: ${item.language}
Program Number: ${item.id}
Read more: ${cardUrl}
        `.trim();
  };

  const handleShare = () => {
    const shareText = generateShareText();
    if (navigator.share) {
      // Use Web Share API for native sharing on mobile
      navigator
        .share({
          title: t.app_name,
          text: shareText,
          url: cardUrl,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      // Fallback for desktop: copy text to clipboard
      copyLink(shareText, (message) => alert(message));
    }
  };

  // Logic to download the QR code as a PNG file
  const downloadQrCode = () => {
    const svg = document.querySelector("#qr-code-to-download svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const svgSize = 500;
      canvas.width = svgSize;
      canvas.height = svgSize;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, svgSize, svgSize);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngFile;
        downloadLink.download = `share-${item.id}-${lang}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      // Note: Data URL conversion is necessary for images created from SVG
      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <button
        onClick={onBack}
        className={`text-sm font-semibold mb-4 flex items-center ${ACCENT_COLOR} hover:text-red-700 transition-colors`}
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        {t.back}
      </button>

      <h1 className="text-3xl font-extrabold mb-2 text-gray-800">
        {lang === "en" ? item.title_en : item.title_th}
      </h1>

      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <p className="text-base font-semibold text-gray-500">{item.language}</p>
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
        <p className="text-xl leading-relaxed text-gray-700 whitespace-pre-line">
          {lang === "en" ? item.verse_en : item.verse_th}
        </p>
        <p className="text-sm font-semibold text-gray-500 mt-4">
          Program Number: {item.id}
        </p>
      </div>

      {/* --- SHARE / EXPORT SECTION --- */}
      <h2 className="text-lg font-bold mb-3 mt-6 text-gray-800">
        Share This Message
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Mobile Share Button / Desktop Copy Text */}
        <button
          onClick={handleShare}
          className="p-3 font-bold text-white rounded-xl bg-green-500 transition-colors hover:bg-green-600 shadow-md flex items-center justify-center"
        >
          <Share2 className="w-5 h-5 mr-2" /> Share/Copy
        </button>

        {/* QR Code Download Button */}
        <button
          onClick={downloadQrCode}
          className="p-3 font-bold text-brand-red border border-brand-red rounded-xl transition-colors hover:bg-red-50 shadow-md flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" /> Download QR (PNG)
        </button>
      </div>

      {/* QR Code Display for Download */}
      <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-inner">
        <p className="text-sm text-gray-600 mb-2">
          Scan to share this specific card.
        </p>
        <div id="qr-code-to-download">
          <QRCodeDisplay url={cardUrl} size={200} />
        </div>
      </div>

      {/* Placeholder for Notes Section */}
      <div className="p-4 bg-red-50 border-l-4 border-brand-red rounded-lg mt-6">
        <h2 className="text-lg font-semibold text-gray-700">My Notes</h2>
        <p className="text-sm text-gray-500">
          Notes feature coming soon! You can view all saved notes on the Notes
          page.
        </p>
      </div>
    </div>
  );
};

// Home Page Component
const HomePage = ({ lang, t, onSelect }) => {
  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.contents}</h1>
      {staticContent.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          lang={lang}
          onSelect={onSelect}
        />
      ))}
      <div className="h-10"></div> {/* Spacer for bottom bar */}
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
          <ContentCard
            key={item.id}
            item={item}
            lang={lang}
            onSelect={onSelect}
          />
        ))
      ) : (
        <div className="text-center p-8 text-gray-500">
          <p>{t.no_bookmarks}</p>
          <p className="text-sm mt-2">{t.bookmark_tip}</p>
        </div>
      )}
      <div className="h-10"></div> {/* Spacer */}
    </div>
  );
};

// Search Component
const SearchPage = ({ lang, t, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter content based on search term
  const filteredContent = useMemo(() => {
    if (!searchTerm) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();

    return staticContent.filter((item) => {
      // Check English title/verse, Thai title/verse, and language name
      return (
        item.language.toLowerCase().includes(lowerSearchTerm) ||
        item.title_en.toLowerCase().includes(lowerSearchTerm) ||
        item.title_th.toLowerCase().includes(lowerSearchTerm) ||
        item.verse_en.toLowerCase().includes(lowerSearchTerm) ||
        item.verse_th.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [searchTerm]);

  const resultCount = filteredContent.length;

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.search}</h1>

      {/* Search Input Box */}
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

      {/* Search Results */}
      {searchTerm && (
        <p className="text-sm text-gray-600 mb-4 font-semibold">
          {resultCount} {resultCount === 1 ? "Result" : "Results"} found.
        </p>
      )}

      {resultCount > 0 ? (
        filteredContent.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            lang={lang}
            onSelect={onSelect}
          />
        ))
      ) : searchTerm ? (
        <div className="text-center p-8 text-gray-500">
          <p>No results found for "{searchTerm}".</p>
          <p className="mt-2 text-sm">
            Try searching by title, language, or a verse snippet.
          </p>
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          <p>Start typing to search all {staticContent.length} items.</p>
        </div>
      )}
    </div>
  );
};

// Settings Component with Auth UI
const SettingsPage = ({ lang, t, setLang, userId, logOut, signUp, signIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState(null);
  // Crude check: Firebase anonymous IDs are long; real UIDs are usually shorter/different format
  const isAnonymous =
    userId && userId.length > 20 && !userId.startsWith("firebase:");

  const handleAuthAction = async (action) => {
    if (action === "signup") {
      const success = await signUp(email, password);
      if (success) setAuthMessage("Sign up successful! You are now logged in.");
      else
        setAuthMessage(
          "Sign up failed. Please check the error message in the console."
        );
    } else if (action === "signin") {
      const success = await signIn(email, password);
      if (success) setAuthMessage("Sign in successful!");
      else setAuthMessage("Sign in failed. Check your email/password.");
    }
    // Clear inputs
    setEmail("");
    setPassword("");
    setTimeout(() => setAuthMessage(null), 5000);
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.settings}</h1>

      <div className="bg-white p-4 rounded-xl shadow-md mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-2">App Status</h2>
        <p className="text-sm text-gray-600 mb-2">
          User ID:{" "}
          <span className="font-mono text-xs text-brand-red">
            {userId ? userId : "Loading..."}
          </span>
        </p>
        <p
          className={`text-sm font-bold ${
            isAnonymous ? "text-orange-500" : "text-green-600"
          }`}
        >
          Status: {isAnonymous ? "Guest (Anonymous)" : "Registered User"}
        </p>

        <h2 className="text-lg font-semibold mt-4 mb-2">Language</h2>
        <LanguageToggle lang={lang} setLang={setLang} t={t} />
      </div>

      {authMessage && (
        <div className="p-3 mb-4 rounded-lg bg-green-100 text-green-700 font-semibold">
          {authMessage}
        </div>
      )}

      {/* Authentication Form */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Email Authentication
        </h2>

        {isAnonymous ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-brand-red focus:border-brand-red"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-brand-red focus:border-brand-red"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAuthAction("signin")}
                className="p-3 font-bold text-white rounded-xl bg-brand-red transition-colors hover:bg-red-800"
              >
                Sign In
              </button>
              <button
                onClick={() => handleAuthAction("signup")}
                className="p-3 font-bold text-brand-red border border-brand-red rounded-xl transition-colors hover:bg-red-50"
              >
                Sign Up
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={logOut}
            className="w-full p-3 font-bold text-white rounded-xl bg-red-600 transition-colors hover:bg-red-700"
          >
            Log Out
          </button>
        )}
      </div>
    </div>
  );
};

// Side Drawer Component
const SideDrawer = ({ isOpen, onClose, userId, navigate, t, appUrl }) => {
  const [showQr, setShowQr] = useState(false); // State for QR code visibility

  // Nav items definition
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
    // This is the functional share button that toggles the QR code
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
    // Changed key from 'share' to 'website' to fix the console warning
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>

      {/* Drawer Content */}
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

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() =>
                item.path ? handleNavigate(item.path) : item.action()
              }
              className={`flex items-center w-full p-3 rounded-xl text-left text-gray-700 hover:bg-gray-200 transition-colors mb-2 ${ACCENT_COLOR}`}
            >
              {item.icon && (
                <item.icon className={`w-5 h-5 mr-3 ${ACCENT_COLOR}`} />
              )}
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* QR Code Display */}
        <div className="p-4 border-t border-gray-200">
          {showQr && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t.qr_code}
              </h3>
              <QRCodeDisplay url={appUrl} size={150} />
              <p className="text-xs text-gray-500 mt-2 break-all">{appUrl}</p>
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Call custom hook to manage authentication and data
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

  const navigate = (path, item = null) => {
    setPage(path);
    setSelectedItem(item);
  };

  // EFFECT: Checks URL for shared card ID on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get("card");
    const shareLang = urlParams.get("lang");

    if (cardId) {
      const item = staticContent.find((i) => i.id === parseInt(cardId));
      if (item) {
        // Navigate to the specific card
        navigate("detail", item);
        // Optionally set the language if shared that way
        if (shareLang && (shareLang === "en" || shareLang === "th")) {
          setLang(shareLang);
        }
      }
    }
  }, [setLang]); // Include setLang in dependency array

  // Helper to render the current page content
  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="p-8 text-center text-gray-600">
          Loading authentication...
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center text-red-600 font-bold">
          Error: {error}
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

      case "search":
        return (
          <SearchPage
            lang={lang}
            t={t}
            onSelect={(item) => navigate("detail", item)}
          />
        );

      case "bookmarks":
        return (
          <BookmarksPage
            lang={lang}
            t={t}
            onSelect={(item) => navigate("detail", item)}
            userData={userData}
          />
        );

      case "notes":
        return (
          <div className="p-4 pt-8 text-center text-gray-500">
            <h1 className="text-2xl font-bold mb-4">{t.notes}</h1>
            <p>This page is ready to be built!</p>
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
          />
        );

      case "home":
      default:
        return (
          <HomePage
            lang={lang}
            t={t}
            onSelect={(item) => navigate("detail", item)}
          />
        );
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-100 shadow-xl">
      {/* Header */}
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">{renderContent()}</main>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userId={userId}
        navigate={navigate}
        t={t}
        appUrl={window.location.href}
      />
    </div>
  );
}
