import React from "react";
import { Share2, Download, ChevronLeft } from "../components/Icons";
import { Copy } from "lucide-react";
import ContentCard from "../components/ContentCard";
import { getFilteredMessages } from "../utils/filterLogic";

const ACCENT_COLOR_CLASS = "text-brand-red";

const SelectedContentPage = ({
  lang,
  t,
  onBack,
  messages,
  selectedMessages,
  selectedPrograms,
  languageGroups,
  allMessages,
  onClearSelection,
  onShare,
  onCopy,
  onDownload,
}) => {
  // Use the logic to get the actual message objects
  const filteredContent = getFilteredMessages(allMessages, selectedPrograms);
  const count = filteredContent.length;

  return (
    <div className="p-4 pt-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${ACCENT_COLOR_CLASS} hover:text-red-700`}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onClearSelection}
          className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
        >
          {t.clear_all || "Clear All"}
        </button>
      </div>
      <h1 className={`text-2xl font-bold mb-1 ${ACCENT_COLOR_CLASS}`}>
        {t.selected_content || "Selected Programs"}
      </h1>
      <p className="text-sm text-gray-500 mb-4 font-semibold">
        {count} {t.messages_selected || "messages selected"}
      </p>

      {/* --- Action Buttons --- */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={onShare}
          className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#002244]"
        >
          <Share2 className="w-6 h-6 mb-1" />
          <span className="text-xs">{t.share || "Share"}</span>
        </button>
        <button
          onClick={onCopy}
          className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#002244]"
        >
          <Copy className="w-6 h-6 mb-1" />
          {/* 👆 IF YOU PICK ANOTHER ICON, replace Copy with: Copy, ClipboardCopy, CopyCheck, or Files */}
          <span className="text-xs">{t.copy || "Copy"}</span>
        </button>

        <button
          onClick={onDownload}
          className="bg-[#2D2A4A] text-white p-3 rounded-lg flex flex-col items-center justify-center shadow hover:bg-[#002244]"
        >
          {/* Using Download as a stand-in for Print/Download */}
          <Download className="w-6 h-6 mb-1" />
          <span className="text-xs">{t.print || "Print/Download"}</span>
        </button>
      </div>
      {/* --- End Action Buttons --- */}
      <div className="flex-grow overflow-y-auto pb-4">
        {count === 0 ? (
          <p className="text-center text-gray-500 pt-8">
            {t.no_content_selected ||
              "No content selected yet. Go back and check some boxes!"}
          </p>
        ) : (
          filteredContent.map((item) => (
            <ContentCard // Re-use the card we updated earlier!
              key={item.id}
              item={item}
              lang={lang}
              onSelect={() => {
                /* Don't navigate on this page */
              }}
              showLanguageName={true} // Show the Language name since they are mixed
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SelectedContentPage;
