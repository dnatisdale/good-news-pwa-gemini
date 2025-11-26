import React, { useState, useMemo, useEffect } from "react";
import html2canvas from "html2canvas";
import ContentView from "./pages/ContentView";
import { useFirebase } from "./hooks/useFirebase";
import { i18n } from "./i18n";
import { useContentFilter } from "./hooks/useContentFilter";
import { getFilteredMessages } from "./utils/filterLogic";
import {
  Home,
  Search,
  Heart,
  Pen,
  Settings,
  Menu,
  X,
  ExternalLink,
  Download,
  Upload,
  Zap,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "./components/Icons";
import { staticContent } from "./data/staticContent";
import QRCodeDisplay from "./components/QRCodeDisplay";
import { QRCodeSVG } from "qrcode.react";
import AppLogo from "./assets/splash-screen-logo.svg";
import BannerLogo from "./assets/banner-logo.svg";
import { jsPDF } from "jspdf";
import { formatContentItem } from "./utils/contentFormatter";
import LanguageToggle from "./components/LanguageToggle";
import FloatingUtilityBar from "./components/FloatingUtilityBar";
import AudioPlayer from "./components/AudioPlayer";
import LanguageListPage from "./pages/LanguageListPage";
import SelectedContentPage from "./pages/SelectedContentPage";
import MessagesByLanguagePage from "./pages/MessagesByLanguagePage";
import FavoritesPage from "./pages/FavoritesPage";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/SettingsPage";
import NotesPage from "./pages/NotesPage";
import MyLibraryPage from "./pages/MyLibraryPage";
import ImportPage from "./pages/ImportPage";
import UpdateNotification from "./components/UpdateNotification";

// --- CONSTANTS ---
const PRIMARY_COLOR_CLASS = "bg-gradient-to-r from-brand-red to-brand-red-dark";
const ACCENT_COLOR_CLASS = "text-brand-red";
const DEFAULT_FONT_SIZE = "16px";

export default function App() {
  // --- Swipe to Close Sidebar Logic ---
  const touchStartRef = React.useRef(null);
  const touchEndRef = React.useRef(null);
  const minSwipeDistance = 50; // Minimum distance for a swipe to be registered

  const onTouchStart = (e) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    if (!touchStartRef.current) return;
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > minSwipeDistance;
    if (isLeftSwipe) {
      setIsDrawerOpen(false);
    }
    // Reset refs
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  // --- NEW HELPER: Combine all selected programs into a single text string ---
  const getShareableContent = () => {
    const isThai = lang === "th";

    // 1. Get the list of actual message objects based on selectedPrograms
    const filteredContent = getFilteredMessages(
      staticContent,
      selectedPrograms
    );

    if (filteredContent.length === 0) return null;

    const divider = "━━━━━━━━━━━━━━━━";

    // 2. Map the selected programs to an array of formatted strings
    const shareableItems = filteredContent.map((item) => {
      const { languageDisplay, messageTitle, trackTitle, programNumber } =
        formatContentItem(item, lang);
      const cardUrl = `https://5fi.sh/T${item.id}`;

      // Get verse text and reference
      const verseText = isThai ? item.verse_th : item.verse_en;
      let verseQuote = "";
      let verseRef = "";
      if (verseText) {
        const match = verseText.match(/^([^\.]+\d+:\d+)\s+(.+)$/);
        if (match) {
          verseRef = match[1];
          verseQuote = match[2];
        } else {
          verseQuote = verseText;
        }
      }

      // Format each message with decorative lines
      return `${divider}\n${languageDisplay} | ${messageTitle} | ${
        isThai ? "ข้อความ" : "Message"
      } #${programNumber}\n${divider}\n\n${
        isThai ? "ฟัง • แบ่งปัน • ดาวน์โหลด" : "Listen • Share • Download"
      }\nListen on 5fish: ${cardUrl}\n\n${
        verseQuote ? `${verseQuote}  ${verseRef}\n` : ""
      }`;
    });

    // 3. Combine the items with footer
    const combinedText = [
      ...shareableItems,
      `${divider}\n${
        isThai
          ? "ค้นพบภาษามากกว่า 6,000+ ภาษาที่ 5fish.mobi หรือ globalrecordings.net\nส่งความคิดเห็นไปที่: Thai@globalrecordings.net"
          : "Discover 6,000+ languages at 5fish.mobi or globalrecordings.net\nEmail any feedback to: Thai@globalrecordings.net"
      }`,
    ].join("\n\n");

    return combinedText;
  };

  // --- NEW: PDF Export (Browser Native Print) ---
  const handleDownloadSelectedPDF = () => {
    const filteredContent = getFilteredMessages(
      staticContent,
      selectedPrograms
    );
    if (filteredContent.length === 0) {
      alert(t.select_content_first || "Please select some content first!");
      return;
    }

    const isThai = lang === "th";
    const titleText = isThai ? "รายการข้อความที่เลือก" : "Selected Messages";

    // --- NEW: Custom Filename with Timestamp ---
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeStr = now
      .toTimeString()
      .split(" ")[0]
      .replace(/:/g, "-")
      .slice(0, 5); // HH-mm
    const filename = `TGN_Selected_Messages_${dateStr}_${timeStr}`;

    // Generate HTML list items
    const listItemsHtml = filteredContent
      .map((item, index) => {
        const { languageDisplay, messageTitle, trackTitle, programNumber } =
          formatContentItem(item, lang);
        const cardUrl = `https://5fi.sh/T${item.id}`;

        return `
        <div class="message-item">
          <div class="item-header">
            <span class="item-index">${index + 1}.</span>
            <span class="item-lang">[${languageDisplay}]</span>
            <span class="item-title">${messageTitle}</span>
          </div>
          <div class="item-track">${trackTitle}</div>
          <div class="item-meta">
            Message #: ${programNumber} | <a href="${cardUrl}">${cardUrl}</a>
          </div>
        </div>
      `;
      })
      .join("");

    const printHtml = `
      <html>
        <head>
          <title>${filename}</title>
          <style>
            @page {
              size: A4;
              margin: 0.75in; /* --- CHANGED: 0.75in Margins --- */
            }
            body {
              font-family: "Sarabun", "Prompt", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.5;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 0; /* Padding handled by @page */
            }
            /* --- NEW: Header Layout with Logo --- */
            .print-header {
              display: flex;
              align-items: center;
              border-bottom: 2px solid #eee;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header-logo {
              height: 50px;
              margin-right: 20px;
            }
            h1 {
              color: #003366; /* --- CHANGED: Thai Blue --- */
              margin: 0;
              font-size: 24px;
            }
            .date {
              color: #666;
              font-size: 0.9em;
              margin-left: auto; /* Push to right */
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              font-weight: bold;
            }
            .print-btn:hover {
              background: #b32d2d;
            }
          </style>
        </head>
        <body>
          <div class="control-bar no-print">
             <button class="print-btn" onclick="window.print()">🖨️ ${
               isThai ? "พิมพ์ / บันทึกเป็น PDF" : "Print / Save as PDF"
             }</button>
             <p style="margin-top:10px; font-size:0.9em; color:#666;">
               ${
                 isThai
                   ? "เลือก 'บันทึกเป็น PDF' ในหน้าต่างพิมพ์"
                   : "Choose 'Save as PDF' in the print destination."
               }
             </p>
          </div>

          <h1>${titleText}</h1>
          <div class="date">${dateText}</div>
          
          <div class="content">
            ${listItemsHtml}
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(t.allow_popups || "Please allow pop-ups to print.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };
  // --- NEW: Filtered Message Helper ---
  const getSelectedContent = () => {
    // 1. Get the list of actual message objects based on selectedPrograms
    const filteredContent = getFilteredMessages(
      staticContent,
      selectedPrograms
    );

    if (filteredContent.length === 0) {
      alert(
        t.please_select_messages ||
          "Please select some messages first by checking the boxes next to them!"
      );
      return null;
    }

    return filteredContent;
  };

  // --- NEW: Share Filtered Content (TEXT LIST) ---
  const handleShareSelected = async () => {
    // 1. Get the combined text list
    const contentToShare = getShareableContent();
    if (!contentToShare) {
      alert(t.select_content_first || "Please select some content first!");
      return;
    }

    const isThai = lang === "th";
    const shareTitle = isThai
      ? "ข่าวดี: รายการที่เลือก"
      : "Thai: Good News - Selected List";

    try {
      if (navigator.share) {
        // Use the native share sheet for the combined text
        await navigator.share({
          title: shareTitle,
          text: contentToShare,
        });
      } else {
        // Fallback: Copy to clipboard if Web Share API is not available
        await navigator.clipboard.writeText(contentToShare);
        alert(
          t.list_copied_to_clipboard || "Selected list copied to clipboard!"
        );
      }
    } catch (error) {
      console.error("Sharing selected list failed:", error);
      // Ignore user cancellation (AbortError)
      if (error.name !== "AbortError") {
        alert(t.share_failed || "Sharing failed or was cancelled.");
      }
    }
  };

  // --- NEW: Copy Filtered Content (TEXT LIST) ---
  const handleCopySelected = async () => {
    // 1. Get the combined text list
    const contentToCopy = getShareableContent();
    if (!contentToCopy) {
      alert(t.select_content_first || "Please select some content first!");
      return;
    }

    try {
      // Copy the text list directly to the clipboard
      await navigator.clipboard.writeText(contentToCopy);
      alert(t.list_copied_to_clipboard || "Selected list copied to clipboard!");
    } catch (error) {
      console.error("Copying selected list failed:", error);
      alert(t.copy_failed || "Failed to copy selected list.");
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
                    <div class="program">Message # ${item.id}</div>
                  </div>
                </div>

          <!-- ✅ QR ABOVE VERSE -->
          <div class="qr-wrap">
            <img src="${qrImg}" class="qr-img" />
          </div>

          <!-- ✅ VERSE UNDER QR -->
          <div class="verse">
            ${verse}
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
              background: #f3f4f6; /* Light gray background for the preview window */
            }
            /* HIDE ELEMENTS WHEN PRINTING */
            @media print {
              .no-print { display: none !important; }
              body { background: white; padding: 0; }
            }
            .page {
              page-break-after: always;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0.4in;
              background: white;
              padding: 0.25in; /* Visual padding for the preview */
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
              /* Ensure cards don't split across pages */
              break-inside: avoid; 
            }
            .qr-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 6px;
            }
            .logo-wrap .logo {
              width: 24px;
              height: 24px;
            }
            .header-text {
              flex: 1;
              margin-left: 6px;
              text-align: center;
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
            /* Close Button Style */
            .control-bar {
              text-align: center;
              margin-bottom: 20px;
              padding: 10px;
              background: #333;
              color: white;
              border-radius: 8px;
            }
            .close-btn {
              background: #CC3333;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="control-bar no-print">
             <p>Printing may not start automatically on some devices.</p>
             <button class="close-btn" onclick="window.print()">🖨️ Print Cards</button>
             <button class="close-btn" onclick="window.close()" style="background:#555; margin-left:10px;">Close Window</button>
          </div>

          ${htmlPages}

          <script>
            window.onload = function() {
              // Attempt to print automatically
              setTimeout(function() {
                window.print();
              }, 500); // Small delay to ensure images render
              
              // ❌ REMOVED THE AUTO-CLOSE TIMEOUT
              // The user must now close the window manually.
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    // Mobile browser pop-up blocker check
    if (!printWindow) {
      alert("Please allow pop-ups to print your cards.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  // --- State Management ---
  const initialLang = localStorage.getItem("appLang") || "en";
  const initialFontSize =
    localStorage.getItem("appFontSize") || DEFAULT_FONT_SIZE;

  const [lang, setLang] = useState(initialLang);
  const t = i18n[lang]; // Restored translation object
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [pageStack, setPageStack] = useState([{ name: "Home" }]);
  const [track, setTrack] = useState(null);
  const [isHoveringContent, setIsHoveringContent] = useState(false);
  const [isAudioMinimized, setIsAudioMinimized] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- NEW: Search History State ---
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem("searchHistory");
    return saved ? JSON.parse(saved) : [];
  });

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToSearchHistory = (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    setSearchHistory((prev) => {
      // Remove if exists, then add to front
      const filtered = prev.filter((item) => item !== cleanTerm);
      return [cleanTerm, ...filtered].slice(0, 10); // Keep max 10
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };
  // --- Theme State (Dark Mode) ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  // Apply theme to html element (Tailwind + CSS variables)
  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === "dark") {
      // Tailwind dark:
      root.classList.add("dark");
      // CSS variables dark:
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.removeAttribute("data-theme");
    }

    // Persist preference
    localStorage.setItem("theme", theme);
    // Compatibility with the patch guide key:
    localStorage.setItem("darkMode", String(theme === "dark"));
  }, [theme]);
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
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

  // --- Unified Share QR Modal ---
  const ShareQrModal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    url,
    footerText,
  }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-5 text-gray-800"
          >
            ✕
          </button>

          {/* Title */}
          <h2 className="text-sm text-gray-600 text-center break-all mb-1">
            {title}
          </h2>

          {/* Subtitle (Language Name or Message Title) */}
          <h3 className="text-lg font-bold text-brand-red mb-2 text-center">
            {subtitle}
          </h3>

          {/* --- QR CODE DISPLAY --- */}
          <div className="flex justify-center mb-3 p-4 bg-white rounded-lg">
            <QRCodeDisplay
              url={url}
              size={200}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>

          {/* URL under the QR */}
          <p className="text-xs text-gray-600 text-center break-all mb-1">
            {footerText}
            <a
              href={url}
              className="text-brand-red underline break-all text-[10px] block mt-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              {url}
            </a>
          </p>
        </div>
      </div>
    );
  };

  // --- Unified Share Modal State ---
  const [shareModalState, setShareModalState] = useState({
    isOpen: false,
    title: "",
    subtitle: "",
    url: "",
    footerText: "",
  });

  const handleCloseShareModal = () => {
    setShareModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleShowQrForLanguage = (stableKey) => {
    const group = languageGroups.find((g) => g.stableKey === stableKey);
    if (group) {
      const name = lang === "en" ? group.displayNameEn : group.displayNameTh;

      // Construct URL (using first message's ISO or fallback)
      const firstMsg = group.messages[0];
      const iso3 = firstMsg?.iso3 || "";
      const url = `https://5fish.mobi/${iso3}`;

      setShareModalState({
        isOpen: true,
        title:
          t?.scan_qr_to_view_messages || "Scan QR to view all messages in:",
        subtitle: name,
        url: url,
        footerText: t?.language_qr_title || "",
      });
    }
  };

  const handleShowQrForMessage = (item, languageDisplayName) => {
    const title = lang === "en" ? item.title_en : item.title_th;

    // Construct URL
    let url = item.trackDownloadUrl;
    if (url) {
      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }
    } else {
      url = `https://5fish.mobi/T${item.id}`;
    }

    setShareModalState({
      isOpen: true,
      title: t?.scan_qr_to_download || "Scan QR to download:",
      subtitle: `${languageDisplayName} - ${title}`,
      url: url,
      footerText: "",
    });
  };

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
          langId: item.langId,
          count: 0,
          messages: [],
          programIds: new Set(),
        };
      }

      // --- DATA FLATTENING & CLEANUP ---
      // 1. Check if this Program ID has already been added to this group
      const progId = item.programId || item.id;
      if (groups[stableKey].programIds.has(progId)) {
        return; // SKIP duplicates (tracks)
      }

      // 2. Mark this Program ID as seen
      groups[stableKey].programIds.add(progId);

      // 3. Clean the Title (Remove "(Mxxx)" suffix)
      // Create a shallow copy to avoid mutating the original staticContent if needed,
      // but for display purposes in this list, we can modify a copy.
      const cleanedItem = { ...item };
      if (cleanedItem.title_en) {
        cleanedItem.title_en = cleanedItem.title_en
          .replace(/\s*\(M\d+\)/, "")
          .trim();
      }
      if (cleanedItem.title_th) {
        cleanedItem.title_th = cleanedItem.title_th
          .replace(/\s*\(M\d+\)/, "")
          .trim();
      }

      // 4. Add the unique, cleaned message
      groups[stableKey].count += 1;
      groups[stableKey].messages.push(cleanedItem);
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
    // Fallback for other contexts (e.g., favorites or direct content view)
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

  // ✅ PASTE YOUR NEW FUNCTION HERE:
  const navigateToSelectedContent = () => {
    setPageStack((prev) => [...prev, { name: "SelectedContent" }]);
    setSearchTerm(""); // Clear search just in case
    setIsDrawerOpen(false); // Close sidebar if open
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

  // Handler for toggling favorites
  const handleToggleFavorite = (itemId) => {
    if (!userData || !saveUserData) return;
    
    const favorites = userData.favorites || [];
    const isFavorited = favorites.includes(itemId);
    
    const newFavorites = isFavorited
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId];
    
    saveUserData({
      ...userData,
      favorites: newFavorites,
    });
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
          onHoverChange={setIsHoveringContent} // 👈 GIVE IT THE CONTROLLER
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
          onDownload={handleDownloadSelected} // This is the "Print" button (using Download icon)
          onDownloadPDF={handleDownloadSelectedPDF} // This is the actual PDF button
          userData={userData}
          onToggleFavorite={handleToggleFavorite}
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
          onShowQrForMessage={handleShowQrForMessage} // 👈 PASSED DOWN
          userData={userData}
          onToggleFavorite={handleToggleFavorite}
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
          // --- NEW: Search History Props ---
          searchHistory={searchHistory}
          onClearHistory={clearSearchHistory}
          onHistorySelect={(term) => {
            setSearchTerm(term);
            addToSearchHistory(term); // Refresh position
          }}
          userData={userData}
          onToggleFavorite={handleToggleFavorite}
        />
      );
      break;
    case "Favorites":
      PageContent = (
        <FavoritesPage
          lang={lang}
          t={t}
          userData={userData}
          onSelect={(item) => handleSelectMessage(item, "favorite")}
          setLang={setLang}
          fontSize={fontSize}
          setFontSize={setFontSize}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          // --- FIX: ADDED pageStack PROP ---
          pageStack={pageStack}
          onToggleFavorite={handleToggleFavorite}
        />
      );
      break;
    case "Notes":
      PageContent = (
        <NotesPage
          lang={lang}
          t={t}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          userData={userData}
          saveUserData={saveUserData}
        />
      );
      break;
    case "MyLibrary":
      PageContent = (
        <MyLibraryPage
          lang={lang}
          t={t}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPlay={handlePlayMessage}
        />
      );
      break;
    case "Settings":
      PageContent = (
        <SettingsPage
          lang={lang}
          t={t}
          setLang={setLang}
          fontSize={fontSize}
          setFontSize={setFontSize}
          onBack={goBack}
          onForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      );
      break;
    case "Import":
      PageContent = (
        <ImportPage
          lang={lang}
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
      <div className="min-h-screen bg-gray-100 dark:bg-[#374151] flex flex-col">
        {/* --- UPDATE NOTIFICATION BANNER --- */}
        <UpdateNotification />

        {/* --- UNIFIED SHARE QR MODAL --- */}
        <ShareQrModal
          isOpen={shareModalState.isOpen}
          onClose={handleCloseShareModal}
          title={shareModalState.title}
          subtitle={shareModalState.subtitle}
          url={shareModalState.url}
          footerText={shareModalState.footerText}
        />

        {/* --- HEADER (Banner) --- */}
        <header
          className={`sticky top-0 w-full ${PRIMARY_COLOR_CLASS} py-1 px-2 shadow-lg z-30 rounded-b-xl md:py-3 md:px-6`}
        >
          {/* Mobile/Tablet: 3-column grid layout */}
          <div className="grid grid-cols-3 items-center md:hidden">
            {/* LEFT: Menu + Logo + Install */}
            <div className="flex items-center justify-start space-x-1">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors btn-hover"
                aria-label="Open Sidebar Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <a
                href="https://5fish.mobi/th?r=Asia&country=Thailand"
                target="_blank"
                rel="noopener noreferrer"
                title="5fish.mobi/th?r=Asia&country=Thailand"
                className="flex items-center text-white rounded-lg hover:bg-red-800 transition-colors"
              >
                <img
                  src={AppLogo}
                  alt={t.app_name}
                  className="h-8 w-8 rounded-md shadow-sm bg-white p-0.5"
                />
              </a>
              <button
                onClick={navigateToHome}
                className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors btn-hover"
                title={t.home || "Home"}
                aria-label={t.home || "Home"}
              >
                <Home className="w-6 h-6" />
              </button>

            </div>

            {/* CENTER: Navigation Controls */}
            <div className="flex items-center justify-center space-x-1">
              {currentPage.name !== "Home" && (
                <>
                  <button
                    onClick={goBack}
                    disabled={!hasPrev}
                    className={`p-1 rounded-lg transition-colors flex items-center ${
                      hasPrev
                        ? "text-white hover:bg-white/20"
                        : "text-red-200 opacity-50 cursor-not-allowed"
                    }`}
                    title={t.back || "Back"}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={goForward}
                    disabled={!hasNext}
                    className={`p-1 rounded-lg transition-colors flex items-center ${
                      hasNext
                        ? "text-white hover:bg-white/20"
                        : "text-red-200 opacity-50 cursor-not-allowed"
                    }`}
                    title={t.forward || "Forward"}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>

            {/* RIGHT: Controls */}
            <div className="flex items-center justify-end space-x-1">
              <button
                onClick={() => {
                  if (deferredPrompt) {
                    handleInstallClick();
                  } else {
                    alert("App is already installed / แอปถูกติดตั้งแล้ว");
                  }
                }}
                title={
                  deferredPrompt
                    ? t.install_app || "Install App"
                    : t.app_installed || "App Installed"
                }
                className={`p-1 rounded-lg transition-colors btn-hover ${
                  deferredPrompt
                    ? "text-white hover:bg-red-800"
                    : "text-red-300 cursor-pointer"
                }`}
                aria-label={
                  deferredPrompt
                    ? t.install_app || "Install App"
                    : t.app_installed || "App Installed"
                }
              >
                <Download className="w-6 h-6" />
              </button>
              <FloatingUtilityBar
                t={t}
                lang={lang}
                setLang={setLang}
                selectionCount={selectedPrograms.length}
                onClearSelection={clearSelection}
                fontSize={fontSize}
                setFontSize={setFontSize}
                navigateToSelectedContent={navigateToSelectedContent}
                isHovering={isHoveringContent}
              />
              <LanguageToggle lang={lang} setLang={setLang} t={t} />


              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors btn-hover"
                aria-label="Toggle Search"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Desktop: Flexbox layout */}
          <div className="hidden md:flex justify-between items-center relative">
            {/* Left: Menu & Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors btn-hover mr-3"
                aria-label="Open Sidebar Menu"
              >
                <Menu className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              <a
                href="https://5fish.mobi/th?r=Asia&country=Thailand"
                target="_blank"
                rel="noopener noreferrer"
                title="5fish.mobi/th?r=Asia&country=Thailand"
                className="flex items-center text-white rounded-lg hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              >
                <img
                  src={BannerLogo}
                  alt={t.app_name}
                  className="h-12 w-auto rounded-md shadow-sm bg-white p-1"
                />
              </a>
              <button
                onClick={() => {
                  navigateToHome();
                  setIsDrawerOpen(false);
                }}
                className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors btn-hover ml-2"
                title={t.home || "Home"}
                aria-label={t.home || "Home"}
              >
                <Home className="w-6 h-6" />
              </button>
            </div>

            {/* Center: Navigation Buttons */}
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={goBack}
                disabled={!hasPrev}
                className={`p-1 rounded-lg transition-colors flex items-center ${
                  hasPrev
                    ? "text-white hover:bg-white/20"
                    : "text-red-200 opacity-50 cursor-not-allowed"
                }`}
                title={t.back || "Back"}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={goForward}
                disabled={!hasNext}
                className={`p-1 rounded-lg transition-colors flex items-center ${
                  hasNext
                    ? "text-white hover:bg-white/20"
                    : "text-red-200 opacity-50 cursor-not-allowed"
                }`}
                title={t.forward || "Forward"}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (deferredPrompt) {
                    handleInstallClick();
                  } else {
                    alert("App is already installed / แอปถูกติดตั้งแล้ว");
                  }
                }}
                title={
                  deferredPrompt
                    ? t.install_app || "Install App"
                    : t.app_installed || "App Installed"
                }
                className={`p-1 rounded-lg transition-colors btn-hover ${
                  deferredPrompt
                    ? "text-white hover:bg-red-800"
                    : "text-red-300 cursor-pointer"
                }`}
                aria-label={
                  deferredPrompt
                    ? t.install_app || "Install App"
                    : t.app_installed || "App Installed"
                }
              >
                <Download className="w-6 h-6" />
              </button>
              <FloatingUtilityBar
                t={t}
                lang={lang}
                setLang={setLang}
                selectionCount={selectedPrograms.length}
                onClearSelection={clearSelection}
                fontSize={fontSize}
                setFontSize={setFontSize}
                navigateToSelectedContent={navigateToSelectedContent}
                isHovering={isHoveringContent}
              />
              <LanguageToggle lang={lang} setLang={setLang} t={t} />


              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-white p-1 rounded-lg hover:bg-red-800 transition-colors btn-hover"
                aria-label="Toggle Search"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* --- TOGGLED SEARCH BAR (Below Header) --- */}
        {isSearchOpen && (
          // IMPORTANT CHANGE: Increased top-16 to top-20 (5rem) and lowered z-index to z-10
          <div className="sticky top-14 w-full p-2 bg-white shadow-xl z-20">
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
                // --- NEW: Save history on Enter ---
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addToSearchHistory(searchTerm);
                  }
                }}
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
          onGoBack={goBack}
          onGoForward={goForward}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onClose={() => setTrack(null)}
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
            className={`absolute left-0 top-0 w-72 h-full bg-white dark:bg-[#374151] shadow-2xl transition-transform duration-300 transform ${
              isDrawerOpen ? "translate-x-0" : "-translate-x-full"
              // 💡 ADD rounded-tr-xl CLASS HERE
            } rounded-tr-xl flex flex-col`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Header */}
            <div
              className={`${PRIMARY_COLOR_CLASS} px-3 py-2 flex flex-col space-y-1 rounded-r-xl flex-shrink-0`}
            >
              {/* Top Row: Logo (Home Button), Title, Close */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {/* 1. The Square Logo (Now acts as Home Button) */}
                  <button
                    onClick={() => {
                      navigateToHome();
                      setIsDrawerOpen(false);
                    }}
                    className="focus:outline-none transition-transform active:scale-95"
                    title={t.home || "Home"}
                  >
                    <img
                      src={AppLogo}
                      alt="Logo"
                      className="w-10 h-10 rounded-xl bg-white shadow-md p-1"
                    />
                  </button>
                  
                  {/* 2. App Title */}
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {t.app_name}
                  </h2>
                </div>

                {/* 3. Close Button */}
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-white p-1 hover:bg-red-800 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Bottom Row: Share App Button (Right Aligned) */}
              <div className="flex justify-end">
                <button
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent drawer close
                    const appUrl = window.location.origin;
                    const shareData = {
                      title: t.app_name || "Thai: Good News",
                      text:
                        t.share_app_text ||
                        "Check out this app for Good News messages in multiple languages!",
                      url: appUrl,
                    };

                    if (navigator.share) {
                      try {
                        await navigator.share(shareData);
                      } catch (err) {
                        if (err.name !== "AbortError") {
                          console.error("Share failed:", err);
                        }
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(appUrl);
                        alert(t.link_copied || "Link copied to clipboard!");
                      } catch (err) {
                        console.error("Copy failed:", err);
                        alert(t.copy_failed || "Could not copy link");
                      }
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 bg-[#003366] text-white rounded text-[10px] font-semibold hover:bg-[#004d99] transition-colors whitespace-nowrap shadow-sm"
                  title={t.share_app || "Share App"}
                >
                  <ExternalLink className="w-3 h-3" />
                  {t.share_app || "Share"}
                </button>
              </div>
            </div>



            {/* Navigation Links (Scrollable) - Tighter spacing */}
            <nav className="p-4 space-y-1 overflow-y-auto flex-grow">
              {/* Navigation Items */}
              {[
                { name: "Search", icon: Search, target: "Search" },
                { name: "Favorites", icon: Heart, target: "Favorites" },
                { name: "My_Library", icon: Download, target: "MyLibrary" },
                { name: "Import", icon: Upload, target: "Import" },
                { name: "Notes", icon: Pen, target: "Notes" },
                // --- 5fish Website Link ---
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
                      className="w-full flex items-center p-3 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#004d99] transition-colors"
                    >
                      <item.icon className="w-6 h-6 mr-3" />
                      {item.name}
                    </a>
                  );
                }

                // Original button logic
                const isFavorites = item.name === "Favorites";
                const isNotes = item.name === "Notes";

                // Calculate counts safely
                const count = isFavorites
                  ? userData?.favorites?.length || 0
                  : isNotes
                  ? userData?.notes?.length || 0
                  : 0;

                return (
                  <button
                    key={item.name}
                    onClick={() => navigateTo(item.target)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg font-semibold transition-colors ${
                      currentPage.name === item.target
                        ? `${ACCENT_COLOR_CLASS} bg-red-100 dark:bg-red-900/30`
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#004d99]"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-6 h-6 mr-3" />
                      {t[item.name.toLowerCase()]}
                    </div>

                    {/* Counter Badge */}
                    {(isFavorites || isNotes) && count > 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* --- Dark Mode Toggle --- */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-3 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#004d99] transition-colors"
              >
                <div className="flex items-center">
                  {theme === "dark" ? (
                    <Sun className="w-6 h-6 mr-3" />
                  ) : (
                    <Moon className="w-6 h-6 mr-3" />
                  )}
                  {theme === "dark"
                    ? t.light_mode || "Light Mode"
                    : t.dark_mode || "Dark Mode"}
                </div>
              </button>
            </nav>

            {/* Bottom Controls (Sticky) */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-3">
              {/* --- PWA Share QR Code --- */}
              <div className="">
                {/* Label removed as requested */}
                <div className="flex justify-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={window.location.origin}
                      // Dynamic size based on font size (approx 5x the font size value)
                      size={parseInt(fontSize || "16") * 5}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
              </div>

              {/* Install Button removed from sidebar (moved to header) */}

              {/* --- User ID at very bottom --- */}
              <div className="text-xs text-gray-500 dark:text-white dark:bg-[#374151] border-t border-gray-200 dark:border-[#374151] pt-3 space-y-2">
                <p className="truncate text-center">
                  {t.user_id || "User ID"}:
                  <span className="font-mono text-gray-600 dark:text-white ml-1">
                    {userId || "..."}
                  </span>
                </p>

                {/* Build Information */}
                <div className="text-center space-y-1 pt-2 border-t border-gray-200 dark:border-white">
                  <p className="text-gray-600 dark:text-white">
                    Build:{" "}
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-gray-600 dark:text-white flex items-center justify-center gap-2">
                    {
                      [...new Set(staticContent.map((item) => item.stableKey))]
                        .length
                    }{" "}
                    Languages | {staticContent.length} Messages | Status
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isAuthReady ? "bg-green-500 animate-pulse" : "bg-red-500 animate-pulse"
                      }`}
                      title={isAuthReady ? t.auth_ready || "Ready" : t.auth_pending || "Pending"}
                    ></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) // This is the closing parenthesis for the entire application UI block
  ); // This is the closing parenthesis for the main return
}
