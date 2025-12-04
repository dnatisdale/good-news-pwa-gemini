import React, { useMemo } from "react";
import ContentCard from "../components/ContentCard";
import { ChevronLeft, ChevronRight, YouTube, YouTubeOff } from "../components/Icons";

const ACCENT_COLOR_CLASS = "text-brand-red";

const MessagesByLanguagePage = ({
  lang,
  t,
  selectedLanguageKey,
  onBack, // currently not used here, but safe to keep
  onForward, // "
  hasPrev, // "
  hasNext, // "
  onSelectMessage,
  currentMessageList,
  languageGroups,
  pageStack, // currently not used here
  selectedPrograms,
  onToggleProgram,
  onShowQrForMessage,
  userData,
  onToggleFavorite,
}) => {
  // Find the language object from languageGroups using the stableKey
  const languageDisplayName = useMemo(() => {
    const group = languageGroups.find(
      (g) => g.stableKey === selectedLanguageKey
    );
    if (!group) return selectedLanguageKey;
    return lang === "en" ? group.displayNameEn : group.displayNameTh;
  }, [lang, selectedLanguageKey, languageGroups]);

  // Optional: you can also get message count from the group if it's there
  const languageMessageCount = useMemo(() => {
    const group = languageGroups.find(
      (g) => g.stableKey === selectedLanguageKey
    );
    if (!group) return currentMessageList?.length || 0;
    return group.count ?? currentMessageList?.length ?? 0;
  }, [languageGroups, selectedLanguageKey, currentMessageList]);

  const languageExternalUrl = useMemo(() => {
    const group = languageGroups.find(
      (g) => g.stableKey === selectedLanguageKey
    );
    if (!group || !group.messages || group.messages.length === 0) {
      return null;
    }

    const firstMsg = group.messages[0];
    const langId = group.langId || firstMsg.langId;
    const iso3 = firstMsg.iso3;

    // Prefer GRN language page if we have langId
    if (langId) {
      return `https://globalrecordings.net/en/language/${langId}`;
    }

    // Fallback to 5fish language page by ISO code
    if (iso3) {
      return `https://5fish.mobi/${iso3}`;
    }

    return null;
  }, [languageGroups, selectedLanguageKey]);

  const languageVideoUrl = useMemo(() => {
    const group = languageGroups.find(
      (g) => g.stableKey === selectedLanguageKey
    );
    if (!group || !group.messages || group.messages.length === 0) {
      return null;
    }
    // Check if any message in the group has a languageVideoUrl (using the first one found)
    const msgWithVideo = group.messages.find((m) => m.languageVideoUrl);
    return msgWithVideo ? msgWithVideo.languageVideoUrl : null;
  }, [languageGroups, selectedLanguageKey]);

  // --- Audio Playback State for "sample" ---
  const [playingSampleId, setPlayingSampleId] = React.useState(null);
  const audioRef = React.useRef(new Audio());

  const handlePlaySample = (item) => {
    // If this item is already playing, stop it
    if (playingSampleId === item.id) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingSampleId(null);
    } else {
      // Start a new sample if we have a URL
      if (item.sampleUrl) {
        // Stop any current audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        // Load new URL
        audioRef.current.src = item.sampleUrl;
        audioRef.current
          .play()
          .then(() => {
            setPlayingSampleId(item.id);
          })
          .catch((e) => {
            console.error("Error playing sample:", e);
            console.error("Sample URL:", item.sampleUrl);
            setPlayingSampleId(null);
          });

        // Reset state when audio finishes
        audioRef.current.onended = () => setPlayingSampleId(null);
      }
    }
  };

  // Cleanup audio when page is unmounted
  React.useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  // If no messages, show a friendly empty state
  if (!currentMessageList || currentMessageList.length === 0) {
    return (
      <div className="p-4">
        <h1 className={`text-lg font-semibold mb-2 ${ACCENT_COLOR_CLASS}`}>
          {languageDisplayName}
        </h1>
        <p className="text-sm text-slate-600">
          {t.no_messages_for_language ||
            "No messages available for this language yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 pt-8">
      {/* Navigation Bar (Dark/Light) */}
      <div className="bg-slate-100 dark:bg-slate-700 text-gray-600 dark:text-white px-4 py-2 flex justify-between items-center shrink-0 border-b border-slate-200 dark:border-slate-600">
        <button
          onClick={onBack}
          disabled={!hasPrev}
          className={`flex items-center text-base font-semibold transition-colors ${
            hasPrev
              ? "hover:text-gray-900 dark:hover:text-gray-300"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>

        <button
          onClick={onForward}
          disabled={!hasNext}
          className={`flex items-center text-base font-semibold transition-colors ${
            hasNext
              ? "hover:text-gray-900 dark:hover:text-gray-300"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      {/* Simple header for this page area */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          {languageExternalUrl ? (
            <button
              type="button"
              onClick={() =>
                window.open(
                  languageExternalUrl,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              className={`text-lg font-semibold ${ACCENT_COLOR_CLASS} dark:text-white underline decoration-dotted underline-offset-2 hover:decoration-solid focus:outline-none focus:ring-2 focus:ring-brand-red rounded-sm`}
              title={
                t.open_language_on_grn || "Open this language on GRN / 5fish"
              }
            >
              {languageDisplayName}
            </button>
          ) : (
            <div
              className={`text-lg font-semibold ${ACCENT_COLOR_CLASS} dark:text-white`}
            >
              {languageDisplayName}
            </div>
          )}

          <div className="text-sm text-slate-500 dark:text-slate-400">
            ({languageMessageCount}{" "}
            {languageMessageCount === 1
              ? t.message || "message"
              : t.messages || "messages"}
            )
          </div>
        </div>
        
        {/* Language Video Indicator */}
        <div>
          {languageVideoUrl && (
            <a
              href={languageVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-red-50 text-brand-red hover:bg-red-100 transition-all inline-block"
              title={t.watch_video || "Watch Video"}
            >
              <YouTube className="w-6 h-6" />
            </a>
          )}
        </div>
      </div>

      {/* Scrollable message list */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800">
        {currentMessageList.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            lang={lang}
            t={t}
            onSelect={onSelectMessage}
            showLanguageName={false}
            // --- Program selection (for bulk actions / playlist, etc.)
            isSelected={selectedPrograms.includes(item.id)}
            onToggle={() =>
              onToggleProgram(item.id, selectedLanguageKey, currentMessageList)
            }
            // --- Sample audio controls
            isPlayingSample={playingSampleId === item.id}
            onPlaySample={() => handlePlaySample(item)}
            // --- QR share for this message
            onShowQrForMessage={() =>
              onShowQrForMessage(item, languageDisplayName)
            }
            // --- Message favorites (hearts)
            // This tells ContentCard whether to show the heart as "on"
            isFavorite={userData?.favorites?.includes(item.id)}
            // This tells App to update favorites in Firestore
            onToggleFavorite={() => onToggleFavorite(item.id)}
          />
        ))}
        {/* Spacer at bottom so floating bars don't cover last card */}
        <div className="h-16"></div>
      </div>
    </div>
  );
};

export default MessagesByLanguagePage;
