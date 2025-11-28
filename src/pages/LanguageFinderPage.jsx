import React, { useMemo, useState } from "react";
import { Search, Heart, Languages } from "../components/Icons";
import { staticContent } from "../data/staticContent";

/**
 * LanguageFinderPage
 * -------------------
 * One screen to browse all languages using:
 * - A / ก script toggle
 * - Search bar (Thai + English)
 * - Alphabet bar
 * - Scrollable list with hearts
 */
const LanguageFinderPage = ({
  lang,
  t,
  userData,
  onToggleFavoriteLanguage,
  onSelectLanguage,
  onBack,
  onForward,
  hasPrev,
  hasNext,
}) => {
  // 1) Build a unique list of languages from staticContent
  const languages = useMemo(() => {
    const map = {};
    staticContent.forEach((item) => {
      const key = item.stableKey;
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          stableKey: key,
          nameEn: item.languageEn || "",
          nameTh: item.langTh || "",
          isoCode: item.iso3 || "",
        };
      }
    });
    return Object.values(map);
  }, []);

  // "th" = Thai script list, "en" = English script list
  const [scriptMode, setScriptMode] = useState("th");
  const [searchTerm, setSearchTerm] = useState("");
  const [letterFilter, setLetterFilter] = useState(null); // e.g. "A" or "ก"

  // Helper: first letter for the current script
  const getInitialLetter = (langItem) => {
    if (scriptMode === "th") {
      return langItem.nameTh?.trim()?.[0] || "";
    }
    return (langItem.nameEn?.trim()?.[0] || "").toUpperCase();
  };

  // 2) Filter by search (Thai + English + ISO)
  const filteredBySearch = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return languages;

    return languages.filter((lg) => {
      const th = (lg.nameTh || "").toLowerCase();
      const en = (lg.nameEn || "").toLowerCase();
      const iso = (lg.isoCode || "").toLowerCase();
      return th.includes(q) || en.includes(q) || iso.includes(q);
    });
  }, [languages, searchTerm]);

  // 3) Letters for the alphabet bar (current script)
  const letters = useMemo(() => {
    const set = new Set();
    filteredBySearch.forEach((lg) => {
      const letter = getInitialLetter(lg);
      if (letter) set.add(letter);
    });
    return Array.from(set).sort((a, b) => (a > b ? 1 : -1));
  }, [filteredBySearch, scriptMode]);

  // 4) Apply letter filter
  const filteredLanguages = useMemo(() => {
    if (!letterFilter) return filteredBySearch;
    return filteredBySearch.filter(
      (lg) => getInitialLetter(lg) === letterFilter
    );
  }, [filteredBySearch, letterFilter, scriptMode]);

  // 5) Group by letter
  const groupedLanguages = useMemo(() => {
    const groups = {};
    filteredLanguages.forEach((lg) => {
      const letter = getInitialLetter(lg) || "#";
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(lg);
    });
    return Object.entries(groups).sort(([a], [b]) => (a > b ? 1 : -1));
  }, [filteredLanguages, scriptMode]);

  const favoriteLanguageKeys = userData?.favoriteLanguages || [];

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-1 flex items-center">
        <Languages className="w-8 h-8 mr-3 text-brand-red dark:text-white" />
        {t.language_finder || t.languages}
      </h1>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">
        {t.search_languages || "Search Languages..."}
      </p>

      {/* A / ก Script Toggle */}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => {
            setScriptMode("th");
            setLetterFilter(null);
          }}
          className={`flex-1 py-2 rounded-full text-sm sm:text-base md:text-lg font-semibold border ${
            scriptMode === "th"
              ? "bg-red-700 text-white border-red-700"
              : "bg-slate-800 text-slate-100 border-slate-600"
          }`}
        >
          ก
        </button>
        <button
          type="button"
          onClick={() => {
            setScriptMode("en");
            setLetterFilter(null);
          }}
          className={`flex-1 py-2 rounded-full text-sm sm:text-base md:text-lg font-semibold border ${
            scriptMode === "en"
              ? "bg-red-700 text-white border-red-700"
              : "bg-slate-800 text-slate-100 border-slate-600"
          }`}
        >
          A
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mt-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          className="w-full pl-10 pr-3 py-2 rounded-full bg-slate-900 text-slate-100 placeholder:text-slate-500 border border-slate-700 text-sm sm:text-base"
          placeholder={
            scriptMode === "th"
              ? "ค้นหาภาษา… / Search languages…"
              : "Search languages… / ค้นหาภาษา…"
          }
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setLetterFilter(null);
          }}
        />
      </div>

      {/* Alphabet Bar */}
      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-xs sm:text-sm md:text-base text-slate-800 dark:text-slate-100 mt-1 pb-1">
        <button
          type="button"
          onClick={() => setLetterFilter(null)}
          className={`px-3 py-1 rounded-full border text-xs sm:text-sm md:text-base ${
            !letterFilter
              ? "bg-red-600 text-white border-red-600"
              : "border-transparent"
          }`}
        >
          {scriptMode === "th" ? "ทั้งหมด" : "All"}
        </button>

        {letters.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => setLetterFilter(letter)}
            className={`px-2 py-1 rounded-full border text-xs sm:text-sm md:text-base transition-transform duration-180 ${
              letterFilter === letter
                ? "bg-red-600 text-white border-red-600"
                : "border-transparent hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700 hover:scale-150"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Language List */}
      <div className="flex-1 overflow-y-auto mt-2 space-y-3">
        {groupedLanguages.map(([letter, langs]) => (
          <div key={letter}>
            {/* Group header – big letter that scales, with theme-aware color */}
            <div className="mt-4 mb-2 flex items-center gap-2">
              <div className="text-base sm:text-lg md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {letter}
              </div>
              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Items in this letter */}
            <div className="space-y-2">
              {langs.map((langItem) => {
                const isFav = favoriteLanguageKeys.includes(langItem.stableKey);
                const primaryName =
                  scriptMode === "th"
                    ? langItem.nameTh || langItem.nameEn
                    : langItem.nameEn || langItem.nameTh;

                return (
                  <button
                    key={langItem.stableKey}
                    type="button"
                    onClick={() =>
                      onSelectLanguage && onSelectLanguage(langItem.stableKey)
                    }
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex justify-between items-center"
                  >
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-white truncate">
                        {primaryName}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300 truncate">
                        {langItem.nameEn}
                        {langItem.isoCode ? ` · ${langItem.isoCode}` : ""}
                      </div>
                    </div>

                    {/* Favorite Heart */}
                    {onToggleFavoriteLanguage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavoriteLanguage(langItem.stableKey);
                        }}
                        className={`ml-2 p-2 rounded-full transition-all ${
                          isFav ? "bg-red-100" : "bg-gray-100 hover:bg-red-100"
                        }`}
                        title={
                          isFav
                            ? t.unfavorite_language ||
                              "Remove favorite language"
                            : t.favorite_language || "Favorite language"
                        }
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFav
                              ? "fill-brand-red text-brand-red"
                              : "text-gray-500"
                          }`}
                          style={
                            isFav ? { fill: "#CC3333", color: "#CC3333" } : {}
                          }
                        />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {groupedLanguages.length === 0 && (
          <div className="text-sm text-slate-400 mt-4">
            {scriptMode === "th"
              ? "ไม่พบภาษา"
              : "No languages match your search yet."}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageFinderPage;
