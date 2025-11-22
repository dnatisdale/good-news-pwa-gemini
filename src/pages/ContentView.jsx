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
} from "../components/Icons";
import { i18n } from "../i18n";
import AppLogo from "../assets/splash-screen-logo.svg";

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
      text = `Program #:${programNumber}\n\nฟัง แบ่งปัน ดาวน์โหลดที่: ${qrCodeUrl}\n\nค้นหาความรู้ใหม่ๆ กับ PWA ข่าวดี!`;
    } else {
      title = "Thai: Good News";
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
    const fallbackText =
      lang === "th"
        ? `ข่าวดี Program #:${programNumber}\nฟัง แบ่งปัน ดาวน์โหลดที่: ${qrCodeUrl}`
        : `Thai: Good News Program #:${programNumber}\nListen, Share, Download at: ${qrCodeUrl}`;

    copyLink(fallbackText, (message) => alert(message));
  }
};

// --- Share Card Print View Component ---
const ShareCardPrintView = ({ item, lang, t, cardUrl }) => {
  const title =
    lang === "en" ? item.title_en ?? "Untitled" : item.title_th ?? "ไม่มีชื่อ";
  const verse = lang === "en" ? item.verse_en ?? "" : item.verse_th ?? "";
  const languageDisplay =
    lang === "en" ? item.languageEn ?? "" : item.langTh ?? "";
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
          <h3 className="text-xl font-bold text-brand-red">{title}</h3>
          <p className="text-sm text-gray-700 mt-1">Program # {item.id}</p>
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

      {/* ✅ VERSE UNDER THE QR */}
      <p className="text-base text-gray-700 mb-4 whitespace-pre-line text-center italic">
        {verse}
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

  const isFavorite = userData?.favorites?.includes(item.id) ?? false;
  const cardUrl = `https://5fi.sh/T${item.id}`;
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

  const toggleFavorite = () => {
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
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${
            pageStack.length === 1 && pageStack[0].name === "Home"
              ? "text-gray-400 cursor-not-allowed"
              : `${ACCENT_COLOR_CLASS} hover:text-red-700`
          }`}
          disabled={pageStack.length === 1 && pageStack[0].name === "Home"}
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

      <h1 className="text-4xl font-extrabold mb-2 text-brand-red">
        {languageDisplay}
      </h1>

      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <p className="text-xl font-semibold text-gray-700">{titleDisplay}</p>

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
          </div>
        </div>

        <div className="md:order-2">
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-6">
            <p className="text-base leading-normal text-gray-700 whitespace-pre-line">
              {verseDisplay}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentView;
