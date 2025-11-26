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
  onShowQrForMessage, // 👇 NEW PROP
  userData, // 👇 NEW PROP
  onToggleFavorite, // 👇 NEW PROP
}) => {
  const languageDisplayName = useMemo(() => {
    const group = languageGroups.find(
      (g) => g.stableKey === selectedLanguageKey
    );
    if (!group) return selectedLanguageKey;
    return lang === "en" ? group.displayNameEn : group.displayNameTh;
  }, [lang, selectedLanguageKey, languageGroups]);

  // Audio Playback State
  const [playingSampleId, setPlayingSampleId] = React.useState(null);
  const audioRef = React.useRef(new Audio());

  const handlePlaySample = (item) => {
    if (playingSampleId === item.id) {
      // Stop playing
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingSampleId(null);
    } else {
      // Start playing new sample
      if (item.sampleUrl) {
        // Stop any currently playing audio first
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Set new source and load
        audioRef.current.src = item.sampleUrl;
        audioRef.current.load(); // Critical: load the new source
        
        // Try to play
        audioRef.current.play()
          .then(() => {
            console.log('Playing sample:', item.sampleUrl);
            setPlayingSampleId(item.id);
          })
          .catch(e => {
            console.error("Error playing sample:", e);
            console.error("Sample URL:", item.sampleUrl);
            setPlayingSampleId(null);
          });
        
        // Reset state when audio ends
        audioRef.current.onended = () => setPlayingSampleId(null);
      }
    }
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      audioRef.current.pause();
    };
  }, []);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Display selected language name */}
      <h1 className={`text-2xl font-bold mb-1 ${ACCENT_COLOR_CLASS} dark:text-white`}>
        {languageDisplayName}
      </h1>
      <p className="text-sm text-gray-500 dark:text-white mb-4 font-semibold">
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
          isPlayingSample={playingSampleId === item.id}
          onPlaySample={() => handlePlaySample(item)}
          onShowQrForMessage={() => onShowQrForMessage(item, languageDisplayName)} // 👇 PASS IT DOWN
          isFavorite={userData?.favorites?.includes(item.id)}
          onToggleFavorite={() => onToggleFavorite(item.id)}
        />
      ))}
      <div className="h-16"></div>
    </div>
  );
};

export default MessagesByLanguagePage;
