import React, { useMemo } from "react";
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
  pageStack,
  selectedPrograms,
  onToggleProgram,
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
      {/* Display selected language name */}
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
