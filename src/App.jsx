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
} from "./components/Icons";
import { staticContent } from "./data/staticContent"; // Corrected import path
import QRCodeDisplay from "./components/QRCodeDisplay";

// --- CONSTANTS ---
const PRIMARY_COLOR = "bg-brand-red";
const ACCENT_COLOR = "text-brand-red";
const TEXT_COLOR = "text-gray-800";

// Helper for share fallback
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
// This is the template for the downloadable PNG
const ShareCardPrintView = ({ item, lang, t, cardUrl }) => {
  const title = lang === "en" ? item.title_en : item.title_th;
  const verse = lang === "en" ? item.verse_en : item.verse_th;

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
        {" "}
        {/* Padding added here */}
        <QRCodeDisplay
          url={cardUrl}
          size={200}
          fgColor="#000000" // Black QR code
          bgColor="#FFFFFF"
        />
      </div>

      <p className="text-sm text-gray-600 text-center break-all">
        Read this message and more at: <br />
        <a href={cardUrl} className="text-brand-red underline">
          {cardUrl}
        </a>
      </p>
      <p className="text-xs text-gray-500 mt-4 text-center">
        Scan the QR code or visit the link to access this content.
      </p>
    </div>
  );
};

// --- Page Components ---

// Content View Component (Detail Page)
const ContentView = ({ item, lang, t, onBack, userData, saveUserData }) => {
  const isBookmarked = userData.bookmarks.includes(item.id);
  // Using the custom 5fi.sh URL pattern
  const cardUrl = `https://5fi.sh/T${item.id}`;

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

  // Logic to download the entire ShareCardPrintView as a PNG file
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
        <button
          onClick={handleShare}
          className="p-3 font-bold text-white rounded-xl bg-green-500 transition-colors hover:bg-green-600 shadow-md flex items-center justify-center"
        >
          <Share2 className="w-5 h-5 mr-2" /> Share/Copy
        </button>

        <button
          onClick={downloadShareCard}
          className="p-3 font-bold text-brand-red border border-brand-red rounded-xl transition-colors hover:bg-red-50 shadow-md flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" /> Download Card (PNG)
        </button>
      </div>

      <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-inner">
        <p className="text-sm text-gray-600 mb-2">
          In-app QR code (download above for print-ready)
        </p>
        <div className="p-2 bg-gray-50 rounded-lg">
          <QRCodeDisplay url={cardUrl} size={150} fgColor="#000000" />
        </div>
      </div>

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
      <div className="h-10"></div>
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
      <div className="h-10"></div>
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
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => item.action()} // Simplified action call
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      // Find item by ID, ensuring cardId is compared as the same type (e.g., string or number)
      // Assuming your staticContent IDs are numbers
      const item = staticContent.find((i) => i.id === parseInt(cardId));
      if (item) {
        navigate("detail", item);
        if (shareLang && (shareLang === "en" || shareLang === "th")) {
          setLang(shareLang);
        }
      }
    }
  }, [setLang]); // Added setLang to dependency array

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
        appUrl={window.location.href}
      />
    </div>
  );
}
