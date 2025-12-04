// src/pages/LanguageListPage.jsx
// ===============================
// Enhanced with search and A-Z navigation for faster browsing

import React, { useState } from "react";
import LanguageCard from "../components/LanguageCard";
import { getLanguageIndeterminateState } from "../utils/filterLogic";
import { Search } from "lucide-react";

const LanguageListPage = ({
  lang,
  t,
  onSelectLanguage,
  languageGroups,
  onShowQrForLanguage,
  selectedPrograms,
  onToggleLanguage,
  onHoverChange,
  userData,
  onToggleFavoriteLanguage,
}) => {
  // Local audio playback state for language samples
  const [playingLanguageKey, setPlayingLanguageKey] = useState(null);
  const audioRef = React.useRef(new Audio());

  // Ref for the scrollable container
  const scrollContainerRef = React.useRef(null);

  // Search state for filtering languages
  const [searchQuery, setSearchQuery] = useState("");

  // Filter languages based on search query (English or Thai)
  const filteredLanguages = languageGroups.filter((group) => {
    if (!searchQuery) return true;
    const nameEn = group.displayNameEn?.toLowerCase() || "";
    const nameTh = group.displayNameTh?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return nameEn.includes(query) || nameTh.includes(query);
  });

  // Scroll to first language starting with a letter
  const scrollToLetter = (letter) => {
    console.log("🔤 Clicking letter:", letter);
    
    const firstLanguageWithLetter = filteredLanguages.find((group) =>
      group.displayNameEn.toUpperCase().startsWith(letter)
    );

    console.log("🎯 Found language:", firstLanguageWithLetter?.displayNameEn);

    if (firstLanguageWithLetter) {
      const element = document.getElementById(
        `lang-${firstLanguageWithLetter.stableKey}`
      );
      console.log("🏷️ Element ID:", `lang-${firstLanguageWithLetter.stableKey}`);
      console.log("📍 Element:", element);
      
      if (element) {
        // Find the actual scrolling container (might be parent page wrapper)
        let scrollContainer = scrollContainerRef.current;
        
        // If our ref container isn't scrolling, find the parent that is
        if (scrollContainer && scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
          console.log("⚠️ Ref container not scrolling, finding parent...");
          scrollContainer = element.closest('.overflow-y-auto') || 
                           element.closest('[style*="overflow"]') ||
                           document.querySelector('main');
        }
        
        console.log("📦 Actual scroll container:", scrollContainer);
        
        if (scrollContainer) {
          const elementTop = element.offsetTop;
          const scrollTop = elementTop - 200; // Offset for header + search bar
          
          console.log("📏 Scrolling to:", scrollTop);
          
          scrollContainer.scrollTo({
            top: scrollTop,
            behavior: "smooth",
          });
        } else {
          console.log("❌ No scroll container found, using scrollIntoView");
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        console.log("❌ Element not found in DOM!");
      }
    } else {
      console.log("❌ No language found starting with:", letter);
    }
  };

  // Build external URL for a language
  const buildLanguageExternalUrl = (group) => {
    if (!group || !group.messages || group.messages.length === 0) return null;
    const firstMsg = group.messages[0];
    const langId = group.langId || firstMsg?.langId;
    const iso3 = group.iso3 || firstMsg?.iso3;

    if (langId) {
      return `https://globalrecordings.net/en/language/${langId}`;
    }
    if (iso3) {
      return `https://5fish.mobi/${iso3}`;
    }
    return null;
  };

  // Play / stop a short language sample
  const handlePlayLanguageSample = (group) => {
    if (!group || !group.messages || group.messages.length === 0) {
      console.log("No messages for this language.");
      return;
    }

    const firstMessageWithSample = group.messages.find((msg) => msg.sampleUrl);
    if (!firstMessageWithSample || !firstMessageWithSample.sampleUrl) {
      console.log("No sample available for this language.");
      return;
    }

    if (playingLanguageKey === group.stableKey) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingLanguageKey(null);
      return;
    }

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

  // Clean up audio when leaving page
  React.useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  // When audio finishes, clear the "now playing" state
  React.useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setPlayingLanguageKey(null);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Alphabet for A-Z navigation
  const alphabet = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];


  return (
    <div className="h-full">
      {/* Fixed Search Bar and A-Z Navigation */}
      <div className="fixed top-20 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-2 border-[#CC3333] rounded-lg mx-2 shadow-md">
        {/* Search Bar */}
        <div className="px-2 pt-1.5 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                t.search_languages ||
                "หาภาษาในภาษาไทยหรืออังกฤษ | Find a language in Thai or English."
              }
              title={
                t.search_languages ||
                "หาภาษาในภาษาไทยหรืออังกฤษ | Find a language in Thai or English."
              }
              aria-label={
                t.search_languages || "Find a language in Thai or English."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-red focus:outline-none"
            />
          </div>
        </div>

        {/* A-Z Quick Navigation */}
        <div className="px-2 pb-1">
          <div className="flex flex-wrap gap-0.5 justify-between">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => scrollToLetter(letter)}
                className="flex-grow px-1.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-brand-red hover:text-white rounded transition-colors min-w-[1.75rem] text-center"
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Language Cards */}
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-y-auto px-4"
        style={{ 
          WebkitOverflowScrolling: "touch",
          paddingTop: "135px" 
        }}
      >
        {filteredLanguages.length > 0 ? (
          filteredLanguages.map((group) => (
            <LanguageCard
              key={group.stableKey}
              id={`lang-${group.stableKey}`}
              languageName={
                lang === "th"
                  ? group.displayNameTh || group.displayNameEn
                  : group.displayNameEn
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
              setHovering={onHoverChange}
              onPlayLanguage={() => handlePlayLanguageSample(group)}
              isPlayingLanguage={playingLanguageKey === group.stableKey}
              isFavorite={
                !!userData?.favoriteLanguages?.includes(group.stableKey)
              }
              onToggleFavorite={() => onToggleFavoriteLanguage(group.stableKey)}
              sampleUrl={group.messages.find((msg) => msg.sampleUrl)?.sampleUrl}
              externalUrl={buildLanguageExternalUrl(group)}
              languageVideoUrl={
                group.messages.find((msg) => msg.languageVideoUrl)
                  ?.languageVideoUrl
              }
              searchQuery={searchQuery}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">
              {t.no_languages_found || "No languages found"}
            </p>
            <p className="text-sm mt-2">
              {t.try_different_search || "Try a different search term"}
            </p>
          </div>
        )}

        {/* Spacer at bottom */}
        <div className="h-16" />
      </div>
    </div>
  );
};

export default LanguageListPage;
