// src/pages/LanguageListPage.jsx
// ===============================
// Uncle-map:
//   - Lines 1–3  : Imports
//   - Lines 5–20 : Props coming in from App.jsx
//   - Lines 22–33: Local audio state (which language sample is playing?)
//   - Lines 35–57: Helper to build GRN / 5fish URL for each language
//   - Lines 59–93: Play / stop the language audio sample
//   - Lines 95–110: Clean up audio when leaving page or when audio ends
//   - Lines 112–145: Render all LanguageCard rows

import React from "react";
import LanguageCard from "../components/LanguageCard";
import { getLanguageIndeterminateState } from "../utils/filterLogic";

// 1) The page component receives props from App.jsx
const LanguageListPage = ({
  lang, // "en" or "th"
  t, // translation object (not used here, but kept for future)
  onSelectLanguage, // when you tap the row, open that language's messages
  languageGroups, // array of language groups (Akeu, Akha, etc.)
  onShowQrForLanguage, // show QR for a whole language
  selectedPrograms, // which message IDs are currently selected
  onToggleLanguage, // select / unselect all messages for that language
  onHoverChange, // tells App when mouse is over content area
  userData, // holds favorites, etc.
  onToggleFavoriteLanguage, // mark a language as a favorite
}) => {
  // 2) Local audio playback state for language samples
  const [playingLanguageKey, setPlayingLanguageKey] = React.useState(null);
  const audioRef = React.useRef(new Audio());

  // 3) Build external URL for a language (GRN language page first, 5fish as backup)
  const buildLanguageExternalUrl = (group) => {
    if (!group || !group.messages || group.messages.length === 0) return null;

    const firstMsg = group.messages[0];

    const langId = group.langId || firstMsg?.langId;
    const iso3 = group.iso3 || firstMsg?.iso3;

    // Prefer GRN language page if we know langId
    if (langId) {
      return `https://globalrecordings.net/en/language/${langId}`;
    }

    // Fallback to 5fish language page by ISO code
    if (iso3) {
      // 5fish mofi-style language page
      return `https://5fish.mobi/${iso3}`;
    }

    // If we really don't know, no external URL
    return null;
  };

  // 4) Play / stop a short language sample (if sampleUrl exists)
  const handlePlayLanguageSample = (group) => {
    if (!group || !group.messages || group.messages.length === 0) {
      console.log("No messages for this language.");
      return;
    }

    // Look for first message with a sampleUrl
    const firstMessageWithSample = group.messages.find((msg) => msg.sampleUrl);

    if (!firstMessageWithSample || !firstMessageWithSample.sampleUrl) {
      console.log("No sample available for this language.");
      return;
    }

    // If we tap the same language that's already playing → stop it
    if (playingLanguageKey === group.stableKey) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingLanguageKey(null);
      return;
    }

    // Otherwise, stop anything else and start this one
    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    audioRef.current.src = firstMessageWithSample.sampleUrl;
    audioRef.current.load();

    audioRef.current
      .play()
      .then(() => {
        console.log(
          "Playing language sample:",
          firstMessageWithSample.sampleUrl
        );
        setPlayingLanguageKey(group.stableKey);
      })
      .catch((err) => {
        console.error("Error playing language sample:", err);
        setPlayingLanguageKey(null);
      });
  };

  // 5) Clean up audio if this page unmounts (we leave the page)
  React.useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  // 6) When audio finishes, clear the "now playing" state
  React.useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setPlayingLanguageKey(null);

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // 7) Render all language rows
  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {languageGroups.map((group) => (
        <LanguageCard
          key={group.stableKey}
          // Show English or Thai language name depending on UI language
          languageName={
            lang === "th"
              ? group.displayNameTh || group.displayNameEn
              : group.displayNameEn
          }
          lang={lang}
          // When you tap the row (not the little language-name link),
          // open the "MessagesByLanguage" page for that language.
          onSelect={() => onSelectLanguage(group.stableKey)}
          messageCount={group.count}
          onShowQrForLanguage={() => onShowQrForLanguage(group.stableKey)}
          selectionState={getLanguageIndeterminateState(
            group,
            selectedPrograms
          )}
          onToggle={() => onToggleLanguage(group.stableKey, group.messages)}
          // Hover state for showing / hiding some UI in App.jsx
          setHovering={onHoverChange}
          // Language sample playback
          onPlayLanguage={() => handlePlayLanguageSample(group)}
          isPlayingLanguage={playingLanguageKey === group.stableKey}
          // Favorites: heart icon on the language row
          isFavorite={!!userData?.favoriteLanguages?.includes(group.stableKey)}
          onToggleFavorite={() => onToggleFavoriteLanguage(group.stableKey)}
          // Pass first available sample URL (for download button, etc.)
          sampleUrl={group.messages.find((msg) => msg.sampleUrl)?.sampleUrl}
          // NEW: External GRN / 5fish link used by LanguageCard for the language name
          externalUrl={buildLanguageExternalUrl(group)}
          // NEW: YouTube URL for the language (find first message with one)
          languageVideoUrl={group.messages.find((msg) => msg.languageVideoUrl)?.languageVideoUrl}
        />
      ))}

      {/* Spacer at bottom so last card isn’t jammed against the edge */}
      <div className="h-16" />
    </div>
  );
};

export default LanguageListPage;
