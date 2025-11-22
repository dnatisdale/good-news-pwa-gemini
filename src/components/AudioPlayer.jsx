import React from "react";
import { PlayCircle, ChevronLeft, Download, CheckCircle, Loader } from "./Icons";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const AudioPlayer = ({ track, isMinimized, toggleMinimize, t }) => {
  // Check if a track is available
  if (!track || !track.trackDownloadUrl) {
    return (
      <div className="sticky bottom-0 w-full p-3 bg-gray-200 text-center text-sm text-gray-600 z-20">
        {t.select_message_to_listen || "Select a message to listen to."}
      </div>
    );
  }

  // Determine the current language from the translation object
  const currentLang = t.lang || "en";

  // Determine the correctly translated message title
  const displayTitle =
    currentLang === "en"
      ? track.title_en ?? "Unknown Title"
      : track.title_th ?? "ข้อความไม่ทราบชื่อ";

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
            ? (t.playing || "Playing") + ": " + displayTitle
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
          {t.audio_not_supported ||
            "Your browser does not support the audio element."}
        </audio>

        {/* Download Button */}
        <div className="mt-3 flex justify-end">
             <DownloadButton track={track} t={t} />
        </div>
      </div>
    </div>
  );
};

// Helper Component to avoid hook rules issues if AudioPlayer is conditionally rendered
const DownloadButton = ({ track, t }) => {
    const { downloadTrack, isTrackOffline, isTrackDownloading } = useOfflineStorage();
    const isOffline = isTrackOffline(track.id);
    const isDownloading = isTrackDownloading(track.id);

    return (
        <button
            onClick={() => !isOffline && !isDownloading && downloadTrack(track)}
            disabled={isOffline || isDownloading}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                isOffline
                ? "text-green-500 bg-green-100 cursor-default"
                : isDownloading
                ? "text-gray-500 bg-gray-200 cursor-wait"
                : "text-brand-red bg-red-100 hover:bg-red-200"
            }`}
        >
            {isOffline ? (
                <>
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    {t.downloaded || "Downloaded"}
                </>
            ) : isDownloading ? (
                <>
                    <Loader className="w-4 h-4 mr-1.5 animate-spin" />
                    {t.downloading || "Downloading..."}
                </>
            ) : (
                <>
                    <Download className="w-4 h-4 mr-1.5" />
                    {t.download || "Download"}
                </>
            )}
        </button>
    );
};

export default AudioPlayer;
