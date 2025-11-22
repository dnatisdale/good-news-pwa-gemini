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

const shareQRCard = (lang, programNumber, qrCodeUrl) => {
  if (navigator.share) {
    let title;
    let text;

    if (lang === "th") {
      title = "ข่าวดี";
      text = `Message #:${programNumber}\n\nฟัง แบ่งปัน ดาวน์โหลดที่: ${qrCodeUrl}\n\nค้นหาความรู้ใหม่ๆ กับ PWA ข่าวดี!`;
    } else {
      title = "Thai: Good News";
      text = `Message #:${programNumber}\n\nListen, Share, Download at: ${qrCodeUrl}\n\nDiscover more with the Thai: Good News PWA!`;
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
    const fallbackText =
      lang === "th"
        ? `ข่าวดี Message #:${programNumber}\nฟัง แบ่งปัน ดาวน์โหลดที่: ${qrCodeUrl}`
        : `Thai: Good News Message #:${programNumber}\nListen, Share, Download at: ${qrCodeUrl}`;

    copyLink(fallbackText, (message) => alert(message));
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
    if (item) shareQRCard(lang, item.id, cardUrl);
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

  if (!item) {
      return <div className="p-8 text-center">Loading content...</div>;
  }

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Line 1: Language Name - HUGE */}
      <h1 className="text-4xl font-extrabold text-brand-red mb-3">
        {languageDisplay}
      </h1>

      {/* Line 2: Message Name | Track Name (Code) | message: # */}
      <div className="mb-4">
        <p className="text-lg text-gray-800 leading-tight">
          <span className="font-normal">{messageTitle}</span>
          {" | "}
          <span className="text-2xl font-bold">{trackTitle}</span>
          {" | "}
          <span className="text-sm text-gray-500">message: #{item.id}</span>
        </p>
      </div>

      {/* Favorite button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleFavorite}
          className={`p-2 rounded-full transition-colors ${
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

      {/* Listen Button */}
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:order-1 flex flex-col items-center">
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
            
            {/* Download Audio Button */}
            {item.trackDownloadUrl && (
              <button
                onClick={() => !isOffline && !isDownloading && downloadTrack(item)}
                disabled={isOffline || isDownloading}
                className={`col-span-2 p-3 font-bold text-white rounded-xl shadow-md flex flex-row items-center justify-center text-sm leading-tight transition-all duration-200 ${
                  isOffline
                    ? "bg-green-600 cursor-default"
                    : isDownloading
                    ? "bg-gray-400 cursor-wait"
                    : "bg-brand-red hover:bg-red-800 hover:scale-105 active:scale-95 hover:shadow-lg"
                }`}
              >
                {isOffline ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t.downloaded || "Downloaded"}
                  </>
                ) : isDownloading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    {t.downloading || "Downloading..."}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    {t.download_audio || "Download Audio"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Bible Verse Box */}
        <div className="md:order-2">
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner border-l-4 border-brand-red mb-6 h-full">
            {verseDisplay ? (
              <p className="text-lg leading-relaxed text-gray-700 italic whitespace-pre-line">
                {verseDisplay}
              </p>
            ) : (
              <p className="text-gray-400 italic text-center mt-10">
                {t.no_verse_content || "No verse available"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentView;
