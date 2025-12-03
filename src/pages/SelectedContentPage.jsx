import React from "react";
import { Share2, Download, ChevronLeft, ChevronRight, Music } from "../components/Icons";
import { Copy } from "lucide-react";
import ContentCard from "../components/ContentCard";
import { getFilteredMessages } from "../utils/filterLogic";

const ACCENT_COLOR_CLASS = "text-brand-red";

const SelectedContentPage = ({
  lang,
  t,
  onBack,
  onForward,
  hasPrev,
  hasNext,
  messages,
  selectedMessages,
  selectedPrograms,
  languageGroups,
  allMessages,
  onClearSelection,
  onShare,
  onCopy,
  onDownload,
  onDownloadPDF,
  userData, // 👇 NEW PROP
  onToggleFavorite, // 👇 NEW PROP
}) => {
  // Use the logic to get the actual message objects
  const filteredContent = getFilteredMessages(allMessages, selectedPrograms);
  const count = filteredContent.length;
  
  console.log("Debug Translation:", { lang, clear_all: t.clear_all, t });

  return (
    <div className="p-4 pt-8 h-full flex flex-col">
      {/* Navigation Header */}
      <div className="bg-slate-100 dark:bg-slate-700 text-gray-600 dark:text-white px-4 py-2 flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-600">
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

      <div className="w-full max-w-lg mx-auto flex flex-col items-center flex-grow overflow-hidden">
        {/* Centered and stacked header */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-6 h-6 text-brand-red dark:text-white" />
            <h1 className="text-2xl font-bold mb-0 text-gray-800 dark:text-white">
              {t.selected_content || "Selected Messages"}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300 font-semibold">
            {count} {t.messages_selected || "messages selected"}
          </p>
          <button
            onClick={onClearSelection}
            className="mt-2 px-5 py-1.5 bg-orange-400 text-white text-sm font-bold rounded-full shadow-md hover:bg-orange-500 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {t.clear_all || "Clear All"}
          </button>
        </div>

        {/* --- Action Buttons --- */}
        <div className="flex justify-center mb-4">
          <div className="grid grid-cols-2 gap-5 max-w-[480px] w-full">
            <button
              onClick={onShare}
              className="aspect-square bg-brand-red-dark text-white p-6 rounded-lg flex flex-col items-center justify-center shadow hover:bg-brand-red transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              <Share2 className="w-10 h-10 mb-2" />
              <span className="text-base font-medium leading-tight">{t.share || "Share"}</span>
            </button>
            <button
              onClick={onCopy}
              className="aspect-square bg-brand-red-dark text-white p-6 rounded-lg flex flex-col items-center justify-center shadow hover:bg-brand-red transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              <Copy className="w-10 h-10 mb-2" />
              <span className="text-base font-medium leading-tight">{t.copy || "Copy"}</span>
            </button>

            <button
              onClick={onDownload}
              className="aspect-square bg-brand-red-dark text-white p-6 rounded-lg flex flex-col items-center justify-center shadow hover:bg-brand-red transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              <Download className="w-10 h-10 mb-2" />
              <span className="text-base font-medium text-center leading-tight">
                {t.print_word || "Print"}
              </span>
            </button>

            <button
              onClick={onDownloadPDF}
              className="aspect-square bg-brand-red-dark text-white p-6 rounded-lg flex flex-col items-center justify-center shadow hover:bg-brand-red transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              <Download className="w-10 h-10 mb-2" />
              <span className="text-base font-medium text-center leading-tight">
                PDF
              </span>
            </button>
          </div>
        </div>
        {/* --- End Action Buttons --- */}
        
        {/* Empty State Message */}
        {count === 0 && (
          <div className="text-center px-6 mb-6">
            <p className="text-gray-600 dark:text-gray-300 text-xs leading-snug mb-4">
              {t.no_content_selected ||
                "It looks like you haven't selected any messages yet. To get started, click here to go back to the Language Finder and check the messages you want to use. Once you return, we can help you with sharing, copying, or printing your selections."}
            </p>
            <button
              onClick={onBack}
              className="bg-brand-red-dark text-white px-6 py-2.5 rounded-lg font-medium shadow hover:bg-brand-red transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {t.go_back || "Go Back"}
            </button>
          </div>
        )}

        <div className="flex-grow w-full overflow-y-auto pb-4">
          {count === 0 ? (
            null
          ) : (
            filteredContent.map((item) => (
              <ContentCard // Re-use the card we updated earlier!
                key={item.id}
                item={item}
                lang={lang}
                t={t} // 👇 PASS t PROP
                onSelect={() => {
                  /* Don't navigate on this page */
                }}
                showLanguageName={true} // Show the Language name since they are mixed
                isFavorite={userData?.favorites?.includes(item.id)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedContentPage;
