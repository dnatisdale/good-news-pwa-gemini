import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Settings, Trash, Folder } from "../components/Icons";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const StorageManagementPage = ({
  lang,
  t,
  onBack,
  onForward,
  hasPrev,
  hasNext,
  offlineTracks = [],
  deleteTrack,
  clearLibrary
}) => {
  // Use props instead of local hook
  // const { offlineTracks, deleteTrack, clearLibrary } = useOfflineStorage();
  const [totalSize, setTotalSize] = useState("Calculating...");

  // Calculate estimated size (Mock for now as actual file size access is tricky in PWA safely)
  // In a real scenario, we might track 'Content-Length' when downloading.
  useEffect(() => {
    // Basic estimate: 5MB per track average if we don't have real data
    // Or we could try to read blob size from cache if `useOfflineStorage` supported it.
    // For now, we'll just show the count.
    setTotalSize(`${offlineTracks.length} items`);
  }, [offlineTracks]);

  const handleDelete = async (trackId) => {
    if (window.confirm(t.confirm_delete_track || "Delete this track?")) {
      await deleteTrack(trackId);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm(t.delete_confirm || "Are you sure?")) {
      await clearLibrary();
    }
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-800">
      {/* Navigation Header */}
      <div className="bg-slate-100 dark:bg-slate-700 text-gray-600 dark:text-white px-4 py-2 flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-600 rounded-t-lg">
        <button
          onClick={onBack}
          disabled={!hasPrev}
          className={`flex items-center text-base font-semibold transition-colors ${
            hasPrev ? "hover:text-gray-900 dark:hover:text-gray-300" : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          disabled={!hasNext}
          className={`flex items-center text-base font-semibold transition-colors ${
            hasNext ? "hover:text-gray-900 dark:hover:text-gray-300" : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 flex items-center justify-center">
        <Folder className="w-8 h-8 mr-3 text-brand-red dark:text-white" />
        {t.storage_management || "Storage Management"}
      </h1>

      <div className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
        {t.storage_used || "Usage"}: <span className="font-semibold text-gray-700 dark:text-gray-200">{totalSize}</span>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden">
        {offlineTracks.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
             <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded-full mb-4">
                <Folder className="w-8 h-8 text-gray-400 dark:text-gray-500" />
             </div>
             {t.no_downloads || "No downloaded messages found"}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-600">
            {offlineTracks.map((track) => (
              <div key={track.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white truncate">
                    {lang === 'th' ? track.title_th : track.title_en}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {lang === 'th' ? track.langTh : track.languageEn}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(track.id)}
                  className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                  aria-label="Delete"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Clear All */}
      {offlineTracks.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleClearAll}
            className="flex items-center px-6 py-3 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all font-semibold"
          >
            <Trash className="w-5 h-5 mr-2" />
            {t.delete_all || "Delete All"}
          </button>
        </div>
      )}
    </div>
  );
};

export default StorageManagementPage;
