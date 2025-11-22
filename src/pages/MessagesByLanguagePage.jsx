import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "../components/Icons";
import ContentCard from "../components/ContentCard";

const ACCENT_COLOR_CLASS = "text-brand-red";

const MessagesByLanguagePage = ({
  lang,
  t,
  selectedLanguageKey,
  onBack,
  onForward,
  hasPrev,
  hasNext,
  onSelectMessage,
  currentMessageList,
  languageGroups,
  pageStack, // Keep this if you use it for back button logic
  selectedPrograms, // NEW
  onToggleProgram, // NEW
}) => {
  const languageDisplayName = useMemo(() => {
    const group = languageGroups.find(
      (g) => g.stableKey === selectedLanguageKey
    );
    if (!group) return selectedLanguageKey;
    return lang === "en" ? group.displayNameEn : group.displayNameTh;
  }, [lang, selectedLanguageKey, languageGroups]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
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

      <h1 className={`text-2xl font-bold mb-1 ${ACCENT_COLOR_CLASS}`}>
        {languageDisplayName}
      </h1>
      <p className="text-sm text-gray-500 mb-4 font-semibold">
        {currentMessageList.length} {t.messages || "messages"}
      </p>

      {currentMessageList.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          lang={lang}
          t={t}
          onSelect={onSelectMessage}
          showLanguageName={false}
          // --- NEW PROPS FOR CHECKBOX ---
          isSelected={selectedPrograms.includes(item.id)}
          onToggle={() =>
            onToggleProgram(item.id, selectedLanguageKey, currentMessageList)
          }
        />
      ))}
      <div className="h-16"></div>
    </div>
  );
};

export default MessagesByLanguagePage;
