import React, { useMemo, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "../components/Icons";
import ContentCard from "../components/ContentCard";
import { staticContent } from "../data/staticContent";

const ACCENT_COLOR_CLASS = "text-brand-red";

const SearchPage = ({
  lang,
  t,
  onSelect,
  searchTerm,
  onBack,
  onForward,
  hasPrev,
  hasNext,
  searchHistory = [],
  onClearHistory,
  onHistorySelect,
  userData,
  onToggleFavorite,
  onOpenSearch, // function to open search bar
}) => {
  // Receives searchTerm and nav props
  const filteredContent = useMemo(() => {
    if (!searchTerm) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();

    return staticContent.filter((item) => {
      // Robust search logic to prevent crashes
      const languageEn = item.languageEn?.toLowerCase() ?? "";
      const languageTh = item.langTh?.toLowerCase() ?? "";
      const titleEn = item.title_en?.toLowerCase() ?? "";
      const titleTh = item.title_th?.toLowerCase() ?? "";
      const verseEn = item.verse_en?.toLowerCase() ?? "";
      const verseTh = item.verse_th?.toLowerCase() ?? "";

      return (
        languageEn.includes(lowerSearchTerm) ||
        languageTh.includes(lowerSearchTerm) ||
        titleEn.includes(lowerSearchTerm) ||
        titleTh.includes(lowerSearchTerm) ||
        verseEn.includes(lowerSearchTerm) ||
        verseTh.includes(lowerSearchTerm)
      );
    });
  }, [searchTerm, lang]);

  const resultCount = filteredContent.length;

  // Auto-open search bar when there are no results and no search term
  useEffect(() => {
    if (!searchTerm && onOpenSearch) {
      onOpenSearch();
    }
  }, [searchTerm, onOpenSearch]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Navigation Header */}
      <div className="bg-slate-100 dark:bg-slate-700 text-gray-600 dark:text-white px-4 py-2 flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-600">
        <button
          onClick={onBack}
          disabled={!hasPrev}
          className={`flex items-center text-base font-semibold transition-colors ${
            hasPrev ? "hover:text-gray-900 dark:hover:text-gray-300" : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          disabled={!hasNext}
          className={`flex items-center text-base font-semibold transition-colors ${
            hasNext ? "hover:text-gray-900 dark:hover:text-gray-300" : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center">
        <Search className="w-8 h-8 mr-3 text-brand-red dark:text-white" />
        {t.search_results || "Search Results"}
      </h1>

      {searchTerm && (
        <p className="text-sm text-gray-600 mb-4 font-semibold">
          {resultCount}{" "}
          {resultCount === 1 ? t.result || "Result" : t.results || "Results"}{" "}
          {t.found || "found"} {t.for_query || "for"} "{searchTerm}".
        </p>
      )}

      {resultCount > 0 ? (
        filteredContent.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            lang={lang}
            t={t}
            onSelect={onSelect}
            showLanguageName={true}
            isFavorite={userData?.favorites?.includes(item.id)}
            onToggleFavorite={() => onToggleFavorite(item.id)}
          />
        ))
      ) : searchTerm ? (
        <div className="text-center p-8 text-gray-500">
          <p>
            {t.no_results_for || "No results found for"} "{searchTerm}".
          </p>
          <p className="mt-2 text-sm">
            {t.search_tip ||
              "Try searching by title, language, or a verse snippet."}
          </p>
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          {/* --- NEW: Recent Searches Section --- */}
          {searchHistory && searchHistory.length > 0 && (
            <div className="mb-8 text-left">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-700">
                  {t.recent_searches || "Recent Searches"}
                </h2>
                <button
                  onClick={onClearHistory}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  {t.clear_history || "Clear History"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => onHistorySelect(term)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
              <hr className="my-6 border-gray-200" />
            </div>
          )}

          <p>
            {t.search_prompt ||
              "Please use the Search box above to find any one of our"}{" "}
            {staticContent.length}{" "}
            {staticContent.length === 1
              ? t.message || "message"
              : t.messages || "messages"}
            !
          </p>
        </div>
      )}
      <div className="h-16"></div>
    </div>
  );
};

export default SearchPage;
