import React from "react";
import { ChevronLeft, ChevronRight, Trash2, PlayCircle, Download } from "../components/Icons";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const ACCENT_COLOR_CLASS = "text-brand-red";

const MyLibraryPage = ({
  lang,
  t,
  onBack,
  onForward,
  hasPrev,
  hasNext,
  onPlay,
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

      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t.my_library || "My Library"}
        </h1>
        {offlineTracks.length > 0 && (
          <button
            onClick={clearLibrary}
            className="text-xs text-red-500 font-semibold hover:underline"
          >
            {t.clear_all || "Clear All"}
          </button>
        )}
      </div>

      {offlineTracks.length === 0 ? (
        <div className="text-center p-8 text-gray-500 flex flex-col items-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Download className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-2">
            {t.library_empty || "Your library is empty"}
          </p>
          <p className="text-sm max-w-xs mx-auto">
            {t.library_empty_tip ||
              "Download messages to listen offline. Look for the download button on message pages."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offlineTracks.map((track) => {
             // Determine display titles based on current app language
             const title = lang === 'en' ? track.title_en : track.title_th;
             const verse = lang === 'en' ? track.verse_en : track.verse_th;
             const languageName = lang === 'en' ? track.languageEn : track.langTh;

             return (
                <div
                  key={track.id}
                  className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => onPlay(track)}
                  >
                    <p className="text-xs font-bold text-brand-red mb-0.5">
                      {languageName}
                    </p>
                    <h3 className="text-md font-bold text-gray-800 leading-tight">
                      {title || track.title_en || track.title_th}
                    </h3>
                    {verse && (
                        <p className="text-sm text-gray-600 mt-0.5">{verse}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                       {t.program_number || "Message No."} {track.id}
                    </p>
                  </div>
    
                  <div className="flex items-center space-x-3 pl-2">
                    <button
                      onClick={() => onPlay(track)}
                      className="p-2 text-brand-red bg-red-50 rounded-full hover:bg-red-100 transition-colors"
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
      
      <div className="h-16"></div>
    </div>
  );
};

export default MyLibraryPage;
