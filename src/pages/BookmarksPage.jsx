import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "../components/Icons";
import ContentCard from "../components/ContentCard";
import { staticContent } from "../data/staticContent";

const ACCENT_COLOR_CLASS = "text-brand-red";

const BookmarksPage = ({
  lang,
  t,
  onSelect,
  userData,
  onBack,
  onForward,
  hasPrev,
  hasNext,
}) => {
  // Added nav props for consistency
  const bookmarkedItems = useMemo(() => {
    // Ensure userData.bookmarks is an array before calling includes()
    const bookmarks = userData?.bookmarks || [];
    return staticContent.filter((item) => bookmarks.includes(item.id));
  }, [userData.bookmarks]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Back and Forward Controls (added for consistency) */}
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

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.bookmarks}</h1>
      {bookmarkedItems.length > 0 ? (
        bookmarkedItems.map((item) => (
          // Show language name on search/bookmark cards
          <ContentCard
            key={item.id}
            item={item}
            lang={lang}
            onSelect={onSelect}
            showLanguageName={true}
          />
        ))
      ) : (
        <div className="text-center p-8 text-gray-500">
          <p>{t.no_bookmarks}</p>
          <p className="text-sm mt-2">{t.bookmark_tip}</p>
        </div>
      )}
      <div className="h-16"></div>
    </div>
  );
};

export default BookmarksPage;
