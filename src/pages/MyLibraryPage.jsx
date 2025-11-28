import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  PlayCircle,
  Download,
} from "../components/Icons";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const ACCENT_COLOR_CLASS = "text-brand-red dark:text-white";

const MyLibraryPage = ({
  lang,
  t,
  onBack,
  onForward,
  hasPrev,
  hasNext,
  onPlay,
  onGoHome,
}) => {
  const { offlineTracks, deleteTrack, clearLibrary } = useOfflineStorage();

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasPrev
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasPrev}
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

      {/* Main Content Wrapper - Centered */}
      <div className="max-w-lg mx-auto">
        <div className="flex justify-center items-center mb-6 relative">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <Download className="w-8 h-8 mr-3 text-brand-red dark:text-white" />
            {t.my_library || "My Library"}
          </h1>
          {offlineTracks.length > 0 && (
            <button
              onClick={clearLibrary}
              className="absolute right-0 text-xs text-red-500 font-semibold hover:underline"
            >
              {t.clear_all || "Clear All"}
            </button>
          )}
        </div>

        {offlineTracks.length === 0 ? (
          <div className="text-center p-8 text-gray-500 flex flex-col items-center bg-white dark:bg-gray-700 rounded-xl shadow-md">
            <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded-full mb-4">
              <Download className="w-10 h-10 text-gray-400 dark:text-gray-300" />
            </div>
            <p className="text-lg font-medium mb-2 dark:text-white">
              {t.library_empty || "Your library is empty"}
            </p>
            <p className="text-sm max-w-xs mx-auto mb-6 dark:text-gray-300">
              {t.library_empty_tip ||
                "Download messages to listen offline. Look for the download button on message pages."}
            </p>
            <button
              onClick={onGoHome}
              className="bg-brand-red text-white font-bold py-2 px-6 rounded-full shadow-md hover:bg-red-800 transition-colors"
            >
              {t.go_to_messages || "Go to Messages"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {offlineTracks.map((track) => {
              // Determine display titles based on current app language
              const title = lang === "en" ? track.title_en : track.title_th;
              const verse = lang === "en" ? track.verse_en : track.verse_th;
              const languageName =
                lang === "en" ? track.languageEn : track.langTh;

              return (
                <div
                  key={track.id}
                  className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-between"
                >
                  <div
                    className="flex-grow cursor-pointer"
                    onClick={() => onPlay(track)}
                  >
                    <p className="text-md font-bold text-brand-red dark:text-red-400 mb-0.5">
                      {languageName}
                    </p>
                    <h3 className="text-md font-bold text-gray-800 dark:text-white leading-tight">
                      {title || track.title_en || track.title_th}
                    </h3>
                    {verse && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                        {verse}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {t.program_number || "Message No."} {track.id}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 pl-2">
                    <button
                      onClick={() => onPlay(track)}
                      className="p-2 text-brand-red bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      aria-label="Play"
                    >
                      <PlayCircle className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => deleteTrack(track.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-16"></div>
    </div>
  );
};

export default MyLibraryPage;
