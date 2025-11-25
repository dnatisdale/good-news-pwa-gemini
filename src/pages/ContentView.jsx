import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import html2canvas from "html2canvas";
import QRCodeDisplay from "../components/QRCodeDisplay";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  PlayCircle,
  CheckCircle,
  Loader,
} from "../components/Icons";
import { i18n } from "../i18n";
import AppLogo from "../assets/splash-screen-logo.svg";
import { useOfflineStorage } from "../hooks/useOfflineStorage";
import { formatContentItem } from "../utils/contentFormatter";

// --- CONSTANTS (Copied from App.jsx for self-containment) ---
const THAI_RED = "#CC3333";
const THAI_BLUE = "#003366";
const ACCENT_COLOR_CLASS = "text-brand-red";
const TEXT_COLOR_CLASS = "text-gray-800";

// --- HELPER FUNCTIONS (Needed locally for this component) ---
const copyLink = (text, callback) => {
  navigator.clipboard
    .writeText(text)
    .then(() => callback("Link copied!"))
    .catch(() => callback("Failed to copy link."));
};

const shareQRCard = (item, lang, qrCodeUrl) => {
  const { languageDisplay, messageTitle, trackTitle } = formatContentItem(item, lang);
  const programNumber = item.id;
  
  // Get verse text and reference
  const verseText = lang === "th" ? item.verse_th : item.verse_en;
  
  // Extract reference if verse has it (e.g., "Genesis 1:1 text..." -> ref: "Genesis 1:1", text: "text...")
  let verseQuote = "";
  let verseRef = "";
  if (verseText) {
    // Simple pattern: if verse starts with book name and chapter:verse, split it
    const match = verseText.match(/^([^\.]+\d+:\d+)\s+(.+)$/);
    if (match) {
      verseRef = match[1];
      verseQuote = match[2];
    } else {
      verseQuote = verseText;
    }
  }
  
  const divider = "━━━━━━━━━━━━━━━━";
  
  let text;
  if (lang === "th") {
    text = `${divider}\n${languageDisplay} | ${messageTitle} | ข้อความ #${programNumber}\n${divider}\n\nฟัง • แบ่งปัน • ดาวน์โหลด\nListen on 5fish: ${qrCodeUrl}\n\n${verseQuote ? `${verseQuote}  ${verseRef}\n\n` : ""}${divider}\nค้นพบภาษามากกว่า 6,000+ ภาษาที่ 5fish.mobi หรือ globalrecordings.net\nส่งความคิดเห็นไปที่: Thai@globalrecordings.net`;
  } else {
    text = `${divider}\n${languageDisplay} | ${messageTitle} | Message #${programNumber}\n${divider}\n\nListen • Share • Download\nListen on 5fish: ${qrCodeUrl}\n\n${verseQuote ? `${verseQuote}  ${verseRef}\n\n` : ""}${divider}\nDiscover 6,000+ languages at 5fish.mobi or globalrecordings.net\nEmail any feedback to: Thai@globalrecordings.net`;
  }

  if (navigator.share) {
    const title = lang === "th" ? "ข่าวดี" : "Thai: Good News";
    
    navigator
      .share({
        title: title,
        text: text,
      })
      .then(() => console.log("QR Card shared successfully!"))
      .catch((error) => {
        console.error("Error sharing QR Card:", error);
        // Fallback to copy if share fails (e.g. user cancelled or not supported)
        if (error.name !== "AbortError") {
             copyLink(text, (message) => alert(message));
        }
      });
  } else {
    copyLink(text, (message) => alert(message));
  }
};

// --- Share Card Print View Component ---
const ShareCardPrintView = ({ item, lang, t, cardUrl }) => {
  const { languageDisplay, messageTitle, trackTitle, programNumber } = formatContentItem(item, lang);
  const readMoreLabel =
    lang === "en" ? "Listen, Share, Download at" : "ฟัง แบ่งปัน ดาวน์โหลดที่";

  return (
    <div
      id="print-view-container"
      className="bg-white p-4 rounded-lg shadow-lg"
      style={{ width: "400px", margin: "auto", fontFamily: "sans-serif" }}
    >
      {/* HEADER: logo + language + title */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex justify-start items-start mb-4">
          <img
            src={AppLogo}
            alt="App Logo"
            style={{ width: "45px", height: "45px", borderRadius: "5px" }}
            className="shadow-sm flex-shrink-0"
          />
        </div>

        <div className="flex flex-col items-center justify-center text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {languageDisplay}
          </h2>
          <h3 className="text-xl font-bold text-brand-red">{messageTitle}</h3>
          <p className="text-sm text-gray-700 mt-1">Message # {programNumber}</p>
        </div>
      </div>

      {/* ✅ QR BLOCK FIRST */}
      <div className="flex justify-center mb-6 p-4 bg-white rounded-lg">
        <QRCodeDisplay
          url={cardUrl}
          size={200}
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </div>

      {/* ✅ VERSE / TRACK TITLE UNDER THE QR */}
      <p className="text-base text-gray-700 mb-4 whitespace-pre-line text-center italic">
        {trackTitle}
      </p>

      {/* LINK */}
      <p className="text-sm text-gray-600 text-center break-all">
        {readMoreLabel}: <br />
        <a href={cardUrl} className="text-brand-red underline">
          {cardUrl}
        </a>
      </p>

      {/* FOOTER TIP */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        {t.scan_qr_tip ||
          "Scan the QR code or visit the link to access this content."}
      </p>
    </div>
  );
};

// --- Content View Component (Detail Page) ---
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
  pageStack,
}) => {
  const [isQrLarge, setIsQrLarge] = useState(false);
  
  // --- NEW: Offline Storage Hook ---
  const { downloadTrack, isTrackOffline, isTrackDownloading } = useOfflineStorage();
  
  // Safety check: ensure item exists before checking status
  const isOffline = item ? isTrackOffline(item.id) : false;
  const isDownloading = item ? isTrackDownloading(item.id) : false;

  const isFavorite = userData?.favorites?.includes(item?.id) ?? false;
  const cardUrl = `https://5fi.sh/T${item?.id}`;

  // --- USE CENTRALIZED FORMATTER ---
  const { languageDisplay, messageTitle, trackTitle, programNumber } = formatContentItem(item, lang);
  
  // Bible Verse - currently missing from data structure, using placeholder logic
  const verseDisplay = ""; 

  const toggleFavorite = () => {
    if (!item) return;
    const currentFavorites = userData.favorites || [];
    let newFavorites;
    if (isFavorite) {
      newFavorites = currentFavorites.filter((id) => id !== item.id);
    } else {
      newFavorites = [...currentFavorites, item.id];
    }
    saveUserData({ ...userData, favorites: newFavorites });
  };

  const handleShare = () => {
    if (item) shareQRCard(item, lang, cardUrl);
  };

  const downloadShareCard = async () => {
    if (!item) return;
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
          // Use toBlob for better browser compatibility than toDataURL
          canvas.toBlob((blob) => {
            if (!blob) {
              console.error("Canvas is empty");
              return;
            }
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = `share-card-${item.id}-${lang}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url); // Clean up
          }, "image/png");
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

  if (!item) {
      return <div className="p-8 text-center">Loading content...</div>;
  }

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">


      {/* Listen Button */}


      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column: QR Code, Bible Verse, and controls */}
        <div className="md:order-1 flex flex-col items-center w-full max-w-lg mx-auto">
          
          {/* --- HEADER ROW: Text Left, Heart Right --- */}
          <div className="w-full flex justify-between items-end mb-4">
            <div className="flex flex-col items-start">
              <h1 className="text-3xl font-extrabold text-brand-red dark:text-white leading-tight">
                {languageDisplay}
              </h1>
              <p className="text-lg text-gray-800 dark:text-white leading-tight mt-1">
                <span className="font-bold">{messageTitle}</span>
                <span className="text-sm text-gray-500 dark:text-white ml-2">#{item.id}</span>
              </p>
            </div>
            
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ml-4 ${
                isFavorite
                  ? "bg-red-100 text-red-500"
                  : "bg-gray-200 text-gray-600 hover:bg-red-50"
              }`}
            >
              <Heart
                className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
          </div>

          {/* --- MOVED: Download Audio Button (Now above Listen Button) --- */}
          {item.trackDownloadUrl && (
            <button
              onClick={() => !isOffline && !isDownloading && downloadTrack(item)}
              disabled={isOffline || isDownloading}
              className={`w-full p-4 mb-4 font-bold text-white text-lg rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 ${
                isOffline
                  ? "bg-amber-500 cursor-default"
                  : isDownloading
                  ? "bg-gray-400 cursor-wait"
                  : "bg-brand-red hover:bg-red-800 hover:scale-105 active:scale-95 hover:shadow-xl"
              }`}
            >
              {isOffline ? (
                <>
                  <CheckCircle className="w-6 h-6 mr-2" />
                  {t.downloaded || "Downloaded"}
                </>
              ) : isDownloading ? (
                <>
                  <Loader className="w-6 h-6 mr-2 animate-spin" />
                  {t.downloading || "Downloading..."}
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 mr-2" />
                  {t.download_audio || "Download Audio"}
                </>
              )}
            </button>
          )}

          {/* --- MOVED: Listen Button (Now inside column, full width) --- */}
          {item.trackDownloadUrl && (
            <button
              onClick={() => onPlay(item)}
              style={{ backgroundColor: THAI_BLUE }}
              className="w-full p-4 mb-6 font-bold text-white text-lg rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 hover:shadow-xl"
            >
              <PlayCircle className="w-6 h-6 mr-2" />
              {t.listen_offline || "Listen (Offline Enabled)"}
            </button>
          )}

          {/* QR Code */}
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

          {/* Bible Verse Box - between QR code and buttons */}
          <div className="w-full bg-gray-50 p-6 rounded-xl shadow-inner border-l-4 border-brand-red mb-6">
            {item.verse_en || item.verse_th ? (
              <p className="text-lg leading-relaxed text-gray-700 italic whitespace-pre-line">
                {lang === "en" ? item.verse_en : item.verse_th}
              </p>
            ) : (
              <p className="text-gray-400 italic text-center">
                {t.no_verse_content || "No verse available"}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6 w-full">
            <button
              onClick={handleShare}
              className="p-3 font-bold text-white rounded-xl bg-brand-red shadow-md flex flex-col items-center justify-center text-sm leading-tight transition-all duration-200 hover:bg-red-800 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              <Share2 className="w-5 h-5 mb-1" /> {t.share_copy || "Share/Copy"}
            </button>
            <button
              onClick={downloadShareCard}
              className="p-3 font-bold text-white rounded-xl bg-brand-red shadow-md flex flex-col items-center justify-center text-sm leading-tight transition-all duration-200 hover:bg-red-800 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              <Download className="w-5 h-5 mb-1" />
              {t.download || "Download"} <br /> {t.qr_card || "QR Card"}
            </button>
            

          </div>
        </div>

        {/* Right Column: Empty on desktop, hidden on mobile */}
        <div className="md:order-2 hidden md:block">
          {/* Reserved for future content if needed */}
        </div>
      </div>
    </div>
  );
};

export default ContentView;
