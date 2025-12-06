import React, { useState, useEffect } from "react";
import { PlayCircle, ChevronLeft, Download, CheckCircle, Loader, X } from "./Icons";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const AudioPlayer = ({ track, isMinimized, toggleMinimize, t, onGoBack, onGoForward, hasPrev, hasNext, onClose }) => {
  const [audioSrc, setAudioSrc] = useState(null);
  
  // Check cache for offline audio
  useEffect(() => {
    const loadAudioSrc = async () => {
      if (!track || !track.trackDownloadUrl) {
        setAudioSrc(null);
        return;
      }



      try {
        // Try to get from cache first
        const cache = await caches.open("offline-audio-v1");
        
        // Ensure URL has protocol for cache matching
        let urlToCheck = track.trackDownloadUrl;
        if (urlToCheck && !urlToCheck.startsWith("http")) {
            urlToCheck = "https://" + urlToCheck;
        }
        
        console.debug("AudioPlayer: Checking cache for URL:", urlToCheck);
        const cachedResponse = await cache.match(urlToCheck);
        
        if (cachedResponse) {
          // Use cached version
          const blob = await cachedResponse.blob();
          
          if (blob.size === 0) {
            console.error("AudioPlayer: Blob is empty! Falling back to online URL");
            setAudioSrc(urlToCheck);
            return;
          }
          
          const url = URL.createObjectURL(blob);
          setAudioSrc(url);
        } else {
          // Use online URL (ensure protocol)
          setAudioSrc(urlToCheck);
        }
      } catch (error) {
        console.error("AudioPlayer: Error loading audio:", error);
        // Fallback to online URL with protocol
        let fallbackUrl = track.trackDownloadUrl;
        if (fallbackUrl && !fallbackUrl.startsWith("http")) {
            fallbackUrl = "https://" + fallbackUrl;
        }
        setAudioSrc(fallbackUrl);
      }
    };

    loadAudioSrc();

    // Cleanup blob URL on unmount
    return () => {
      if (audioSrc && audioSrc.startsWith("blob:")) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [track]);

  // Check if a track is available
  if (!track || !track.trackDownloadUrl) {
    return (
      <div className="sticky bottom-0 w-full p-3 bg-gray-200 flex items-center justify-between text-sm text-gray-600 z-20">
        <button
          onClick={onGoBack}
          disabled={!hasPrev}
          className={`p-2 transition-colors ${
            hasPrev
              ? "text-gray-600 hover:text-gray-800 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
          aria-label="Go Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-center flex-grow">
          {t.select_message_to_listen || "Select a message to listen to."}
        </span>
        <button
          onClick={onGoForward}
          disabled={!hasNext}
          className={`p-2 transition-colors ${
            hasNext
              ? "text-gray-600 hover:text-gray-800 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
          aria-label="Go Forward"
        >
          <ChevronLeft className="w-6 h-6 rotate-180" />
        </button>
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
            : t.controls || "Audio Player"}
        </p>
        {/* Close Button */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent minimize/maximize toggle
              onClose();
            }}
            className="ml-auto mr-2 p-1 hover:bg-gray-700 rounded-full transition-colors"
            title="Close Player"
            aria-label="Close Player"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
        <ChevronLeft
          className={`w-5 h-5 text-white ${!onClose ? 'ml-auto' : ''} transition-transform ${
            isMinimized ? "rotate-90" : "-rotate-90"
          }`}
        />
      </div>

      {/* Full Controls (Hidden when minimized) */}
      <div className={`${isMinimized ? "hidden" : "p-4"}`}>
        {audioSrc ? (
          <audio
            key={track.id + "-" + audioSrc}
            controls
            autoPlay
            src={audioSrc}
            className="w-full"
          >
            {t.audio_not_supported ||
              "Your browser does not support the audio element."}
          </audio>
        ) : (
          <div className="text-white text-center">Loading audio...</div>
        )}

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
                ? "text-amber-600 bg-amber-100 cursor-default"
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
