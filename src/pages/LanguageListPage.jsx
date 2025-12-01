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
  userData, // 👇 NEW
  onToggleFavoriteLanguage, // 👇 NEW
}) => {
  // Audio Playback State
  const [playingLanguageKey, setPlayingLanguageKey] = React.useState(null);
  const audioRef = React.useRef(new Audio());

  const handlePlayLanguageSample = (group) => {
    // Find first message in the group that has a sample
    const firstMessageWithSample = group.messages.find(msg => msg.sampleUrl);
    
    if (!firstMessageWithSample || !firstMessageWithSample.sampleUrl) {
      console.log('No sample available for this language');
      return;
    }

    if (playingLanguageKey === group.stableKey) {
      // Stop playing
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingLanguageKey(null);
    } else {
      // Start playing new sample
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      audioRef.current.src = firstMessageWithSample.sampleUrl;
      audioRef.current.load();
      
      audioRef.current.play()
        .then(() => {
          console.log('Playing language sample:', firstMessageWithSample.sampleUrl);
          setPlayingLanguageKey(group.stableKey);
        })
        .catch(e => {
          console.error("Error playing sample:", e);
          setPlayingLanguageKey(null);
        });
    }
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  // Stop audio when it ends
  React.useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setPlayingLanguageKey(null);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

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
          // 👇 NEW: Audio playback props
          onPlayLanguage={() => handlePlayLanguageSample(group)}
          isPlayingLanguage={playingLanguageKey === group.stableKey}
          isFavorite={userData?.favoriteLanguages?.includes(group.stableKey)} // 👇 NEW
          onToggleFavorite={() => onToggleFavoriteLanguage(group.stableKey)} // 👇 NEW
          sampleUrl={group.messages.find(msg => msg.sampleUrl)?.sampleUrl} // 👇 NEW: Pass sample URL for download
        />
      ))}
      <div className="h-16"></div>
    </div>
  );
};

export default LanguageListPage;
