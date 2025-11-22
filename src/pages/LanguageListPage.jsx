import React from "react";
import LanguageCard from "../components/LanguageCard";
import { getLanguageIndeterminateState } from "../utils/filterLogic";

const LanguageListPage = ({
  lang,
  t,
  onSelectLanguage,
  languageGroups,
  onShowQrForLanguage,
  selectedPrograms,
  onToggleLanguage,
  // 👇 NEW PROP
  onHoverChange,
}) => {
  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {languageGroups.map((group) => (
        <LanguageCard
          key={group.stableKey}
          languageName={
            lang === "en" ? group.displayNameEn : group.displayNameTh
          }
          lang={lang}
          onSelect={() => onSelectLanguage(group.stableKey)}
          messageCount={group.count}
          onShowQrForLanguage={() => onShowQrForLanguage(group.stableKey)}
          selectionState={getLanguageIndeterminateState(
            group,
            selectedPrograms
          )}
          onToggle={() => onToggleLanguage(group.stableKey, group.messages)}
          // 👇 CONNECT THE WIRE HERE
          setHovering={onHoverChange}
        />
      ))}
      <div className="h-16"></div>
    </div>
  );
};

export default LanguageListPage;
